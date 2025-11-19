import threading
import os
from flask import current_app
from flask_mail import Message
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from premailer import transform


class NotificationService:
    """Servicio para envío de notificaciones por email"""
    
    _jinja_env = None
    
    @staticmethod
    def get_jinja_env():
        """Obtiene o crea el ambiente Jinja2 para templates"""
        if NotificationService._jinja_env is None:
            template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'emails')
            NotificationService._jinja_env = Environment(loader=FileSystemLoader(template_dir))
        return NotificationService._jinja_env
    
    @staticmethod
    def send_async_email(app, mail, msg):
        """Envía un email de forma asíncrona"""
        with app.app_context():
            try:
                mail.send(msg)
                return True
            except Exception as e:
                return False
    
    @staticmethod
    def send_email(mail, subject, recipients, html_body):
        """
        Envía un email de forma asíncrona
        
        Args:
            mail: Instancia de Flask-Mail
            subject: Asunto del correo
            recipients: Lista de destinatarios
            html_body: Cuerpo HTML del correo
        """
        if not mail:
            return False
        
        app = current_app._get_current_object()
        
        try:
            msg = Message(
                subject=subject,
                sender=('PsicoPlus', current_app.config.get('MAIL_DEFAULT_SENDER', 'psicoplus25@gmail.com')),
                recipients=recipients if isinstance(recipients, list) else [recipients]
            )
            msg.html = html_body
            
            
            
            thread = threading.Thread(
                target=NotificationService.send_async_email,
                args=(app, mail, msg)
            )
            thread.daemon = True
            thread.start()
            
            return True
        except Exception as e:
           
            import traceback
            traceback.print_exc()
            return False
    
    @staticmethod
    def render_template(template_name, **context):
        """Renderiza un template y convierte CSS a inline para emails"""
        try:
            env = NotificationService.get_jinja_env()
            template = env.get_template(template_name)
            
            # Leer el archivo CSS
            css_path = os.path.join(
                os.path.dirname(__file__), 
                '..', 
                'templates', 
                'emails', 
                'style.css'
            )
            
            with open(css_path, 'r', encoding='utf-8') as f:
                css_content = f.read()
            
            # Renderizar template
            html = template.render(**context)
            
            # Inyectar CSS en el <head>
            html_with_css = html.replace(
                '</head>',
                f'<style>{css_content}</style></head>'
            )
            
            # Convertir a inline con Premailer
            html_inlined = transform(html_with_css)
            
            return html_inlined
        except Exception as e:
            
            import traceback
            traceback.print_exc()
            return ""
    
    @staticmethod
    def format_fecha(fecha_str):
        """Formatea una fecha de YYYY-MM-DD a formato legible"""
        try:
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d')
            meses = [
                'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
            ]
            return f"{fecha.day} de {meses[fecha.month - 1]} de {fecha.year}"
        except:
            return fecha_str
    
    @staticmethod
    def format_hora(hora_str):
        """Formatea una hora de HH:MM:SS a formato 12 horas"""
        try:
            hora = datetime.strptime(hora_str, '%H:%M:%S')
            return hora.strftime('%I:%M %p')
        except:
            try:
                hora = datetime.strptime(hora_str, '%H:%M')
                return hora.strftime('%I:%M %p')
            except:
                return hora_str
    
    @staticmethod
    def notificar_cita_profesional(mail, profesional_nombre, profesional_email, 
                                   cliente_nombre, fecha, hora, motivo):
        """Envía notificación al profesional sobre nueva solicitud de cita"""
        fecha_formateada = NotificationService.format_fecha(fecha)
        hora_formateada = NotificationService.format_hora(hora)
        
        html_body = NotificationService.render_template(
            'nueva_cita_profesional.html',
            profesional_nombre=profesional_nombre,
            cliente_nombre=cliente_nombre,
            fecha_formateada=fecha_formateada,
            hora_formateada=hora_formateada,
            motivo=motivo
        )
        
        NotificationService.send_email(
            mail,
            subject='Nueva Solicitud de Cita - PsicoPlus',
            recipients=profesional_email,
            html_body=html_body
        )
    
    @staticmethod
    def notificar_cita_cliente(mail, cliente_nombre, cliente_email, 
                               profesional_nombre, fecha, hora, monto_total):
        """Envía confirmación al cliente sobre su solicitud de cita"""
        fecha_formateada = NotificationService.format_fecha(fecha)
        hora_formateada = NotificationService.format_hora(hora)
        
        try:
            monto_txt = f"${float(monto_total):,.0f} COP"
        except:
            monto_txt = f"{monto_total} COP"
        
        html_body = NotificationService.render_template(
            'cita_cliente_confirmada.html',
            cliente_nombre=cliente_nombre,
            profesional_nombre=profesional_nombre,
            fecha_formateada=fecha_formateada,
            hora_formateada=hora_formateada,
            monto_total=monto_txt
        )
        
        NotificationService.send_email(
            mail,
            subject='Solicitud de Cita Confirmada - PsicoPlus',
            recipients=cliente_email,
            html_body=html_body
        )
    
    @staticmethod
    def notificar_cita_aceptada(mail, cliente_nombre, cliente_email, 
                                profesional_nombre, fecha, hora, lugar, 
                                modalidad, monto_total):
        """Envía notificación al cliente cuando su cita es aceptada"""
        fecha_formateada = NotificationService.format_fecha(fecha)
        hora_formateada = NotificationService.format_hora(hora)
        modalidad_texto = "Presencial" if modalidad == "presencial" else "Virtual"
        icono_modalidad = "Presencial" if modalidad == "presencial" else "Virtual"
        
        try:
            monto_txt = f"${float(monto_total):,.0f} COP"
        except:
            monto_txt = f"{monto_total} COP"
        
        html_body = NotificationService.render_template(
            'cita_aceptada.html',
            cliente_nombre=cliente_nombre,
            profesional_nombre=profesional_nombre,
            fecha_formateada=fecha_formateada,
            hora_formateada=hora_formateada,
            lugar=lugar,
            modalidad_texto=modalidad_texto,
            icono_modalidad=icono_modalidad,
            monto_total=monto_txt
        )
        
        NotificationService.send_email(
            mail,
            subject='Cita Aceptada - Procede al Pago - PsicoPlus',
            recipients=cliente_email,
            html_body=html_body
        )
    
    @staticmethod
    def notificar_cita_rechazada(mail, cliente_nombre, cliente_email, 
                                 profesional_nombre, fecha, hora, motivo_rechazo):
        """Envía notificación al cliente cuando su cita es rechazada"""
        fecha_formateada = NotificationService.format_fecha(fecha)
        hora_formateada = NotificationService.format_hora(hora)
        
        html_body = NotificationService.render_template(
            'cita_rechazada.html',
            cliente_nombre=cliente_nombre,
            profesional_nombre=profesional_nombre,
            fecha_formateada=fecha_formateada,
            hora_formateada=hora_formateada,
            motivo_rechazo=motivo_rechazo
        )
        
        NotificationService.send_email(
            mail,
            subject='Cita No Aceptada - Explora Otras Opciones - PsicoPlus',
            recipients=cliente_email,
            html_body=html_body
        )

    @staticmethod
    def notificar_pago_confirmado_cliente(mail, cliente_nombre, cliente_email,
                                          profesional_nombre, fecha, hora,
                                          lugar, modalidad):
        """Email al CLIENTE: pago confirmado y cita ya pagada"""
        fecha_formateada = NotificationService.format_fecha(str(fecha))
        hora_formateada = NotificationService.format_hora(str(hora))
        modalidad_texto = "Presencial" if (modalidad or "").lower() == "presencial" else "Virtual"
        icono_modalidad = "Presencial" if modalidad_texto == "Presencial" else "Virtual"

        html_body = NotificationService.render_template(
            'pago_confirmado_cliente.html',
            cliente_nombre=cliente_nombre,
            profesional_nombre=profesional_nombre,
            fecha_formateada=fecha_formateada,
            hora_formateada=hora_formateada,
            lugar=lugar,
            modalidad_texto=modalidad_texto,
            icono_modalidad=icono_modalidad
        )

        return NotificationService.send_email(
            mail,
            subject="Pago confirmado - Tu cita está lista",
            recipients=cliente_email,
            html_body=html_body
        )

    @staticmethod
    def notificar_pago_confirmado_profesional(mail, profesional_nombre, profesional_email,
                                              cliente_nombre, fecha, hora, monto_total):
        """Email al PROFESIONAL: pago confirmado por parte del cliente"""
        fecha_formateada = NotificationService.format_fecha(str(fecha))
        hora_formateada = NotificationService.format_hora(str(hora))
        try:
            monto_txt = f"${float(monto_total):,.0f} COP"
        except:
            monto_txt = f"{monto_total} COP"

        html_body = NotificationService.render_template(
            'pago_confirmado_profesional.html',
            profesional_nombre=profesional_nombre,
            cliente_nombre=cliente_nombre,
            fecha_formateada=fecha_formateada,
            hora_formateada=hora_formateada,
            monto_total=monto_txt
        )

        return NotificationService.send_email(
            mail,
            subject="Pago confirmado - Cita pagada por el cliente",
            recipients=profesional_email,
            html_body=html_body
        )
    
    @staticmethod
    def notificar_cancelacion_por_falta_pago(mail, cliente_nombre, cliente_email,
                                            profesional_nombre, fecha, hora, monto_total):
        """Envía notificación al cliente cuando su cita es cancelada por falta de pago"""
        fecha_formateada = NotificationService.format_fecha(fecha)
        hora_formateada = NotificationService.format_hora(hora)

        try:
            monto_txt = f"${float(monto_total):,.0f} COP"
        except:
            monto_txt = f"{monto_total} COP"

        html_body = NotificationService.render_template(
            'cancelacion_falta_pago.html',
            cliente_nombre=cliente_nombre,
            profesional_nombre=profesional_nombre,
            fecha_formateada=fecha_formateada,
            hora_formateada=hora_formateada,
            monto_total=monto_txt
        )

        return NotificationService.send_email(
            mail,
            subject='Cita Cancelada - Falta de Pago - PsicoPlus',
            recipients=cliente_email,
            html_body=html_body
        )

    @staticmethod
    def notificar_recordatorio_cita(mail, cliente_nombre, cliente_email,
                                    profesional_nombre, profesional_telefono,
                                    fecha, hora_inicio, hora_fin, lugar, 
                                    modalidad, motivo):
        """Envía email de recordatorio al cliente sobre su cita próxima"""
        fecha_formateada = NotificationService.format_fecha(str(fecha))
        hora_inicio_formateada = NotificationService.format_hora(str(hora_inicio))
        hora_fin_formateada = NotificationService.format_hora(str(hora_fin))
        modalidad_texto = "Presencial" if (modalidad or "").lower() == "presencial" else "Virtual"
        icono_modalidad = "Presencial" if modalidad_texto == "Presencial" else "Virtual"

        html_body = NotificationService.render_template(
            'recordatorio_cita.html',
            cliente_nombre=cliente_nombre,
            profesional_nombre=profesional_nombre,
            profesional_telefono=profesional_telefono,
            fecha_formateada=fecha_formateada,
            hora_inicio_formateada=hora_inicio_formateada,
            hora_fin_formateada=hora_fin_formateada,
            lugar=lugar,
            modalidad_texto=modalidad_texto,
            icono_modalidad=icono_modalidad,
            motivo=motivo
        )

        return NotificationService.send_email(
            mail,
            subject=f'Recordatorio: Cita con {profesional_nombre} - PsicoPlus',
            recipients=cliente_email,
            html_body=html_body
        )



notification_service = NotificationService()