# ==========================================
# Stage 1: Build React/Vite application
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

# Public frontend configuration
ARG VITE_HERCULES_WEBSITE_ID
ARG VITE_HERCULES_OIDC_AUTHORITY
ARG VITE_HERCULES_OIDC_CLIENT_ID
ARG VITE_CONVEX_URL
ARG VITE_CONVEX_SITE_URL

ENV VITE_HERCULES_WEBSITE_ID=$VITE_HERCULES_WEBSITE_ID
ENV VITE_HERCULES_OIDC_AUTHORITY=$VITE_HERCULES_OIDC_AUTHORITY
ENV VITE_HERCULES_OIDC_CLIENT_ID=$VITE_HERCULES_OIDC_CLIENT_ID
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_CONVEX_SITE_URL=$VITE_CONVEX_SITE_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application
COPY . .

# Build production application
RUN npm run build


# ==========================================
# Stage 2: Production web server
# ==========================================
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]