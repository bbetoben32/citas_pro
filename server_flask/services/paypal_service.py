# services/paypal_service.py
"""
Servicio para manejar pagos con PayPal (Payments v1 con paypalrestsdk)
"""
import os
import math
import paypalrestsdk
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
    # Permite sobreescribir la tasa por env var, ej. PAYPAL_COP_USD_RATE=4200
    tasa_env = os.getenv("PAYPAL_COP_USD_RATE")
    if tasa is not None:
        tasa_cop_usd = float(tasa)
    elif tasa_env:
        tasa_cop_usd = float(tasa_env)
    else:
        # Fallback: 1 USD ≈ 4000 COP (ajústalo según tu necesidad real)
        tasa_cop_usd = 4000.0

    usd = float(monto_cop) / tasa_cop_usd
    usd = max(usd, 1.0)  # mínimo 1.00 USD para evitar rechazos por 0.00
    return _round_usd(usd), tasa_cop_usd


class PayPalService:
    def __init__(self):
        """
        Inicializa la configuración de PayPal.
        """
        paypalrestsdk.configure({
            "mode": PayPalConfig.PAYPAL_MODE,  # 'sandbox' o 'live'
            "client_id": PayPalConfig.PAYPAL_CLIENT_ID,
            "client_secret": PayPalConfig.PAYPAL_CLIENT_SECRET,
        })

    def crear_pago(self, monto, descripcion, cita_id):
        """
        Crea un pago en PayPal.

        Args:
            monto (float|str|Decimal): Monto en COP
            descripcion (str): Descripción del pago
            cita_id (int): ID de la cita

        Returns:
            dict: { success, payment_id, approval_url, monto_original, monto_usd, tasa_cop_usd } o { success: False, error }
        """
        try:
            monto_usd, tasa = _cop_a_usd(monto)

            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": f"{PayPalConfig.PAYPAL_RETURN_URL}?cita_id={cita_id}",
                    "cancel_url": f"{PayPalConfig.PAYPAL_CANCEL_URL}?cita_id={cita_id}",
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": descripcion[:127] if descripcion else f"Cita #{cita_id}",
                            "sku": f"cita-{cita_id}",
                            "price": monto_usd,    # string con 2 decimales
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "total": monto_usd,
                        "currency": "USD"
                    },
                    "description": f"Pago de cita #{cita_id}"
                }]
            })

            if payment.create():
                # Buscar approval_url para el flujo de redirección si lo usas (aunque con pop-up no es obligatorio)
                approval_url = None
                try:
                    for link in payment.links:
                        if link.rel == "approval_url":
                            approval_url = link.href
                            break
                except Exception:
                    # no es crítico si no hay links (checkout.js usa paymentId)
                    approval_url = None

                return {
                    "success": True,
                    "payment_id": payment.id,
                    "approval_url": approval_url,
                    "monto_original": float(monto),
                    "monto_usd": float(monto_usd),
                    "tasa_cop_usd": tasa,
                }
            else:
                # payment.error trae info detallada del fallo de PayPal
                return {
                    "success": False,
                    "error": payment.error
                }

        except Exception as e:
            return {
                "success": False,
                "error": f"crear_pago: {str(e)}"
            }

    def ejecutar_pago(self, payment_id, payer_id):
        """
        Ejecuta un pago ya aprobado por el usuario en el pop-up de PayPal.

        Args:
            payment_id (str): ID del pago de PayPal
            payer_id (str): ID del pagador (payerID)

        Returns:
            dict: { success, payment_id, state, payer_email, transaction_id, amount, currency } o { success: False, error }
        """
        try:
            payment = paypalrestsdk.Payment.find(payment_id)

            # Ejecutar
            executed = payment.execute({"payer_id": payer_id})
            if not executed:
                # Error en la ejecución
                return {
                    "success": False,
                    "error": payment.error
                }

            # PayPal Payments v1 devuelve 'approved' cuando todo OK
            state = getattr(payment, "state", None)
            if state != "approved":
                # No marcar como pagada si no approved
                return {
                    "success": False,
                    "error": f"Estado no aprobado: {state or 'desconocido'}"
                }

            # Extraer algunos datos útiles (opcional, para guardar o auditar)
            payer_email = None
            try:
                payer_info = payment.payer.payer_info
                payer_email = getattr(payer_info, "email", None)
            except Exception:
                pass

            transaction_id = None
            amount = None
            currency = None
            try:
                # Normalmente viene en payment.transactions[0].related_resources[0].sale
                txs = payment.transactions or []
                if txs and "related_resources" in txs[0] and txs[0]["related_resources"]:
                    sale = txs[0]["related_resources"][0].get("sale")
                    if sale:
                        transaction_id = sale.get("id")
                        amount = sale.get("amount", {}).get("total")
                        currency = sale.get("amount", {}).get("currency")
                # fallback al amount declarado si no encontramos sale
                if amount is None and txs:
                    amount = txs[0].get("amount", {}).get("total")
                    currency = txs[0].get("amount", {}).get("currency")
            except Exception:
                pass

            return {
                "success": True,
                "payment_id": payment_id,
                "state": state,  # 'approved'
                "payer_email": payer_email,
                "transaction_id": transaction_id,
                "amount": amount,
                "currency": currency
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"ejecutar_pago: {str(e)}"
            }

    def obtener_pago(self, payment_id):
        """
        Obtiene información de un pago por ID.

        Returns:
            dict: { success, payment: { id, state, create_time, update_time } } o { success: False, error }
        """
        try:
            payment = paypalrestsdk.Payment.find(payment_id)
            return {
                "success": True,
                "payment": {
                    "id": payment.id,
                    "state": getattr(payment, "state", None),
                    "create_time": getattr(payment, "create_time", None),
                    "update_time": getattr(payment, "update_time", None),
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"obtener_pago: {str(e)}"
            }


# Instancia singleton
paypal_service = PayPalService()
