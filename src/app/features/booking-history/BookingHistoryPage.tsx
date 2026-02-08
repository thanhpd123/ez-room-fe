import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookingCard,
    BookingTabs,
    ReviewModal,
    ReportModal,
    EmptyState,
} from './components';
import { MOCK_BOOKINGS, type BookingTabValue } from './constants';
import { filterBookings } from './utils';
import type { ReviewData, ReportData } from './types';

type ModalState = 'none' | 'review' | 'report';

interface SelectedProperty {
    id: string;
    name: string;
}

export function BookingHistoryPage() {
    const navigate = useNavigate();

    // Tab state
    const [activeTab, setActiveTab] = React.useState<BookingTabValue>('all');

    // Modal state
    const [modalState, setModalState] = React.useState<ModalState>('none');
    const [selectedProperty, setSelectedProperty] = React.useState<SelectedProperty>({
        id: '',
        name: '',
    });
    const [isEditingReview, setIsEditingReview] = React.useState(false);
    const [existingReviewRating, setExistingReviewRating] = React.useState(0);

    // Filtered bookings
    const filteredBookings = filterBookings(MOCK_BOOKINGS, activeTab);

    // Handlers
    const handleWriteReview = (bookingId: string, propertyName: string) => {
        setSelectedProperty({ id: bookingId, name: propertyName });
        setIsEditingReview(false);
        setModalState('review');
    };

    const handleEditReview = (bookingId: string, propertyName: string, rating: number) => {
        setSelectedProperty({ id: bookingId, name: propertyName });
        setIsEditingReview(true);
        setExistingReviewRating(rating);
        setModalState('review');
    };

    const handleReport = (propertyId: string, propertyName: string) => {
        setSelectedProperty({ id: propertyId, name: propertyName });
        setModalState('report');
    };

    const handleContactLandlord = (bookingId: string) => {
        // TODO: Implement chat/contact feature
        console.log('Contact landlord for booking:', bookingId);
    };

    const handleReviewSubmit = (data: ReviewData) => {
        console.log('Review submitted:', { propertyId: selectedProperty.id, ...data });
        // TODO: Call API to submit review
        setModalState('none');
    };

    const handleReportSubmit = (data: ReportData) => {
        console.log('Report submitted:', { propertyId: selectedProperty.id, ...data });
        // TODO: Call API to submit report
        setModalState('none');
    };

    const handleCloseModal = () => {
        setModalState('none');
    };

    const handleExplore = () => {
        navigate('/search');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Lịch sử thuê phòng</h1>
                    <p className="text-foreground/60">Quản lý các booking và đánh giá của bạn</p>
                </div>

                {/* Tabs */}
                <BookingTabs activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Booking List */}
                {filteredBookings.length > 0 ? (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onWriteReview={handleWriteReview}
                                onEditReview={handleEditReview}
                                onReport={handleReport}
                                onContactLandlord={handleContactLandlord}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState onExplore={handleExplore} />
                )}
            </main>

            {/* Modals */}
            <ReviewModal
                isOpen={modalState === 'review'}
                onClose={handleCloseModal}
                onSubmit={handleReviewSubmit}
                propertyName={selectedProperty.name}
                existingRating={isEditingReview ? existingReviewRating : undefined}
                isEditMode={isEditingReview}
            />

            <ReportModal
                isOpen={modalState === 'report'}
                onClose={handleCloseModal}
                onSubmit={handleReportSubmit}
                propertyName={selectedProperty.name}
            />
        </div>
    );
}
