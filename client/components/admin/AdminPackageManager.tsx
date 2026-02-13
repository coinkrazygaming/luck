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
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Gift,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  TrendingUp,
  DollarSign,
} from "lucide-react";

interface Package {
  id: string;
  name: string;
  gold_coins: number;
  bonus_sweep_coins: number;
  price: number;
  original_price: number;
  icon: string;
  color: string;
  is_popular: boolean;
  is_best_value: boolean;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface AdminPackageManagerProps {
  token: string | null;
}

export function AdminPackageManager({ token }: AdminPackageManagerProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    topPackages: [],
  });

  const [formData, setFormData] = useState({
    name: "",
    goldCoins: 0,
    bonusSweepCoins: 0,
    price: 0,
    originalPrice: 0,
    icon: "Gift",
    color: "from-blue-500 to-blue-600",
    isPopular: false,
    isBestValue: false,
    features: "",
    isActive: true,
    displayOrder: 0,
  });

  useEffect(() => {
    if (token) {
      loadPackages();
      loadStats();
    }
  }, [token]);

  const loadPackages = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await fetch("/api/admin/packages", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages);
      } else {
        toast.error("Failed to load packages");
      }
    } catch (error) {
      console.error("Failed to load packages:", error);
      toast.error("Error loading packages");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/admin/packages/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const parseFeatures = (featuresString: string): string[] => {
    return featuresString
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  };

  const createPackage = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/admin/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          goldCoins: formData.goldCoins,
          bonusSweepCoins: formData.bonusSweepCoins,
          price: formData.price,
          originalPrice: formData.originalPrice || null,
          icon: formData.icon,
          color: formData.color,
          isPopular: formData.isPopular,
          isBestValue: formData.isBestValue,
          features: parseFeatures(formData.features),
          displayOrder: formData.displayOrder,
        }),
      });

      if (response.ok) {
        toast.success("Package created");
        setIsCreateDialogOpen(false);
        resetForm();
        loadPackages();
        loadStats();
      } else {
        toast.error("Failed to create package");
      }
    } catch (error) {
      console.error("Failed to create package:", error);
      toast.error("Error creating package");
    }
  };

  const updatePackage = async () => {
    if (!token || !selectedPackage) return;

    try {
      const response = await fetch(
        `/api/admin/packages/${selectedPackage.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            goldCoins: formData.goldCoins,
            bonusSweepCoins: formData.bonusSweepCoins,
            price: formData.price,
            originalPrice: formData.originalPrice || null,
            icon: formData.icon,
            color: formData.color,
            isPopular: formData.isPopular,
            isBestValue: formData.isBestValue,
            features: parseFeatures(formData.features),
            isActive: formData.isActive,
            displayOrder: formData.displayOrder,
          }),
        },
      );

      if (response.ok) {
        toast.success("Package updated");
        setIsEditDialogOpen(false);
        loadPackages();
        loadStats();
      } else {
        toast.error("Failed to update package");
      }
    } catch (error) {
      console.error("Failed to update package:", error);
      toast.error("Error updating package");
    }
  };

  const deletePackage = async (packageId: string) => {
    if (!token) return;

    if (!window.confirm("Delete this package?")) return;

    try {
      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Package deleted");
        loadPackages();
        loadStats();
      } else {
        toast.error("Failed to delete package");
      }
    } catch (error) {
      console.error("Failed to delete package:", error);
      toast.error("Error deleting package");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      goldCoins: 0,
      bonusSweepCoins: 0,
      price: 0,
      originalPrice: 0,
      icon: "Gift",
      color: "from-blue-500 to-blue-600",
      isPopular: false,
      isBestValue: false,
      features: "",
      isActive: true,
      displayOrder: 0,
    });
  };

  const openEditDialog = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      goldCoins: pkg.gold_coins,
      bonusSweepCoins: pkg.bonus_sweep_coins,
      price: pkg.price,
      originalPrice: pkg.original_price,
      icon: pkg.icon,
      color: pkg.color,
      isPopular: pkg.is_popular,
      isBestValue: pkg.is_best_value,
      features: Array.isArray(pkg.features) ? pkg.features.join("\n") : "",
      isActive: pkg.is_active,
      displayOrder: pkg.display_order,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Package sales count</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">From package sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Packages Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gold Coin Packages</CardTitle>
            <CardDescription>
              Manage packages available in the store
            </CardDescription>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Package</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Package Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Starter Pack"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="goldCoins">Gold Coins</Label>
                    <Input
                      id="goldCoins"
                      type="number"
                      value={formData.goldCoins}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          goldCoins: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="bonusSweepCoins">Bonus Sweep Coins</Label>
                    <Input
                      id="bonusSweepCoins"
                      type="number"
                      value={formData.bonusSweepCoins}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bonusSweepCoins: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalPrice">Original Price ($)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          originalPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="features">Features (one per line)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) =>
                      setFormData({ ...formData, features: e.target.value })
                    }
                    placeholder="Instant Delivery&#10;Free Support&#10;Bonus Included"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPopular">Popular Badge</Label>
                    <Switch
                      id="isPopular"
                      checked={formData.isPopular}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isPopular: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isBestValue">Best Value</Label>
                    <Switch
                      id="isBestValue"
                      checked={formData.isBestValue}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isBestValue: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createPackage}>Create Package</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Gold Coins</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading packages...
                    </TableCell>
                  </TableRow>
                ) : packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No packages
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>
                        {pkg.gold_coins}
                        {pkg.bonus_sweep_coins > 0 && (
                          <div className="text-xs text-muted-foreground">
                            +{pkg.bonus_sweep_coins} SC
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-bold">
                        ${pkg.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {pkg.is_popular && (
                            <Badge className="bg-purple-100 text-purple-800">
                              Popular
                            </Badge>
                          )}
                          {pkg.is_best_value && (
                            <Badge className="bg-amber-100 text-amber-800">
                              Best Value
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={pkg.is_active ? "default" : "secondary"}
                        >
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Dialog
                            open={
                              isEditDialogOpen && selectedPackage?.id === pkg.id
                            }
                            onOpenChange={setIsEditDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(pkg)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Package</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-name">
                                    Package Name
                                  </Label>
                                  <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-goldCoins">
                                      Gold Coins
                                    </Label>
                                    <Input
                                      id="edit-goldCoins"
                                      type="number"
                                      value={formData.goldCoins}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          goldCoins:
                                            parseInt(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-price">
                                      Price ($)
                                    </Label>
                                    <Input
                                      id="edit-price"
                                      type="number"
                                      step="0.01"
                                      value={formData.price}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          price:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label htmlFor="edit-isActive">Active</Label>
                                  <Switch
                                    id="edit-isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) =>
                                      setFormData({
                                        ...formData,
                                        isActive: checked,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsEditDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={updatePackage}>
                                  Save Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deletePackage(pkg.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Button onClick={loadPackages} className="mt-4" disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Top Selling Packages */}
      {stats.topPackages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPackages.map((pkg: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <div className="font-medium">{pkg.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {pkg.sales_count} sales
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      ${parseFloat(pkg.revenue).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
