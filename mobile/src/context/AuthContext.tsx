import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, TokenResponse } from "../types";
import { mobileApi } from "../services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          const profile = await mobileApi.getProfile();
          setUser(profile);
        }
      } catch {
        await AsyncStorage.removeItem("auth_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      await mobileApi.login(credentials);
      const profile = await mobileApi.getProfile();
      setUser(profile);
      await AsyncStorage.setItem("auth_user", JSON.stringify(profile));
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; full_name: string }) => {
    setLoading(true);
    try {
      await mobileApi.register(data);
      const profile = await mobileApi.getProfile();
      setUser(profile);
      await AsyncStorage.setItem("auth_user", JSON.stringify(profile));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await mobileApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
