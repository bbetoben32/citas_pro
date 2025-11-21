# services/paypal_service.py

import os
import requests
from decimal import Decimal, ROUND_HALF_UP
from config.paypal_config import PayPalConfig


def _round_usd(value):
    """
    Redondeo a 2 decimales estilo financiero.
    """
    return str(Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _cop_a_usd(monto_cop, tasa=None):
    """
    Convierte COP→USD usando una tasa configurable (env PAYPAL_COP_USD_RATE) o fallback.
    - Aplica redondeo a 2 decimales.
    - Fuerza mínimo de 1.00 USD (PayPal no acepta 0.00).
    """
    tasa_env = os.getenv("PAYPAL_COP_USD_RATE")
    if tasa is not None:
        tasa_cop_usd = float(tasa)
    elif tasa_env:
        tasa_cop_usd = float(tasa_env)
    else:
        tasa_cop_usd = 4000.0

    usd = float(monto_cop) / tasa_cop_usd
    usd = max(usd, 1.0)  # mínimo 1.00 USD
    return _round_usd(usd), tasa_cop_usd


class PayPalService:
    def __init__(self):
        """
        Inicializa la configuración de PayPal Orders API v2
        """
        self.client_id = PayPalConfig.PAYPAL_CLIENT_ID
        self.client_secret = PayPalConfig.PAYPAL_CLIENT_SECRET
        self.mode = PayPalConfig.PAYPAL_MODE
        self.base_url = PayPalConfig.get_api_base_url()

    def _obtener_token(self):
        """
        Obtiene el token de acceso de PayPal
        """
        url = f"{self.base_url}/v1/oauth2/token"
        
        response = requests.post(
            url,
            headers={
                "Accept": "application/json",
                "Accept-Language": "en_US",
            },
            data={"grant_type": "client_credentials"},
            auth=(self.client_id, self.client_secret)
        )
        
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            raise Exception(f"Error obteniendo token: {response.text}")

    def crear_pago(self, monto, descripcion, cita_id):
        """
        Crea una orden de pago en PayPal usando Orders API v2

        Args:
            monto (float|str|Decimal): Monto en COP
            descripcion (str): Descripción del pago
            cita_id (int): ID de la cita

        Returns:
            dict: { success, payment_id, approval_url, monto_original, monto_usd, tasa_cop_usd } 
                  o { success: False, error }
        """
        try:
            # Convertir COP a USD
            monto_usd, tasa = _cop_a_usd(monto)

            # Obtener token de acceso
            access_token = self._obtener_token()

            # Crear orden
            url = f"{self.base_url}/v2/checkout/orders"
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
            
            # Truncar descripción si es muy larga
            desc_corta = descripcion[:127] if descripcion else f"Cita #{cita_id}"
            
            order_data = {
                "intent": "CAPTURE",
                "purchase_units": [{
                    "reference_id": f"CITA_{cita_id}",
                    "description": f"Pago de cita #{cita_id}",
                    "custom_id": str(cita_id),
                    "items": [{
                        "name": desc_corta,
                        "description": f"Pago de cita #{cita_id}",
                        "sku": f"cita-{cita_id}",
                        "unit_amount": {
                            "currency_code": "USD",
                            "value": monto_usd
                        },
                        "quantity": "1",
                        "category": "DIGITAL_GOODS"
                    }],
                    "amount": {
                        "currency_code": "USD",
                        "value": monto_usd,
                        "breakdown": {
                            "item_total": {
                                "currency_code": "USD",
                                "value": monto_usd
                            }
                        }
                    }
                }],
                "application_context": {
                    "brand_name": "PsicoPlus",
                    "landing_page": "NO_PREFERENCE",
                    "user_action": "PAY_NOW",
                    "return_url": f"{PayPalConfig.PAYPAL_RETURN_URL}?cita_id={cita_id}",
                    "cancel_url": f"{PayPalConfig.PAYPAL_CANCEL_URL}?cita_id={cita_id}"
                }
            }
            
            response = requests.post(url, headers=headers, json=order_data)
            
            if response.status_code == 201:
                order = response.json()
                order_id = order["id"]
                
                # Buscar la URL de aprobación
                approval_url = None
                for link in order.get("links", []):
                    if link.get("rel") == "approve":
                        approval_url = link.get("href")
                        break
                
                return {
                    "success": True,
                    "payment_id": order_id,  # Este es el Order ID v2 (NO PAY-XXX)
                    "approval_url": approval_url,
                    "monto_original": float(monto),
                    "monto_usd": float(monto_usd),
                    "tasa_cop_usd": tasa
                }
            else:
                error_detail = response.json()
                return {
                    "success": False,
                    "error": error_detail
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"crear_pago: {str(e)}"
            }

    def ejecutar_pago(self, payment_id, payer_id):
        """
        Captura un pago ya aprobado por el usuario (Orders API v2)

        Args:
            payment_id (str): Order ID de PayPal (NO es PAY-XXX, es el ID de v2)
            payer_id (str): ID del pagador (no se usa en v2 pero lo mantenemos por compatibilidad)

        Returns:
            dict: { success, payment_id, state, payer_email, transaction_id, amount, currency } 
                  o { success: False, error }
        """
        try:
            # Obtener token de acceso
            access_token = self._obtener_token()
            
            # Capturar el pago
            url = f"{self.base_url}/v2/checkout/orders/{payment_id}/capture"
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
            
            response = requests.post(url, headers=headers)
            
            if response.status_code == 201:
                capture_data = response.json()
                
                # El estado debe ser "COMPLETED"
                estado = capture_data.get("status")
                
                if estado == "COMPLETED":
                    # Extraer información útil
                    payer_email = None
                    transaction_id = None
                    amount = None
                    currency = None
                    
                    try:
                        # Obtener email del pagador
                        payer = capture_data.get("payer", {})
                        payer_email = payer.get("email_address")
                        
                        # Obtener info de la transacción
                        purchase_units = capture_data.get("purchase_units", [])
                        if purchase_units:
                            payments = purchase_units[0].get("payments", {})
                            captures = payments.get("captures", [])
                            if captures:
                                capture = captures[0]
                                transaction_id = capture.get("id")
                                amount_data = capture.get("amount", {})
                                amount = amount_data.get("value")
                                currency = amount_data.get("currency_code")
                    except Exception:
                        pass
                    
                    return {
                        "success": True,
                        "payment_id": payment_id,
                        "state": "approved",  # Mantener "approved" para compatibilidad
                        "status": estado,
                        "payer_email": payer_email,
                        "transaction_id": transaction_id,
                        "amount": amount,
                        "currency": currency
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Pago no completado. Estado: {estado}"
                    }
            else:
                error_detail = response.json()
                return {
                    "success": False,
                    "error": f"Error capturando pago: {error_detail}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"ejecutar_pago: {str(e)}"
            }

    def obtener_pago(self, payment_id):
        """
        Obtiene información de una orden por ID (Orders API v2)

        Returns:
            dict: { success, payment: { id, state, create_time, update_time } } 
                  o { success: False, error }
        """
        try:
            access_token = self._obtener_token()
            
            url = f"{self.base_url}/v2/checkout/orders/{payment_id}"
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                order = response.json()
                return {
                    "success": True,
                    "payment": {
                        "id": order.get("id"),
                        "state": order.get("status"),
                        "create_time": order.get("create_time"),
                        "update_time": order.get("update_time"),
                    }
                }
            else:
                error_detail = response.json()
                return {
                    "success": False,
                    "error": f"obtener_pago: {error_detail}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"obtener_pago: {str(e)}"
            }


# Instancia singleton
paypal_service = PayPalService()
