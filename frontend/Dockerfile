# Frontend build image
FROM node:20-bullseye AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY . ./

ARG REACT_APP_API_URL
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_KEY
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_SUPABASE_URL=${REACT_APP_SUPABASE_URL}
ENV REACT_APP_SUPABASE_KEY=${REACT_APP_SUPABASE_KEY}

RUN npm ci --legacy-peer-deps
RUN npm run build

# Serve built frontend
FROM node:20-bullseye-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
