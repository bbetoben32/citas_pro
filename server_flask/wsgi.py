import os
from app import create_app

# Determinar el entorno (production por defecto en Railway)
env = os.getenv('FLASK_ENV', 'production')

# Crear la aplicación
app = create_app(env)

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)