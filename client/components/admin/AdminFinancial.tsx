import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Check,
  X,
  Plus,
  Minus,
} from "lucide-react";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  processed_at: string;
  email?: string;
  name?: string;
}

interface FinancialSummary {
  totalUsers: number;
  totalBalance: number;
  pendingWithdrawals: number;
}

interface AdminFinancialProps {
  token: string | null;
}

export function AdminFinancial({ token }: AdminFinancialProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isProcessingDialog, setIsProcessingDialog] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    userId: "",
    goldCoins: 0,
    sweepCoins: 0,
    realMoney: 0,
  });
  const [revenueReport, setRevenueReport] = useState({
    revenue: 0,
    payouts: 0,
    bonuses: 0,
    netRevenue: 0,
    margin: 0,
  });

  useEffect(() => {
    if (token) {
      loadFinancialData();
    }
  }, [token]);

  const loadFinancialData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const [summaryRes, transactionsRes, withdrawalsRes, revenueRes] = await Promise.all([
        fetch("/api/admin/financial-summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/withdrawals", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/revenue-report", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions);
      }

      if (withdrawalsRes.ok) {
        const data = await withdrawalsRes.json();
        setWithdrawals(data.withdrawals);
      }

      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenueReport(data.report);
      }
    } catch (error) {
      console.error("Failed to load financial data:", error);
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const approveWithdrawal = async (withdrawalId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Withdrawal approved");
        loadFinancialData();
        setIsProcessingDialog(false);
      } else {
        toast.error("Failed to approve withdrawal");
      }
    } catch (error) {
      console.error("Failed to approve withdrawal:", error);
      toast.error("Error approving withdrawal");
    }
  };

  const rejectWithdrawal = async (withdrawalId: string) => {
    if (!token) return;

    if (!window.confirm("Reject this withdrawal?")) return;

    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: "Rejected by admin" }),
      });

      if (response.ok) {
        toast.success("Withdrawal rejected");
        loadFinancialData();
      } else {
        toast.error("Failed to reject withdrawal");
      }
    } catch (error) {
      console.error("Failed to reject withdrawal:", error);
      toast.error("Error rejecting withdrawal");
    }
  };

  const adjustUserBalance = async () => {
    if (!token || !adjustmentData.userId) {
      toast.error("User ID is required");
      return;
    }

    const totalChange =
      adjustmentData.goldCoins + adjustmentData.sweepCoins + adjustmentData.realMoney;
    if (totalChange === 0) {
      toast.error("Enter an amount to adjust");
      return;
    }

    try {
      const response = await fetch(`/api/admin/balances/${adjustmentData.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goldCoins: adjustmentData.goldCoins,
          sweepCoins: adjustmentData.sweepCoins,
          realMoney: adjustmentData.realMoney,
        }),
      });

      if (response.ok) {
        toast.success("Balance adjusted successfully");
        setAdjustmentData({
          userId: "",
          goldCoins: 0,
          sweepCoins: 0,
          realMoney: 0,
        });
        loadFinancialData();
      } else {
        toast.error("Failed to adjust balance");
      }
    } catch (error) {
      console.error("Failed to adjust balance:", error);
      toast.error("Error adjusting balance");
    }
  };

  if (loading && !summary) {
    return <div className="text-center py-8">Loading financial data...</div>;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="adjustments">Balance Adjustment</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                ${revenueReport.revenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Total Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                ${revenueReport.payouts.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Net Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenueReport.netRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {revenueReport.margin.toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-500" />
                Pending Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                ${summary?.pendingWithdrawals.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Total Users</div>
                <div className="text-3xl font-bold">{summary?.totalUsers || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Balance</div>
                <div className="text-3xl font-bold">
                  ${summary?.totalBalance.toFixed(2) || "0.00"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Average Balance</div>
                <div className="text-3xl font-bold">
                  $
                  {summary && summary.totalUsers > 0
                    ? (summary.totalBalance / summary.totalUsers).toFixed(2)
                    : "0.00"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={loadFinancialData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </TabsContent>

      {/* Withdrawals Tab */}
      <TabsContent value="withdrawals" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Requests</CardTitle>
            <CardDescription>Manage pending withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No withdrawals
                      </TableCell>
                    </TableRow>
                  ) : (
                    withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{withdrawal.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {withdrawal.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          ${withdrawal.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{withdrawal.payment_method}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              withdrawal.status === "approved"
                                ? "default"
                                : withdrawal.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={isProcessingDialog && selectedWithdrawal?.id === withdrawal.id} onOpenChange={setIsProcessingDialog}>
                            <DialogTrigger asChild>
                              {withdrawal.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedWithdrawal(withdrawal)}
                                >
                                  Process
                                </Button>
                              )}
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Process Withdrawal</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>User: {withdrawal.name}</Label>
                                  <p className="text-sm text-muted-foreground">{withdrawal.email}</p>
                                </div>
                                <div>
                                  <Label>Amount: ${withdrawal.amount.toFixed(2)}</Label>
                                </div>
                                <div>
                                  <Label>Payment Method: {withdrawal.payment_method}</Label>
                                </div>
                              </div>
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    rejectWithdrawal(withdrawal.id);
                                  }}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => {
                                    approveWithdrawal(withdrawal.id);
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Transactions Tab */}
      <TabsContent value="transactions" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All financial transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No transactions
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Badge variant="outline">{transaction.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              transaction.amount > 0 ? "text-green-600" : "text-red-600"
                            }
                          >
                            {transaction.amount > 0 ? "+" : ""}${transaction.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <Badge>{transaction.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Balance Adjustment Tab */}
      <TabsContent value="adjustments" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Adjust User Balance</CardTitle>
            <CardDescription>Add or remove currency from user accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="Enter user UUID"
                value={adjustmentData.userId}
                onChange={(e) =>
                  setAdjustmentData({ ...adjustmentData, userId: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="goldCoins">Gold Coins</Label>
                <Input
                  id="goldCoins"
                  type="number"
                  placeholder="Amount"
                  value={adjustmentData.goldCoins}
                  onChange={(e) =>
                    setAdjustmentData({
                      ...adjustmentData,
                      goldCoins: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="sweepCoins">Sweep Coins</Label>
                <Input
                  id="sweepCoins"
                  type="number"
                  placeholder="Amount"
                  value={adjustmentData.sweepCoins}
                  onChange={(e) =>
                    setAdjustmentData({
                      ...adjustmentData,
                      sweepCoins: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="realMoney">Real Money</Label>
                <Input
                  id="realMoney"
                  type="number"
                  placeholder="Amount"
                  value={adjustmentData.realMoney}
                  onChange={(e) =>
                    setAdjustmentData({
                      ...adjustmentData,
                      realMoney: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <Button onClick={adjustUserBalance} className="w-full">
              Apply Adjustment
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
