from flask import Blueprint, jsonify, request, current_app, redirect, send_from_directory
from werkzeug.utils import safe_join
import os

from utils.jwt_helper import jwt_helper
from utils.verification_helper import verification_helper
from services.auth_service import auth_service
from services.file_service import file_service


bp_profesionales = Blueprint('profesionales', __name__)
mysql = None  # Se inyectará desde app.py

# Almacenamiento temporal de registros pendientes
pending_registrations = {}


class ProfesionalController:
    """Controlador para endpoints de profesionales"""
    
    REQUIRED_FIELDS = ['nombre', 'correo', 'contrasena', 'telefono', 'ocupacion', 'exp', 'tarifa']
    
    @staticmethod
    def login():
        """POST /profesionales/login - Autenticación de profesional"""
        try:
            data = request.get_json(silent=True) or {}
            
            if not data.get('correo') or not data.get('contrasena'):
                return jsonify({'error': 'Correo y contraseña son requeridos'}), 400
            
            cur = mysql.connection.cursor()
            try:
                cur.execute(
                    "SELECT id, nombre, correo, contrasena FROM profesional WHERE correo = %s",
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
        """GET /profesionales/perfil - Obtener perfil del profesional autenticado"""
        cur = mysql.connection.cursor()
        try:
            cur.execute("""
                SELECT id, nombre, correo, telefono, ocupacion, exp, cv, linkedin, tarifa, foto 
                FROM profesional WHERE id = %s
            """, (payload['user_id'],))
            user = cur.fetchone()
            
            if not user:
                return jsonify({'error': 'Usuario no encontrado'}), 404
            
            return jsonify({
                'id': user['id'],
                'nombre': user['nombre'],
                'correo': user['correo'],
                'telefono': user['telefono'],
                'ocupacion': user['ocupacion'],
                'exp': user['exp'],
                'cv': user['cv'],
                'linkedin': user['linkedin'],
                'tarifa': float(user['tarifa']) if user['tarifa'] is not None else 0.0,
                'foto': user.get('foto')
            }), 200
        finally:
            cur.close()
    
    @staticmethod
    def register():
        """POST /profesionales/registro - Paso 1: Guardar datos temporalmente"""
        try:
            # Detectar tipo de contenido (multipart o JSON)
            if request.content_type and 'multipart/form-data' in request.content_type:
                data = request.form.to_dict()
                cv_file = request.files.get('cv')
            else:
                data = request.get_json(silent=True) or {}
                cv_file = None
            
            # Validar campos requeridos
            missing = [f for f in ProfesionalController.REQUIRED_FIELDS if f not in data]
            if missing:
                return jsonify({'error': f'Faltan campos: {", ".join(missing)}'}), 400
            
            # Verificar si el correo ya existe
            cur = mysql.connection.cursor()
            try:
                cur.execute("SELECT id FROM profesional WHERE correo = %s", (data['correo'],))
                if cur.fetchone():
                    return jsonify({'error': 'El correo ya está registrado'}), 400
            finally:
                cur.close()
            
            # Guardar archivo CV temporalmente si existe
            cv_temp_path = None
            if cv_file and cv_file.filename:
                try:
                    cv_temp_path, _ = file_service.save_file(cv_file, prefix='temp')
                except ValueError as e:
                    return jsonify({'error': str(e)}), 400
            
            # Guardar datos temporalmente
            temp_id = data['correo']
            pending_registrations[temp_id] = {
                'nombre': data['nombre'],
                'correo': data['correo'],
                'contrasena': auth_service.hash_password(data['contrasena']),
                'telefono': data['telefono'],
                'ocupacion': data['ocupacion'],
                'exp': data['exp'],
                'linkedin': data.get('linkedin', ''),
                'tarifa': data['tarifa'],
                'cv_temp_path': cv_temp_path,
                'tipo': 'profesional'
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
        """POST /profesionales/enviar-codigo - Paso 2: Enviar código por email"""
        data = request.get_json(silent=True) or {}
        temp_id = data.get('temp_id')
        
        if not temp_id or temp_id not in pending_registrations:
            return jsonify({'error': 'Registro no encontrado o expirado'}), 404
        
        registration_data = pending_registrations[temp_id]
        code = verification_helper.generate_code(6)
        verification_helper.save_code(registration_data['correo'], code, 'profesional')
        
        mail = current_app.extensions.get('mail')
        if verification_helper.send_verification_email(mail, registration_data['correo'], code):
            return jsonify({'message': f'Código enviado a {registration_data["correo"]}'}), 200
        
        return jsonify({'error': 'Error al enviar email'}), 500
    
    @staticmethod
    def verify_code():
        """POST /profesionales/verificar-codigo - Paso 3: Verificar código e insertar en BD"""
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
        
        # Mover CV a ubicación final si existe
        cv_path = None
        final_path = None
        if registration_data['cv_temp_path'] and os.path.exists(registration_data['cv_temp_path']):
            temp_path = registration_data['cv_temp_path']
            filename = os.path.basename(temp_path).replace('temp_', '')
            final_path = os.path.join(file_service.get_upload_directory(), filename)
            os.rename(temp_path, final_path)
            cv_path = file_service.get_public_path(filename)
        
        # Insertar en BD
        cur = mysql.connection.cursor()
        try:
            cur.execute("""
                INSERT INTO profesional 
                (nombre, correo, contrasena, telefono, ocupacion, exp, cv, linkedin, tarifa)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                registration_data['nombre'],
                registration_data['correo'],
                registration_data['contrasena'],
                registration_data['telefono'],
                registration_data['ocupacion'],
                registration_data['exp'],
                cv_path,
                registration_data['linkedin'],
                registration_data['tarifa']
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
                'token': token,
                'cv_path': cv_path
            }), 201
            
        except Exception as e:
            # Si falla, eliminar archivo CV
            if final_path and os.path.exists(final_path):
                file_service.delete_file(final_path)
            mysql.connection.rollback()
            return jsonify({'error': f'Error al crear profesional: {str(e)}'}), 500
        finally:
            cur.close()
    
    @staticmethod
    def get_all():
        """GET /profesionales - Obtener todos los profesionales"""
        cur = mysql.connection.cursor()
        try:
            cur.execute("""
                SELECT id, nombre, correo, telefono, ocupacion, exp, cv, linkedin, tarifa, foto 
                FROM profesional
            """)
            rows = cur.fetchall()
            
            # Convertir tarifa a float si es necesario
            profesionales_list = []
            for row in rows:
                prof = dict(row)  # Convertir a dict mutable si no lo es
                if prof.get('tarifa') is not None:
                    prof['tarifa'] = float(prof['tarifa'])
                profesionales_list.append(prof)
            
            return jsonify(profesionales_list), 200
        finally:
            cur.close()
    
    @staticmethod
    def get_by_id(payload, profesional_id):
        """GET /profesionales/<id> - Obtener profesional por ID"""
        cur = mysql.connection.cursor()
        try:
            cur.execute("""
                SELECT id, nombre, correo, telefono, ocupacion, exp, cv, linkedin, tarifa, foto 
                FROM profesional WHERE id = %s
            """, (profesional_id,))
            row = cur.fetchone()
            
            if not row:
                return jsonify({'error': 'Profesional no encontrado'}), 404
            
            prof = dict(row)
            if prof.get('tarifa') is not None:
                prof['tarifa'] = float(prof['tarifa'])
            
            return jsonify(prof), 200
        finally:
            cur.close()
    
    @staticmethod
    def update(payload, profesional_id):
        """PUT /profesionales/<id> - Actualizar profesional"""
        if payload['user_id'] != profesional_id:
            return jsonify({'error': 'No autorizado'}), 403
        
        # Detectar tipo de contenido
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            cv_file = request.files.get('cv')
            foto_file = request.files.get('foto')
        else:
            data = request.get_json(silent=True) or {}
            cv_file = None
            foto_file = None
        
        # Construir query dinámica
        fields = []
        values = []
        
        field_mapping = {
            'nombre': 'nombre',
            'telefono': 'telefono',
            'ocupacion': 'ocupacion',
            'exp': 'exp',
            'linkedin': 'linkedin',
            'tarifa': 'tarifa'
        }
        
        for key, db_field in field_mapping.items():
            if key in data:
                fields.append(f"{db_field} = %s")
                values.append(data[key])
        
        if 'contrasena' in data:
            fields.append("contrasena = %s")
            values.append(auth_service.hash_password(data['contrasena']))
        
        # Manejar archivo CV
        if cv_file and cv_file.filename:
            try:
                _, cv_public_path = file_service.save_file(cv_file)
                fields.append("cv = %s")
                values.append(cv_public_path)
            except ValueError as e:
                return jsonify({'error': str(e)}), 400
        elif 'cv' in data:
            fields.append("cv = %s")
            values.append(data['cv'].strip() if data['cv'] else None)
        
        # Manejar archivo FOTO
        if foto_file and foto_file.filename:
            try:
                _, foto_public_path = file_service.save_file(foto_file, file_type='image')
                fields.append("foto = %s")
                values.append(foto_public_path)
            except ValueError as e:
                return jsonify({'error': str(e)}), 400
        
        if not fields:
            return jsonify({'error': 'No hay campos para actualizar'}), 400
        
        values.append(profesional_id)
        query = f"UPDATE profesional SET {', '.join(fields)} WHERE id = %s"
        
        cur = mysql.connection.cursor()
        try:
            cur.execute(query, values)
            mysql.connection.commit()
            return jsonify({'message': 'Profesional actualizado exitosamente'}), 200
        finally:
            cur.close()
    
    @staticmethod
    def delete(payload, profesional_id):
        """DELETE /profesionales/<id> - Eliminar profesional"""
        if payload['user_id'] != profesional_id:
            return jsonify({'error': 'No autorizado'}), 403
        
        cur = mysql.connection.cursor()
        try:
            cur.execute("DELETE FROM profesional WHERE id = %s", (profesional_id,))
            mysql.connection.commit()
            return jsonify({'message': 'Profesional eliminado exitosamente'}), 200
        finally:
            cur.close()
    
    @staticmethod
    def get_cv(profesional_id):
        """GET /profesionales/<id>/cv - Obtener CV del profesional"""
        cur = mysql.connection.cursor()
        try:
            cur.execute("SELECT cv FROM profesional WHERE id = %s", (profesional_id,))
            row = cur.fetchone()
            
            if not row:
                return jsonify({'error': 'Profesional no encontrado'}), 404
            
            cv_path = (row['cv'] or '').strip()
            if not cv_path:
                return jsonify({'error': 'Este profesional no tiene CV'}), 404
            
            # Si es URL externa, redirigir
            if cv_path.startswith('http'):
                return redirect(cv_path)
            
            # Si es archivo local, servirlo
            rel_path = cv_path.lstrip('/')
            filename = rel_path.split('/')[-1]
            base_dir = file_service.get_upload_directory()
            filepath = safe_join(base_dir, filename)
            
            if not filepath or not os.path.exists(filepath):
                return jsonify({'error': 'Archivo no encontrado'}), 404
            
            return send_from_directory(base_dir, filename, mimetype='application/pdf')
        finally:
            cur.close()
    
    @staticmethod
    def search():
        """GET /profesionales/buscar - Buscar profesionales por filtros"""
        ocupacion = request.args.get('ocupacion', '').strip()
        exp_min = request.args.get('exp_min', 0)
        
        cur = mysql.connection.cursor()
        try:
            query = """
                SELECT id, nombre, correo, telefono, ocupacion, exp, cv, linkedin, tarifa, foto 
                FROM profesional WHERE 1=1
            """
            params = []
            
            if ocupacion:
                query += " AND ocupacion LIKE %s"
                params.append(f"%{ocupacion}%")
            
            if str(exp_min).strip():
                query += " AND exp >= %s"
                params.append(exp_min)
            
            cur.execute(query, params)
            rows = cur.fetchall()
            
            profesionales_list = []
            for row in rows:
                prof = dict(row)
                if prof.get('tarifa') is not None:
                    prof['tarifa'] = float(prof['tarifa'])
                profesionales_list.append(prof)
            
            return jsonify(profesionales_list), 200
        finally:
            cur.close()

    @staticmethod
    def request_password_change(payload):
        """POST /profesionales/cambiar-password/solicitar - Paso 1: Solicitar cambio de contraseña"""
        try:
            data = request.get_json(silent=True) or {}
            
            if not data.get('contrasena_actual') or not data.get('contrasena_nueva'):
                return jsonify({'error': 'Contraseña actual y nueva son requeridas'}), 400
            
            # Verificar contraseña actual y obtener correo
            cur = mysql.connection.cursor()
            try:
                cur.execute(
                    "SELECT correo, contrasena FROM profesional WHERE id = %s",
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
        """POST /profesionales/cambiar-password/verificar - Paso 2: Verificar código y cambiar contraseña"""
        try:
            data = request.get_json(silent=True) or {}
            
            if not data.get('codigo') or not data.get('contrasena_nueva'):
                return jsonify({'error': 'Código y contraseña nueva son requeridos'}), 400
            
            # Obtener correo del usuario
            cur = mysql.connection.cursor()
            try:
                cur.execute(
                    "SELECT correo FROM profesional WHERE id = %s",
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
                    "UPDATE profesional SET contrasena = %s WHERE id = %s",
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
        """POST /profesionales/cambiar-correo/solicitar - Paso 1: Solicitar cambio de correo"""
        try:
            data = request.get_json(silent=True) or {}
            
            if not data.get('correo_nuevo'):
                return jsonify({'error': 'Correo nuevo es requerido'}), 400
            
            # Verificar que el nuevo correo no esté en uso
            cur = mysql.connection.cursor()
            try:
                cur.execute("SELECT id FROM profesional WHERE correo = %s", (data['correo_nuevo'],))
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
        """POST /profesionales/cambiar-correo/verificar - Paso 2: Verificar código y cambiar correo"""
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
                    "UPDATE profesional SET correo = %s WHERE id = %s",
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



bp_profesionales.route('/login', methods=['POST'])(ProfesionalController.login)
bp_profesionales.route('/perfil', methods=['GET'])(jwt_helper.token_required(ProfesionalController.get_profile))
bp_profesionales.route('/registro', methods=['POST'])(ProfesionalController.register)
bp_profesionales.route('/enviar-codigo', methods=['POST'])(ProfesionalController.send_verification_code)
bp_profesionales.route('/verificar-codigo', methods=['POST'])(ProfesionalController.verify_code)
bp_profesionales.route('/', methods=['GET'])(ProfesionalController.get_all)
bp_profesionales.route('/<int:profesional_id>', methods=['GET'])(jwt_helper.token_required(ProfesionalController.get_by_id))
bp_profesionales.route('/<int:profesional_id>', methods=['PUT'])(jwt_helper.token_required(ProfesionalController.update))
bp_profesionales.route('/<int:profesional_id>', methods=['DELETE'])(jwt_helper.token_required(ProfesionalController.delete))
bp_profesionales.route('/<int:profesional_id>/cv', methods=['GET'])(ProfesionalController.get_cv)
bp_profesionales.route('/buscar', methods=['GET'])(ProfesionalController.search)
bp_profesionales.route('/cambiar-password/solicitar', methods=['POST'])(
    jwt_helper.token_required(ProfesionalController.request_password_change)
)
bp_profesionales.route('/cambiar-password/verificar', methods=['POST'])(
    jwt_helper.token_required(ProfesionalController.verify_password_change)
)
bp_profesionales.route('/cambiar-correo/solicitar', methods=['POST'])(
    jwt_helper.token_required(ProfesionalController.request_email_change)
)
bp_profesionales.route('/cambiar-correo/verificar', methods=['POST'])(
    jwt_helper.token_required(ProfesionalController.verify_email_change)
)