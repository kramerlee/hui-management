# Quản Lý Hụi

Hệ thống quản lý dây hụi thông minh dành cho chủ hụi.

## Tính năng

- 📱 **Đăng nhập bằng số điện thoại** - Xác thực OTP qua Firebase
- 📊 **Dashboard** - Tổng quan về các dây hụi
- 👥 **Quản lý hụi viên** - Thêm, sửa, xóa thành viên
- 📅 **Quản lý kỳ hụi** - Theo dõi từng kỳ, khui hụi
- 💰 **Quản lý thanh toán** - Theo dõi thanh toán của hụi viên
- 🎯 **Demo mode** - Sử dụng không cần Firebase

## Công nghệ

- **Frontend**: Vue 3 (Composition API)
- **State Management**: Pinia
- **Routing**: Vue Router
- **UI Components**: PrimeVue
- **Styling**: SCSS
- **Build Tool**: Vite
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Phone)

## Cài đặt

```bash
# Clone repository
git clone https://github.com/your-username/hui-management.git
cd hui-management

# Cài đặt dependencies
yarn install

# Chạy development server
yarn dev
```

## Cấu hình Firebase

1. Tạo project tại [Firebase Console](https://console.firebase.google.com/)
2. Bật Phone Authentication
3. Tạo Firestore Database
4. Copy thông tin cấu hình vào file `.env`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Demo Mode

Nếu không có cấu hình Firebase, ứng dụng tự động chạy ở chế độ Demo:
- Dữ liệu được lưu trong localStorage
- Sử dụng mã OTP `123456` để đăng nhập
- Đầy đủ tính năng như khi có Firebase

## Build & Deploy

```bash
# Build production
yarn build

# Preview build locally
yarn preview
```

### Deploy lên GitHub Pages

Ứng dụng được cấu hình tự động deploy khi push lên branch `main`.
Xem file `.github/workflows/deploy.yml`.

URL: `https://your-username.github.io/hui-management/`

## Cấu trúc thư mục

```
src/
├── assets/          # Styles, images
├── components/      # Vue components
│   ├── common/      # Shared components
│   └── layout/      # Layout components
├── firebase/        # Firebase configuration
├── router/          # Vue Router
├── stores/          # Pinia stores
├── types/           # TypeScript types
└── views/           # Page components
```

## Screens

1. **Login** - Đăng nhập bằng SĐT, xác thực OTP
2. **Dashboard** - Tổng quan các dây hụi
3. **Hui List** - Danh sách dây hụi
4. **Hui Create** - Tạo dây hụi mới
5. **Hui Detail** - Chi tiết dây hụi
6. **Hui Members** - Quản lý hụi viên
7. **Hui Periods** - Quản lý kỳ hụi
8. **Hui Payments** - Quản lý thanh toán

## License

MIT

