FROM python:3.13-slim

# Instalar dependencias del sistema para MySQL/MariaDB
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    pkg-config \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo EN server_flask directamente
WORKDIR /app/server_flask

# Copiar requirements e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código al directorio padre
COPY . /app

# Crear directorios necesarios
RUN mkdir -p uploads/cvs uploads/fotos

# Exponer puerto
EXPOSE 8080

# IMPORTANTE: Usar /bin/bash para expansión de variables
CMD ["/bin/bash", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers 2 --timeout 120 wsgi:app"]
