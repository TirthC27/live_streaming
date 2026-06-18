# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

# React embeds env vars at build time
ARG REACT_APP_PROXY_URL=http://localhost:4000
ARG REACT_APP_STREAM_TITLE=DeportesPlus Live
ARG REACT_APP_PLATFORM_NAME=StreamX

ENV REACT_APP_PROXY_URL=$REACT_APP_PROXY_URL
ENV REACT_APP_STREAM_TITLE=$REACT_APP_STREAM_TITLE
ENV REACT_APP_PLATFORM_NAME=$REACT_APP_PLATFORM_NAME

RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
