"""
Configuración de PayPal
"""
import os

class PayPalConfig:
    # Usar sandbox para pruebas, production para producción
    PAYPAL_MODE = os.getenv('PAYPAL_MODE', 'sandbox')
    
    # Obtener credenciales desde variables de entorno
    PAYPAL_CLIENT_ID = os.getenv('PAYPAL_CLIENT_ID', 'AXhZRD0uJVqhIxjjpBsxpfbTbwB8Y_QcCCPspCyduIp_Hlb-g_gaPbhUG0QtFMQVQ67CA3e2aHDA2bG_')
    PAYPAL_CLIENT_SECRET = os.getenv('PAYPAL_CLIENT_SECRET', 'ELrbZuqXWuNgyy6g452InlIpdSys5kgiJk5to-9cizxiaDbqtubgLQv7wTJyE7XDjaa5wlxQpERyO1TM')
    
    # URLs de retorno
    PAYPAL_RETURN_URL = 'http://localhost:3000/pago-exitoso'
    PAYPAL_CANCEL_URL = 'http://localhost:3000/pago-cancelado'