# Hệ thống quản lý món ăn trên nền tảng đám mây

**MSSV:** 236725  
**Sinh viên:** Lê Phát Huy

Ứng dụng quản lý món ăn gồm frontend React, backend Node.js/Express và cơ sở dữ liệu MongoDB Atlas. Dự án được chuẩn bị để quản lý mã nguồn bằng GitHub, đóng gói bằng Docker và triển khai trên Render.

## Công nghệ
- React + Vite
- Node.js, Express
- MongoDB Atlas, Mongoose
- Docker
- Git/GitHub
- Render

## Cấu trúc
```text
236725_LePhatHuy/
├── backend/
├── frontend/
├── .gitignore
└── README.md
```

## Chạy local
### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Điền `MONGODB_URI` trong `backend/.env` bằng chuỗi kết nối MongoDB Atlas của bạn. Không commit tệp `.env`.

### 2. Frontend
Mở terminal khác:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Vite thường chạy frontend tại `http://localhost:5173`; backend mặc định tại `http://localhost:5000`.

## API
- `GET /health`
- `GET /api/foods`
- `GET /api/foods/:id`
- `POST /api/foods`
- `PUT /api/foods/:id`
- `DELETE /api/foods/:id`
- `GET /api/foods?search=pho`

## Docker
Trong thư mục `backend`:
```bash
docker build -t 236725lephathuy/backend .
docker run --rm -p 5000:5000 --env-file .env 236725lephathuy/backend
```
Trong thư mục `frontend`:
```bash
docker build -t 236725lephathuy/frontend .
docker run --rm -p 8080:80 236725lephathuy/frontend
```

Để đẩy image lên Docker Hub, đăng nhập bằng `docker login`, sau đó:
```bash
docker push 236725lephathuy/backend
docker push 236725lephathuy/frontend
```
Trước khi push cần build/tag đúng tài khoản Docker Hub và đăng nhập tài khoản của bạn.

## Triển khai
Tạo dịch vụ frontend và backend trên Render. Cấu hình `MONGODB_URI`, `FRONTEND_URL` ở backend và `VITE_API_URL` ở frontend theo URL thực tế. Sau khi triển khai, cập nhật các URL thật ở đây.

- GitHub: Chưa tạo repository
- Docker Hub backend: Chưa push image
- Docker Hub frontend: Chưa push image
- Render frontend: Chưa triển khai
- Render backend: Chưa triển khai

## Dữ liệu mẫu
Có thể tạo ít nhất 3 món ăn bằng giao diện sau khi backend kết nối thành công. Mỗi món gồm `foodId`, `name`, `category`, `cuisine`, `ingredients`, `price`, `quantity`, `description`, `imageUrl`.

## Lưu ý bảo mật
Không đưa mật khẩu, access token hoặc chuỗi kết nối có thông tin xác thực lên GitHub. `.env` đã được thêm vào `.gitignore`.
