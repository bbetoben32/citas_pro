"""
routes/citas/routes.py
Define las rutas del módulo de citas
"""
from flask import Blueprint
from utils.jwt_helper import jwt_helper

bp_citas = Blueprint('citas', __name__)
mysql = None  # Se inyectará desde app.py


def setup_routes():
    """Configura las rutas del blueprint"""
    from .controller import CitasController
    
    # Crear instancia del controlador con mysql inyectado
    controller = CitasController(mysql)
    
    # POST /citas - Crear cita
    @bp_citas.route('', methods=['POST'], strict_slashes=False)
    @jwt_helper.token_required
    def crear_cita(payload):
        return controller.crear_cita(payload)
    
    # GET /citas/cliente - Obtener citas del cliente
    @bp_citas.route('/cliente', methods=['GET'], strict_slashes=False)
    @jwt_helper.token_required
    def obtener_citas_cliente(payload):
        return controller.obtener_citas_cliente(payload)
    
    # GET /citas/profesional - Obtener citas del profesional
    @bp_citas.route('/profesional', methods=['GET'], strict_slashes=False)
    @jwt_helper.token_required
    def obtener_citas_profesional(payload):
        return controller.obtener_citas_profesional(payload)
    
    # POST /citas/recordatorio - Enviar recordatorio por correo
    @bp_citas.route('/recordatorio', methods=['POST'], strict_slashes=False)
    @jwt_helper.token_required
    def enviar_recordatorio(payload):
        return controller.enviar_recordatorio(payload)
    
    # GET /citas/<id> - Obtener detalle de cita
    @bp_citas.route('/<int:cita_id>', methods=['GET'], strict_slashes=False)
    @jwt_helper.token_required
    def obtener_cita_detalle(payload, cita_id):
        return controller.obtener_cita_detalle(payload, cita_id)
    
    # PUT /citas/<id>/responder - Responder cita
    @bp_citas.route('/<int:cita_id>/responder', methods=['PUT'], strict_slashes=False)
    @jwt_helper.token_required
    def responder_cita(payload, cita_id):
        return controller.responder_cita(payload, cita_id)
    
    # 🆕 PUT /citas/<id>/notas - Actualizar notas del profesional
    @bp_citas.route('/<int:cita_id>/notas', methods=['PUT'], strict_slashes=False)
    @jwt_helper.token_required
    def actualizar_notas_profesional(payload, cita_id):
        return controller.actualizar_notas_profesional(payload, cita_id)
    
    # DELETE /citas/<id>/cancelar - Cancelar cita
    @bp_citas.route('/<int:cita_id>/cancelar', methods=['DELETE'], strict_slashes=False)
    @jwt_helper.token_required
    def cancelar_cita(payload, cita_id):
        return controller.cancelar_cita(payload, cita_id)
    
    # PUT /citas/<id>/pagar - Pagar cita (método antiguo, mantener por compatibilidad)
    @bp_citas.route('/<int:cita_id>/pagar', methods=['PUT'], strict_slashes=False)
    @jwt_helper.token_required
    def pagar_cita(payload, cita_id):
        return controller.pagar_cita(payload, cita_id)
    
    # POST /citas/<id>/pagar/iniciar - Iniciar pago PayPal
    @bp_citas.route('/<int:cita_id>/pagar/iniciar', methods=['POST'], strict_slashes=False)
    @jwt_helper.token_required
    def iniciar_pago_paypal(payload, cita_id):
        return controller.iniciar_pago_paypal(payload, cita_id)

    # POST /citas/<id>/pagar/confirmar - Confirmar pago PayPal
    @bp_citas.route('/<int:cita_id>/pagar/confirmar', methods=['POST'], strict_slashes=False)
    @jwt_helper.token_required
    def confirmar_pago_paypal(payload, cita_id):
        return controller.confirmar_pago_paypal(payload, cita_id)
    
    @bp_citas.route('/estadisticas', methods=['GET'], strict_slashes=False)
    @jwt_helper.token_required
    def obtener_estadisticas(payload):
        return controller.obtener_estadisticas_profesional(payload)


# NO llamar setup_routes() aquí automáticamente