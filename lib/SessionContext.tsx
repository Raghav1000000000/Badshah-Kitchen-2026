"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSessionId, clearSession as clearStoredSession } from "./session";

type SessionContextType = {
  sessionId: string;
  isLoading: boolean;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize session on component mount (app load)
    // This runs ONCE when the app first loads
    // 
    // BEHAVIOR:
    // 1. If session_id exists in localStorage → reuses it
    // 2. If session_id missing → generates new UUID and stores it
    // 
    // This ensures session_id is created once and persists across:
    // - Page refreshes
    // - Navigation between routes
    // - Component remounts
    // 
    // Until explicitly cleared by logout
    const id = getSessionId();
    setSessionId(id);
    setIsLoading(false);
  }, []);

  const clearSession = () => {
    // Clear session wrapper function
    // 
    // WHAT THIS DOES:
    // 1. Calls clearStoredSession() → removes session_id from localStorage
    // 2. Calls getSessionId() → generates NEW session_id and stores it
    // 3. Updates state with new session_id
    // 
    // WHY NEW SESSION CLEARS ORDER HISTORY:
    // - Orders table has session_id foreign key
    // - Orders query: SELECT * FROM orders WHERE session_id = current_session
    // - New session_id = different value = no matching orders
    // - Previous orders still exist in DB but aren't visible
    // 
    // Note: In current flow, logout actually reloads the page,
    // so this function completes but then page reloads anyway
    clearStoredSession();
    const newId = getSessionId();
    setSessionId(newId);
  };

  return (
    <SessionContext.Provider value={{ sessionId, isLoading, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to access session data in any client component
 * @example
 * const { sessionId, isLoading, clearSession } = useSession();
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
