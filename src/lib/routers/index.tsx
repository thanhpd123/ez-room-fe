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

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/home" replace />,
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
        element: <BookingHistoryPage />,
    },
    {
        path: '/favorites',
        element: <FavoritesPage />,
    },
    {
        path: '/rental-management',
        element: <LayoutRentalManagements />,
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
]);
