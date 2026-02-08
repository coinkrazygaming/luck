import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  verified: boolean;
  kycStatus: "pending" | "approved" | "rejected" | "not_submitted";
  createdAt: Date;
  lastLoginAt: Date | null;
  totalLosses: number;
  jackpotOptIn: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateKYCStatus: (status: User["kycStatus"]) => Promise<void>;
  updateJackpotOptIn: (optIn: boolean) => Promise<void>;
  addLoss: (amount: number) => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("auth_token")
  );

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await fetch("/api/auth/session", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const { user } = await response.json();
            setUser(user);
            localStorage.setItem("coinkrazy_auth_user", JSON.stringify(user));
          } else {
            // Token is invalid, clear it
            setToken(null);
            localStorage.removeItem("auth_token");
          }
        } catch (error) {
          console.error("Session fetch error:", error);
          setToken(null);
          localStorage.removeItem("auth_token");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        setIsLoading(false);
        return false;
      }

      const { user, token } = await response.json();
      setUser(user);
      setToken(token);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("coinkrazy_auth_user", JSON.stringify(user));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);

    if (data.password !== data.confirmPassword) {
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
        }),
      });

      if (!response.ok) {
        setIsLoading(false);
        return false;
      }

      const { user, token } = await response.json();
      setUser(user);
      setToken(token);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("coinkrazy_auth_user", JSON.stringify(user));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Register error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue even if logout request fails
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("coinkrazy_auth_user");
    localStorage.removeItem("coinkrazy_user");
    localStorage.removeItem("coinkrazy_transactions");
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!token) return;

    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
        localStorage.setItem("coinkrazy_auth_user", JSON.stringify(user));
      }
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  const updateKYCStatus = async (status: User["kycStatus"]) => {
    await updateProfile({ kycStatus: status });
  };

  const updateJackpotOptIn = async (optIn: boolean) => {
    await updateProfile({ jackpotOptIn: optIn });
  };

  const addLoss = async (amount: number) => {
    if (!user) return;
    const newLoss = user.totalLosses + amount;
    await updateProfile({ totalLosses: newLoss });
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    login,
    register,
    logout,
    updateProfile,
    updateKYCStatus,
    updateJackpotOptIn,
    addLoss,
    token,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const getAllUsers = async (token: string): Promise<User[]> => {
  try {
    // This would require an admin endpoint - for now return empty array
    // You can implement this when you add admin features
    return [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};
