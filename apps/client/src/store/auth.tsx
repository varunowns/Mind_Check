import { createContext, useContext, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import type { User } from "@mindcheck/shared";
import { api } from "../lib/api";
import { storage } from "../lib/storage";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setSession: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = storage.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api.me().then((response) => setUser(response.user)).catch(() => storage.setToken(null)).finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setSession: (token, nextUser) => {
          storage.setToken(token);
          setUser(nextUser);
        },
        updateUser: (nextUser) => setUser(nextUser),
        logout: () => {
          storage.setToken(null);
          setUser(null);
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
