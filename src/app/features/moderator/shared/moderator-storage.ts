import { listManagedRentals, updateManagedRentalStatus } from '@/app/features/rentalManagement/shared/rental-storage';
import { listManagedRoomPosts, updateRoomPostModerationStatus } from '@/app/features/roomManagement/shared/room-post-storage';
import type {
    HandleReportInput,
    ModerateRentalInput,
    ModerateReviewInput,
    ModerateRoomPostInput,
    ModeratedReview,
    ModerationDecision,
    ModerationHistoryRecord,
    RentalModerationItem,
    ReviewModerationStatus,
    RoomPostModerationItem,
    ViolationReport,
} from './types';

const STORAGE_KEY = 'ezroom:moderator:state';

interface StoredModerationDecision {
    decision: ModerationDecision;
    moderated_at: string;
    note?: string;
}

interface ModeratorState {
    rental_decisions: Record<string, StoredModerationDecision>;
    room_post_decisions: Record<string, StoredModerationDecision>;
    reports: ViolationReport[];
    reviews: ModeratedReview[];
    history: ModerationHistoryRecord[];
}

const DEFAULT_REPORTS: ViolationReport[] = [
    {
        report_id: 'report-seed-1',
        reporter_id: 'tenant-101',
        target_user_id: 'owner-002',
        target_type: 'rental',
        target_id: 'rental-seed-2',
        category: 'misleading',
        details: 'Listing says private kitchen but shared kitchen in reality.',
        status: 'open',
        created_at: '2026-02-08T09:40:00.000Z',
    },
    {
        report_id: 'report-seed-2',
        reporter_id: 'owner-008',
        target_user_id: 'tenant-220',
        target_type: 'review',
        target_id: 'review-seed-2',
        category: 'offensive',
        details: 'Review includes insulting language and personal attacks.',
        status: 'open',
        created_at: '2026-02-09T03:30:00.000Z',
    },
    {
        report_id: 'report-seed-3',
        reporter_id: 'tenant-131',
        target_user_id: 'owner-001',
        target_type: 'room_post',
        target_id: 'room-post-seed-1',
        category: 'spam',
        details: 'Duplicate room post submitted multiple times in one day.',
        status: 'resolved',
        action_taken: 'warning',
        created_at: '2026-02-04T10:00:00.000Z',
        resolved_at: '2026-02-04T14:20:00.000Z',
    },
];

const DEFAULT_REVIEWS: ModeratedReview[] = [
    {
        review_id: 'review-seed-1',
        reviewer_id: 'tenant-190',
        rental_id: 'rental-seed-1',
        rental_title: 'Maple Residence',
        rating: 4,
        content: 'Good room but the reviewer copied the same text in many posts.',
        flag_reason: 'Potential spam pattern',
        status: 'flagged',
        warning_count: 0,
        created_at: '2026-02-08T11:00:00.000Z',
    },
    {
        review_id: 'review-seed-2',
        reviewer_id: 'tenant-220',
        rental_id: 'rental-seed-2',
        rental_title: 'Sunrise Mini Apartment',
        rating: 1,
        content: 'This place is a total scam, owner is dishonest and rude.',
        flag_reason: 'Offensive language',
        status: 'flagged',
        warning_count: 1,
        created_at: '2026-02-09T02:40:00.000Z',
    },
    {
        review_id: 'review-seed-3',
        reviewer_id: 'tenant-154',
        rental_id: 'rental-seed-1',
        rental_title: 'Maple Residence',
        rating: 5,
        content: 'Clean room, responsive landlord, and stable electricity.',
        flag_reason: 'Routine quality check',
        status: 'approved',
        warning_count: 0,
        created_at: '2026-02-06T08:20:00.000Z',
    },
];

const DEFAULT_STATE: ModeratorState = {
    rental_decisions: {},
    room_post_decisions: {},
    reports: DEFAULT_REPORTS,
    reviews: DEFAULT_REVIEWS,
    history: [],
};

function createDefaultState(): ModeratorState {
    return {
        rental_decisions: {},
        room_post_decisions: {},
        reports: [...DEFAULT_REPORTS],
        reviews: [...DEFAULT_REVIEWS],
        history: [],
    };
}

function wait(ms = 120) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function createHistoryId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `moderation-history-${crypto.randomUUID()}`;
    }
    return `moderation-history-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function readState(): ModeratorState {
    if (typeof window === 'undefined') {
        return createDefaultState();
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
        return createDefaultState();
    }

    try {
        const parsed = JSON.parse(raw) as Partial<ModeratorState>;
        return {
            rental_decisions: parsed.rental_decisions ?? {},
            room_post_decisions: parsed.room_post_decisions ?? {},
            reports: Array.isArray(parsed.reports) ? parsed.reports : [...DEFAULT_REPORTS],
            reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [...DEFAULT_REVIEWS],
            history: Array.isArray(parsed.history) ? parsed.history : [],
        };
    } catch {
        return createDefaultState();
    }
}

function writeState(state: ModeratorState) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function deriveRentalModerationStatus(rentalStatus: string): ModerationDecision {
    if (rentalStatus === 'PENDING' || rentalStatus === 'HIDDEN') return 'pending_review';
    if (rentalStatus === 'VIOLATE') return 'rejected';
    return 'approved';
}

function toReviewStatus(action: ModerateReviewInput['action']): ReviewModerationStatus {
    if (action === 'approve') return 'approved';
    if (action === 'hide' || action === 'warn_user') return 'hidden';
    return 'deleted';
}

export async function listRentalModerationItems() {
    await wait();
    const rentals = await listManagedRentals();
    const state = readState();

    const result: RentalModerationItem[] = rentals.map((rental) => {
        const decision = state.rental_decisions[rental.rental_id];
        return {
            rental_id: rental.rental_id,
            user_id: rental.user_id,
            title: rental.title,
            city: rental.city,
            district: rental.district,
            address: rental.address,
            property_type: rental.property_type,
            created_at: rental.created_at,
            listing_status: rental.status,
            moderation_status: decision?.decision ?? deriveRentalModerationStatus(rental.status),
            last_moderated_at: decision?.moderated_at,
            last_note: decision?.note,
        };
    });

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function moderateRental(input: ModerateRentalInput) {
    await wait();
    const state = readState();
    const moderatedAt = new Date().toISOString();

    state.rental_decisions[input.rental_id] = {
        decision: input.decision,
        moderated_at: moderatedAt,
        note: input.note?.trim() || undefined,
    };

    state.history.unshift({
        history_id: createHistoryId(),
        target_type: 'rental',
        target_id: input.rental_id,
        action: input.decision === 'approved' ? 'approve_listing' : 'reject_listing',
        note: input.note?.trim() || undefined,
        moderator_id: input.moderator_id,
        created_at: moderatedAt,
    });

    writeState(state);

    await updateManagedRentalStatus(input.rental_id, input.decision === 'approved' ? 'AVAILABLE' : 'HIDDEN');
}

export async function listRoomPostModerationItems() {
    await wait();
    const [posts, rentals] = await Promise.all([listManagedRoomPosts(), listManagedRentals()]);
    const rentalMap = new Map(rentals.map((item) => [item.rental_id, item.title]));
    const state = readState();

    const result: RoomPostModerationItem[] = posts.map((post) => {
        const decision = state.room_post_decisions[post.room_post_id];
        return {
            room_post_id: post.room_post_id,
            rental_id: post.rental_id,
            rental_title: rentalMap.get(post.rental_id) ?? post.rental_id,
            title: post.title,
            price: post.price,
            area: post.area,
            max_occupants: post.max_occupants,
            created_at: post.created_at,
            listing_status: post.status,
            moderation_status: decision?.decision ?? post.moderation_status,
            last_moderated_at: decision?.moderated_at,
            last_note: decision?.note,
        };
    });

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function moderateRoomPost(input: ModerateRoomPostInput) {
    await wait();
    const state = readState();
    const moderatedAt = new Date().toISOString();

    state.room_post_decisions[input.room_post_id] = {
        decision: input.decision,
        moderated_at: moderatedAt,
        note: input.note?.trim() || undefined,
    };

    state.history.unshift({
        history_id: createHistoryId(),
        target_type: 'room_post',
        target_id: input.room_post_id,
        action: input.decision === 'approved' ? 'approve_room_post' : 'reject_room_post',
        note: input.note?.trim() || undefined,
        moderator_id: input.moderator_id,
        created_at: moderatedAt,
    });

    writeState(state);
    await updateRoomPostModerationStatus(input.room_post_id, input.decision);
}

export async function listViolationReports() {
    await wait();
    const state = readState();
    return [...state.reports].sort((a, b) => {
        if (a.status === b.status) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (a.status === 'open') return -1;
        if (b.status === 'open') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

export async function handleViolationReport(input: HandleReportInput) {
    await wait();
    const state = readState();
    const resolvedAt = new Date().toISOString();
    const status = input.action === 'dismiss_report' ? 'dismissed' : 'resolved';

    state.reports = state.reports.map((report) =>
        report.report_id === input.report_id
            ? {
                ...report,
                status,
                action_taken: input.action,
                resolved_at: resolvedAt,
            }
            : report
    );

    state.history.unshift({
        history_id: createHistoryId(),
        target_type: 'report',
        target_id: input.report_id,
        action: input.action,
        note: input.note?.trim() || undefined,
        moderator_id: input.moderator_id,
        created_at: resolvedAt,
    });

    writeState(state);
}

export async function listModeratedReviews() {
    await wait();
    const state = readState();
    return [...state.reviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function moderateReview(input: ModerateReviewInput) {
    await wait();
    const state = readState();
    const moderatedAt = new Date().toISOString();
    const nextStatus = toReviewStatus(input.action);

    state.reviews = state.reviews.map((review) =>
        review.review_id === input.review_id
            ? {
                ...review,
                status: nextStatus,
                warning_count: input.action === 'warn_user' ? review.warning_count + 1 : review.warning_count,
                moderated_at: moderatedAt,
            }
            : review
    );

    state.history.unshift({
        history_id: createHistoryId(),
        target_type: 'review',
        target_id: input.review_id,
        action: input.action,
        note: input.note?.trim() || undefined,
        moderator_id: input.moderator_id,
        created_at: moderatedAt,
    });

    writeState(state);
}

export async function listModerationHistory() {
    await wait();
    const state = readState();
    return [...state.history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getModeratorOverview() {
    const [rentalItems, roomPostItems, reports, reviews] = await Promise.all([
        listRentalModerationItems(),
        listRoomPostModerationItems(),
        listViolationReports(),
        listModeratedReviews(),
    ]);

    return {
        pendingRentalCount: rentalItems.filter((item) => item.moderation_status === 'pending_review').length,
        pendingRoomPostCount: roomPostItems.filter((item) => item.moderation_status === 'pending_review').length,
        openReportCount: reports.filter((item) => item.status === 'open').length,
        flaggedReviewCount: reviews.filter((item) => item.status === 'flagged').length,
    };
}
