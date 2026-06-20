# Usamos Node.js versión 20
FROM node:20

# Carpeta de trabajo dentro de Docker
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del código
COPY . .

# Compilamos el proyecto de NestJS
RUN npm run build

# Exponemos el puerto 3000
EXPOSE 3000

# Arrancamos la aplicación
CMD ["npm", "run", "start:prod"]