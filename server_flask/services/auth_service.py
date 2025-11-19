from werkzeug.security import generate_password_hash, check_password_hash
from utils.jwt_helper import jwt_helper


class AuthService:
    """Servicio para manejo de autenticación"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hashea una contraseña"""
        return generate_password_hash(password)
    
    @staticmethod
    def verify_password(hashed: str, password: str) -> bool:
        """Verifica una contraseña contra su hash"""
        return check_password_hash(hashed, password)
    
    @staticmethod
    def generate_token(user_id: int, email: str) -> str:
        """Genera un token JWT"""
        return jwt_helper.generate_token(user_id, email)
    
    @staticmethod
    def authenticate_user(cursor, email: str, password: str, table: str) -> tuple:
        """
        Autentica un usuario y retorna sus datos si es válido
        
        Returns:
            tuple: (success: bool, data: dict or error_message: str, status_code: int)
        """
        cursor.execute(
            f"SELECT id, nombre, correo, contrasena FROM {table} WHERE correo = %s",
            (email,)
        )
        user = cursor.fetchone()
        
        if not user:
            return False, 'Usuario no encontrado, Registrese para continuar', 401
        
        if not AuthService.verify_password(user[3], password):
            return False, 'Contraseña incorrecta', 401
        
        token = AuthService.generate_token(user[0], user[2])
        
        return True, {
            'message': 'Login exitoso',
            'token': token,
            'usuario': {
                'id': user[0],
                'nombre': user[1],
                'correo': user[2]
            }
        }, 200


auth_service = AuthService()