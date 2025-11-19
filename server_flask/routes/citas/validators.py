"""
Validators para el módulo de citas
Maneja todas las validaciones de datos
"""
from datetime import datetime


class CitasValidator:
    """Validaciones para operaciones de citas"""
    
    @staticmethod
    def validar_crear_cita(data):
        """Valida los datos para crear una cita"""
        required = ['profesional_id', 'fecha', 'hora_inicio', 'hora_fin', 'duracion', 'motivo', 'monto_total']
        missing = [f for f in required if f not in data]
        
        if missing:
            return False, f'Faltan campos: {", ".join(missing)}'
        
        # Validar formato de fecha
        try:
            fecha_cita = datetime.strptime(data['fecha'], '%Y-%m-%d').date()
            if fecha_cita < datetime.now().date():
                return False, 'No se pueden agendar citas en fechas pasadas'
        except ValueError:
            return False, 'Formato de fecha inválido. Use YYYY-MM-DD'
        
        return True, None
    
    @staticmethod
    def validar_accion_respuesta(accion):
        """Valida la acción de respuesta a una cita"""
        if accion not in ['aceptar', 'rechazar']:
            return False, 'Acción inválida. Use "aceptar" o "rechazar"'
        return True, None
    
    @staticmethod
    def validar_aceptar_cita(data, modalidad='presencial'):
        """Valida los datos para aceptar una cita"""
        lugar = data.get('lugar')
        
        if not lugar and modalidad == 'presencial':
            return False, 'Debe especificar el lugar para citas presenciales'
        
        return True, None
    
    @staticmethod
    def validar_estado_cancelable(estado):
        """Valida si una cita puede ser cancelada"""
        if estado in ['completada', 'cancelada']:
            return False, f'No se puede cancelar una cita {estado}'
        return True, None
    
    @staticmethod
    def validar_estado_pagable(estado):
        """Valida si una cita puede ser pagada"""
        if estado != 'aceptada':
            return False, f'No se puede pagar una cita en estado: {estado}'
        return True, None
    
    @staticmethod
    def validar_estado_respondible(estado):
        """Valida si una cita puede ser respondida"""
        if estado != 'pendiente':
            return False, f'La cita ya fue {estado}'
        return True, None