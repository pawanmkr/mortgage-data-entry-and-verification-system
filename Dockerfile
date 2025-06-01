FROM node:18-alpine
WORKDIR /app
RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install sentence-transformers
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "dist/main"]
