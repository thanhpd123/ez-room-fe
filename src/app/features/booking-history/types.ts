export type BookingStatus = 'completed' | 'active' | 'cancelled';

export interface Booking {
    id: string;
    propertyId: string;
    propertyName: string;
    propertyImage: string;
    address: string;
    landlordName: string;
    startDate: string;
    endDate: string;
    status: BookingStatus;
    hasReview: boolean;
    userRating?: number;
}

export interface ReviewData {
    rating: number;
    comment: string;
    images: File[];
}

export interface ReportData {
    reason: string;
    details: string;
}

export interface ReportReason {
    value: string;
    label: string;
    description: string;
}
