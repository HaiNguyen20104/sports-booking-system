# Sports Booking System

Hệ thống đặt sân thể thao trực tuyến - cho phép người dùng tìm kiếm, đặt sân và thanh toán online.

## Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Testing](#-testing)

## Tính năng

### Người dùng (Customer)
- Đăng ký / Đăng nhập với xác thực email
- Quên mật khẩu / Đặt lại mật khẩu
- Tìm kiếm và xem thông tin sân
- Đặt sân theo khung giờ
- Thanh toán online qua Stripe
- Nhận thông báo đẩy (Push Notification)
- Xem lịch sử đặt sân

### Chủ sân (Court Owner / Manager)
- Quản lý sân (thêm, sửa, xóa)
- Cấu hình giá theo khung giờ
- Xem danh sách booking của sân mình
- Thống kê doanh thu và booking
- Xuất báo cáo Excel
- Nhận thông báo khi có booking mới / thanh toán

### Admin
- Thống kê tổng quan hệ thống
- Quản lý tất cả sân và booking
- Xuất báo cáo toàn hệ thống

### Hệ thống thông báo
- Push Notification (Web Push)
- Nhắc lịch đặt sân trước 30 phút (Cronjob)
- Thông báo khi booking/thanh toán thành công

## Công nghệ sử dụng

### Backend
| Công nghệ | Mô tả |
|-----------|-------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **Sequelize** | ORM cho MySQL |
| **MySQL** | Database |
| **JWT** | Authentication |
| **Stripe** | Payment gateway |
| **Web-Push** | Push notifications |
| **Nodemailer** | Email service |
| **Node-Cron** | Scheduled tasks |
| **ExcelJS** | Export Excel reports |

### Frontend
| Công nghệ | Mô tả |
|-----------|-------|
| **HTML/CSS/JS** | Vanilla JavaScript |
| **Pug** | Template engine |
| **Service Worker** | Push notifications |

## Cấu trúc dự án

```
sports-booking-system/
├── backend/
│   ├── database/
│   │   ├── migrations/          # Database migrations
│   │   └── seeders/             # Seed data
│   ├── src/
│   │   ├── config/              # Cấu hình (DB, Email, etc.)
│   │   ├── constants/           # Constants & Error codes
│   │   ├── controllers/         # Request handlers
│   │   ├── middlewares/         # Auth, Validation, etc.
│   │   ├── models/              # Sequelize models
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Helper functions
│   │   ├── validators/          # Input validation
│   │   └── server.js            # Entry point
│   ├── tests/                   # Unit & Integration tests
│   ├── uploads/                 # Uploaded files
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── css/                 # Stylesheets
│   │   ├── js/                  # Client-side JavaScript
│   │   └── images/              # Static images
│   └── views/
│       ├── components/          # Reusable Pug components
│       ├── layouts/             # Page layouts
│       └── pages/               # Page templates
└── docker/                      # Docker configuration
```

## 🚀 Cài đặt

### Yêu cầu
- Node.js >= 18.x
- MySQL >= 8.0
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone https://github.com/your-username/sports-booking-system.git
cd sports-booking-system
```

### Bước 2: Cài đặt dependencies
```bash
cd backend
npm install
```

### Bước 3: Tạo database
```sql
CREATE DATABASE sports_booking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 4: Cấu hình environment
```bash
cp .env.example .env
```

### Bước 5: Chạy migrations
```bash
npm run db:migrate
```

### Bước 6: Chạy seeders (tùy chọn)
```bash
npm run db:seed
```

## Cấu hình

Tạo file `.env` trong thư mục `backend/`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sports_booking
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Sports Booking <noreply@sportsbooking.com>

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Web Push (VAPID Keys)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your_email@example.com

# App URL
APP_URL=http://localhost:3000
```

### Tạo VAPID Keys
```bash
npx web-push generate-vapid-keys
```

## Chạy ứng dụng

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/auth/verify-email` | Xác thực email |
| POST | `/api/auth/forgot-password` | Yêu cầu reset mật khẩu |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu |
| GET | `/api/auth/profile` | Lấy thông tin user |

### Courts
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/courts` | Danh sách sân |
| GET | `/api/courts/:id` | Chi tiết sân |
| POST | `/api/courts` | Tạo sân mới (Manager) |
| PUT | `/api/courts/:id` | Cập nhật sân (Manager) |
| DELETE | `/api/courts/:id` | Xóa sân (Manager) |
| GET | `/api/courts/my-courts` | Sân của tôi (Manager) |

### Bookings
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/bookings` | Danh sách booking của tôi |
| GET | `/api/bookings/court-bookings` | Danh sách booking của sân |
| GET | `/api/bookings/:id` | Chi tiết booking |
| GET | `/api/bookings/all` | Danh sách tất cả booking |
| POST | `/api/bookings` | Tạo booking mới |
| PUT | `/api/bookings/:id` | Sửa booking |
| PUT | `/api/bookings/:id/confirm` | Xác nhận booking |
| DELETE | `/api/bookings/:id` | Hủy booking |

### Payments
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/payments/create-checkout` | Tạo phiên thanh toán |
| GET | `/api/payments/status/:bookingId` | Kiểm tra trạng thái |
| POST | `/api/payments/webhook` | Stripe webhook |
| GET | `/api/payments/history` | Lịch sử thanh toán |

### Notifications
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/notifications/vapid-key` | Lấy vapid key |
| GET | `/api/notifications` | Danh sách thông báo |
| PUT | `/api/notifications/:id/read` | Đánh dấu đã đọc |
| POST | `/api/notifications/subscribe` | Đăng ký push |
| DELETE | `/api/notifications/subscribe` | Hủy đăng ký push |

### Statistics
| Method | Endpoint | Mô tả | Role |
|--------|----------|-------|------|
| GET | `/api/statistics/overview` | Thống kê tổng quan | Admin |
| GET | `/api/statistics/my-courts` | Thống kê sân của tôi | Manager |
| GET | `/api/statistics/courts/:id` | Thống kê chi tiết sân | Manager, Admin |
| GET | `/api/statistics/export/excel` | Xuất báo cáo Excel | Manager, Admin |

## 🗄 Database Schema

### Bảng chính
- **tblUser** - Người dùng (Customer, Manager, Admin)
- **tblCourts** - Thông tin sân
- **tblCourtPriceSlot** - Giá theo khung giờ
- **tblBooking** - Đặt sân
- **tblTransaction** - Giao dịch thanh toán
- **tblNotification** - Thông báo
- **tblDevice** - Thiết bị đăng ký push

### Quan hệ
```
User (1) ─────< (n) Court (owner)
User (1) ─────< (n) Booking
Court (1) ────< (n) Booking
Court (1) ────< (n) CourtPriceSlot
Booking (1) ─── (1) Transaction
User (1) ─────< (n) Notification
User (1) ─────< (n) Device
```

## Testing

### Chạy tests
```bash
npm test
```

### Chạy tests với coverage
```bash
npm run test -- --coverage
```

## Scripts

| Script | Mô tả |
|--------|-------|
| `npm start` | Chạy production |
| `npm run dev` | Chạy development với nodemon |
| `npm test` | Chạy tests |
| `npm run db:migrate` | Chạy migrations |
| `npm run db:migrate:undo` | Rollback migration |
| `npm run db:seed` | Chạy seeders |
| `npm run db:reset` | Reset database |

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Customer** | Đặt sân, xem booking của mình, thanh toán |
| **Manager** | Quản lý sân của mình, xem thống kê, xuất báo cáo |
| **Admin** | Full access, thống kê toàn hệ thống |

