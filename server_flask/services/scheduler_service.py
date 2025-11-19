# services/scheduler_service.py
"""
Servicio para tareas programadas
Maneja la cancelación automática de citas no pagadas
"""
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from flask import current_app
import pytz


class SchedulerService:
    """Servicio para ejecutar tareas programadas en segundo plano"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.mysql = None
        self.mail = None
    
    def init_app(self, app, mysql, mail):
        """
        Inicializa el scheduler con la aplicación Flask
        
        Args:
            app: Instancia de Flask
            mysql: Instancia de MySQL
            mail: Instancia de Flask-Mail
        """
        self.mysql = mysql
        self.mail = mail
        
        # 🆕 EJECUTAR LIMPIEZA INICIAL al arrancar el servidor
        self.limpiar_citas_antiguas(app)
        
        # Ejecutar cada 2 minutos para mayor precisión
        self.scheduler.add_job(
            func=lambda: self.cancelar_citas_sin_pago(app),
            trigger="interval",
            minutes=2,
            id='cancelar_citas_sin_pago',
            name='Cancelar citas sin pago 30 min antes',
            replace_existing=True
        )
        
        # Iniciar el scheduler
        if not self.scheduler.running:
            self.scheduler.start()
    
    def cancelar_citas_sin_pago(self, app):
        """
        Cancela automáticamente las citas aceptadas que no fueron pagadas
        30 minutos antes de su hora de inicio
        """
        with app.app_context():
            try:
                cur = self.mysql.connection.cursor()
                try:
                    # Calcular el límite de tiempo (ahora + 30 minutos)
                    ahora = datetime.now()
                    limite_tiempo = ahora + timedelta(minutes=30)
                    
                    
                    
                    # MEJORADO: Query más precisa
                    # Buscar citas que cumplan TODAS estas condiciones:
                    # 1. Estado = 'aceptada' (no pagada)
                    # 2. La hora de la cita es <= ahora + 30 minutos
                    # 3. La hora de la cita es > ahora (no ha pasado)
                    query = """
                        SELECT 
                            c.id, 
                            c.fecha, 
                            c.hora_inicio, 
                            c.monto_total,
                            cl.nombre as cliente_nombre, 
                            cl.correo as cliente_correo,
                            p.nombre as profesional_nombre,
                            CONCAT(c.fecha, ' ', c.hora_inicio) as fecha_hora_completa
                        FROM citas c
                        INNER JOIN clientes cl ON c.cliente_id = cl.id
                        INNER JOIN profesional p ON c.profesional_id = p.id
                        WHERE c.estado = 'aceptada'
                        AND CONCAT(c.fecha, ' ', c.hora_inicio) <= %s
                        AND CONCAT(c.fecha, ' ', c.hora_inicio) > %s
                    """
                    
                    cur.execute(query, (
                        limite_tiempo.strftime('%Y-%m-%d %H:%M:%S'),
                        ahora.strftime('%Y-%m-%d %H:%M:%S')
                    ))
                    
                    citas_a_cancelar = cur.fetchall()
                    
                    if not citas_a_cancelar:
                        return
                    
                    
                    # Cancelar cada cita
                    for cita in citas_a_cancelar:
                        try:
                            cita_id = cita['id']
                            
                            
                            
                            # Actualizar estado en la BD
                            cur.execute("""
                                UPDATE citas 
                                SET estado = 'cancelada',
                                    fecha_cancelacion = NOW(),
                                    motivo_cancelacion = 'Cancelada automáticamente por falta de pago (30 minutos antes de la cita)',
                                    cancelada_por = 'sistema'
                                WHERE id = %s
                            """, (cita_id,))
                            
                            self.mysql.connection.commit()
                            
                            # Enviar notificación al cliente
                            from services.notification_service import NotificationService
                            
                            # Convertir hora a string si es timedelta
                            hora_str = str(cita['hora_inicio'])
                            if isinstance(cita['hora_inicio'], timedelta):
                                total_seconds = int(cita['hora_inicio'].total_seconds())
                                hours = total_seconds // 3600
                                minutes = (total_seconds % 3600) // 60
                                hora_str = f"{hours:02d}:{minutes:02d}"
                            
                            # Convertir fecha a string si es date
                            fecha_str = str(cita['fecha'])
                            if hasattr(cita['fecha'], 'isoformat'):
                                fecha_str = cita['fecha'].isoformat()
                            
                            # Enviar email
                            NotificationService.notificar_cancelacion_por_falta_pago(
                                mail=self.mail,
                                cliente_nombre=cita['cliente_nombre'],
                                cliente_email=cita['cliente_correo'],
                                profesional_nombre=cita['profesional_nombre'],
                                fecha=fecha_str,
                                hora=hora_str,
                                monto_total=cita['monto_total']
                            )
                            
                            
                            
                        except Exception as e_cita:
                            
                            import traceback
                            traceback.print_exc()
                            self.mysql.connection.rollback()
                            continue
                    
                    
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    self.mysql.connection.rollback()
                finally:
                    cur.close()
                    
            except Exception as e:
                import traceback
                traceback.print_exc()
    
    def shutdown(self):
        """Detiene el scheduler de forma segura"""
        if self.scheduler.running:
            self.scheduler.shutdown()
    
    def limpiar_citas_antiguas(self, app):
        """
        Limpia todas las citas antiguas que debieron ser canceladas
        Se ejecuta al iniciar el servidor
        """
        with app.app_context():
            try:
                cur = self.mysql.connection.cursor()
                try:
                    ahora = datetime.now()
                    
                    
                    
                    # Buscar TODAS las citas 'aceptadas' cuya fecha/hora ya pasó
                    # o que están dentro de los próximos 30 minutos
                    query = """
                        SELECT 
                            c.id, 
                            c.fecha, 
                            c.hora_inicio, 
                            c.monto_total,
                            cl.nombre as cliente_nombre, 
                            cl.correo as cliente_correo,
                            p.nombre as profesional_nombre,
                            CONCAT(c.fecha, ' ', c.hora_inicio) as fecha_hora_completa
                        FROM citas c
                        INNER JOIN clientes cl ON c.cliente_id = cl.id
                        INNER JOIN profesional p ON c.profesional_id = p.id
                        WHERE c.estado = 'aceptada'
                        AND CONCAT(c.fecha, ' ', c.hora_inicio) <= DATE_ADD(NOW(), INTERVAL 30 MINUTE)
                    """
                    
                    cur.execute(query)
                    citas_antiguas = cur.fetchall()
                    
                    if not citas_antiguas:
                      
                        return
                    
                   
                    
                    for cita in citas_antiguas:
                        try:
                            cita_id = cita['id']
                            
                            
                            
                            # Actualizar estado
                            cur.execute("""
                                UPDATE citas 
                                SET estado = 'cancelada',
                                    fecha_cancelacion = NOW(),
                                    motivo_cancelacion = 'Cancelada automáticamente por falta de pago',
                                    cancelada_por = 'sistema'
                                WHERE id = %s
                            """, (cita_id,))
                            
                            self.mysql.connection.commit()
                            
                            
                            # Enviar notificación
                            from services.notification_service import NotificationService
                            
                            # Convertir hora a string
                            hora_str = str(cita['hora_inicio'])
                            if isinstance(cita['hora_inicio'], timedelta):
                                total_seconds = int(cita['hora_inicio'].total_seconds())
                                hours = total_seconds // 3600
                                minutes = (total_seconds % 3600) // 60
                                hora_str = f"{hours:02d}:{minutes:02d}"
                            
                            # Convertir fecha a string
                            fecha_str = str(cita['fecha'])
                            if hasattr(cita['fecha'], 'isoformat'):
                                fecha_str = cita['fecha'].isoformat()
                            
                            NotificationService.notificar_cancelacion_por_falta_pago(
                                mail=self.mail,
                                cliente_nombre=cita['cliente_nombre'],
                                cliente_email=cita['cliente_correo'],
                                profesional_nombre=cita['profesional_nombre'],
                                fecha=fecha_str,
                                hora=hora_str,
                                monto_total=cita['monto_total']
                            )
                            
                            
                            
                        except Exception as e_cita:
                            
                            self.mysql.connection.rollback()
                            continue
                    
                   
                    
                except Exception as e:
                   
                    import traceback
                    traceback.print_exc()
                    self.mysql.connection.rollback()
                finally:
                    cur.close()
                    
            except Exception as e:
              
                import traceback
                traceback.print_exc()


# Instancia singleton
scheduler_service = SchedulerService()