from flask import Blueprint, jsonify, request, current_app
from utils.jwt_helper import jwt_helper
from utils.verification_helper import verification_helper
from services.auth_service import auth_service

# NO crear instancia de MySQL aquí
bp_clientes = Blueprint('clientes', __name__)
mysql = None  # Se inyectará desde app.py

# Almacenamiento temporal de registros pendientes
pending_registrations = {}


class ClienteController:
    """Controlador para endpoints de clientes"""
    
    REQUIRED_FIELDS = ['nombre', 'edad', 'ocupacion', 'correo', 'contrasena', 'telefono']
    
    @staticmethod
    def login():
        """POST /clientes/login - Autenticación de cliente"""
        try:
            data = request.get_json(silent=True) or {}
            
            if not data.get('correo') or not data.get('contrasena'):
                return jsonify({'error': 'Correo y contraseña son requeridos'}), 400
            
            cur = mysql.connection.cursor()
            try:
                cur.execute(
                    "SELECT id, nombre, correo, contrasena FROM clientes WHERE correo = %s",
                    (data['correo'],)
                )
                user = cur.fetchone()
                
                if not user:
                    return jsonify({'error': 'Usuario no encontrado, Registrese para continuar'}), 401
                
                # Acceso por clave (DictCursor)
                if not auth_service.verify_password(user['contrasena'], data['contrasena']):
                    return jsonify({'error': 'Contraseña incorrecta'}), 401
                
                token = auth_service.generate_token(user['id'], user['correo'])
                
                return jsonify({
                    'message': 'Login exitoso',
                    'token': token,
                    'usuario': {
                        'id': user['id'],
                        'nombre': user['nombre'],
                        'correo': user['correo']
                    }
                }), 200
            finally:
                cur.close()
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error interno: {str(e)}'}), 500
    
    @staticmethod
    def get_profile(payload):
        """GET /clientes/perfil - Obtener perfil del cliente autenticado"""
        try:
            cur = mysql.connection.cursor()
            try:
                cur.execute(
                    "SELECT id, nombre, edad, ocupacion, correo, telefono FROM clientes WHERE id = %s",
                    (payload['user_id'],)
                )
                user = cur.fetchone()
                
                if not user:
                    return jsonify({'error': 'Usuario no encontrado'}), 404
                
                return jsonify({
                    'id': user['id'],
                    'nombre': user['nombre'],
                    'edad': user['edad'],
                    'ocupacion': user['ocupacion'],
                    'correo': user['correo'],
                    'telefono': user['telefono']
                }), 200
            finally:
                cur.close()
        except Exception as e:
           
            return jsonify({'error': str(e)}), 500
    
    @staticmethod
    def register():
        """POST /clientes/registro - Paso 1: Guardar datos temporalmente"""
        try:
            data = request.get_json(silent=True) or {}
            
            # Validar campos requeridos
            missing = [f for f in ClienteController.REQUIRED_FIELDS if f not in data]
            if missing:
                return jsonify({'error': f'Faltan campos: {", ".join(missing)}'}), 400
            
            # Verificar si el correo ya existe
            cur = mysql.connection.cursor()
            try:
                cur.execute("SELECT id FROM clientes WHERE correo = %s", (data['correo'],))
                if cur.fetchone():
                    return jsonify({'error': 'El correo ya está registrado'}), 400
            finally:
                cur.close()
            
            # Guardar datos temporalmente
            temp_id = data['correo']
            pending_registrations[temp_id] = {
                'nombre': data['nombre'],
                'edad': data['edad'],
                'ocupacion': data['ocupacion'],
                'correo': data['correo'],
                'contrasena': auth_service.hash_password(data['contrasena']),
                'telefono': data['telefono'],
                'tipo': 'cliente'
            }
            
            return jsonify({
                'message': 'Datos guardados. Solicita verificación.',
                'temp_id': temp_id,
                'correo': data['correo']
            }), 200
            
        except Exception as e:
            
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error interno: {str(e)}'}), 500
    
    @staticmethod
    def send_verification_code():
        """POST /clientes/enviar-codigo - Paso 2: Enviar código por email"""
        try:
            data = request.get_json(silent=True) or {}
            temp_id = data.get('temp_id')
            
            if not temp_id or temp_id not in pending_registrations:
                return jsonify({'error': 'Registro no encontrado o expirado'}), 404
            
            registration_data = pending_registrations[temp_id]
            code = verification_helper.generate_code(6)
            verification_helper.save_code(registration_data['correo'], code, 'cliente')
            
            mail = current_app.extensions.get('mail')
            if verification_helper.send_verification_email(mail, registration_data['correo'], code):
                return jsonify({'message': f'Código enviado a {registration_data["correo"]}'}), 200
            
            return jsonify({'error': 'Error al enviar email'}), 500
        except Exception as e:
            
            return jsonify({'error': str(e)}), 500
    
    @staticmethod
    def verify_code():
        """POST /clientes/verificar-codigo - Paso 3: Verificar código e insertar en BD"""
        try:
            data = request.get_json(silent=True) or {}
            temp_id = data.get('temp_id')
            code = data.get('codigo')
            
            if not temp_id or not code:
                return jsonify({'error': 'temp_id y codigo son requeridos'}), 400
            
            if temp_id not in pending_registrations:
                return jsonify({'error': 'Registro no encontrado'}), 404
            
            registration_data = pending_registrations[temp_id]
            valid, message = verification_helper.verify_code(registration_data['correo'], code)
            
            if not valid:
                return jsonify({'error': message}), 400
            
            # Insertar en BD
            cur = mysql.connection.cursor()
            try:
                cur.execute("""
                    INSERT INTO clientes (nombre, edad, ocupacion, correo, contrasena, telefono)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    registration_data['nombre'],
                    registration_data['edad'],
                    registration_data['ocupacion'],
                    registration_data['correo'],
                    registration_data['contrasena'],
                    registration_data['telefono']
                ))
                mysql.connection.commit()
                
                nuevo_id = cur.lastrowid
                token = auth_service.generate_token(nuevo_id, registration_data['correo'])
                
                # Limpiar datos temporales
                verification_helper.clear_code(registration_data['correo'])
                del pending_registrations[temp_id]
                
                return jsonify({
                    'message': 'Registro completado exitosamente',
                    'id': nuevo_id,
                    'token': token
                }), 201
                
            except Exception as e:
                mysql.connection.rollback()
                raise e
            finally:
                cur.close()
            
        except Exception as e:
            
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error al crear cliente: {str(e)}'}), 500
    
    @staticmethod
    def get_all():
        """GET /clientes - Obtener todos los clientes"""
        try:
            cur = mysql.connection.cursor()
            try:
                cur.execute("SELECT id, nombre, edad, ocupacion, correo, telefono FROM clientes")
                clientes = cur.fetchall()
                
                # Ya son diccionarios por DictCursor
                return jsonify(clientes), 200
            finally:
                cur.close()
        except Exception as e:
            
            return jsonify({'error': str(e)}), 500
    
    @staticmethod
    def update(payload, user_id):
        """PUT /clientes/<id> - Actualizar perfil del cliente"""
        if payload['user_id'] != user_id:
            return jsonify({'error': 'No autorizado'}), 403
        
        try:
            data = request.get_json(silent=True) or {}
            
            # Construir query dinámica
            fields = []
            values = []
            
            allowed_fields = {
                'nombre': 'nombre',
                'edad': 'edad',
                'ocupacion': 'ocupacion',
                'telefono': 'telefono'
            }
            
            for key, db_field in allowed_fields.items():
                if key in data:
                    fields.append(f"{db_field} = %s")
                    values.append(data[key])
            
            if 'contrasena' in data:
                fields.append("contrasena = %s")
                values.append(auth_service.hash_password(data['contrasena']))
            
            if not fields:
                return jsonify({'error': 'No hay campos para actualizar'}), 400
            
            values.append(user_id)
            query = f"UPDATE clientes SET {', '.join(fields)} WHERE id = %s"
            
            cur = mysql.connection.cursor()
            try:
                cur.execute(query, values)
                mysql.connection.commit()
                return jsonify({'message': 'Cliente actualizado exitosamente'}), 200
            finally:
                cur.close()
                
        except Exception as e:
          
            return jsonify({'error': str(e)}), 500
    @staticmethod
    def request_password_change(payload):
        """POST /clientes/cambiar-password/solicitar - Paso 1: Solicitar cambio de contraseña"""
        try:
            data = request.get_json(silent=True) or {}
            
            if not data.get('contrasena_actual') or not data.get('contrasena_nueva'):
                return jsonify({'error': 'Contraseña actual y nueva son requeridas'}), 400
            
            # Verificar contraseña actual y obtener correo
            cur = mysql.connection.cursor()
            try:
                cur.execute(
                    "SELECT correo, contrasena FROM clientes WHERE id = %s",
                    (payload['user_id'],)
                )
                user = cur.fetchone()
                
                if not user:
                    return jsonify({'error': 'Usuario no encontrado'}), 404
                
                if not auth_service.verify_password(user['contrasena'], data['contrasena_actual']):
                    return jsonify({'error': 'Contraseña actual incorrecta'}), 401
                
                # Generar y enviar código al correo del usuario
                correo_usuario = user['correo']
                code = verification_helper.generate_code(6)
                verification_helper.save_code(correo_usuario, code, 'password_change')
                
                mail = current_app.extensions.get('mail')
                if verification_helper.send_verification_email(mail, correo_usuario, code):
                    return jsonify({'message': f'Código enviado a tu correo actual'}), 200
                
                return jsonify({'error': 'Error al enviar email'}), 500
                
            finally:
                cur.close()
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error interno: {str(e)}'}), 500

    @staticmethod
    def verify_password_change(payload):
        """POST /clientes/cambiar-password/verificar - Paso 2: Verificar código y cambiar contraseña"""
        try:
            data = request.get_json(silent=True) or {}
            
            if not data.get('codigo') or not data.get('contrasena_nueva'):
                return jsonify({'error': 'Código y contraseña nueva son requeridos'}), 400
            
            # Obtener correo del usuario
            cur = mysql.connection.cursor()
            try:
                cur.execute(
                    "SELECT correo FROM clientes WHERE id = %s",
                    (payload['user_id'],)
                )
                user = cur.fetchone()
                
                if not user:
                    return jsonify({'error': 'Usuario no encontrado'}), 404
                
                correo_usuario = user['correo']
                
                # Verificar código
                valid, message = verification_helper.verify_code(correo_usuario, data['codigo'])
                
                if not valid:
                    return jsonify({'error': message}), 400
                
                # Actualizar contraseña
                hashed_password = auth_service.hash_password(data['contrasena_nueva'])
                cur.execute(
                    "UPDATE clientes SET contrasena = %s WHERE id = %s",
                    (hashed_password, payload['user_id'])
                )
                mysql.connection.commit()
                
                # Limpiar código
                verification_helper.clear_code(correo_usuario)
                
                return jsonify({'message': 'Contraseña actualizada exitosamente'}), 200
                
            except Exception as e:
                mysql.connection.rollback()
                raise e
            finally:
                cur.close()
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error al cambiar contraseña: {str(e)}'}), 500

    @staticmethod
    def request_email_change(payload):
        """POST /clientes/cambiar-correo/solicitar - Paso 1: Solicitar cambio de correo"""
        try:
            data = request.get_json(silent=True) or {}
            
            if not data.get('correo_nuevo'):
                return jsonify({'error': 'Correo nuevo es requerido'}), 400
            
            # Verificar que el nuevo correo no esté en uso
            cur = mysql.connection.cursor()
            try:
                cur.execute("SELECT id FROM clientes WHERE correo = %s", (data['correo_nuevo'],))
                if cur.fetchone():
                    return jsonify({'error': 'El correo ya está registrado'}), 400
                
                # Generar y enviar código al NUEVO correo
                code = verification_helper.generate_code(6)
                verification_helper.save_code(data['correo_nuevo'], code, 'email_change')
                
                mail = current_app.extensions.get('mail')
                if verification_helper.send_verification_email(mail, data['correo_nuevo'], code):
                    return jsonify({'message': f'Código enviado a {data["correo_nuevo"]}'}), 200
                
                return jsonify({'error': 'Error al enviar email'}), 500
                
            finally:
                cur.close()
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error interno: {str(e)}'}), 500

    @staticmethod
    def verify_email_change(payload):
        """POST /clientes/cambiar-correo/verificar - Paso 2: Verificar código y cambiar correo"""
        try:
            data = request.get_json(silent=True) or {}
            
            if not data.get('codigo') or not data.get('correo_nuevo'):
                return jsonify({'error': 'Código y correo nuevo son requeridos'}), 400
            
            # Verificar código
            valid, message = verification_helper.verify_code(data['correo_nuevo'], data['codigo'])
            
            if not valid:
                return jsonify({'error': message}), 400
            
            # Actualizar correo
            cur = mysql.connection.cursor()
            try:
                cur.execute(
                    "UPDATE clientes SET correo = %s WHERE id = %s",
                    (data['correo_nuevo'], payload['user_id'])
                )
                mysql.connection.commit()
                
                # Limpiar código
                verification_helper.clear_code(data['correo_nuevo'])
                
                return jsonify({'message': 'Correo actualizado exitosamente'}), 200
                
            except Exception as e:
                mysql.connection.rollback()
                raise e
            finally:
                cur.close()
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error al cambiar correo: {str(e)}'}), 500

# Registrar rutas
bp_clientes.route('/login', methods=['POST'])(ClienteController.login)
bp_clientes.route('/perfil', methods=['GET'])(jwt_helper.token_required(ClienteController.get_profile))
bp_clientes.route('/registro', methods=['POST'])(ClienteController.register)
bp_clientes.route('/enviar-codigo', methods=['POST'])(ClienteController.send_verification_code)
bp_clientes.route('/verificar-codigo', methods=['POST'])(ClienteController.verify_code)
bp_clientes.route('/', methods=['GET'])(ClienteController.get_all)
bp_clientes.route('/<int:user_id>', methods=['PUT'])(jwt_helper.token_required(ClienteController.update))
# Al final del archivo clientes.py, después de las otras rutas:
bp_clientes.route('/cambiar-password/solicitar', methods=['POST'])(
    jwt_helper.token_required(ClienteController.request_password_change)
)
bp_clientes.route('/cambiar-password/verificar', methods=['POST'])(
    jwt_helper.token_required(ClienteController.verify_password_change)
)
bp_clientes.route('/cambiar-correo/solicitar', methods=['POST'])(
    jwt_helper.token_required(ClienteController.request_email_change)
)
bp_clientes.route('/cambiar-correo/verificar', methods=['POST'])(
    jwt_helper.token_required(ClienteController.verify_email_change)
)