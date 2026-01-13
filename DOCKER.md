# Docker Deployment Guide - Sports Booking System

## 📋 Yêu cầu

- Docker Engine 20.10+
- Docker Compose 2.0+

## Hướng dẫn triển khai

### 1. Chuẩn bị environment

Copy file `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với các giá trị thực:

```env
# Database
DB_ROOT_PASSWORD=your-secure-root-password
DB_PASSWORD=your-secure-db-password

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Web Push
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### 2. Build và chạy containers

```bash
# Build image
docker-compose build

# Chạy ở chế độ detached
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### 3. Chạy database migrations

```bash
# Chạy migrations
docker-compose exec backend npm run db:migrate

# Chạy seeders (tạo admin user)
docker-compose exec backend npm run db:seed
```

### 4. Kiểm tra hệ thống

```bash
# Kiểm tra containers
docker-compose ps

# Kiểm tra health
curl http://localhost:3000/api/health

# Xem logs của backend
docker-compose logs -f backend

# Xem logs của database
docker-compose logs -f db
```

## Các lệnh hữu ích

### Quản lý containers

```bash
# Dừng tất cả containers
docker-compose stop

# Khởi động lại
docker-compose start

# Dừng và xóa containers
docker-compose down

# Dừng, xóa containers và volumes (xóa cả data)
docker-compose down -v
```

### Truy cập container

```bash
# Vào shell của backend
docker-compose exec backend sh

# Vào MySQL console
docker-compose exec db mysql -u root -p
```

### Database

```bash
# Backup database
docker-compose exec db mysqldump -u root -p sports_booking_db > backup.sql

# Restore database
docker-compose exec -T db mysql -u root -p sports_booking_db < backup.sql

# Reset database
docker-compose exec backend npm run db:reset
```

### Build lại

```bash
# Build lại không dùng cache
docker-compose build --no-cache

# Build và khởi động lại
docker-compose up -d --build
```

## Cấu trúc Docker

```
sports-booking-system/
├── Dockerfile              # Multi-stage Dockerfile cho backend
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore          # Files không cần copy vào image
├── .env.docker            # Template environment variables
└── docker/
    ├── wait-for-it.sh     # Script đợi database
    └── mysql/
        └── init/
            └── 01-init.sql # Script khởi tạo database
```

##  Bảo mật

1. **Không commit file `.env`** - Chứa thông tin nhạy cảm
2. **Thay đổi passwords mặc định** - Đặc biệt trong production
3. **Sử dụng HTTPS** - Cấu hình reverse proxy (nginx) phía trước
4. **Giới hạn network** - Không expose port database ra ngoài trong production