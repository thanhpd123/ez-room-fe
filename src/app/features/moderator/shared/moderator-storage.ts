import {
    getRentalsForModeration as getRentalsForModerationApi,
    updateRentalStatusRequest,
    getReportsRequest,
    handleReportRequest,
    type ReportStatusEnum,
} from '@/lib/api';
import { listManagedRoomPosts, moderateRoomPostApi } from '@/app/features/roomManagement/shared/room-post-storage';
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
    try {
        const response = await getRentalsForModerationApi();
        const state = readState();

        const result: RentalModerationItem[] = response.data.map((rental) => {
            const decision = state.rental_decisions[rental.id];
            return {
                rental_id: rental.id,
                user_id: rental.owner?.fullName ?? rental.owner?.id ?? '--',
                title: rental.title,
                description: rental.description ?? undefined,
                city: rental.location?.city ?? '',
                district: rental.location?.district ?? '',
                address: rental.location?.address ?? '',
                property_type: 'house',
                created_at: rental.createdAt,
                listing_status: rental.status,
                moderation_status: decision?.decision ?? deriveRentalModerationStatus(rental.status),
                last_moderated_at: decision?.moderated_at,
                last_note: decision?.note,
                images: rental.images,
                documents: rental.documents ?? [],
                owner_email: (rental.owner as Record<string, unknown>)?.email as string | undefined,
                owner_phone: (rental.owner as Record<string, unknown>)?.phone as string | undefined,
                rooms_count: (rental as Record<string, unknown>).roomsCount as number | undefined,
            };
        });

        return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
        console.error('Failed to fetch rentals for moderation:', err);
        return [];
    }
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

    // Call real backend API to update rental status
    try {
        await updateRentalStatusRequest(
            input.rental_id,
            input.decision === 'approved' ? 'AVAILABLE' : 'HIDDEN'
        );
    } catch (err) {
        console.error('Failed to update rental status via API:', err);
    }
}

export async function listRoomPostModerationItems() {
    await wait();
    const [posts, rentalsResponse] = await Promise.all([
        listManagedRoomPosts(),
        getRentalsForModerationApi().catch(() => ({ data: [] })),
    ]);

    interface RentalInfo {
        title: string;
        owner_name?: string;
        owner_email?: string;
        owner_phone?: string;
    }
    const rentalMap = new Map<string, RentalInfo>();
    for (const r of rentalsResponse.data) {
        const owner = r.owner as Record<string, unknown> | undefined;
        rentalMap.set(r.id, {
            title: r.title,
            owner_name: (owner?.fullName as string) ?? undefined,
            owner_email: (owner?.email as string) ?? undefined,
            owner_phone: (owner?.phone as string) ?? undefined,
        });
    }

    const state = readState();

    const deriveStatus = (roomStatus: string): ModerationDecision => {
        if (roomStatus === 'PENDING') return 'pending_review';
        if (roomStatus === 'MAINTENANCE') return 'rejected';
        return 'approved';
    };

    const result: RoomPostModerationItem[] = posts.map((post) => {
        const decision = state.room_post_decisions[post.room_post_id];
        const rentalInfo = rentalMap.get(post.rental_id);
        return {
            room_post_id: post.room_post_id,
            rental_id: post.rental_id,
            rental_title: rentalInfo?.title ?? post.rental_id,
            title: post.title,
            price: post.price,
            area: post.area,
            max_occupants: post.max_occupants,
            created_at: post.created_at,
            listing_status: post.status,
            moderation_status: decision?.decision ?? deriveStatus(post.status),
            last_moderated_at: decision?.moderated_at,
            last_note: decision?.note,
            images: post.images,
            amenities: post.amenities,
            description: post.description,
            owner_name: rentalInfo?.owner_name,
            owner_email: rentalInfo?.owner_email,
            owner_phone: rentalInfo?.owner_phone,
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
    await moderateRoomPostApi(input.room_post_id, input.decision, input.note);
}

export async function listViolationReports(): Promise<ViolationReport[]> {
    try {
        const response = await getReportsRequest({ limit: 100 });
        return response.data.map((r) => {
            // Map report_status_enum (BE) -> ViolationReport.status (FE)
            let status: ViolationReport['status'] = 'open';
            if (r.status === 'APPROVED' || r.status === 'REJECTED') status = 'resolved';
            else if (r.status === 'DISMISSED') status = 'dismissed';

            // Map report_target_type_enum (BE) -> ViolationReport.target_type (FE)
            let target_type: ViolationReport['target_type'] = 'user';
            if (r.targetType === 'ROOM') target_type = 'room_post';
            else if (r.targetType === 'REVIEW') target_type = 'review';
            else if (r.targetType === 'BOOKING') target_type = 'rental';

            // Map action_taken from status
            let action_taken: ViolationReport['action_taken'] | undefined;
            if (r.status === 'APPROVED') action_taken = 'warning';
            else if (r.status === 'DISMISSED') action_taken = 'dismiss_report';
            else if (r.status === 'REJECTED') action_taken = 'remove_content';

            return {
                report_id: r.id,
                reporter_id: r.reporter?.fullName ?? r.reporterId,
                reporter_email: r.reporter?.email,
                reporter_phone: r.reporter?.phone ?? undefined,
                target_user_id: r.targetUser?.fullName ?? r.targetId,
                target_user_name: r.targetUser?.fullName,
                target_user_email: r.targetUser?.email,
                target_user_phone: r.targetUser?.phone ?? undefined,
                target_type,
                target_id: r.targetId,
                category: r.reason as ViolationReport['category'],
                details: r.description ?? '',
                status,
                action_taken,
                created_at: r.createdAt,
                resolved_at: r.reviewedAt ?? undefined,
            } satisfies ViolationReport;
        }).sort((a, b) => {
            if (a.status === b.status) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            if (a.status === 'open') return -1;
            if (b.status === 'open') return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    } catch (err) {
        console.error('Failed to fetch reports from API, falling back to local:', err);
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
}

export async function handleViolationReport(input: HandleReportInput) {
    // Map frontend action -> report_status_enum (BE)
    let backendStatus: Exclude<ReportStatusEnum, 'PENDING'>;
    if (input.action === 'dismiss_report') {
        backendStatus = 'DISMISSED';
    } else if (input.action === 'remove_content' || input.action === 'restrict_content') {
        backendStatus = 'REJECTED';
    } else {
        backendStatus = 'APPROVED';
    }

    try {
        await handleReportRequest(input.report_id, {
            status: backendStatus,
            moderatorNote: input.note?.trim() || undefined,
        });
    } catch (err) {
        console.error('Failed to handle report via API, falling back to local:', err);
        // Fallback to local storage if API fails
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
