
"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <h2 className="mb-4 text-2xl font-bold text-slate-800">Something went wrong!</h2>
            <p className="mb-6 text-slate-500">{error.message || "An unexpected error occurred."}</p>
            <button
                onClick={() => reset()}
                className="rounded-lg bg-indigo-600 px-6 py-2 font-bold text-white hover:bg-indigo-700"
            >
                Try again
            </button>
        </div>
    );
}
