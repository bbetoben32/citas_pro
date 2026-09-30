import os


class BaseConfig:
    """Configuración base común a todos los entornos"""
    SECRET_KEY = os.getenv('SECRET_KEY', '*************************')
    JSON_SORT_KEYS = False
    

class DevelopmentConfig(BaseConfig):
    """Configuración para desarrollo"""
    DEBUG = True
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '***********')
    MYSQL_DB = os.getenv('MYSQL_DB', 'citas')
    MYSQL_CURSORCLASS = 'DictCursor'


class ProductionConfig(BaseConfig):
    """Configuración para producción"""
    DEBUG = False
    MYSQL_HOST = os.getenv('MYSQL_HOST')
    MYSQL_USER = os.getenv('MYSQL_USER')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
    MYSQL_DB = os.getenv('MYSQL_DB')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    MYSQL_CURSORCLASS = 'DictCursor'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
