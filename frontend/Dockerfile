# Stage 1: build ด้วย Node
FROM node:20-alpine AS build

WORKDIR /app

# รับค่า VITE_API_URL จาก docker-compose ตอน build (Vite ฝังค่า env ไว้ตอน build เท่านั้น)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# Stage 1: build ด้วย Node
FROM node:20-alpine AS build

WORKDIR /app

# รับค่า VITE_API_URL จาก docker-compose ตอน build (Vite ฝังค่า env ไว้ตอน build เท่านั้น)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: เสิร์ฟไฟล์ที่ build แล้วด้วย Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: เสิร์ฟไฟล์ที่ build แล้วด้วย Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]