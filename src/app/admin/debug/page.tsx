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

    const forceFix = async (mode: 'product_only' | 'full_repair' | 'test_insert' | 'promote_admin') => {
        let msg = "Are you sure?";
        let bodyPayload: any = { mode };

        if (mode === 'full_repair') msg = "DANGER: Attempt to create ALL missing tables via Raw SQL?";
        if (mode === 'test_insert') msg = "Attempt to INSERT dummy data (Course/Inventory) to verify DB write access?";
        if (mode === 'product_only') msg = "Attempt to create Product table?";
        if (mode === 'promote_admin') {
            msg = "Grant yourself ADMIN role?";
            // Extract email from status if available to confirm
            const currentEmail = status?.currentUser?.split(',')[0]?.split(': ')[1]?.trim();
            if (currentEmail) {
                msg += `\nTarget Email: ${currentEmail}`;
                bodyPayload.email = currentEmail;
            } else {
                const manualEmail = prompt("Could not auto-detect email. Please enter your email address:");
                if (!manualEmail) return;
                bodyPayload.email = manualEmail;
            }
        }

        if (!confirm(msg)) return;

        setLoading(true);
        try {
            const res = await fetch("/api/admin/debug", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });
            const data = await res.json();
            alert(JSON.stringify(data, null, 2));
            setTimeout(checkStatus, 1000);
        } catch (e) {
            alert("Action failed");
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
                <h2 className="font-bold border-b mb-2">Current Session</h2>
                <div className="text-lg font-mono text-blue-700 bg-white p-2 border rounded">
                    {status.currentUser || 'Loading...'}
                </div>
            </div>

            <div className="bg-slate-100 p-4 rounded">
                <h2 className="font-bold border-b mb-2">Environment</h2>
                <pre className="text-xs overflow-auto">{JSON.stringify(status.env, null, 2)}</pre>
            </div>

            <div className="bg-slate-100 p-4 rounded">
                <h2 className="font-bold border-b mb-2">Database Counts</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>Product Count: <strong>{String(status.counts.products)}</strong></div>
                    <div>Course Count: <strong>{String(status.counts.courses)}</strong></div>
                    <div>Inventory Count: <strong>{String(status.counts.inventory)}</strong></div>
                    <div>User Count: <strong>{String(status.counts.users)}</strong></div>
                </div>
                {status.error && (
                    <div className="mt-4 p-2 bg-red-100 text-red-800 text-sm">
                        DB Error: {status.error}
                    </div>
                )}
            </div>

            <div className="border-t pt-4 space-y-4">
                <h3 className="font-bold">Emergency Actions</h3>

                <div>
                    <p className="text-sm text-slate-600 mb-2">
                        Use this if ONLY Product table is missing (older error).
                    </p>
                    <button
                        onClick={() => forceFix('product_only')}
                        disabled={loading}
                        className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                    >
                        {loading ? "Processing..." : "Fix Product Table Only"}
                    </button>
                </div>

                <div className="border-t pt-4">
                    <p className="text-sm text-red-600 font-bold mb-2">
                        Use this if Course / Inventory tables are missing (Current Issue).
                    </p>
                    <button
                        onClick={() => forceFix('full_repair')}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 w-full font-bold text-lg"
                    >
                        {loading ? "⚠️ REPAIR ALL MISSING TABLES" : "⚠️ REPAIR ALL MISSING TABLES"}
                    </button>
                </div>

                <div className="border-t pt-4">
                    <p className="text-sm text-slate-600 mb-2">
                        Use this to verify if tables are writable.
                    </p>
                    <button
                        onClick={() => forceFix('test_insert')}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 w-full"
                    >
                        {loading ? "Testing..." : "🧪 TEST TABLE WRITES (Insert Dummy Data)"}
                    </button>
                </div>

                <div className="border-t pt-4 pb-8">
                    <p className="text-sm text-purple-600 font-bold mb-2">
                        Fix "Access Denied" by upgrading your role.
                    </p>
                    <button
                        onClick={() => forceFix('promote_admin')}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 w-full font-bold text-lg"
                    >
                        {loading ? "Promoting..." : "👑 GRANT ME ADMIN ROLE"}
                    </button>
                </div>
            </div>

        </div>
    );
}
