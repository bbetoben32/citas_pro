import random
import string
import threading
from datetime import datetime, timedelta
from flask_mail import Message
from flask import current_app
import logging


class VerificationHelper:
    """Helper para manejo de códigos de verificación"""
    
    def __init__(self):
        self._codes = {}
    
    def generate_code(self, length: int = 6) -> str:
        """Genera un código numérico aleatorio"""
        return ''.join(random.choices(string.digits, k=length))
    
    def save_code(self, email: str, code: str, user_type: str, expiration_minutes: int = 10):
        """Guarda un código temporal con su fecha de expiración"""
        self._codes[email] = {
            'codigo': code,
            'expiracion': datetime.now() + timedelta(minutes=expiration_minutes),
            'tipo': user_type
        }
    
    def verify_code(self, email: str, input_code: str) -> tuple[bool, str]:
        """Verifica si el código ingresado es válido"""
        if email not in self._codes:
            return False, "Código no encontrado"
        
        data = self._codes[email]
        
        if datetime.now() > data['expiracion']:
            del self._codes[email]
            return False, "Código expirado"
        
        if data['codigo'] != input_code:
            return False, "Código inválido"
        
        return True, "Código válido"
    
    def clear_code(self, email: str):
        """Elimina el código asociado a un email"""
        self._codes.pop(email, None)
    
    def send_verification_email(self, mail, recipient: str, code: str) -> bool:
        """Envía el código de verificación por email (asíncrono)"""
        app = current_app._get_current_object()
        
        def send_async():
            with app.app_context():
                try:
                    app.logger.info(f"Intentando enviar email a {recipient}")
                    app.logger.info(f"Mail object: {mail}")
                    app.logger.info(f"MAIL_SERVER: {app.config.get('MAIL_SERVER')}")
                    app.logger.info(f"MAIL_PORT: {app.config.get('MAIL_PORT')}")
                    app.logger.info(f"MAIL_DEFAULT_SENDER: {app.config.get('MAIL_DEFAULT_SENDER')}")
                    
                    msg = Message(
                        'Verificación de Cuenta - PsicoPlus',
                        sender=('PsicoPlus', app.config.get('MAIL_DEFAULT_SENDER')),
                        recipients=[recipient]
                    )
                    msg.html = self._get_email_template(code)
                    
                    app.logger.info("Enviando mensaje...")
                    mail.send(msg)
                    app.logger.info(f"✅ Email enviado exitosamente a {recipient}")
                    
                except Exception as e:
                    app.logger.error(f"❌ Error al enviar email a {recipient}: {str(e)}")
                    import traceback
                    app.logger.error(traceback.format_exc())
        
        thread = threading.Thread(target=send_async)
        thread.daemon = True
        thread.start()
        return True
    
    def _get_email_template(self, code: str) -> str:
        """Retorna el template HTML del email"""
        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
                .header {{ background: #102e50; padding: 32px 24px; text-align: center; color: white; }}
                .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
                .content {{ padding: 32px 24px; text-align: center; }}
                .code-container {{ background: linear-gradient(to right, #f5f7fa, #f9fafb); border: 1px solid #e0e3e8; border-radius: 6px; padding: 24px; margin: 28px 0; }}
                .code {{ font-size: 32px; font-weight: 700; color: #102e50; letter-spacing: 6px; font-family: 'Courier New', monospace; }}
                .info-box {{ background: #f0f4f8; border-left: 3px solid #102e50; padding: 16px; margin: 24px 0; text-align: left; border-radius: 4px; }}
                .warning-box {{ background: #fef3e2; border-left: 3px solid #ff9800; padding: 16px; margin: 24px 0; text-align: left; border-radius: 4px; }}
                .footer {{ background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e0e3e8; }}
                .footer-text {{ color: #777; font-size: 13px; margin: 6px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>Verificación de Cuenta</h1></div>
                <div class="content">
                    <p>Gracias por registrarte en <strong>PsicoPlus</strong>.</p>
                    <div class="code-container">
                        <div class="code">{code}</div>
                    </div>
                    <div class="info-box">
                        <p><strong>Tiempo de Expiración:</strong> Este código expirará en 10 minutos.</p>
                    </div>
                    <div class="warning-box">
                        <p><strong>Seguridad:</strong> Si no solicitaste este código, ignora este mensaje.</p>
                    </div>
                </div>
                <div class="footer">
                    <p class="footer-text">© 2025 PsicoPlus. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        '''


verification_helper = VerificationHelper()
