FROM node:20-alpine AS deps
WORKDIR /app

# quebra cache quando GIT_SHA muda
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA

# cache do npm para builds mais rápidos
RUN --mount=type=cache,target=/root/.npm true

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
