FROM node:22-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias (dentro del contenedor, para Alpine/Linux)
RUN npm install

# Copiar el código fuente (sin node_modules gracias al .dockerignore)
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Iniciar Vite
CMD ["npx", "vite", "--host", "0.0.0.0"]
