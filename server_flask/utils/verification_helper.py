# helpers/verification_helper.py
import os
import random
import string
import requests
from datetime import datetime, timedelta
from flask import current_app


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
    
    def _send_via_sendgrid(self, recipient: str, subject: str, html_content: str) -> bool:
        """Envía email usando SendGrid API HTTP"""
        api_key = os.getenv('SENDGRID_API_KEY')
        sender_email = os.getenv('MAIL_DEFAULT_SENDER', 'psicoplus25@gmail.com')
        
        if not api_key:
            current_app.logger.error("❌ SENDGRID_API_KEY no configurada")
            return False
        
        url = "https://api.sendgrid.com/v3/mail/send"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "personalizations": [{"to": [{"email": recipient}]}],
            "from": {"email": sender_email, "name": "PsicoPlus"},
            "subject": subject,
            "content": [{"type": "text/html", "value": html_content}]
        }
        
        try:
            current_app.logger.info(f"📧 Enviando email a {recipient}...")
            response = requests.post(url, headers=headers, json=data, timeout=10)
            
            if response.status_code == 202:
                current_app.logger.info(f"✅ Email enviado a {recipient}")
                return True
            else:
                current_app.logger.error(f"❌ SendGrid error: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            current_app.logger.error(f"❌ Error enviando email: {str(e)}")
            return False
    
    def send_verification_email(self, mail, recipient: str, code: str) -> bool:
        """Envía el código de verificación por email"""
        subject = "Verificación de Cuenta - PsicoPlus"
        html_content = self._get_email_template(code)
        return self._send_via_sendgrid(recipient, subject, html_content)
    
    def _get_email_template(self, code: str) -> str:
        """Retorna el template HTML del email de verificación"""
        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
                .header {{ background: #102e50; padding: 32px 24px; text-align: center; color: white; border-radius: 8px 8px 0 0; }}
                .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
                .content {{ padding: 32px 24px; text-align: center; }}
                .code-container {{ background: linear-gradient(to right, #f5f7fa, #f9fafb); border: 1px solid #e0e3e8; border-radius: 6px; padding: 24px; margin: 28px 0; }}
                .code {{ font-size: 32px; font-weight: 700; color: #102e50; letter-spacing: 6px; font-family: 'Courier New', monospace; }}
                .info-box {{ background: #f0f4f8; border-left: 3px solid #102e50; padding: 16px; margin: 24px 0; text-align: left; border-radius: 4px; }}
                .warning-box {{ background: #fef3e2; border-left: 3px solid #ff9800; padding: 16px; margin: 24px 0; text-align: left; border-radius: 4px; }}
                .footer {{ background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e0e3e8; border-radius: 0 0 8px 8px; }}
                .footer-text {{ color: #777; font-size: 13px; margin: 6px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>🔐 Verificación de Cuenta</h1></div>
                <div class="content">
                    <p style="font-size: 16px; color: #333;">Gracias por registrarte en <strong>PsicoPlus</strong>.</p>
                    <p style="color: #666;">Usa el siguiente código para verificar tu cuenta:</p>
                    <div class="code-container">
                        <div class="code">{code}</div>
                    </div>
                    <div class="info-box">
                        <p style="margin: 0;"><strong>⏱️ Tiempo de Expiración:</strong> Este código expirará en <strong>10 minutos</strong>.</p>
                    </div>
                    <div class="warning-box">
                        <p style="margin: 0;"><strong>🔒 Seguridad:</strong> Si no solicitaste este código, puedes ignorar este mensaje.</p>
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
