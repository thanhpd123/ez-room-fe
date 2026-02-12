import { useEffect, useMemo, useState } from 'react';
import { handleViolationReport, listViolationReports } from '../shared/moderator-storage';
import type { ReportAction, ReportStatus, ViolationReport } from '../shared/types';

const statusBadgeClass: Record<ReportStatus, string> = {
    open: 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    dismissed: 'bg-slate-200 text-slate-700',
};

const statusLabel: Record<ReportStatus, string> = {
    open: 'Open',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
};

const actionLabel: Record<ReportAction, string> = {
    warning: 'Warning user',
    remove_content: 'Remove content',
    restrict_content: 'Restrict content',
    suspend_user: 'Suspend user',
    dismiss_report: 'Dismiss report',
};

function formatDateTime(dateString?: string) {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function HandleReportsPage() {
    const [reports, setReports] = useState<ViolationReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('open');
    const [selectedId, setSelectedId] = useState('');
    const [action, setAction] = useState<ReportAction>('warning');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const data = await listViolationReports();
        setReports(data);
        setSelectedId((current) => current || data[0]?.report_id || '');
        setIsLoading(false);
    };

    useEffect(() => {
        void loadData();
    }, []);

    const filteredReports = useMemo(() => {
        if (statusFilter === 'all') return reports;
        return reports.filter((item) => item.status === statusFilter);
    }, [reports, statusFilter]);

    useEffect(() => {
        if (filteredReports.length === 0) {
            setSelectedId('');
            return;
        }
        const exists = filteredReports.some((item) => item.report_id === selectedId);
        if (!exists) {
            setSelectedId(filteredReports[0].report_id);
        }
    }, [filteredReports, selectedId]);

    const selectedReport = filteredReports.find((item) => item.report_id === selectedId) ?? null;
    const isReportOpen = selectedReport?.status === 'open';

    const onHandleReport = async () => {
        if (!selectedReport || !isReportOpen) return;
        setIsSubmitting(true);
        await handleViolationReport({
            report_id: selectedReport.report_id,
            action,
            note,
            moderator_id: 'moderator-demo',
        });
        setNote('');
        await loadData();
        setIsSubmitting(false);
    };

    return (
        <section className="mx-auto w-full max-w-7xl py-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">Handle Reports</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Review violation reports and apply moderation actions.
                </p>
            </header>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Filter by status</label>
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | ReportStatus)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 md:w-72"
                >
                    <option value="all">All status</option>
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                </select>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Loading reports...
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-2">
                        {filteredReports.length === 0 ? (
                            <p className="p-4 text-sm text-slate-600">No report found for current filter.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {filteredReports.map((report) => (
                                    <li key={report.report_id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(report.report_id)}
                                            className={`w-full px-4 py-3 text-left transition ${
                                                selectedId === report.report_id ? 'bg-slate-50' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-medium text-slate-900">{report.category}</p>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass[report.status]}`}
                                                >
                                                    {statusLabel[report.status]}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Target: {report.target_type} ({report.target_id})
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Submitted: {formatDateTime(report.created_at)}
                                            </p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        {!selectedReport ? (
                            <p className="text-sm text-slate-600">Select a report to inspect details.</p>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {selectedReport.category}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-600">{selectedReport.details}</p>
                                </div>

                                <dl className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Reporter</dt>
                                        <dd className="font-medium">{selectedReport.reporter_id}</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Target user</dt>
                                        <dd className="font-medium">{selectedReport.target_user_id}</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Status</dt>
                                        <dd className="font-medium">{statusLabel[selectedReport.status]}</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Resolved at</dt>
                                        <dd className="font-medium">{formatDateTime(selectedReport.resolved_at)}</dd>
                                    </div>
                                </dl>

                                {selectedReport.action_taken ? (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs text-slate-500">Action taken</p>
                                        <p className="mt-1 text-sm text-slate-700">
                                            {actionLabel[selectedReport.action_taken]}
                                        </p>
                                    </div>
                                ) : null}

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Moderator action
                                    </label>
                                    <select
                                        value={action}
                                        onChange={(event) => setAction(event.target.value as ReportAction)}
                                        disabled={!isReportOpen}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100"
                                    >
                                        <option value="warning">Warning user</option>
                                        <option value="remove_content">Remove content</option>
                                        <option value="restrict_content">Restrict content</option>
                                        <option value="suspend_user">Suspend user</option>
                                        <option value="dismiss_report">Dismiss report</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Moderator note
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                        rows={3}
                                        placeholder="Optional case investigation notes"
                                        disabled={!isReportOpen}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100"
                                    />
                                </div>

                                <button
                                    type="button"
                                    disabled={!isReportOpen || isSubmitting}
                                    onClick={onHandleReport}
                                    className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
                                >
                                    {isReportOpen ? 'Apply action' : 'Report already processed'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
