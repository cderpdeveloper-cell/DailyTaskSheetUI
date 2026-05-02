import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types/api.types";
import Cookies from "js-cookie";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
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
        Cookies.set("accessToken", accessToken);
        Cookies.set("refreshToken", refreshToken);
        set({ user, isAuthenticated: true, accessToken, refreshToken });
      },
      updateUser: (user) => set({ user }),
      logout: () => {
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
