
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
          <h2 className="mb-4 text-2xl font-bold">Critical Error</h2>
          <p className="mb-6 text-gray-500">Global application error occurred.</p>
          <button
            onClick={() => reset()}
            className="rounded bg-blue-600 px-4 py-2 font-bold text-white"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
