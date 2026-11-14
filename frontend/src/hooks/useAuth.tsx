import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getToken, setToken } from "@/services/api";
import type { User } from "@/types";

interface AuthState {
  user: User | undefined;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(() => getToken());

  // BUG-AUTH-0006: Synchronize authentication state across multiple browser tabs
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "km_token") {
        const next = event.newValue;
        setTokenState(next);
        if (!next) {
          queryClient.clear();
        } else {
          queryClient.invalidateQueries({ queryKey: ["me"] });
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [queryClient]);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    enabled: Boolean(token),
    retry: false,
  });

  const value = useMemo<AuthState>(
    () => ({
      user: me.data,
      loading: Boolean(token) && me.isLoading,
      login: async (next: string) => {
        setToken(next);
        setTokenState(next);
        await queryClient.invalidateQueries({ queryKey: ["me"] });
      },
      logout: async () => {
        try {
          await api.logout();
        } catch {
          /* The local session is cleared even if the server token is already gone. */
        }
        setToken(null);
        setTokenState(null);
        queryClient.clear();
      },
    }),
    [me.data, me.isLoading, queryClient, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing");
  return value;
}
