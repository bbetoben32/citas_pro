import os

class MailConfig:
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.sendgrid.net')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'apikey')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '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')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'psicoplus25@gmail.com')