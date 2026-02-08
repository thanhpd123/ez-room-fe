import type { Booking, BookingStatus } from './types';

export function filterBookings(
    bookings: Booking[],
    filter: 'all' | BookingStatus
): Booking[] {
    if (filter === 'all') return bookings;
    return bookings.filter((booking) => booking.status === filter);
}
