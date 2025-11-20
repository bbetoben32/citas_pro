from flask import Flask, send_from_directory
from flask_mysqldb import MySQL
from flask_mail import Mail
from flask_cors import CORS
import os
import atexit

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
    
    # ✅ CRÍTICO: Desactivar redirección automática de barras
    app.url_map.strict_slashes = False
    
    # Cargar configuraciones
    app.config.from_object(config[config_name])
    app.config.from_object(MailConfig)
    
    # ✅ CONFIGURACIÓN CORS
    CORS(app, 
         resources={r"/*": {
             "origins": ["http://localhost:3000","https://noble-light-production.up.railway.app",os.getenv("FRONTEND_URL", "*")],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "expose_headers": ["Content-Type", "Authorization"]
         }})
    
    # Inicializar extensiones
    mysql = MySQL(app)
    mail = Mail(app)
    
    # CRÍTICO: Inicializar modelos después de MySQL
    with app.app_context():
        init_models(mysql)
    
    # ✅ Inyectar MySQL en los blueprints
    from routes import clientes, profesionales, citas
    
    clientes.mysql = mysql
    profesionales.mysql = mysql
    
    # ✅ Inyectar mysql en el módulo de citas
    from routes.citas import routes as citas_routes
    citas_routes.mysql = mysql
    
    # ✅ Configurar rutas de citas DESPUÉS de inyectar mysql
    citas_routes.setup_routes()
    
    # Registrar blueprints
    app.register_blueprint(bp_clientes, url_prefix='/clientes')
    app.register_blueprint(bp_profesionales, url_prefix='/profesionales')
    app.register_blueprint(bp_citas, url_prefix='/citas')
    
    # 🆕 INICIALIZAR SCHEDULER PARA CANCELACIÓN AUTOMÁTICA
    with app.app_context():
        scheduler_service.init_app(app, mysql, mail)
        
    
    # Registrar función para detener el scheduler al cerrar la app
    atexit.register(lambda: scheduler_service.shutdown())
    
    @app.route('/')
    def index():
        return {'message': 'API PsicoPlus funcionando'}, 200
    
    @app.route('/health')
    def health():
        return {'status': 'healthy'}, 200
    
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
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)