import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";

interface SlotGame {
  id: number;
  name: string;
  provider: string;
  rtp: number;
  volatility: string;
  paylines: number;
  min_bet: number;
  max_bet: number;
  description: string;
  thumbnail: string;
  features: string[];
  release_year: number;
  is_active: boolean;
}

interface AdminSlotsProps {
  token: string;
}

export function AdminSlots({ token }: AdminSlotsProps) {
  const [games, setGames] = useState<SlotGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<SlotGame | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    rtp: 96.0,
    volatility: "medium",
    paylines: 25,
    minBet: 0.1,
    maxBet: 100,
    description: "",
    thumbnail: "",
    features: "",
    releaseYear: new Date().getFullYear(),
    isActive: true,
  });

  useEffect(() => {
    fetchGames();
    fetchStats();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/admin/slots", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch games");
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error("Error fetching games:", error);
      toast.error("Failed to load slot games");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/slots/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const parseFeatures = (featuresStr: string): string[] => {
    return featuresStr
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  };

  const createGame = async () => {
    try {
      const response = await fetch("/api/admin/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          provider: formData.provider,
          rtp: formData.rtp,
          volatility: formData.volatility,
          paylines: formData.paylines,
          minBet: formData.minBet,
          maxBet: formData.maxBet,
          description: formData.description,
          thumbnail: formData.thumbnail,
          features: parseFeatures(formData.features),
          releaseYear: formData.releaseYear,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) throw new Error("Failed to create game");
      toast.success("Game created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        provider: "",
        rtp: 96.0,
        volatility: "medium",
        paylines: 25,
        minBet: 0.1,
        maxBet: 100,
        description: "",
        thumbnail: "",
        features: "",
        releaseYear: new Date().getFullYear(),
        isActive: true,
      });
      fetchGames();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to create game");
    }
  };

  const updateGame = async () => {
    if (!selectedGame) return;
    try {
      const response = await fetch(`/api/admin/slots/${selectedGame.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          provider: formData.provider,
          rtp: formData.rtp,
          volatility: formData.volatility,
          paylines: formData.paylines,
          minBet: formData.minBet,
          maxBet: formData.maxBet,
          description: formData.description,
          thumbnail: formData.thumbnail,
          features: parseFeatures(formData.features),
          releaseYear: formData.releaseYear,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) throw new Error("Failed to update game");
      toast.success("Game updated successfully");
      setIsEditDialogOpen(false);
      fetchGames();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to update game");
    }
  };

  const deleteGame = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this game?")) return;
    try {
      const response = await fetch(`/api/admin/slots/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete game");
      toast.success("Game deleted successfully");
      fetchGames();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete game");
    }
  };

  const handleEditClick = (game: SlotGame) => {
    setSelectedGame(game);
    setFormData({
      name: game.name,
      provider: game.provider,
      rtp: game.rtp,
      volatility: game.volatility,
      paylines: game.paylines,
      minBet: game.min_bet,
      maxBet: game.max_bet,
      description: game.description,
      thumbnail: game.thumbnail,
      features: game.features.join("\n"),
      releaseYear: game.release_year,
      isActive: game.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility.toLowerCase()) {
      case "low":
        return "bg-green-500/20 text-green-700";
      case "medium":
        return "bg-yellow-500/20 text-yellow-700";
      case "high":
        return "bg-red-500/20 text-red-700";
      case "very high":
        return "bg-red-600/20 text-red-800";
      default:
        return "bg-gray-500/20 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="games" className="space-y-4">
      <TabsList>
        <TabsTrigger value="games">Games</TabsTrigger>
        <TabsTrigger value="stats">Statistics</TabsTrigger>
      </TabsList>

      <TabsContent value="games" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Slot Games</h3>
            <p className="text-sm text-muted-foreground">
              Manage available slot games in the casino
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4" />
                Add Game
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Slot Game</DialogTitle>
                <DialogDescription>
                  Create a new slot game in the casino
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Game Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Book of Dead"
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Input
                      id="provider"
                      value={formData.provider}
                      onChange={(e) =>
                        setFormData({ ...formData, provider: e.target.value })
                      }
                      placeholder="e.g., Play'n GO"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rtp">RTP (%)</Label>
                    <Input
                      id="rtp"
                      type="number"
                      step="0.01"
                      value={formData.rtp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rtp: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="volatility">Volatility</Label>
                    <select
                      id="volatility"
                      value={formData.volatility}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          volatility: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="very high">Very High</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="paylines">Paylines</Label>
                    <Input
                      id="paylines"
                      type="number"
                      value={formData.paylines}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paylines: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="release">Release Year</Label>
                    <Input
                      id="release"
                      type="number"
                      value={formData.releaseYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          releaseYear: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minBet">Min Bet</Label>
                    <Input
                      id="minBet"
                      type="number"
                      step="0.01"
                      value={formData.minBet}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minBet: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxBet">Max Bet</Label>
                    <Input
                      id="maxBet"
                      type="number"
                      step="0.01"
                      value={formData.maxBet}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxBet: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Game description"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) =>
                      setFormData({ ...formData, thumbnail: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="features">Features (one per line)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) =>
                      setFormData({ ...formData, features: e.target.value })
                    }
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    rows={3}
                  />
                </div>

                <Button onClick={createGame} className="w-full bg-purple-600 hover:bg-purple-700">
                  Create Game
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {games.map((game) => (
            <Card key={game.id} className="border border-purple-200/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <img
                      src={game.thumbnail}
                      alt={game.name}
                      className="h-16 w-16 rounded object-cover flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=64&h=64&fit=crop";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{game.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {game.provider}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          RTP {game.rtp}%
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getVolatilityColor(
                            game.volatility
                          )}`}
                        >
                          {game.volatility}
                        </Badge>
                        {game.is_active ? (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Dialog open={isEditDialogOpen && selectedGame?.id === game.id}
                      onOpenChange={setIsEditDialogOpen}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(game)}
                        className="gap-1"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Slot Game</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-name">
                                Game Name
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
                            <div>
                              <Label htmlFor="edit-provider">Provider</Label>
                              <Input
                                id="edit-provider"
                                value={formData.provider}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    provider: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-rtp">RTP (%)</Label>
                              <Input
                                id="edit-rtp"
                                type="number"
                                step="0.01"
                                value={formData.rtp}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    rtp:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-volatility">
                                Volatility
                              </Label>
                              <select
                                id="edit-volatility"
                                value={formData.volatility}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    volatility: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border rounded-md bg-background"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="very high">Very High</option>
                              </select>
                            </div>
                          </div>
                          <Button onClick={updateGame}>
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteGame(game.id)}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="stats" className="space-y-4">
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalGames}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {stats.activeGames}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average RTP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.averageRtp}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.providers.length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stats?.providers && (
          <Card>
            <CardHeader>
              <CardTitle>Game Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.providers.map((provider: string, idx: number) => (
                  <Badge key={idx} variant="outline">
                    {provider}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
