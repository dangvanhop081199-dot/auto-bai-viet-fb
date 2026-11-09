# BAZAN AUTO LEAD — Android

Mã nguồn React Native / Expo để chuẩn bị APK cài trực tiếp. Đây **không phải tệp APK đã build**.

## Cấu trúc và nguồn dữ liệu

- Ứng dụng nằm ngay **thư mục gốc** của kho; Base directory trong Expo giữ `/`.
- `lib/api-client-react` chứa API client dùng chung, nối qua pnpm workspace.
- Backend công khai: `https://bazan-auto-leads.replit.app`.
- Không chứa backend, cơ sở dữ liệu, khách hàng, khóa bí mật, ảnh trò chuyện hoặc dữ liệu mẫu.
- Chức năng yêu cầu đăng nhập; chưa cấu hình Gemini trong ứng dụng thì bài viết không có kết quả AI thật.
- Không cào Facebook, không tự gửi bình luận và không lưu mật khẩu Facebook.

## Cấu hình Expo trước khi build

1. Dự án đã được người dùng chỉ định: `@hopdangs-team/auto-bai-viet-fb`.
2. `extra.eas.projectId` đã gắn với dự án Expo hiện có. Không tự tạo UUID mới hoặc tạo dự án Expo trùng.
3. Trong biến môi trường **preview** của Expo, thêm `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` phù hợp với backend. Đây phải là publishable key, không phải secret key. Không đưa khóa thật vào Git.
4. Nếu Clerk yêu cầu proxy, thêm `EXPO_PUBLIC_CLERK_PROXY_URL` là URL HTTPS của proxy thật đang sử dụng. Không tự đặt URL.
5. `EXPO_PUBLIC_DOMAIN` đã được profile `preview` đặt thành tên miền backend công khai ở trên.

Không đưa `CLERK_SECRET_KEY`, `SESSION_SECRET`, `DATABASE_URL`, Gemini key hoặc mật khẩu vào các biến `EXPO_PUBLIC_*`: chúng sẽ được nhúng trong ứng dụng.

## Kiểm tra

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run check:build-config
```

`check:build-config` **cố ý báo lỗi** nếu thiếu publishable key hoặc mất liên kết Project ID. Không bỏ kiểm tra chỉ để tạo một APK không đăng nhập được.

## Build dự kiến

- Chọn profile **preview**, platform **Android**, nhánh **main**.
- `eas.json`: `distribution: internal`, `android.buildType: apk`, `developmentClient: false`.
- Không tự submit lên Google Play.
- Việc build cloud có thể sử dụng hạn mức của tài khoản Expo; cần xác nhận và xử lý quyền/budget trước khi chạy.
- Android application ID ban đầu: **vn.bazan.autolead**. Giữ nguyên cho các lần cập nhật tiếp theo.
- Chứng chỉ ký phải được lưu trong dịch vụ quản lý credentials của Expo, không trong kho mã.

## Trước khi bàn giao APK

Phải có build Android hoàn tất và URL tải APK thật; không đổi tên ZIP/AAB thành APK. Sau đó cần xác minh trên thiết bị Android: đăng nhập, gọi API, nhập bài/ảnh/file, CRM, clipboard, mở bài Facebook và dừng khẩn cấp. APK vẫn cần Internet và backend đang chạy.
