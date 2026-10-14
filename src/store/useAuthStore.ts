import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types/api.types";
import Cookies from "js-cookie";

// 12 hours token expiry helper (12 hours from now)
const get12HoursExpiry = () => new Date(Date.now() + 12 * 60 * 60 * 1000);

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setAuth: (user, accessToken, refreshToken) => {
        Cookies.set("accessToken", accessToken, { expires: get12HoursExpiry(), path: "/" });
        Cookies.set("refreshToken", refreshToken, { expires: get12HoursExpiry(), path: "/" });
        set({ user, isAuthenticated: true, accessToken, refreshToken });
      },
      setTokens: (accessToken, refreshToken) => {
        Cookies.set("accessToken", accessToken, { expires: get12HoursExpiry(), path: "/" });
        Cookies.set("refreshToken", refreshToken, { expires: get12HoursExpiry(), path: "/" });
        set({ accessToken, refreshToken });
      },
      updateUser: (user) => set({ user }),
      logout: () => {
        Cookies.remove("accessToken", { path: "/" });
        Cookies.remove("refreshToken", { path: "/" });
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Sync cookies with 12 hours expiry on rehydration if missing
        if (state?.accessToken && !Cookies.get("accessToken")) {
          Cookies.set("accessToken", state.accessToken, { expires: get12HoursExpiry(), path: "/" });
        }
        if (state?.refreshToken && !Cookies.get("refreshToken")) {
          Cookies.set("refreshToken", state.refreshToken, { expires: get12HoursExpiry(), path: "/" });
        }
      },
    }
  )
);
