'use client';

/**
 * Client-side usage demo.
 * In the browser, only variables prefixed with NEXT_PUBLIC_ are accessible.
 */
export default function DemoEnvPage() {
  const publicApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Environment Variable Demo</h1>
      
      <section className="p-4 border rounded bg-slate-50 dark:bg-slate-900">
        <h2 className="text-xl font-semibold mb-2">Public Access (NEXT_PUBLIC_)</h2>
        <p>API Base URL: <code className="bg-blue-100 dark:bg-blue-900 px-2 rounded">{publicApiUrl || "Not Found"}</code></p>
        <p className="text-sm text-gray-500 mt-2 italic">Safe for the browser.</p>
      </section>

      <section className="p-4 border rounded bg-amber-50 dark:bg-amber-950">
        <h2 className="text-xl font-semibold mb-2">Private Keys (Protected)</h2>
        <p>The code no longer even tries to import private keys on the client. Check <code>src/utils/env.server.ts</code> for how keys are handled securely.</p>
        <p className="text-sm text-gray-500 mt-2 italic">This follows Next.js security best practices by never bundling secrets.</p>
      </section>
    </div>
  );
}
