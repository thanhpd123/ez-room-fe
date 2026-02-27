import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HomePage } from '@/app/features/home';
import { SearchPage } from '@/app/features/search';
import { BookingHistoryPage } from '@/app/features/booking-history';
import { RentalDetailPage } from '@/app/features/rental-detail';
import { RoomDetailPage } from '@/app/features/room-detail';
import FavoritesPage from '@/app/features/favorites';
import LayoutRentalManagements from '@/app/layouts/layout_rentalManagements/Layout_rentalManagements';
import { CreateRentalPage, ViewListRentalPage, ViewRentalDetailPage } from '@/app/features/rentalManagement';
import { CreateRoomPostPage, ViewListRoomPostPage, ViewRoomPostDetailPage } from '@/app/features/roomManagement';
import {
    HandleReportsPage,
    ModerateRentalListPage,
    ModerateReviewsPage,
    ModerateRoomPostListPage,
    ModeratorDashboardPage,
} from '@/app/features/moderator';
import {
    AdminLayout,
    AdminDashboardPage,
    AdminUsersPage,
    AdminRentalsPage,
    AdminAmenitiesPage,
    AdminLocationsPage,
} from '@/app/features/admin';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage, CompleteSignupPage } from '@/app/features/auth';
import { RegisterPage } from '@/app/features/common';
import { ProfilePage } from '@/app/features/profile';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';

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
        path: '/home',
        element: <HomePage />,
    },
    {
        path: '/search',
        element: <SearchPage />,
    },
    {
        path: '/history',
        element: (
            <ProtectedRoute>
                <BookingHistoryPage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/favorites',
        element: (
            <ProtectedRoute>
                <FavoritesPage />
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
                <LayoutRentalManagements />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="rentals" replace />,
            },
            {
                path: 'rentals',
                element: <ViewListRentalPage />,
            },
            {
                path: 'rentals/create',
                element: <CreateRentalPage />,
            },
            {
                path: 'rentals/:rentalId',
                element: <ViewRentalDetailPage />,
            },
            {
                path: 'rentals/:rentalId/room-posts',
                element: <ViewListRoomPostPage />,
            },
            {
                path: 'rentals/:rentalId/room-posts/create',
                element: <CreateRoomPostPage />,
            },
            {
                path: 'rentals/:rentalId/room-posts/:roomPostId',
                element: <ViewRoomPostDetailPage />,
            },
        ],
    },
    {
        path: '/rental/:id',
        element: <RentalDetailPage />,
    },
    {
        path: '/room/:id',
        element: <RoomDetailPage />,
    },
    {
        path: '/moderator',
        element: <ModeratorDashboardPage />,
    },
    {
        path: '/moderator/rentals',
        element: <ModerateRentalListPage />,
    },
    {
        path: '/moderator/room-posts',
        element: <ModerateRoomPostListPage />,
    },
    {
        path: '/moderator/reports',
        element: <HandleReportsPage />,
    },
    {
        path: '/moderator/reviews',
        element: <ModerateReviewsPage />,
    },
    {
        path: '/admin',
        element: (
            <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <AdminDashboardPage />,
            },
            {
                path: 'users',
                element: <AdminUsersPage />,
            },
            {
                path: 'rentals',
                element: <AdminRentalsPage />,
            },
            {
                path: 'amenities',
                element: <AdminAmenitiesPage />,
            },
            {
                path: 'locations',
                element: <AdminLocationsPage />,
            },
        ],
    },
]);
