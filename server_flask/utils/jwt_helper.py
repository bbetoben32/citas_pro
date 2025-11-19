import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify


class JWTHelper:
    """Helper para manejo de JWT tokens"""
    
    def __init__(self):
        self.secret_key = os.getenv('JWT_SECRET_KEY', 'cambiar-esta-clave-en-produccion')
        self.algorithm = os.getenv('JWT_ALGORITHM', 'HS256')
        self.expiration_hours = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    
    def generate_token(self, user_id: int, email: str) -> str:
        """Genera un token JWT para el usuario"""
        payload = {
            'user_id': user_id,
            'correo': email,
            'exp': datetime.utcnow() + timedelta(hours=self.expiration_hours),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> dict:
        """Verifica y decodifica un token JWT"""
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None
    
    def extract_token_from_header(self, auth_header: str) -> str:
        """Extrae el token del header Authorization"""
        try:
            return auth_header.split(' ')[1] if auth_header else None
        except IndexError:
            return None
    
    def token_required(self, f):
        """Decorador para proteger rutas que requieren autenticación"""
        @wraps(f)
        def decorator(*args, **kwargs):
            # ✅ NO manejamos OPTIONS aquí - CORS lo hace automáticamente
            auth_header = request.headers.get('Authorization')
            token = self.extract_token_from_header(auth_header)
            
            if not token:
               
                return jsonify({'error': 'Token no proporcionado'}), 401
            
            payload = self.verify_token(token)
            if not payload:
               
                return jsonify({'error': 'Token inválido o expirado'}), 401
            
           
            return f(payload, *args, **kwargs)
        
        return decorator


jwt_helper = JWTHelper()