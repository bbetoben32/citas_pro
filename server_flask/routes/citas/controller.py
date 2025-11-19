"""
Controller principal para el módulo de citas
Maneja la lógica de negocio
"""
from flask import jsonify, request, current_app
from .validators import CitasValidator
from .serializers import serializar_cita, convertir_hora_a_string, convertir_fecha_a_string
from services.notification_service import notification_service


class CitasController:
    """Controlador para endpoints de citas"""
    
    def __init__(self, mysql):
        self.mysql = mysql
        self.validator = CitasValidator()
    
    def crear_cita(self, payload):
        """POST /citas - Cliente solicita una cita"""
        try:
            data = request.get_json(silent=True) or {}
            cliente_id = payload['user_id']
            
            # Validar datos
            valido, error = self.validator.validar_crear_cita(data)
            if not valido:
                return jsonify({'error': error}), 400
            
            cur = self.mysql.connection.cursor()
            try:
                # Verificar profesional
                profesional = self._verificar_profesional(cur, data['profesional_id'])
                if not profesional:
                    return jsonify({'error': 'Profesional no encontrado'}), 404
                
                # Verificar conflictos de horario
                tiene_conflicto = self._verificar_conflicto_horario(
                    cur, cliente_id, data['profesional_id'], 
                    data['fecha'], data['hora_inicio'], data['hora_fin']
                )
                
                if tiene_conflicto:
                    return jsonify({'error': 'Ya tienes una cita pendiente con este profesional en ese horario'}), 400
                
                # Insertar cita
                cita_id = self._insertar_cita(cur, cliente_id, data)
                self.mysql.connection.commit()
                
                # Obtener info del cliente
                cliente = self._obtener_cliente(cur, cliente_id)
                
                # Enviar notificaciones
                self._enviar_notificaciones_nueva_cita(
                    profesional, cliente, data
                )
                
                return jsonify({
                    'message': 'Cita solicitada exitosamente',
                    'cita_id': cita_id,
                    'estado': 'pendiente'
                }), 201
                
            except Exception as e:
                self.mysql.connection.rollback()
                raise e
            finally:
                cur.close()
                
        except Exception as e:
            return jsonify({'error': f'Error interno: {str(e)}'}), 500
    
    def obtener_citas_cliente(self, payload):
        """GET /citas/cliente - Obtener citas del cliente autenticado"""
        try:
            cliente_id = payload['user_id']
            estado = request.args.get('estado')
            
            cur = self.mysql.connection.cursor()
            try:
                citas = self._obtener_citas_por_cliente(cur, cliente_id, estado)
                citas_serializadas = [serializar_cita(cita) for cita in citas]
                
                return jsonify(citas_serializadas), 200
            finally:
                cur.close()
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    def obtener_citas_profesional(self, payload):
        """GET /citas/profesional - Obtener citas del profesional autenticado"""
        try:
            profesional_id = payload['user_id']
            estado = request.args.get('estado')
            
            cur = self.mysql.connection.cursor()
            try:
                citas = self._obtener_citas_por_profesional(cur, profesional_id, estado)
                citas_serializadas = [serializar_cita(cita) for cita in citas]
                
                return jsonify(citas_serializadas), 200
            finally:
                cur.close()
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    def responder_cita(self, payload, cita_id):
        """PUT /citas/<id>/responder - Profesional acepta/rechaza cita"""
        try:
            profesional_id = payload['user_id']
            data = request.get_json(silent=True) or {}
            
            accion = data.get('accion')
            valido, error = self.validator.validar_accion_respuesta(accion)
            if not valido:
                return jsonify({'error': error}), 400
            
            cur = self.mysql.connection.cursor()
            try:
                # Obtener información de la cita
                cita = self._obtener_cita_completa(cur, cita_id, profesional_id)
                if not cita:
                    return jsonify({'error': 'Cita no encontrada'}), 404
                
                valido, error = self.validator.validar_estado_respondible(cita['estado'])
                if not valido:
                    return jsonify({'error': error}), 400
                
                if accion == 'aceptar':
                    return self._aceptar_cita(cur, cita_id, data, cita)
                else:
                    return self._rechazar_cita(cur, cita_id, data, cita)
                
            except Exception as e:
                self.mysql.connection.rollback()
                raise e
            finally:
                cur.close()
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    def cancelar_cita(self, payload, cita_id):
        """DELETE /citas/<id>/cancelar - Cancelar cita"""
        try:
            user_id = payload['user_id']
            data = request.get_json(silent=True) or {}
            motivo = data.get('motivo_cancelacion', 'No especificado')
            
            cur = self.mysql.connection.cursor()
            try:
                cita = self._obtener_cita_basica(cur, cita_id)
                if not cita:
                    return jsonify({'error': 'Cita no encontrada'}), 404
                
                # Verificar autorización
                es_cliente = cita['cliente_id'] == user_id
                es_profesional = cita['profesional_id'] == user_id
                
                if not (es_cliente or es_profesional):
                    return jsonify({'error': 'No autorizado'}), 403
                
                # Validar estado
                valido, error = self.validator.validar_estado_cancelable(cita['estado'])
                if not valido:
                    return jsonify({'error': error}), 400
                
                # Cancelar
                cancelada_por = 'cliente' if es_cliente else 'profesional'
                self._cancelar_cita_db(cur, cita_id, motivo, cancelada_por)
                
                self.mysql.connection.commit()
                return jsonify({'message': 'Cita cancelada exitosamente'}), 200
                
            except Exception as e:
                self.mysql.connection.rollback()
                raise e
            finally:
                cur.close()
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    def pagar_cita(self, payload, cita_id):
        """PUT /citas/<id>/pagar - Cliente paga una cita aceptada (MÉTODO ANTIGUO - Mantener por compatibilidad)"""
        try:
            cliente_id = payload['user_id']
            
            cur = self.mysql.connection.cursor()
            try:
                # Obtener info de la cita
                cita = self._obtener_cita_para_pago(cur, cita_id, cliente_id)
                if not cita:
                    return jsonify({'error': 'Cita no encontrada'}), 404
                
                # Validar estado
                valido, error = self.validator.validar_estado_pagable(cita['estado'])
                if not valido:
                    return jsonify({'error': error}), 400
                
                # Actualizar estado
                self._marcar_cita_como_pagada(cur, cita_id)
                self.mysql.connection.commit()
                
                # Enviar notificaciones
                self._enviar_notificaciones_pago(cita)
                
                return jsonify({'message': 'Pago procesado exitosamente'}), 200
                
            except Exception as e:
                self.mysql.connection.rollback()
                raise e
            finally:
                cur.close()
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    def iniciar_pago_paypal(self, payload, cita_id):
        """POST /citas/<id>/pagar/iniciar - Inicia el proceso de pago con PayPal"""
        try:
            cliente_id = payload['user_id']
            
            cur = self.mysql.connection.cursor()
            try:
                # Obtener info de la cita
                cita = self._obtener_cita_para_pago(cur, cita_id, cliente_id)
                if not cita:
                    return jsonify({'error': 'Cita no encontrada'}), 404
                
                # Validar estado
                valido, error = self.validator.validar_estado_pagable(cita['estado'])
                if not valido:
                    return jsonify({'error': error}), 400
                
                # Crear pago en PayPal
                from services.paypal_service import paypal_service
                
                descripcion = f"Consulta con {cita['profesional_nombre']}"
                resultado = paypal_service.crear_pago(
                    monto=cita['monto_total'],
                    descripcion=descripcion,
                    cita_id=cita_id
                )
                
                if not resultado['success']:
                    return jsonify({
                        'error': 'Error al crear pago en PayPal', 
                        'details': resultado.get('error')
                    }), 500
                
                # Guardar payment_id en la base de datos
                cur.execute("""
                    UPDATE citas 
                    SET paypal_payment_id = %s
                    WHERE id = %s
                """, (resultado['payment_id'], cita_id))
                self.mysql.connection.commit()
                
                return jsonify({
                    'success': True,
                    'payment_id': resultado['payment_id'],
                    'approval_url': resultado['approval_url'],
                    'monto_cop': cita['monto_total'],
                    'monto_usd': resultado['monto_usd']
                }), 200
                
            except Exception as e:
                self.mysql.connection.rollback()
                raise e
            finally:
                cur.close()
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    def confirmar_pago_paypal(self, payload, cita_id):
        """POST /citas/<id>/pagar/confirmar - Confirma el pago después de PayPal"""
        try:
            cliente_id = payload['user_id']
            data = request.get_json(silent=True) or {}

            payment_id = data.get('paymentId')
            payer_id = data.get('payerId')

            if not payment_id or not payer_id:
                return jsonify({'error': 'Faltan datos de PayPal (paymentId o payerId)'}), 400

            cur = self.mysql.connection.cursor()
            try:
                # 1️⃣ Verificar que la cita existe y pertenece al cliente
                cita = self._obtener_cita_para_pago(cur, cita_id, cliente_id)
                if not cita:
                    return jsonify({'error': 'Cita no encontrada'}), 404

                # 2️⃣ Verificar estado: solo se puede pagar si está "aceptada"
                if cita['estado'] != 'aceptada':
                    return jsonify({'error': f'No se puede confirmar pago en estado: {cita["estado"]}'}), 400

                # 3️⃣ Ejecutar el pago en PayPal
                from services.paypal_service import paypal_service
                resultado = paypal_service.ejecutar_pago(payment_id, payer_id)

                # ⚠️ SOLO continuar si el pago fue exitoso
                if not resultado['success'] or resultado.get('state') != 'approved':
                    return jsonify({
                        'error': 'Pago no aprobado en PayPal',
                        'details': resultado.get('error', 'Estado no aprobado')
                    }), 400

                # 4️⃣ Actualizar el estado de la cita a "pagada"
                cur.execute("""
                    UPDATE citas 
                    SET estado = 'pagada',
                        fecha_pago = NOW(),
                        paypal_payer_id = %s,
                        paypal_state = %s
                    WHERE id = %s
                """, (payer_id, resultado['state'], cita_id))
                
                self.mysql.connection.commit()

                # 5️⃣ Enviar notificaciones
                self._enviar_notificaciones_pago(cita)

                return jsonify({
                    'success': True,
                    'message': 'Pago confirmado exitosamente',
                    'payment_id': payment_id,
                    'state': resultado['state']
                }), 200

            except Exception as e:
                self.mysql.connection.rollback()
                raise e
            finally:
                cur.close()

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    
    def obtener_cita_detalle(self, payload, cita_id):
        """GET /citas/<id> - Obtener detalle de una cita"""
        try:
            user_id = payload['user_id']
            
            cur = self.mysql.connection.cursor()
            try:
                cita = self._obtener_cita_detalle_db(cur, cita_id, user_id)
                if not cita:
                    return jsonify({'error': 'Cita no encontrada'}), 404
                
                cita_serializada = serializar_cita(cita)
                
                return jsonify(cita_serializada), 200
            finally:
                cur.close()
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    # ========== MÉTODOS PRIVADOS DE BASE DE DATOS ==========
    
    def _verificar_profesional(self, cur, profesional_id):
        """Verifica que el profesional existe"""
        cur.execute("SELECT id, nombre, correo FROM profesional WHERE id = %s", (profesional_id,))
        return cur.fetchone()
    
    def _obtener_cliente(self, cur, cliente_id):
        """Obtiene información del cliente"""
        cur.execute("SELECT nombre, correo FROM clientes WHERE id = %s", (cliente_id,))
        return cur.fetchone()
    
    def _verificar_conflicto_horario(self, cur, cliente_id, profesional_id, fecha, hora_inicio, hora_fin):
        """Verifica si hay conflictos de horario"""
        cur.execute("""
            SELECT COUNT(*) as count FROM citas 
            WHERE cliente_id = %s 
            AND profesional_id = %s
            AND fecha = %s 
            AND estado IN ('pendiente', 'aceptada', 'pagada')
            AND (
                (hora_inicio < %s AND hora_fin > %s) OR
                (hora_inicio < %s AND hora_fin > %s) OR
                (hora_inicio >= %s AND hora_fin <= %s)
            )
        """, (
            cliente_id, profesional_id, fecha,
            hora_fin, hora_inicio,
            hora_fin, hora_inicio,
            hora_inicio, hora_fin
        ))
        
        conflicto = cur.fetchone()
        return conflicto and conflicto['count'] > 0
    
    def _insertar_cita(self, cur, cliente_id, data):
        """Inserta una nueva cita en la base de datos"""
        cur.execute("""
            INSERT INTO citas (
                cliente_id, profesional_id, fecha, hora_inicio, hora_fin, 
                duracion, motivo, notas_cliente, monto_total, estado
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pendiente')
        """, (
            cliente_id,
            data['profesional_id'],
            data['fecha'],
            data['hora_inicio'],
            data['hora_fin'],
            data['duracion'],
            data['motivo'],
            data.get('notas_cliente'),
            data['monto_total']
        ))
        return cur.lastrowid
    
    def _obtener_citas_por_cliente(self, cur, cliente_id, estado=None):
        """Obtiene citas de un cliente"""
        query = """
            SELECT 
                c.id, c.fecha, c.hora_inicio, c.hora_fin, c.duracion,
                c.lugar, c.modalidad, c.motivo, c.notas_cliente,
                c.estado, c.monto_total, c.fecha_solicitud,
                c.motivo_rechazo, c.motivo_cancelacion,
                p.id as profesional_id, p.nombre as profesional_nombre,
                p.ocupacion, p.telefono as profesional_telefono
            FROM citas c
            INNER JOIN profesional p ON c.profesional_id = p.id
            WHERE c.cliente_id = %s
        """
        params = [cliente_id]
        
        if estado:
            query += " AND c.estado = %s"
            params.append(estado)
        
        query += " ORDER BY c.fecha DESC, c.hora_inicio DESC"
        
        cur.execute(query, params)
        return cur.fetchall()
    
    def _obtener_citas_por_profesional(self, cur, profesional_id, estado=None):
        """Obtiene citas de un profesional"""
        query = """
            SELECT 
                c.id, c.fecha, c.hora_inicio, c.hora_fin, c.duracion,
                c.lugar, c.modalidad, c.motivo, c.notas_cliente,
                c.notas_profesional, c.estado, c.monto_total,
                c.fecha_solicitud, c.fecha_respuesta,
                cl.id as cliente_id, cl.nombre as cliente_nombre,
                cl.correo as cliente_correo, cl.telefono as cliente_telefono
            FROM citas c
            INNER JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.profesional_id = %s
        """
        params = [profesional_id]
        
        if estado:
            query += " AND c.estado = %s"
            params.append(estado)
        
        query += " ORDER BY c.fecha DESC, c.hora_inicio DESC"
        
        cur.execute(query, params)
        return cur.fetchall()
    
    def _obtener_cita_completa(self, cur, cita_id, profesional_id):
        """Obtiene información completa de una cita"""
        cur.execute("""
            SELECT 
                c.estado, c.fecha, c.hora_inicio, c.monto_total, c.motivo,
                cl.id as cliente_id, cl.nombre as cliente_nombre, 
                cl.correo as cliente_correo,
                p.nombre as profesional_nombre
            FROM citas c
            INNER JOIN clientes cl ON c.cliente_id = cl.id
            INNER JOIN profesional p ON c.profesional_id = p.id
            WHERE c.id = %s AND c.profesional_id = %s
        """, (cita_id, profesional_id))
        
        return cur.fetchone()
    
    def _obtener_cita_basica(self, cur, cita_id):
        """Obtiene información básica de una cita"""
        cur.execute("""
            SELECT cliente_id, profesional_id, estado 
            FROM citas WHERE id = %s
        """, (cita_id,))
        return cur.fetchone()
    
    def _obtener_cita_para_pago(self, cur, cita_id, cliente_id):
        """Obtiene información de la cita para procesar pago"""
        cur.execute("""
            SELECT c.estado, c.fecha, c.hora_inicio, c.monto_total,
                   c.lugar, c.modalidad,
                   cl.nombre as cliente_nombre, cl.correo as cliente_correo,
                   p.nombre as profesional_nombre, p.correo as profesional_correo
            FROM citas c
            INNER JOIN clientes cl ON c.cliente_id = cl.id
            INNER JOIN profesional p ON c.profesional_id = p.id
            WHERE c.id = %s AND c.cliente_id = %s
        """, (cita_id, cliente_id))
        return cur.fetchone()
    
    def _obtener_cita_detalle_db(self, cur, cita_id, user_id):
        """Obtiene detalle completo de una cita"""
        cur.execute("""
            SELECT 
                c.*,
                cl.nombre as cliente_nombre, cl.correo as cliente_correo,
                cl.telefono as cliente_telefono,
                p.nombre as profesional_nombre, p.correo as profesional_correo,
                p.telefono as profesional_telefono, p.ocupacion
            FROM citas c
            INNER JOIN clientes cl ON c.cliente_id = cl.id
            INNER JOIN profesional p ON c.profesional_id = p.id
            WHERE c.id = %s AND (c.cliente_id = %s OR c.profesional_id = %s)
        """, (cita_id, user_id, user_id))
        
        return cur.fetchone()
    
    def _cancelar_cita_db(self, cur, cita_id, motivo, cancelada_por):
        """Cancela una cita en la base de datos"""
        cur.execute("""
            UPDATE citas 
            SET estado = 'cancelada',
                fecha_cancelacion = NOW(),
                motivo_cancelacion = %s,
                cancelada_por = %s
            WHERE id = %s
        """, (motivo, cancelada_por, cita_id))
    
    def _marcar_cita_como_pagada(self, cur, cita_id):
        """Marca una cita como pagada"""
        cur.execute("""
            UPDATE citas 
            SET estado = 'pagada',
                fecha_pago = NOW()
            WHERE id = %s
        """, (cita_id,))
    
    # ========== MÉTODOS DE RESPUESTA A CITAS ==========
    
    def _aceptar_cita(self, cur, cita_id, data, cita):
        """Acepta una cita"""
        lugar = data.get('lugar')
        modalidad = data.get('modalidad', 'presencial')
        
        valido, error = self.validator.validar_aceptar_cita(data, modalidad)
        if not valido:
            return jsonify({'error': error}), 400
        
        cur.execute("""
            UPDATE citas 
            SET estado = 'aceptada', 
                fecha_respuesta = NOW(),
                lugar = %s,
                modalidad = %s
            WHERE id = %s
        """, (lugar, modalidad, cita_id))
        
        self.mysql.connection.commit()
        
        # Enviar notificación
        self._enviar_notificacion_aceptacion(cita, lugar, modalidad)
        
        return jsonify({'message': 'Cita aceptada exitosamente'}), 200
    
    def _rechazar_cita(self, cur, cita_id, data, cita):
        """Rechaza una cita"""
        motivo_rechazo = data.get('motivo_rechazo', 'No especificado')
        
        cur.execute("""
            UPDATE citas 
            SET estado = 'rechazada',
                fecha_respuesta = NOW(),
                motivo_rechazo = %s
            WHERE id = %s
        """, (motivo_rechazo, cita_id))
        
        self.mysql.connection.commit()
        
        # Enviar notificación
        self._enviar_notificacion_rechazo(cita, motivo_rechazo)
        
        return jsonify({'message': 'Cita rechazada'}), 200
    
    # ========== MÉTODOS DE NOTIFICACIONES ==========
    
    def _enviar_notificaciones_nueva_cita(self, profesional, cliente, data):
        """Envía notificaciones cuando se crea una cita"""
        try:
            mail = current_app.extensions.get('mail')
            
            if mail and cliente:
                # Notificar al profesional
                notification_service.notificar_cita_profesional(
                    mail=mail,
                    profesional_nombre=profesional['nombre'],
                    profesional_email=profesional['correo'],
                    cliente_nombre=cliente['nombre'],
                    fecha=data['fecha'],
                    hora=data['hora_inicio'],
                    motivo=data['motivo']
                )
                
                # Notificar al cliente
                notification_service.notificar_cita_cliente(
                    mail=mail,
                    cliente_nombre=cliente['nombre'],
                    cliente_email=cliente['correo'],
                    profesional_nombre=profesional['nombre'],
                    fecha=data['fecha'],
                    hora=data['hora_inicio'],
                    monto_total=data['monto_total']
                )
        except Exception as e:
            pass
    
    def _enviar_notificacion_aceptacion(self, cita, lugar, modalidad):
        """Envía notificación de cita aceptada"""
        try:
            mail = current_app.extensions.get('mail')
            if mail:
                hora_str = convertir_hora_a_string(cita['hora_inicio'])
                fecha_str = convertir_fecha_a_string(cita['fecha'])
                
                notification_service.notificar_cita_aceptada(
                    mail=mail,
                    cliente_nombre=cita['cliente_nombre'],
                    cliente_email=cita['cliente_correo'],
                    profesional_nombre=cita['profesional_nombre'],
                    fecha=fecha_str,
                    hora=hora_str,
                    lugar=lugar,
                    modalidad=modalidad,
                    monto_total=cita['monto_total']
                )
        except Exception as e:
            pass
    
    def _enviar_notificacion_rechazo(self, cita, motivo_rechazo):
        """Envía notificación de cita rechazada"""
        try:
            mail = current_app.extensions.get('mail')
            if mail:
                hora_str = convertir_hora_a_string(cita['hora_inicio'])
                fecha_str = convertir_fecha_a_string(cita['fecha'])
                
                notification_service.notificar_cita_rechazada(
                    mail=mail,
                    cliente_nombre=cita['cliente_nombre'],
                    cliente_email=cita['cliente_correo'],
                    profesional_nombre=cita['profesional_nombre'],
                    fecha=fecha_str,
                    hora=hora_str,
                    motivo_rechazo=motivo_rechazo
                )
        except Exception as e:
            pass
    
    def _enviar_notificaciones_pago(self, cita):
        """Envía notificaciones cuando se procesa un pago"""
        try:
            mail = current_app.extensions.get('mail')
            if mail:
                hora_str = convertir_hora_a_string(cita['hora_inicio'])
                fecha_str = convertir_fecha_a_string(cita['fecha'])
                
                # Notificar al cliente
                notification_service.notificar_pago_confirmado_cliente(
                    mail=mail,
                    cliente_nombre=cita['cliente_nombre'],
                    cliente_email=cita['cliente_correo'],
                    profesional_nombre=cita['profesional_nombre'],
                    fecha=fecha_str,
                    hora=hora_str,
                    lugar=cita['lugar'],
                    modalidad=cita['modalidad']
                )
                
                # Notificar al profesional
                notification_service.notificar_pago_confirmado_profesional(
                    mail=mail,
                    profesional_nombre=cita['profesional_nombre'],
                    profesional_email=cita['profesional_correo'],
                    cliente_nombre=cita['cliente_nombre'],
                    fecha=fecha_str,
                    hora=hora_str,
                    monto_total=cita['monto_total']
                )
        except Exception as e:
            pass
    


    def enviar_recordatorio(self, payload):
        """POST /citas/recordatorio - Enviar recordatorio de cita por correo"""
        try:
            data = request.get_json(silent=True) or {}
            cita_id = data.get('cita_id')
            cliente_id = payload['user_id']
            
            if not cita_id:
                return jsonify({'error': 'Falta cita_id'}), 400
            
            cur = self.mysql.connection.cursor()
            try:
                # Obtener información completa de la cita
                cur.execute("""
                    SELECT 
                        c.id, c.fecha, c.hora_inicio, c.hora_fin, c.lugar, 
                        c.modalidad, c.motivo, c.monto_total, c.estado,
                        cl.nombre as cliente_nombre, cl.correo as cliente_correo,
                        p.nombre as profesional_nombre, p.telefono as profesional_telefono
                    FROM citas c
                    INNER JOIN clientes cl ON c.cliente_id = cl.id
                    INNER JOIN profesional p ON c.profesional_id = p.id
                    WHERE c.id = %s AND c.cliente_id = %s AND c.estado = 'pagada'
                """, (cita_id, cliente_id))
                
                cita = cur.fetchone()
                
                if not cita:
                    return jsonify({'error': 'Cita no encontrada o no está pagada'}), 404
                
                # Enviar email de recordatorio
                mail = current_app.extensions.get('mail')
                if mail:
                    self._enviar_email_recordatorio(mail, cita)
                    return jsonify({
                        'success': True,
                        'message': 'Recordatorio enviado por correo'
                    }), 200
                else:
                    return jsonify({'error': 'Servicio de correo no disponible'}), 500
                    
            finally:
                cur.close()
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def _enviar_email_recordatorio(self, mail, cita):
        """Envía email de recordatorio al cliente"""
        try:
            notification_service.notificar_recordatorio_cita(
                mail=mail,
                cliente_nombre=cita['cliente_nombre'],
                cliente_email=cita['cliente_correo'],
                profesional_nombre=cita['profesional_nombre'],
                profesional_telefono=cita['profesional_telefono'],
                fecha=cita['fecha'],
                hora_inicio=cita['hora_inicio'],
                hora_fin=cita['hora_fin'],
                lugar=cita['lugar'],
                modalidad=cita['modalidad'],
                motivo=cita['motivo']
            )
        except Exception as e:
            pass

    def actualizar_notas_profesional(self, payload, cita_id):
        """PUT /citas/<id>/notas - Actualizar notas profesionales de una cita"""
        try:
            profesional_id = payload['user_id']
            data = request.get_json(silent=True) or {}
            
            notas_profesional = data.get('notas_profesional', '').strip()
            
            cur = self.mysql.connection.cursor()
            try:
                # Verificar que la cita existe y pertenece al profesional
                cur.execute("""
                    SELECT id, estado, fecha, hora_fin 
                    FROM citas 
                    WHERE id = %s AND profesional_id = %s
                """, (cita_id, profesional_id))
                
                cita = cur.fetchone()
                
                if not cita:
                    return jsonify({'error': 'Cita no encontrada o no autorizado'}), 404
                
                # Verificar que la cita ya pasó (opcional, puedes quitar esta validación si quieres)
                from datetime import datetime
                fecha_hora_fin = datetime.combine(cita['fecha'], 
                                                (datetime.min + cita['hora_fin']).time())
                
                if fecha_hora_fin > datetime.now():
                    return jsonify({'error': 'Solo puedes agregar notas a citas que ya ocurrieron'}), 400
                
                # Actualizar las notas
                cur.execute("""
                    UPDATE citas 
                    SET notas_profesional = %s,
                        updated_at = NOW()
                    WHERE id = %s
                """, (notas_profesional, cita_id))
                
                self.mysql.connection.commit()
                
                return jsonify({
                    'message': 'Notas actualizadas exitosamente',
                    'notas_profesional': notas_profesional
                }), 200
                
            except Exception as e:
                self.mysql.connection.rollback()
                raise e
            finally:
                cur.close()
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    def obtener_estadisticas_profesional(self, payload):
        """GET /citas/estadisticas - Obtener estadísticas del profesional"""
        try:
            profesional_id = payload['user_id']
            
            # Obtener filtros de fecha (opcional)
            fecha_inicio = request.args.get('fecha_inicio')
            fecha_fin = request.args.get('fecha_fin')
            
            cur = self.mysql.connection.cursor()
            try:
                # Query base con filtros opcionales
                where_clause = "WHERE profesional_id = %s"
                params = [profesional_id]
                
                if fecha_inicio:
                    where_clause += " AND fecha >= %s"
                    params.append(fecha_inicio)
                if fecha_fin:
                    where_clause += " AND fecha <= %s"
                    params.append(fecha_fin)
                
                # 1. Total de citas por estado
                cur.execute(f"""
                    SELECT estado, COUNT(*) as total
                    FROM citas
                    {where_clause}
                    GROUP BY estado
                """, params)
                citas_por_estado = cur.fetchall()
                
                # 2. Ingresos totales y proyectados
                cur.execute(f"""
                    SELECT 
                        SUM(CASE WHEN estado = 'pagada' THEN monto_total ELSE 0 END) as ingresos_confirmados,
                        SUM(CASE WHEN estado = 'aceptada' THEN monto_total ELSE 0 END) as ingresos_pendientes,
                        SUM(monto_total) as ingresos_totales,
                        COUNT(CASE WHEN estado = 'pagada' THEN 1 END) as citas_pagadas,
                        COUNT(*) as total_citas
                    FROM citas
                    {where_clause}
                """, params)
                ingresos = cur.fetchone()
                
                # 3. Citas por mes (últimos 6 meses)
                cur.execute("""
                    SELECT 
                        DATE_FORMAT(fecha, '%%Y-%%m') as mes,
                        COUNT(*) as total,
                        SUM(CASE WHEN estado = 'pagada' THEN monto_total ELSE 0 END) as ingresos
                    FROM citas
                    WHERE profesional_id = %s
                    AND fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                    GROUP BY mes
                    ORDER BY mes
                """, [profesional_id])
                citas_por_mes = cur.fetchall()
                
                # 4. Top clientes (más citas)
                cur.execute(f"""
                    SELECT 
                        c.nombre,
                        c.correo,
                        COUNT(ci.id) as total_citas,
                        SUM(CASE WHEN ci.estado = 'pagada' THEN ci.monto_total ELSE 0 END) as total_pagado
                    FROM citas ci
                    JOIN clientes c ON ci.cliente_id = c.id
                    {where_clause}
                    GROUP BY c.id, c.nombre, c.correo
                    ORDER BY total_citas DESC
                    LIMIT 10
                """, params)
                top_clientes = cur.fetchall()
                
                # 5. Tasa de cancelación
                cur.execute(f"""
                    SELECT 
                        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
                        COUNT(*) as total
                    FROM citas
                    {where_clause}
                """, params)
                tasas = cur.fetchone()
                tasa_cancelacion = (tasas['canceladas'] / tasas['total'] * 100) if tasas['total'] > 0 else 0
                
                # 6. Horarios más solicitados
                cur.execute(f"""
                    SELECT 
                        HOUR(hora_inicio) as hora,
                        COUNT(*) as total
                    FROM citas
                    {where_clause}
                    GROUP BY hora
                    ORDER BY total DESC
                    LIMIT 5
                """, params)
                horarios_populares = cur.fetchall()
                
                # 7. Promedio de duración entre citas
                cur.execute(f"""
                    SELECT AVG(TIMESTAMPDIFF(DAY, fecha_solicitud, fecha)) as dias_promedio
                    FROM citas
                    {where_clause}
                    AND fecha >= fecha_solicitud
                """, params)
                duracion = cur.fetchone()
                
                return jsonify({
                    'resumen': {
                        'total_citas': ingresos['total_citas'] or 0,
                        'citas_pagadas': ingresos['citas_pagadas'] or 0,
                        'ingresos_confirmados': float(ingresos['ingresos_confirmados'] or 0),
                        'ingresos_pendientes': float(ingresos['ingresos_pendientes'] or 0),
                        'ingresos_totales': float(ingresos['ingresos_totales'] or 0),
                        'tasa_cancelacion': round(tasa_cancelacion, 2),
                        'dias_promedio_reserva': round(duracion['dias_promedio'] or 0, 1) if duracion['dias_promedio'] else 0
                    },
                    'citas_por_estado': [
                        {'estado': row['estado'], 'total': row['total']}
                        for row in citas_por_estado
                    ],
                    'citas_por_mes': [
                        {
                            'mes': row['mes'],
                            'total': row['total'],
                            'ingresos': float(row['ingresos'] or 0)
                        }
                        for row in citas_por_mes
                    ],
                    'top_clientes': [
                        {
                            'nombre': row['nombre'],
                            'correo': row['correo'],
                            'total_citas': row['total_citas'],
                            'total_pagado': float(row['total_pagado'] or 0)
                        }
                        for row in top_clientes
                    ],
                    'horarios_populares': [
                        {
                            'hora': f"{row['hora']:02d}:00",
                            'total': row['total']
                        }
                        for row in horarios_populares
                    ]
                }), 200
                
            finally:
                cur.close()
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error al obtener estadísticas: {str(e)}'}), 500