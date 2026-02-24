import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuthSafe } from "./AuthContext";

export enum CurrencyType {
  GC = "GC", // Gold Coins (fun play)
  SC = "SC", // Sweep Coins (real money)
}

export interface UserBalance {
  goldCoins: number;
  sweepCoins: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  balance: UserBalance;
  isNewUser: boolean;
  lastDailySpinClaim: Date | null;
  totalWagered: {
    goldCoins: number;
    sweepCoins: number;
  };
  totalWon: {
    goldCoins: number;
    sweepCoins: number;
  };
  verified: boolean;
  level: number;
}

export interface Transaction {
  id: string;
  type: "win" | "wager" | "bonus" | "deposit" | "withdrawal";
  currency: CurrencyType;
  amount: number;
  description: string;
  timestamp: Date;
  gameType?: string;
}

interface CurrencyContextType {
  user: UserProfile | null;
  selectedCurrency: CurrencyType;
  setSelectedCurrency: (currency: CurrencyType) => void;
  updateBalance: (
    currency: CurrencyType,
    amount: number,
    description: string,
    type?: "win" | "wager" | "bonus",
  ) => Promise<void>;
  canAffordWager: (currency: CurrencyType, amount: number) => boolean;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "timestamp">,
  ) => Promise<void>;
  getTransactionHistory: () => Transaction[];
  claimWelcomeBonus: () => Promise<void>;
  canClaimDailySpin: () => boolean;
  claimDailySpin: () => Promise<void>;
  initializeUser: (userData: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const authContext = useAuthSafe();
  const authUser = authContext?.user || null;
  const token = authContext?.token || null;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(
    CurrencyType.GC,
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user balance and transactions from local API
  const loadUserData = useCallback(async () => {
    if (!authUser || !token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch user balance
      const balanceResponse = await fetch(`/api/balance?userId=${authUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const balanceData = balanceResponse.ok ? (await balanceResponse.json()).balance : null;

      // Fetch transactions
      const transResponse = await fetch(`/api/transactions?userId=${authUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const transData = transResponse.ok ? (await transResponse.json()).transactions : [];

      // Build user profile
      const profile: UserProfile = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name || "",
        balance: {
          goldCoins: balanceData?.goldCoins || 0,
          sweepCoins: balanceData?.sweepCoins || 0,
        },
        isNewUser: !balanceData?.goldCoins,
        lastDailySpinClaim: null, // Would need a profile endpoint to get this
        totalWagered: { goldCoins: 0, sweepCoins: 0 },
        totalWon: { goldCoins: 0, sweepCoins: 0 },
        verified: authUser.verified || false,
        level: 1,
      };

      setUser(profile);

      // Convert transactions
      const mappedTransactions: Transaction[] = (transData || []).map(
        (t: any) => ({
          id: t.id,
          type: t.type,
          currency: t.currency,
          amount: parseFloat(t.amount),
          description: t.description,
          timestamp: new Date(t.created_at),
          gameType: t.metadata?.gameId,
        }),
      );

      setTransactions(mappedTransactions);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authUser, token]);

  // Load data when auth user changes
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const updateBalance = useCallback(
    async (
      currency: CurrencyType,
      amount: number,
      description: string,
      type: "win" | "wager" | "bonus" = "win",
    ) => {
      if (!authUser || !token || !user) return;

      try {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: authUser.id,
            type,
            currency,
            amount,
            description,
          }),
        });

        if (response.ok) {
          const { newBalance } = await response.json();
          
          // Update local state
          setUser((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              balance: {
                ...prev.balance,
                [currency === CurrencyType.GC ? "goldCoins" : "sweepCoins"]:
                  newBalance,
              },
            };
          });

          // Reload transactions
          await loadUserData();
        }
      } catch (error) {
        console.error("Error updating balance:", error);
      }
    },
    [authUser, token, user, loadUserData],
  );

  const canAffordWager = (currency: CurrencyType, amount: number): boolean => {
    if (!user) return false;

    if (currency === CurrencyType.GC) {
      return user.balance.goldCoins >= amount;
    } else {
      return user.balance.sweepCoins >= amount;
    }
  };

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, "id" | "timestamp">) => {
      if (!authUser || !token) return;

      try {
        await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: authUser.id,
            ...transaction,
          }),
        });

        // Reload transactions
        await loadUserData();
      } catch (error) {
        console.error("Error adding transaction:", error);
      }
    },
    [authUser, token, loadUserData],
  );

  const getTransactionHistory = (): Transaction[] => {
    return transactions;
  };

  const claimWelcomeBonus = useCallback(async () => {
    if (!user || !user.isNewUser || !authUser || !token) return;

    try {
      await updateBalance(
        CurrencyType.GC,
        10000,
        "Welcome Bonus - Gold Coins",
        "bonus",
      );
      await updateBalance(
        CurrencyType.SC,
        10,
        "Welcome Bonus - Sweep Coins",
        "bonus",
      );
    } catch (error) {
      console.error("Error claiming welcome bonus:", error);
    }
  }, [user, authUser, token, updateBalance]);

  const canClaimDailySpin = (): boolean => {
    if (!user) return false;

    if (!user.lastDailySpinClaim) return true;

    const now = new Date();
    const lastClaim = new Date(user.lastDailySpinClaim);
    const timeDiff = now.getTime() - lastClaim.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    return hoursDiff >= 24;
  };

  const claimDailySpin = useCallback(async () => {
    if (!user || !canClaimDailySpin() || !authUser || !token) return;

    try {
      // In a real app, you'd have an endpoint to update last_daily_spin_claim in DB
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, lastDailySpinClaim: new Date() };
      });
    } catch (error) {
      console.error("Error claiming daily spin:", error);
    }
  }, [user, authUser, token, canClaimDailySpin]);

  const initializeUser = (userData: Partial<UserProfile>) => {
    if (!user) {
      setUser({
        id: userData.id || "",
        email: userData.email || "",
        name: userData.name || "",
        balance: userData.balance || { goldCoins: 0, sweepCoins: 0 },
        isNewUser: userData.isNewUser !== false,
        lastDailySpinClaim: userData.lastDailySpinClaim || null,
        totalWagered: userData.totalWagered || { goldCoins: 0, sweepCoins: 0 },
        totalWon: userData.totalWon || { goldCoins: 0, sweepCoins: 0 },
        verified: userData.verified || false,
        level: userData.level || 1,
      });
    } else {
      setUser((prev) => (prev ? { ...prev, ...userData } : null));
    }
  };

  const contextValue: CurrencyContextType = {
    user,
    selectedCurrency,
    setSelectedCurrency,
    updateBalance,
    canAffordWager,
    addTransaction,
    getTransactionHistory,
    claimWelcomeBonus,
    canClaimDailySpin,
    claimDailySpin,
    initializeUser,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

// Safe version of useCurrency that returns null if not available
export const useCurrencySafe = () => {
  const context = useContext(CurrencyContext);
  return context;
};

// Utility functions
export const formatCurrency = (
  amount: number,
  currency: CurrencyType,
): string => {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: currency === CurrencyType.SC ? 2 : 0,
    maximumFractionDigits: currency === CurrencyType.SC ? 2 : 0,
  });

  return `${formatted} ${currency}`;
};

export const getCurrencyColor = (currency: CurrencyType): string => {
  return currency === CurrencyType.GC ? "text-gold" : "text-teal";
};

export const getCurrencyIcon = (currency: CurrencyType): string => {
  return currency === CurrencyType.GC ? "🪙" : "💎";
};
