# ============================================
# Dockerfile cho Sports Booking System
# ============================================

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Cài đặt các dependencies cần thiết
RUN apk add --no-cache python3 make g++

# Tạo thư mục làm việc
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Cài đặt dependencies
WORKDIR /app/backend
# RUN npm ci --only=production
RUN npm install

# ============================================
# Stage 2: Production stage
FROM node:18-alpine AS production

# Thêm labels
LABEL maintainer="Sports Booking System"
LABEL version="1.0.0"
LABEL description="Backend API for Sports Booking System"

# Tạo user không phải root để chạy ứng dụng (bảo mật)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Tạo thư mục làm việc
WORKDIR /app

# Copy node_modules từ builder stage
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Tạo thư mục uploads và đặt quyền
RUN mkdir -p /app/backend/uploads && \
    chown -R nodejs:nodejs /app

# Chuyển sang user không phải root
USER nodejs

# Expose port
EXPOSE 3000

# Đặt thư mục làm việc cho backend
WORKDIR /app/backend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Command để chạy ứng dụng
CMD ["node", "src/server.js"]
