# Frontend: Auth & Profile Checklist

## Login errors
- **LoginPage** (`app/features/auth/LoginPage.tsx`): `setError()` on email/password failure (backend message) and on Google/Facebook failure; error shown in red alert box above the form.

## Logout
- **Header** (`app/features/home/components/Header.tsx`): "Đăng xuất" button calls `signOut()` from `useAuth()`; clears Supabase session and stored token/user.

## Role-based UI
- **Header**: Shows "Quản lý cho thuê" link to `/rental-management` only when `user?.role === 'LANDLORD'`.
- **ProfilePage**: Displays role badge (Chủ nhà / Người thuê phòng) and readonly role in profile tab.

## Registration
- All new users register as **TENANT** by default. There is no role selection during registration.
- After registration, a skip-able popup reminds users to complete their profile, lifestyle, preferences, and citizen card (CCCD).

## Complete-signup flow (OAuth)
- **AuthContext**: After OAuth, `GET /auth/me` returns 404 with `code: 'NEED_REGISTER'` if user not in DB → redirect to `/complete-signup` (pendingOAuth in sessionStorage).
- **Route**: `/complete-signup` → `CompleteSignupPage`.
- **CompleteSignupPage**: Form with fullName, phone; submits `POST /auth/register-oauth`; on success clears sessionStorage and redirects to `/home`.

## Landlord upgrade
- Tenants can upgrade to Landlord via **ProfilePage** after completing:
  1. Profile (fullName, phone, gender)
  2. Lifestyle profile
  3. User preferences
  4. Citizen card (CCCD) with **VERIFIED** status
- CCCD images are uploaded via file picker (Cloudinary), not manual URL entry.
- Moderators/Admins review CCCD submissions via `/verifications/citizen-cards`.

## Profile + Lifestyle + Preference pages
- **Route**: `/profile` (ProtectedRoute) → `ProfilePage`.
- **ProfilePage** (`app/features/profile/ProfilePage.tsx`):
  - **Thông tin cá nhân**: fullName, email (readonly), role (readonly), phone, gender, avatar upload.
  - **Phong cách sống**: smoking, drinking, pets_allowed, sleep_schedule, personalityType (dropdown), etc.
  - **Sở thích tìm phòng**: budget_min, budget_max, preferredLocation, preferred_districts, room_type, amenities, etc.
- API: `registerRequest`, `updateProfileRequest`, `getLifestyleRequest`, `upsertLifestyleRequest`, `getPreferenceRequest`, `upsertPreferenceRequest`, `getCitizenCardRequest`, `upsertCitizenCardRequest`, `registerLandlordRequest` in `lib/api.ts`.
