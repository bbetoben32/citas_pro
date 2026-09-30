import os

class MailConfig:
    MAIL_SERVER = os.getenv('MAIL_SERVER', '**************')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = 'apikey'
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '**********************************************')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'psicoplus25@gmail.com')

    MAIL_DEBUG = os.getenv('MAIL_DEBUG', 'False').lower() == 'true'
    MAIL_SUPPRESS_SEND = os.getenv('MAIL_SUPPRESS_SEND', 'False').lower() == 'true'
