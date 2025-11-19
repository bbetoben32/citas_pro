import os


class BaseConfig:
    """Configuración base común a todos los entornos"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'estaesunallavesecreta')
    JSON_SORT_KEYS = False
    

class DevelopmentConfig(BaseConfig):
    """Configuración para desarrollo"""
    DEBUG = True
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'beto1')
    MYSQL_DB = os.getenv('MYSQL_DB', 'citas')
    MYSQL_CURSORCLASS = 'DictCursor'



config = {
    'development': DevelopmentConfig,
    'default': DevelopmentConfig
}