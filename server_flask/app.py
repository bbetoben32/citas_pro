from flask import Flask, send_from_directory
from flask_mysqldb import MySQL
from flask_mail import Mail
from flask_cors import CORS
import os
import atexit
import logging
from logging.handlers import RotatingFileHandler

from config.app_config import config
from config.mail_config import MailConfig

from models.database import init_models

# Importar el scheduler
from services.scheduler_service import scheduler_service

# Importar blueprints
from routes.clientes import bp_clientes
from routes.profesionales import bp_profesionales
from routes.citas import bp_citas


def create_app(config_name='development'):
    """Factory para crear la aplicación Flask"""
    
    app = Flask(__name__)
    
    # ✅ CONFIGURAR LOGGING
    if not app.debug:
        # Producción: Log a stdout para Railway
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.INFO)
        stream_handler.setFormatter(logging.Formatter(
            '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
        ))
        app.logger.addHandler(stream_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('PsicoPlus API iniciando en producción')
    else:
        # Desarrollo: Log detallado
        app.logger.setLevel(logging.DEBUG)
        app.logger.info('PsicoPlus API iniciando en desarrollo')
    
    # ✅ CRÍTICO: Desactivar redirección automática de barras
    app.url_map.strict_slashes = False
    
    # Cargar configuraciones
    app.config.from_object(config[config_name])
    app.config.from_object(MailConfig)
    
    # ✅ Log de configuración de mail
    app.logger.info(f"MAIL_SERVER: {app.config.get('MAIL_SERVER')}")
    app.logger.info(f"MAIL_PORT: {app.config.get('MAIL_PORT')}")
    app.logger.info(f"MAIL_DEFAULT_SENDER: {app.config.get('MAIL_DEFAULT_SENDER')}")
    app.logger.info(f"MAIL_PASSWORD configurado: {'Sí' if app.config.get('MAIL_PASSWORD') else 'No'}")
    
    # ✅ CONFIGURACIÓN CORS
    CORS(app, 
         resources={r"/*": {
             "origins": [
                 "http://localhost:3000",
                 "https://noble-light-production.up.railway.app",
                 "https://accomplished-playfulness-production-d1f3.up.railway.app",
                 os.getenv("FRONTEND_URL", "*")
             ],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "expose_headers": ["Content-Type", "Authorization"]
         }})
    
    # Inicializar extensiones
    mysql = MySQL(app)
    mail = Mail(app)
    
    app.logger.info("MySQL y Mail inicializados")
    
    # CRÍTICO: Inicializar modelos después de MySQL
    with app.app_context():
        init_models(mysql)
        app.logger.info("Modelos de base de datos inicializados")
    
    # ✅ Inyectar MySQL en los blueprints
    from routes import clientes, profesionales, citas
    
    clientes.mysql = mysql
    clientes.mail = mail  # ✅ IMPORTANTE: Inyectar mail
    profesionales.mysql = mysql
    profesionales.mail = mail  # ✅ IMPORTANTE: Inyectar mail
    
    app.logger.info("MySQL y Mail inyectados en blueprints")
    
    # ✅ Inyectar mysql en el módulo de citas
    from routes.citas import routes as citas_routes
    citas_routes.mysql = mysql
    citas_routes.mail = mail  # ✅ IMPORTANTE: Inyectar mail
    
    # ✅ Configurar rutas de citas DESPUÉS de inyectar mysql
    citas_routes.setup_routes()
    
    # Registrar blueprints
    app.register_blueprint(bp_clientes, url_prefix='/clientes')
    app.register_blueprint(bp_profesionales, url_prefix='/profesionales')
    app.register_blueprint(bp_citas, url_prefix='/citas')
    
    app.logger.info("Blueprints registrados")
    
    # 🆕 INICIALIZAR SCHEDULER PARA CANCELACIÓN AUTOMÁTICA
    with app.app_context():
        scheduler_service.init_app(app, mysql, mail)
        app.logger.info("Scheduler inicializado")
    
    # Registrar función para detener el scheduler al cerrar la app
    atexit.register(lambda: scheduler_service.shutdown())
    
    @app.route('/')
    def index():
        return {'message': 'API PsicoPlus funcionando'}, 200
    
    @app.route('/health')
    def health():
        return {'status': 'healthy'}, 200
    
    # ✅ RUTA DE PRUEBA DE EMAIL
    @app.route('/test-email')
    def test_email():
        """Endpoint de prueba para verificar envío de emails"""
        try:
            from flask_mail import Message
            app.logger.info("Iniciando test de email...")
            
            msg = Message(
                'Test Email desde PsicoPlus',
                sender=('PsicoPlus Test', app.config.get('MAIL_DEFAULT_SENDER')),
                recipients=['psicoplus25@gmail.com']  # Cambia por tu email
            )
            msg.html = '<h1>✅ Test exitoso desde Railway</h1><p>Si recibes esto, SendGrid está funcionando correctamente.</p>'
            
            app.logger.info(f"Enviando email de prueba a: psicoplus25@gmail.com")
            mail.send(msg)
            app.logger.info("Email de prueba enviado exitosamente")
            
            return {'status': 'Email enviado exitosamente!'}, 200
        except Exception as e:
            app.logger.error(f"Error al enviar email de prueba: {str(e)}")
            import traceback
            app.logger.error(traceback.format_exc())
            return {'error': str(e), 'traceback': traceback.format_exc()}, 500
    
    # ✅ Ruta para servir archivos CVs
    @app.route('/uploads/cvs/<path:filename>')
    def serve_cv(filename):
        """Sirve archivos PDF desde la carpeta uploads/cvs"""
        upload_dir = os.path.join(app.root_path, 'uploads', 'cvs')
        os.makedirs(upload_dir, exist_ok=True)
        return send_from_directory(
            upload_dir, 
            filename, 
            mimetype='application/pdf',
            as_attachment=False
        )
    
    @app.route('/uploads/fotos/<path:filename>')
    def serve_foto(filename):
        """Sirve imágenes de perfil desde la carpeta uploads/fotos"""
        upload_dir = os.path.join(app.root_path, 'uploads', 'fotos')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Determinar el tipo MIME según la extensión
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        mime_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp'
        }
        mimetype = mime_types.get(ext, 'image/jpeg')
        
        return send_from_directory(
            upload_dir, 
            filename, 
            mimetype=mimetype,
            as_attachment=False
        )
    
    return app

if __name__ == '__main__':
    # Determinar el entorno
    env = os.getenv('FLASK_ENV', 'development')
    app = create_app(env)
    
    # En Railway, usar el puerto que proporciona la plataforma
    port = int(os.getenv('PORT', 5000))
    
    app.logger.info(f"Iniciando servidor en puerto {port}")
    app.run(host='0.0.0.0', port=port, debug=(env == 'development'))