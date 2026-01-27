/**
 * Example: How to use the session helper in any component
 */

"use client";

import { useSession } from "@/lib/SessionContext";

export default function SessionExample() {
  const { sessionId, isLoading, clearSession } = useSession();

  // You can now use this session_id for:
  // - Tracking orders
  // - Analytics
  // - Personalization
  // - Cart persistence across page reloads

  if (isLoading) {
    return <div className="p-4 bg-gray-100 rounded-lg">Loading session...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-semibold mb-2">Session Info</h3>
      <p className="text-sm text-gray-600 mb-2">
        Session ID: <code className="bg-white px-2 py-1 rounded">{sessionId}</code>
      </p>
      <button
        onClick={clearSession}
        className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
      >
        Clear Session
      </button>
    </div>
  );
}
