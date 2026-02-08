import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HomePage } from '@/app/features/home';
import { SearchPage } from '@/app/features/search';
import { BookingHistoryPage } from '@/app/features/booking-history';

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
]);
