# EZ-Room Frontend

Dự án Frontend cho hệ thống EZ-Room, được xây dựng với các công nghệ hiện đại nhằm cung cấp trải nghiệm học tập/thuê phòng/quản lý tốt nhất với hiệu năng cao.

## Công Nghệ Sử Dụng

### Lõi & Framework
- **[React 19](https://react.dev/)**: Thư viện UI cốt lõi.
- **[Vite](https://vitejs.dev/)**: Công cụ build siêu tốc thế hệ mới.
- **[TypeScript](https://www.typescriptlang.org/)**: Code type-safe, dễ dàng phát triển và bảo trì.
- **[React Router DOM 7](https://reactrouter.com/)**: Xử lý điều hướng và routing phía client.

### UI & Styling
- **[Tailwind CSS 4](https://tailwindcss.com/)**: Utility-first CSS framework (kết hợp `clsx` và `tailwind-merge` cho cấu trúc class linh hoạt).
- **[Ant Design 6](https://ant.design/)**: Bộ component UI toàn diện và chuyên nghiệp.
- **Icon**: Sử dụng `lucide-react` và `@ant-design/icons` cung cấp các hệ thống icon đa dạng.
- **[Recharts](https://recharts.org/)**: Vẽ biểu đồ và hiển thị dữ liệu mạnh mẽ.

### Connect & Real-time
- **[Axios](https://axios-http.com/)**: Xử lý mọi HTTP Request.
- **[Socket.io-client](https://socket.io/)**: Nhận và xử lý dữ liệu theo thời gian thực (real-time).
- **[Supabase Client](https://supabase.com/)**: Quản lý ảnh, file và xác thực nếu cần tích hợp trực tiếp từ client.

### Tiện Ích & Công cụ Khác
- **[i18next / React-i18next](https://react.i18next.com/)**: Hỗ trợ đa ngôn ngữ (Internationalization).
- **[ESLint](https://eslint.org/)**: Đảm bảo chất lượng code và chuẩn hóa convention.

## Cài Đặt và Khởi Chạy

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Chạy phiên bản phát triển (Development):**
   ```bash
   npm run dev
   ```

3. **Build bản Production:**
   ```bash
   npm run build
   ```

4. **Preview bản Production:**
   ```bash
   npm run preview
   ```

## Cấu Trúc Dự Án

* `src/`: Chứa toàn bộ source code (components, pages, hooks, utils,...).
* `public/`: Chứa các tài nguyên tĩnh (images, fonts,...).
* `vite.config.ts`: Cấu hình cho Vite.
* `tailwind.config.js` / File cấu hình tailwind: Cấu hình giao diện TailwindCSS.