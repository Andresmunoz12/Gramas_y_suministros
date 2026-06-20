FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Iniciar Vite exponiendo en todas las interfaces de red
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
