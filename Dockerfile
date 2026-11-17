FROM node:24-slim

WORKDIR /app

COPY package*.json ./

# npm ci: cài đúng phiên bản trong package-lock.json; --omit=dev: bỏ jest, supertest
RUN npm ci --omit=dev

# copy phần code còn lại, giao quyền cho user "node"
COPY --chown=node:node . .

# tạo sẵn thư mục logs cho winston
RUN mkdir -p logs && chown node:node logs

# chạy bằng user "node" (không phải root)
USER node

EXPOSE 3000

# mặc định chạy migrate rồi mở server, compose và render ghi đè bằng "npm run start:demo"
CMD ["npm", "start"]