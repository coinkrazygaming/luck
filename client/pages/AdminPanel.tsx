import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  Users,
  DollarSign,
  Trophy,
  Gamepad2,
  BarChart3,
  Settings,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { AdminFinancial } from "@/components/admin/AdminFinancial";
import { AdminTournaments } from "@/components/admin/AdminTournaments";
import { AdminGames } from "@/components/admin/AdminGames";
import { AdminSettings } from "@/components/admin/AdminSettings";

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  activeToday: number;
  newUsersWeek: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  activeTournaments: number;
  totalGames: number;
}

export default function AdminPanel() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (token) {
      loadStats();
    }
  }, [token]);

  const loadStats = async () => {
    if (!token) return;
    setLoadingStats(true);

    try {
      const [adminRes, dashRes] = await Promise.all([
        fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let userData = {
        totalUsers: 0,
        verifiedUsers: 0,
        activeToday: 0,
        newUsersWeek: 0,
      };

      let financialData = {
        totalRevenue: 0,
        pendingWithdrawals: 0,
      };

      let gameData = {
        totalGames: 0,
      };

      let tournamentData = {
        activeTournaments: 0,
      };

      if (adminRes.ok) {
        const data = await adminRes.json();
        userData = data;
      }

      if (dashRes.ok) {
        const data = await dashRes.json();
        financialData = {
          totalRevenue: 0,
          pendingWithdrawals: data.summary?.pendingWithdrawals || 0,
        };
        userData = {
          ...userData,
          activeToday: data.summary?.activeUsers || 0,
          newUsersWeek: data.summary?.newUsersToday || 0,
        };
      }

      setStats({
        ...userData,
        ...financialData,
        ...gameData,
        ...tournamentData,
      } as AdminStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
      toast.error("Failed to load admin stats");
    } finally {
      setLoadingStats(false);
    }
  };

  if (!user) {
    return <div className="text-center py-8">Not authorized</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold gradient-text flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Dashboard
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Complete casino management system
            </p>
          </div>
          <Button onClick={loadStats} disabled={loadingStats}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loadingStats ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.verifiedUsers} verified
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  ${stats.totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Total earnings</p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Pending Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  ${stats.pendingWithdrawals.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">To be processed</p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Active Tournaments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTournaments}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="financial">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="tournaments">
              <Trophy className="h-4 w-4 mr-2" />
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="games">
              <Gamepad2 className="h-4 w-4 mr-2" />
              Games
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                    <span>Total Users</span>
                    <Badge>{stats?.totalUsers || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                    <span>Verified Users</span>
                    <Badge variant="default">{stats?.verifiedUsers || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                    <span>Active Today</span>
                    <Badge variant="outline">{stats?.activeToday || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                    <span>New This Week</span>
                    <Badge>{stats?.newUsersWeek || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      Database
                    </span>
                    <span className="text-sm text-green-700">Connected</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      API Server
                    </span>
                    <span className="text-sm text-green-700">Running</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      Total Games
                    </span>
                    <Badge variant="outline">{stats?.totalGames || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      Active Tournaments
                    </span>
                    <Badge variant="outline">
                      {stats?.activeTournaments || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span>Admin Email</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span>Admin Name</span>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span>Status</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span>Last Login</span>
                    <span className="font-medium">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Today"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <AdminUserManagement token={token} />
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <AdminFinancial token={token} />
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-6">
            <AdminTournaments token={token} />
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <AdminGames token={token} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
