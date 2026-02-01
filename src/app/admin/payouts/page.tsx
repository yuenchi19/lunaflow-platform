
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Check, X, Loader2, Download } from "lucide-react";

interface PayoutRequest {
    id: string;
    amount: number;
    status: 'pending' | 'paid' | 'rejected';
    requestedAt: string;
    processedAt?: string;
    note?: string;
    user: {
        id: string;
        name: string;
        email: string;
        bankName: string;
        bankBranch: string;
        bankAccountType: string;
        bankAccountNumber: string;
        bankAccountHolder: string;
    };
}

export default function AdminPayoutsPage() {
    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        const res = await fetch('/api/admin/payouts');
        if (res.ok) {
            setRequests(await res.json());
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, status: 'paid' | 'rejected') => {
        const note = status === 'rejected' ? prompt("Enter rejection reason:") : null;
        if (status === 'rejected' && !note) return;
        if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;

        setProcessingId(id);
        try {
            const res = await fetch('/api/admin/payouts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: id, status, note })
            });
            if (res.ok) {
                fetchRequests();
            } else {
                alert("Failed to update");
            }
        } catch (e) {
            alert("Error");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Payout Requests</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-500 font-bold uppercase">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">User</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Bank Details</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {requests.map(req => (
                            <tr key={req.id} className="hover:bg-slate-50">
                                <td className="p-4 text-slate-500">
                                    {format(new Date(req.requestedAt), 'yyyy-MM-dd HH:mm')}
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{req.user.name}</div>
                                    <div className="text-xs text-slate-500">{req.user.email}</div>
                                </td>
                                <td className="p-4 font-mono font-bold text-slate-800">
                                    ¥{req.amount.toLocaleString()}
                                </td>
                                <td className="p-4 text-xs text-slate-600">
                                    <div>{req.user.bankName} {req.user.bankBranch}</div>
                                    <div>{req.user.bankAccountType === 'ordinary' ? '普通' : '当座'} {req.user.bankAccountNumber}</div>
                                    <div>{req.user.bankAccountHolder}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            req.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {req.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {req.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(req.id, 'paid')}
                                                disabled={!!processingId}
                                                className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100 border border-green-200"
                                                title="Mark as Paid"
                                            >
                                                {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'rejected')}
                                                disabled={!!processingId}
                                                className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-200"
                                                title="Reject"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">No requests found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
