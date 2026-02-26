# Frontend: Auth & Profile Checklist

## Login errors
- **LoginPage** (`app/features/auth/LoginPage.tsx`): `setError()` on email/password failure (backend message) and on Google/Facebook failure; error shown in red alert box above the form.

## Logout
- **Header** (`app/features/home/components/Header.tsx`): "Đăng xuất" button calls `signOut()` from `useAuth()`; clears Supabase session and stored token/user.

## Role-based UI
- **Header**: Shows "Quản lý cho thuê" link to `/rental-management` only when `user?.role === 'LANDLORD'`.
- **ProfilePage**: Displays role badge (Chủ nhà / Người thuê phòng) and readonly role in profile tab.

## Complete-signup flow
- **AuthContext**: After OAuth, `GET /auth/me` returns 404 with `code: 'NEED_REGISTER'` if user not in DB → redirect to `/complete-signup` (pendingOAuth in sessionStorage).
- **Route**: `/complete-signup` → `CompleteSignupPage`.
- **CompleteSignupPage**: Form with fullName, phone, role (TENANT/LANDLORD); submits `POST /auth/register-oauth`; on success clears sessionStorage and redirects to `/home`.

## Register role choice
- **RegisterPage** (`app/features/common/RegisterPage.tsx`): Dropdown "Vai trò" with options "Người thuê phòng (Tenant)" and "Chủ nhà / Cho thuê (Landlord)"; `form.role` sent in register payload.

## Profile + Lifestyle + Preference pages
- **Route**: `/profile` (ProtectedRoute) → `ProfilePage`.
- **ProfilePage** (`app/features/profile/ProfilePage.tsx`):
  - **Thông tin cá nhân**: fullName, email (readonly), role (readonly), phone, avatar URL + preview.
  - **Phong cách sống**: smoking, drinking, pets_allowed, sleep_schedule, personalityType (dropdown).
  - **Sở thích tìm phòng**: budget_min, budget_max, preferredLocation, preferred_gender (dropdown).
- API: `updateProfileRequest`, `getLifestyleRequest`, `upsertLifestyleRequest`, `getPreferenceRequest`, `upsertPreferenceRequest` in `lib/api.ts`.
