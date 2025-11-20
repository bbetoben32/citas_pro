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

# Copiar TODO el proyecto primero
COPY . .

# Si server_flask existe, mover su contenido a /app
RUN if [ -d "server_flask" ]; then \
        cp -r server_flask/* . && \
        cp -r server_flask/.* . 2>/dev/null || true && \
        rm -rf server_flask; \
    fi

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Crear directorios necesarios
RUN mkdir -p uploads/cvs uploads/fotos

# Exponer puerto
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "wsgi:app"]
