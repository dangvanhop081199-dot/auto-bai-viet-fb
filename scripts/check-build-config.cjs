const { expo } = require("../app.json");
const { build } = require("../eas.json");

const errors = [];
const domain = process.env.EXPO_PUBLIC_DOMAIN || build.preview.env.EXPO_PUBLIC_DOMAIN;
const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const proxy = process.env.EXPO_PUBLIC_CLERK_PROXY_URL;

if (!domain || domain.includes("://") || !/^[a-z0-9.-]+$/i.test(domain)) {
  errors.push("EXPO_PUBLIC_DOMAIN phải là tên miền backend, không chứa https:// hoặc đường dẫn.");
}
if (!/^pk_(test|live)_[a-zA-Z0-9_-]+$/.test(key)) {
  errors.push("Thiếu EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY hợp lệ trong môi trường Expo preview. Không dùng CLERK_SECRET_KEY.");
}
if (proxy) {
  try {
    if (new URL(proxy).protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    errors.push("EXPO_PUBLIC_CLERK_PROXY_URL phải là URL HTTPS nếu được sử dụng.");
  }
}
if (!expo.android?.package || expo.android.package !== "vn.bazan.autolead") {
  errors.push("Android package phải giữ nguyên vn.bazan.autolead.");
}
if (expo.owner !== "hopdangs-team" || expo.slug !== "auto-bai-viet-fb") {
  errors.push("Chủ sở hữu và slug phải trùng dự án Expo đã kết nối.");
}
if (!expo.extra?.eas?.projectId) {
  errors.push("Chưa liên kết extra.eas.projectId: sao chép Project ID từ Expo → Project settings → General vào app.json trước khi build. Không tự đặt UUID mới.");
}
if (build.preview.android.buildType !== "apk" || build.preview.developmentClient !== false) {
  errors.push("Profile preview phải tạo APK độc lập, không phải AAB hoặc development client.");
}
if (errors.length) {
  console.error("Chưa đủ cấu hình để build APK:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.info("Đã kiểm tra cấu hình APK. Không in giá trị khóa.");
