"""
routes/citas/__init__.py
Módulo de gestión de citas
"""
from .routes import bp_citas

# Solo exportar el blueprint, no llamar setup_routes aquí
__all__ = ['bp_citas']