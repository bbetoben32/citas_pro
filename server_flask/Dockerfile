FROM python:3.13-slim

# Instalar dependencias del sistema para MySQL/MariaDB
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    pkg-config \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar requirements e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código
COPY . .

# Crear directorios necesarios dentro de server_flask
RUN mkdir -p server_flask/uploads/cvs server_flask/uploads/fotos

# Exponer puerto (Railway usa variable $PORT)
EXPOSE $PORT

# CRÍTICO: Cambiar al directorio server_flask y ejecutar gunicorn
CMD ["sh", "-c", "cd server_flask && gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 2 --timeout 120 wsgi:app"]
