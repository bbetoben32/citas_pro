# backend/routes/pagos.py o donde tengas las rutas de PayPal
import requests
import json
from flask import Blueprint, request, jsonify
from config.paypal_config import PayPalConfig

# Función para obtener token de acceso
def obtener_token_paypal():
    """Obtiene el token de acceso de PayPal"""
    url = "https://api-m.sandbox.paypal.com/v1/oauth2/token"  # sandbox
    # Para producción: "https://api-m.paypal.com/v1/oauth2/token"
    
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US",
    }
    
    data = {
        "grant_type": "client_credentials"
    }
    
    response = requests.post(
        url,
        headers=headers,
        data=data,
        auth=(PayPalConfig.PAYPAL_CLIENT_ID, PayPalConfig.PAYPAL_CLIENT_SECRET)
    )
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Error obteniendo token: {response.text}")


@app.route('/citas/<int:cita_id>/pagar/iniciar', methods=['POST'])
def iniciar_pago_cita(cita_id):
    """Crea una orden de PayPal usando Orders API v2"""
    try:
        # Obtener datos de la cita desde tu base de datos
        cita = obtener_cita_por_id(cita_id)  # Tu función para obtener la cita
        
        if not cita:
            return jsonify({"success": False, "error": "Cita no encontrada"}), 404
        
        # Verificar que la cita esté en estado 'aceptada' y no pagada
        if cita.estado != 'aceptada':
            return jsonify({"success": False, "error": "La cita no está en estado aceptada"}), 400
        
        # Obtener token de acceso
        access_token = obtener_token_paypal()
        
        # Crear la orden usando Orders API v2
        url = "https://api-m.sandbox.paypal.com/v2/checkout/orders"
        # Para producción: "https://api-m.paypal.com/v2/checkout/orders"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        # Convertir COP a USD (ajusta la tasa de cambio según necesites)
        # IMPORTANTE: PayPal no soporta COP directamente, debes usar USD
        monto_usd = float(cita.monto_total) / 4000  # Ejemplo: 1 USD = 4000 COP
        
        order_data = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "reference_id": f"CITA_{cita_id}",
                "description": f"Cita con {cita.profesional_nombre}",
                "amount": {
                    "currency_code": "USD",
                    "value": f"{monto_usd:.2f}"
                }
            }],
            "application_context": {
                "brand_name": "PsicoPlus",
                "landing_page": "NO_PREFERENCE",
                "user_action": "PAY_NOW",
                "return_url": f"{PayPalConfig.FRONTEND_URL}/pago-exitoso",
                "cancel_url": f"{PayPalConfig.FRONTEND_URL}/pago-cancelado"
            }
        }
        
        response = requests.post(url, headers=headers, json=order_data)
        
        if response.status_code == 201:
            order = response.json()
            order_id = order["id"]  # Este es el ID que necesitas (formato EC-XXX o similar)
            
            # Guardar el order_id en tu base de datos asociado a la cita
            # cita.paypal_order_id = order_id
            # db.session.commit()
            
            return jsonify({
                "success": True,
                "payment_id": order_id  # Ahora es un Order ID v2
            })
        else:
            error_detail = response.json()
            return jsonify({
                "success": False,
                "error": "Error creando la orden en PayPal",
                "details": error_detail
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/citas/<int:cita_id>/pagar/confirmar', methods=['POST'])
def confirmar_pago_cita(cita_id):
    """Captura el pago de una orden de PayPal"""
    try:
        data = request.get_json()
        order_id = data.get('paymentId')  # Este es el orderID que viene del frontend
        
        if not order_id:
            return jsonify({"success": False, "error": "Order ID no proporcionado"}), 400
        
        # Obtener token de acceso
        access_token = obtener_token_paypal()
        
        # Capturar el pago
        url = f"https://api-m.sandbox.paypal.com/v2/checkout/orders/{order_id}/capture"
        # Para producción: f"https://api-m.paypal.com/v2/checkout/orders/{order_id}/capture"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.post(url, headers=headers)
        
        if response.status_code == 201:
            capture_data = response.json()
            
            # Verificar que el pago fue exitoso
            if capture_data["status"] == "COMPLETED":
                # Actualizar la cita en tu base de datos
                cita = obtener_cita_por_id(cita_id)
                cita.estado = 'pagada'  # o el estado que uses
                cita.paypal_order_id = order_id
                cita.paypal_capture_id = capture_data["purchase_units"][0]["payments"]["captures"][0]["id"]
                # db.session.commit()
                
                return jsonify({
                    "success": True,
                    "message": "Pago confirmado exitosamente",
                    "capture_id": cita.paypal_capture_id
                })
            else:
                return jsonify({
                    "success": False,
                    "error": f"El pago no se completó. Estado: {capture_data['status']}"
                }), 400
        else:
            error_detail = response.json()
            return jsonify({
                "success": False,
                "error": "Error capturando el pago",
                "details": error_detail
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
