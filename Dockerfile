FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

FROM base AS dev
EXPOSE 10086
CMD ["npm", "run", "dev:weapp"]

FROM base AS build
RUN npm run build:weapp

FROM nginx:alpine AS serve-h5
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
