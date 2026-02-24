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
    localStorage.getItem("coinkrazy_auth_token")
  );

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem("coinkrazy_auth_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/session", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const { user } = await response.json();
          setUser({
            ...user,
            createdAt: new Date(user.created_at),
            lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : null,
          });
          setToken(storedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem("coinkrazy_auth_token");
          setToken(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

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

      const { session, user: userData } = await response.json();
      
      const mappedUser: User = {
        ...userData,
        createdAt: new Date(userData.created_at),
        lastLoginAt: userData.last_login_at ? new Date(userData.last_login_at) : null,
      };

      setUser(mappedUser);
      setToken(session.access_token);
      localStorage.setItem("coinkrazy_auth_token", session.access_token);
      localStorage.setItem("coinkrazy_auth_user", JSON.stringify(mappedUser));

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("[Login] Exception:", error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    if (data.password !== data.confirmPassword) return false;
    
    setIsLoading(true);
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

      const { session, user: userData } = await response.json();
      
      const mappedUser: User = {
        ...userData,
        createdAt: new Date(userData.created_at),
        lastLoginAt: userData.last_login_at ? new Date(userData.last_login_at) : null,
      };

      setUser(mappedUser);
      setToken(session.access_token);
      localStorage.setItem("coinkrazy_auth_token", session.access_token);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Registration exception:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("coinkrazy_auth_token");
    localStorage.removeItem("coinkrazy_auth_user");
    localStorage.removeItem("coinkrazy_auth_session");
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user || !token) return;

    try {
      // In a real app, you'd have an /api/auth/profile update endpoint
      // For now, we update local state and you might want to implement the backend part
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("coinkrazy_auth_user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error updating profile:", error);
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

export const useAuthSafe = () => {
  const context = useContext(AuthContext);
  return context;
};
