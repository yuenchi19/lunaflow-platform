"use client";

import { useState, useEffect } from "react";

export default function DebugPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/debug");
            const data = await res.json();
            setStatus(data);
        } catch (e) {
            console.error(e);
            alert("Check failed");
        } finally {
            setLoading(false);
        }
    };

    const forceFix = async () => {
        if (!confirm("Attempt to create missing Product table via Raw SQL?")) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/debug", { method: "POST" });
            const data = await res.json();
            alert(JSON.stringify(data, null, 2));
            checkStatus(); // Refresh
        } catch (e) {
            alert("Fix failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    if (!status) return <div className="p-10">Loading debug info...</div>;

    return (
        <div className="p-10 max-w-4xl mx-auto bg-white text-slate-900 border space-y-6">
            <h1 className="text-2xl font-bold text-red-600">Admin Debug Console</h1>

            <div className="bg-slate-100 p-4 rounded">
                <h2 className="font-bold border-b mb-2">Environment</h2>
                <pre className="text-xs overflow-auto">{JSON.stringify(status.env, null, 2)}</pre>
            </div>

            <div className="bg-slate-100 p-4 rounded">
                <h2 className="font-bold border-b mb-2">Database Counts</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>Product Count: <strong>{status.counts.products}</strong></div>
                    <div>Course Count: <strong>{status.counts.courses}</strong></div>
                    <div>User Count: <strong>{status.counts.users}</strong></div>
                </div>
                {status.error && (
                    <div className="mt-4 p-2 bg-red-100 text-red-800 text-sm">
                        DB Error: {status.error}
                    </div>
                )}
            </div>

            <div className="border-t pt-4">
                <h3 className="font-bold">Emergency Actions</h3>
                <p className="text-sm text-slate-600 mb-4">
                    If "Product Count" shows error or "Table not found", click below to force table creation.
                </p>
                <button
                    onClick={forceFix}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Force Create Product Table (SQL)"}
                </button>
            </div>
        </div>
    );
}
