# EZ-Room Frontend

Frontend của hệ thống EZ-Room, được xây dựng để phục vụ trải nghiệm người dùng trong một ứng dụng thuê phòng / tìm nhà / quản lý cho thuê hiện đại. Đây là phần giao diện người dùng, kết nối trực tiếp với backend, xử lý xác thực, tìm kiếm, thanh toán, realtime chat, quản trị và quản lý danh mục thuê nhà.

Dự án frontend này không chỉ là một landing page hay demo UI; nó là một ứng dụng web đa role với nhiều màn hình cho từng loại người dùng:
- Người thuê tìm phòng
- Chủ nhà đăng tin và quản lý phòng
- Người quản trị / moderator kiểm duyệt và quản lý hệ thống
- Người dùng có ví, đánh giá, yêu thích, chat, và thanh toán

---

## 1. Mục tiêu dự án

EZ-Room frontend hướng tới việc xây dựng trải nghiệm đầy đủ cho một nền tảng bất động sản kiểu marketplace như sau:
- Tìm kiếm phòng trọ theo vị trí, giá, tiện ích và loại phòng
- Xem chi tiết nhà/phòng, ảnh, địa điểm, tiện nghi
- Đăng ký, đăng nhập, lưu phiên, auth và bảo vệ route
- Chủ nhà quản lý rental và room post
- Người thuê đặt cọc và thanh toán online
- Chat real-time, theo dõi trạng thái online/offline
- Theo dõi lịch sử thuê, yêu thích, ví, đánh giá, và doanh nghiệp/marketing nội bộ

Nói cách khác, frontend này đã làm một hệ thống web “full app” cho thuê nhà, chứ không chỉ là giao diện tĩnh.

---

## 2. Công nghệ chính đã dùng

### 2.1 Core frontend
- React 19
- Vite
- TypeScript
- React Router DOM 7

### 2.2 UI library & styling
- Ant Design 6
- Tailwind CSS 4
- clsx + tailwind-merge
- lucide-react + @ant-design/icons

### 2.3 State, API, realtime
- Axios
- Socket.io-client
- Supabase client
- i18next + react-i18next

### 2.4 Visualisation & utility
- Recharts
- ESLint

Như có thể thấy trong `package.json`, project này đã kết hợp nhiều công nghệ vừa để build UI nhanh vừa để đảm bảo UX chuyên nghiệp và tính năng nghiệp vụ hoàn chỉnh.

---

## 3. Cấu trúc dự án

Dự án frontend được tổ chức khá rõ theo module và feature-based pattern.

```text
src/
  app/
    AppWithLocale.tsx
    components/
    context/
    features/
    hooks/
    layouts/
  i18n/
  lib/
    api.ts
    api-config.ts
    routers/
    socket.ts
    supabase.ts
    utils.ts
  index.css
  main.tsx
```

### Các folder quan trọng

- `src/app/features/`: chứa các trang chức năng chính như auth, home, search, rental-detail, room-detail, chat, wallet, profile, admin, moderator, landlord, roommate...
- `src/app/context/`: chứa provider cho auth, favorites, language, chatbox
- `src/app/components/`: reusable UI components, protected route, floating chat, image upload, page loader...
- `src/app/layouts/`: layout cho các role khác nhau như rental management, moderator
- `src/lib/`: utility, API config, auth helper, socket helper, Supabase helper
- `src/i18n/`: đa ngôn ngữ (vi/en)

---

## 4. Kiến trúc tổng thể

Project này dùng mô hình SPA (Single Page Application) với React Router.

### 4.1 App bootstrap
Tại `src/main.tsx`:
- app khởi tạo bằng `createRoot`
- load global stylesheet
- gọi `AppWithLocale`
- xóa cookie `googtrans` cũ để tránh chrome translate can thiệp vào UI

### 4.2 App root và provider
Trong `src/app/AppWithLocale.tsx`:
- cấu hình Ant Design theme và locale theo ngôn ngữ hiện tại
- bọc toàn app bằng:
  - `LanguageProvider`
  - `AuthProvider`
  - `FavoritesProvider`
  - `ChatBoxProvider`
- render `AppRouter`
- hiển thị `FloatingChatBox` trên nền app

Điều này cho thấy app có tính toàn cục, state được truyền qua context, tránh phải truyền props nhiều tầng.

---

## 5. Routing và phân quyền

Trong `src/lib/routers/index.tsx`, hệ thống định tuyến theo nhiều nhóm route:

### Public routes
- `/home`
- `/login`
- `/register`
- `/search`
- `/rooms`
- `/browse`
- `/room/:id`
- `/rental/:id`
- `/blog`, `/blog/:slug`
- `/vip-plans`

### Protected routes
- `/profile`
- `/favorites`
- `/history`
- `/wallet`
- `/chat`, `/chat/:userId`
- `/roommate`

### Role-based routes
- Landlord:
  - `/rental-management/...`
  - dashboard, list rentals, requests, reviews, wallet, chat
- Moderator/Admin:
  - `/moderator/...`
  - `/admin/...`

Router có lazy loading bằng `React.lazy()` cho các màn hình lớn, giúp tối ưu hiệu năng và giảm bundle nặng ban đầu.

`ProtectedRoute` được dùng để chặn route theo trạng thái auth và role. Đây là một phần rất quan trọng trong app vì nó đảm bảo người dùng chỉ truy cập đúng màn hình theo quyền.

---

## 6. Auth flow và bảo mật frontend

Auth logic được xử lý rất rõ trong `src/app/context/AuthProvider.tsx`.

### 6.1 Token management
- Token backend được lưu trong localStorage theo khóa `ezroom_token`
- User info cũng được lưu trong `ezroom_user`
- Hỗ trợ đồng thời Supabase OAuth session và backend JWT

### 6.2 Login flow
Ứng dụng xử lý 2 loại auth:
1. Email/password login qua backend API
2. Google OAuth qua Supabase

`loginWithEmail()` gọi API backend `/auth/login`, nhận access token và user; sau đó gọi `setStoredAuth()` lưu vào localStorage.

### 6.3 Refresh & verify session
- `authFetch()` và `AuthProvider` tự verify `/auth/me`
- Nếu người dùng đã có token hợp lệ thì `authVerified` được set true
- Nếu backend trả 401 hoặc token hết hạn thì logout / clear session
- Có logic riêng để phân biệt giữa backend JWT và Supabase session

### 6.4 OAuth registration flow
Với Google login, app redirect tới `/auth/callback`, và nếu user chưa có tài khoản backend, chuyển đến `/complete-signup`.

Đây là một tính năng rất thực tế, cho thấy app không chỉ handle login cơ bản mà còn xử lý onboarding user phức tạp.

---

## 7. API layer và giao tiếp backend

File `src/lib/api.ts` là nơi tập trung xử lý request tới backend.

### Các nhóm function chính
- `loginWithEmail`, `registerRequest`, `forgotPasswordRequest`, `resetPasswordRequest`
- `changePasswordRequest`, `updateProfileRequest`
- `getAccessToken`, `setStoredAuth`, `clearStoredAuth`
- `authFetch` helper tự động gắn token vào header
- `refreshAccessTokenRequest`
- Lifestyle profile / preference requests
- Payment / wallet / preorder API tương tác với backend

Điểm mạnh của file này là nó đóng vai trò như một abstraction layer giữa UI và backend. UI components không cần gọi fetch trực tiếp nhiều lần; hầu hết đều đi qua API helper.

---

## 8. Xử lý realtime và chat

Project dùng Socket.IO client để làm realtime:
- online/offline presence
- typing indicator
- chat events
- notification flow

Các file liên quan:
- `src/lib/socket.ts`
- `src/app/context/ChatBoxContext.tsx`
- `src/app/components/FloatingChatBox.tsx`
- `src/app/features/chat/*`

### Chat experience
Người dùng có thể:
- mở chat qua route `/chat` hoặc `/chat/:userId`
- xem trạng thái online của người đối thoại
- gõ tin nhắn realtime
- thấy floating chat box trên app

Khả năng realtime này là một dấu hiệu app đã đi đúng hướng của một hệ thống thương mại trực tuyến hơn là một UI demo thuần túy.

---

## 9. Tìm kiếm, danh sách phòng và marketplace flow

### Home / Search / Browse / Rooms
Các module chính như:
- `src/app/features/home`
- `src/app/features/search`
- `src/app/features/rooms`
- `src/app/features/browse`
- `src/app/features/rental-detail`
- `src/app/features/room-detail`

### Flow người dùng
1. User vào trang home hoặc search
2. Chọn filter: vị trí, giá, loại phòng, tiện ích
3. Gọi API backend để tìm danh sách phòng
4. Xem chi tiết từng rental / room
5. Lưu yêu thích / đặt cọc / liên hệ chủ nhà

### Tính năng bổ sung
- `RoomFavoriteButton` cho phép lưu phòng yêu thích
- `FavoritesProvider` quản lý trạng thái favorite toàn app
- `LocationPickerMap` cho địa điểm và vị trí

Điều này cho thấy app đã làm gần như một marketplace thuê phòng thực thụ, có trải nghiệm tìm kiếm và lọc chi tiết.

---

## 10. Quản lý rental và room post cho landlord

Phần landlord rất phong phú. Route đã định nghĩa rõ:
- `/rental-management/dashboard`
- `/rental-management/rentals`
- `/rental-management/rentals/create`
- `/rental-management/rentals/:rentalId`
- `/rental-management/requests`
- `/rental-management/reviews`
- `/rental-management/messages`

### Chức năng landlord làm được
- Tạo rental mới
- Xem danh sách rental
- Tạo room post, quản lý room detail
- Chỉnh sửa rental / room post
- Xem yêu cầu thuê từ tenant
- Duyệt / từ chối request
- Xem review và feedback
- Theo dõi lịch sử thuê và hợp đồng

Folder `src/app/features/rentalManagement` và `src/app/features/roomManagement` cho thấy app có logic quản lý nội dung và nghiệp vụ trực tiếp cho chủ nhà.

---

## 11. Wallet, thanh toán và PayOS

Frontend có module payment-result và wallet khá rõ ràng:
- `/wallet`
- `/payment/payos-result`
- `/payment-success`
- `/payment-cancel`

### Chức năng wallet / payment
- Xem số dư ví
- Theo dõi giao dịch
- Thanh toán cọc hoặc gói VIP
- Hướng người dùng quay lại trang kết quả giao dịch
- Xử lý callback PayOS rõ ràng

Đây là một phần rất quan trọng vì app không chỉ hiển thị UI mà còn kết nối với thanh toán thực tế.

---

## 12. Multilingual và UX quốc tế hóa

`src/i18n/index.ts` + `src/i18n/locales/en.json` + `vi.json` cho thấy app hỗ trợ đa ngôn ngữ.

`AppWithLocale` đọc `i18n.language`, đổi locale Ant Design tương ứng (`en_US` / `vi_VN`).

Điều này cho thấy app đã cân nhắc UX cho người dùng quốc tế và người Việt hóa rõ ràng.

---

## 13. User preferences, favorites và personalization

### Favorites
- `FavoritesProvider` + `FavoritesContext`
- `RoomFavoriteButton`

Hệ thống cho phép người dùng lưu phòng yêu thích để theo dõi nhanh.

### Lifestyle / preference data
Dự án frontend lưu trữ và hiển thị preference profile, lifestyle profile, role data, VIP status. Đây là dấu hiệu app có mô hình người dùng cá nhân hóa, khớp với backend schema như `LifestyleProfile`, `UserPreference`.

---

## 14. Admin và moderator features

Phần admin/moderator rất đầy đủ trong router và folder:

- `/admin` dashboard
- user management
- rental moderation
- review moderation
- location management
- amenities management
- wallet management
- finance overview
- system settings
- VIP package management
- blog posts management

Điều này cho thấy app không chỉ phục vụ end-user mà còn xây dựng hệ thống vận hành và quản trị nội bộ.

---

## 15. UI components và reusable logic

Một số component đáng chú ý:
- `ProtectedRoute`: kiểm soát quyền truy cập
- `PageLoader`: loading state
- `ImageUpload`, `MultiFileSelect`, `MultiImageUpload`: upload media
- `LocationPickerMap`: chọn vị trí địa lý
- `VoiceSearchButton`: tìm kiếm bằng giọng nói
- `FloatingChatBox`: chat box nổi
- `ImageWithFallback`: xử lý ảnh lỗi hoặc thiếu ảnh

Những component này cho thấy frontend không chỉ có trang mà còn có lớp giao diện có tính tái sử dụng cao.

---

## 16. Setup môi trường

### Cài đặt

```bash
npm install
```

### Chạy dev

```bash
npm run dev
```

### Build production

```bash
npm run build
```

### Preview production

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## 17. Environment variables

Project có file `.env` và `.env.deploy`, nên frontend chắc chắn kết nối với backend và các dịch vụ bên ngoài như Supabase, nếu có tích hợp direct client. Thường sẽ có các biến như:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_CLIENT_ID=...
```

Tùy theo cấu hình thực tế, frontend sẽ dùng URL backend và Supabase để vận hành auth, upload, realtime.

---

## 18. Mô tả cách app hoạt động theo luồng user

### Luồng người thuê
1. Vào `/home` hoặc `/search`
2. Tìm phòng theo điều kiện lọc
3. Xem phòng trong `/room/:id` hoặc `/rental/:id`
4. Lưu yêu thích
5. Đăng nhập nếu cần
6. Chọn đặt cọc / thanh toán
7. Theo dõi lịch sử trong `/history` và `/wallet`
8. Chat với chủ nhà hoặc người liên quan

### Luồng chủ nhà
1. Đăng nhập với role `LANDLORD`
2. Vào `/rental-management`
3. Tạo rental / room post mới
4. Upload ảnh, thông tin và tiện ích
5. Theo dõi request từ tenant
6. Duyệt yêu cầu và cập nhật review

### Luồng admin / moderator
1. Đăng nhập vào dashboard quản trị
2. Kiểm duyệt report, review, rental, room post
3. Quản lý user, wallet, VIP package, site settings
4. Theo dõi tổng quan và động lực vận hành hệ thống

---

## 19. Điểm mạnh của frontend hiện tại

Frontend này đã rất “sống” vì có nhiều yếu tố mà project nhỏ thường thiếu:

- Module-based architecture rõ ràng
- Role-based routing
- Protected auth flow
- Lazy loading để tối ưu hiệu năng
- Realtime chat
- Payment flow integration
- Multi-language support
- Provider-based state management
- Upload / media handling
- Admin + moderator system
- Rich marketplace UX

Nói ngắn gọn: đây là một frontend của ứng dụng thực tế, không phải kiểu mock UI hoặc tutorial app.

---

## 20. Kết luận

EZ-Room frontend là một ứng dụng React/TypeScript có tính năng đầy đủ cho một nền tảng cho thuê nhà hiện đại. Nó không chỉ render giao diện mà còn xử lý:
- authentication
- protected routes
- search & browse
- payment flow
- chat realtime
- management dashboard
- review / moderation workflow
- localization
- real app state management

Nếu nhìn kỹ, đây là một frontend tương đương với một sản phẩm SaaS hoặc marketplace thật sự, nơi người dùng từng vai trò có trải nghiệm riêng và hệ thống được tổ chức theo mô hình rất rõ ràng.

---

## 21. Tóm tắt cực ngắn

EZ-Room frontend đang làm một app thuê phòng trực tuyến kiểu marketplace với:
- UI React + Vite + TypeScript
- Ant Design + Tailwind
- Auth + protected route
- Search / room detail / rental detail
- Landlord dashboard
- Wallet + PayOS
- Socket.IO realtime chat
- Admin / moderator module
- Multi-language support

Nếu cần, mình có thể tiếp tục viết thêm:
1. README theo dạng portfolio / GitHub showcase
2. README dài theo format chuyên nghiệp cho team dự án
3. README ngắn gọn nhưng đẹp hơn cho người xem ngoài
4. Một bản architecture diagram bằng Mermaid mô tả flow frontend/backend