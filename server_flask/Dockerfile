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

# Copiar requirements desde server_flask
COPY server_flask/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar TODO el contenido de server_flask a /app
COPY server_flask/ .

# Crear directorios necesarios
RUN mkdir -p uploads/cvs uploads/fotos

# Exponer puerto
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "wsgi:app"]
