import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HomePage } from '@/app/features/home';
import { SearchPage } from '@/app/features/search';
import { BookingHistoryPage } from '@/app/features/booking-history';
import { RentalDetailPage } from '@/app/features/rental-detail';
import { RoomDetailPage } from '@/app/features/room-detail';

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
        path: '/rental/:id',
        element: <RentalDetailPage />,
    },
    {
        path: '/room/:id',
        element: <RoomDetailPage />,
    },
]);
