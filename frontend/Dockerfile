FROM node:20-alpine AS build

WORKDIR /app/weather_frontend

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build 

FROM nginx:alpine

COPY --from=build /app/weather_frontend/dist /app/weather_frontend/dist
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
# COPY ./nginx/default.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]