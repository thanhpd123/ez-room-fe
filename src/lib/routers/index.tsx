import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HomePage } from '@/app/features/home';
import { SearchPage } from '@/app/features/search';
import { BrowsePage } from '@/app/features/browse';
import { RentalDetailPage } from '@/app/features/rental-detail';
import { RoomDetailPage } from '@/app/features/room-detail';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage, CompleteSignupPage, OAuthCallbackPage } from '@/app/features/auth';
import { RegisterPage } from '@/app/features/common';
import { ProfilePage } from '@/app/features/profile';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';

/* Lazy-loaded chunks – admin/moderator/rental-mgmt only loaded when visited */
const BookingHistoryPage = lazy(() => import('@/app/features/booking-history').then((m) => ({ default: m.BookingHistoryPage })));
const FavoritesPage = lazy(() => import('@/app/features/favorites').then((m) => ({ default: m.default })));
const LayoutRentalManagements = lazy(() => import('@/app/layouts/layout_rentalManagements/Layout_rentalManagements').then((m) => ({ default: m.default })));
const CreateRentalPage = lazy(() => import('@/app/features/rentalManagement/create_Rental').then((m) => ({ default: m.CreateRentalPage })));
const ViewListRentalPage = lazy(() => import('@/app/features/rentalManagement/ViewListRental').then((m) => ({ default: m.ViewListRentalPage })));
const ViewRentalDetailPage = lazy(() => import('@/app/features/rentalManagement/ViewRentalDetail').then((m) => ({ default: m.ViewRentalDetailPage })));
const CreateRoomPostPage = lazy(() => import('@/app/features/roomManagement').then((m) => ({ default: m.CreateRoomPostPage })));
const ViewListRoomPostPage = lazy(() => import('@/app/features/roomManagement').then((m) => ({ default: m.ViewListRoomPostPage })));
const ViewRoomPostDetailPage = lazy(() => import('@/app/features/roomManagement').then((m) => ({ default: m.ViewRoomPostDetailPage })));
const EditRentalPage = lazy(() => import('@/app/features/rentalManagement/EditRental/EditRentalPage').then((m) => ({ default: m.EditRentalPage })));
const EditRoomPostPage = lazy(() => import('@/app/features/roomManagement/EditRoomPost/EditRoomPostPage').then((m) => ({ default: m.EditRoomPostPage })));
const HandleReportsPage = lazy(() => import('@/app/features/moderator/handle-reports').then((m) => ({ default: m.HandleReportsPage })));
const ModerateRentalListPage = lazy(() => import('@/app/features/moderator/moderate-rental').then((m) => ({ default: m.ModerateRentalListPage })));
const ModerateReviewsPage = lazy(() => import('@/app/features/moderator/moderate-reviews').then((m) => ({ default: m.ModerateReviewsPage })));
const ModerateRoomPostListPage = lazy(() => import('@/app/features/moderator/moderateRoomPost').then((m) => ({ default: m.ModerateRoomPostListPage })));
const ModeratorDashboardPage = lazy(() => import('@/app/features/moderator').then((m) => ({ default: m.ModeratorDashboardPage })));
const AdminLayout = lazy(() => import('@/app/features/admin').then((m) => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('@/app/features/admin').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('@/app/features/admin').then((m) => ({ default: m.AdminUsersPage })));
const AdminRentalsPage = lazy(() => import('@/app/features/admin').then((m) => ({ default: m.AdminRentalsPage })));
const AdminAmenitiesPage = lazy(() => import('@/app/features/admin').then((m) => ({ default: m.AdminAmenitiesPage })));
const AdminLocationsPage = lazy(() => import('@/app/features/admin').then((m) => ({ default: m.AdminLocationsPage })));
const LayoutModerator = lazy(() => import('@/app/layouts/layout_moderator/LayoutModerator').then((m) => ({ default: m.default })));
const ViewLandlordPage = lazy(() => import('@/app/features/lanlord-page').then((m) => ({ default: m.ViewLandlordPage })));

function PageLoader() {
    return (
        <div className="min-h-[200px] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
    );
}

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/home" replace />,
    },
    {
        path: '/register',
        element: <RegisterPage />,
    },
    {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
    },
    {
        path: '/reset-password',
        element: <ResetPasswordPage />,
    },
    {
        path: '/complete-signup',
        element: <CompleteSignupPage />,
    },
    {
        path: '/auth/callback',
        element: <OAuthCallbackPage />,
    },
    {
        path: '/home',
        element: <HomePage />,
    },
    {
        path: '/search',
        element: <SearchPage />,
    },
    {
        path: '/browse',
        element: <BrowsePage />,
    },
    {
        path: '/history',
        element: (
            <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                    <BookingHistoryPage />
                </Suspense>
            </ProtectedRoute>
        ),
    },
    {
        path: '/favorites',
        element: (
            <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                    <FavoritesPage />
                </Suspense>
            </ProtectedRoute>
        ),
    },
    {
        path: '/profile',
        element: (
            <ProtectedRoute>
                <ProfilePage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/rental-management',
        element: (
            <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                    <LayoutRentalManagements />
                </Suspense>
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="rentals" replace /> },
            { path: 'rentals', element: <Suspense fallback={<PageLoader />}><ViewListRentalPage /></Suspense> },
            { path: 'rentals/create', element: <Suspense fallback={<PageLoader />}><CreateRentalPage /></Suspense> },
            { path: 'rentals/:rentalId', element: <Suspense fallback={<PageLoader />}><ViewRentalDetailPage /></Suspense> },
            { path: 'rentals/:rentalId/edit', element: <Suspense fallback={<PageLoader />}><EditRentalPage /></Suspense> },
            { path: 'rentals/:rentalId/room-posts', element: <Suspense fallback={<PageLoader />}><ViewListRoomPostPage /></Suspense> },
            { path: 'rentals/:rentalId/room-posts/create', element: <Suspense fallback={<PageLoader />}><CreateRoomPostPage /></Suspense> },
            { path: 'rentals/:rentalId/room-posts/:roomPostId', element: <Suspense fallback={<PageLoader />}><ViewRoomPostDetailPage /></Suspense> },
            { path: 'rentals/:rentalId/room-posts/:roomPostId/edit', element: <Suspense fallback={<PageLoader />}><EditRoomPostPage /></Suspense> },
        ],
    },
    {
        path: '/rental/:id',
        element: <RentalDetailPage />,
    },
    {
        path: '/landlord/:id',
        element: (
            <Suspense fallback={<PageLoader />}>
                <ViewLandlordPage />
            </Suspense>
        ),
    },
    {
        path: '/room/:id',
        element: <RoomDetailPage />,
    },
    {
        path: '/moderator',
        element: (
            <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                    <LayoutModerator />
                </Suspense>
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Suspense fallback={<PageLoader />}><ModeratorDashboardPage /></Suspense> },
            { path: 'rentals', element: <Suspense fallback={<PageLoader />}><ModerateRentalListPage /></Suspense> },
            { path: 'room-posts', element: <Suspense fallback={<PageLoader />}><ModerateRoomPostListPage /></Suspense> },
            { path: 'reports', element: <Suspense fallback={<PageLoader />}><HandleReportsPage /></Suspense> },
            { path: 'reviews', element: <Suspense fallback={<PageLoader />}><ModerateReviewsPage /></Suspense> },
        ],
    },
    {
        path: '/admin',
        element: (
            <ProtectedRoute requiredRole="ADMIN">
                <Suspense fallback={<PageLoader />}>
                    <AdminLayout />
                </Suspense>
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense> },
            { path: 'users', element: <Suspense fallback={<PageLoader />}><AdminUsersPage /></Suspense> },
            { path: 'rentals', element: <Suspense fallback={<PageLoader />}><AdminRentalsPage /></Suspense> },
            { path: 'amenities', element: <Suspense fallback={<PageLoader />}><AdminAmenitiesPage /></Suspense> },
            { path: 'locations', element: <Suspense fallback={<PageLoader />}><AdminLocationsPage /></Suspense> },
        ],
    },
]);
