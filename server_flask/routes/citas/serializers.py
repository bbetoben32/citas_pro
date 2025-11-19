"""
Serializers para el módulo de citas
Maneja la conversión de objetos de base de datos a JSON
"""
from datetime import datetime, timedelta, date


def serializar_cita(cita):
    """Convierte objetos timedelta y date a strings para JSON"""
    if not cita:
        return None
    
    cita_dict = dict(cita)
    
    # Convertir campos TIME (timedelta) a string HH:MM:SS
    for campo in ['hora_inicio', 'hora_fin']:
        if campo in cita_dict and isinstance(cita_dict[campo], timedelta):
            total_seconds = int(cita_dict[campo].total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            cita_dict[campo] = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    
    # Convertir campos DATE a string YYYY-MM-DD
    for campo in ['fecha', 'fecha_solicitud', 'fecha_respuesta', 'fecha_cancelacion']:
        if campo in cita_dict and isinstance(cita_dict[campo], date):
            cita_dict[campo] = cita_dict[campo].isoformat()
    
    # Convertir campos DATETIME a string
    for campo in ['created_at', 'updated_at']:
        if campo in cita_dict and isinstance(cita_dict[campo], datetime):
            cita_dict[campo] = cita_dict[campo].isoformat()
    
    return cita_dict


def convertir_hora_a_string(hora):
    """Convierte timedelta a string HH:MM"""
    if isinstance(hora, timedelta):
        total_seconds = int(hora.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        return f"{hours:02d}:{minutes:02d}"
    return str(hora)


def convertir_fecha_a_string(fecha):
    """Convierte date a string YYYY-MM-DD"""
    if isinstance(fecha, date):
        return fecha.isoformat()
    return str(fecha)