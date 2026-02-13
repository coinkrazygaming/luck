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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Gamepad2,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  created_at: string;
}

interface Game {
  id: string;
  provider_id: string;
  game_id: string;
  name: string;
  description: string;
  enabled: boolean;
  created_at: string;
  provider_name?: string;
}

interface AdminGamesProps {
  token: string | null;
}

export function AdminGames({ token }: AdminGamesProps) {
  const [activeTab, setActiveTab] = useState("games");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameStats, setGameStats] = useState({
    totalGames: 0,
    enabledGames: 0,
    totalProviders: 0,
  });

  const [isCreateProviderDialogOpen, setIsCreateProviderDialogOpen] =
    useState(false);
  const [isCreateGameDialogOpen, setIsCreateGameDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const [providerForm, setProviderForm] = useState({
    name: "",
    type: "slots",
  });

  const [gameForm, setGameForm] = useState({
    providerId: "",
    gameId: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const [providersRes, gamesRes, statsRes] = await Promise.all([
        fetch("/api/admin/providers", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/games", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/games-stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (providersRes.ok) {
        const data = await providersRes.json();
        setProviders(data.providers);
      }

      if (gamesRes.ok) {
        const data = await gamesRes.json();
        setGames(data.games);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setGameStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load game data:", error);
      toast.error("Failed to load game data");
    } finally {
      setLoading(false);
    }
  };

  // Provider Management
  const createProvider = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/admin/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(providerForm),
      });

      if (response.ok) {
        toast.success("Provider created");
        setIsCreateProviderDialogOpen(false);
        setProviderForm({ name: "", type: "slots" });
        loadData();
      } else {
        toast.error("Failed to create provider");
      }
    } catch (error) {
      console.error("Failed to create provider:", error);
      toast.error("Error creating provider");
    }
  };

  const updateProvider = async (provider: Provider) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: !provider.enabled,
        }),
      });

      if (response.ok) {
        toast.success("Provider updated");
        loadData();
      } else {
        toast.error("Failed to update provider");
      }
    } catch (error) {
      console.error("Failed to update provider:", error);
      toast.error("Error updating provider");
    }
  };

  const deleteProvider = async (providerId: string) => {
    if (!token) return;

    if (!window.confirm("Delete this provider?")) return;

    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Provider deleted");
        loadData();
      } else {
        toast.error("Failed to delete provider");
      }
    } catch (error) {
      console.error("Failed to delete provider:", error);
      toast.error("Error deleting provider");
    }
  };

  // Game Management
  const createGame = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/admin/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(gameForm),
      });

      if (response.ok) {
        toast.success("Game created");
        setIsCreateGameDialogOpen(false);
        setGameForm({
          providerId: "",
          gameId: "",
          name: "",
          description: "",
        });
        loadData();
      } else {
        toast.error("Failed to create game");
      }
    } catch (error) {
      console.error("Failed to create game:", error);
      toast.error("Error creating game");
    }
  };

  const updateGame = async (game: Game) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/games/${game.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: !game.enabled,
        }),
      });

      if (response.ok) {
        toast.success("Game updated");
        loadData();
      } else {
        toast.error("Failed to update game");
      }
    } catch (error) {
      console.error("Failed to update game:", error);
      toast.error("Error updating game");
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!token) return;

    if (!window.confirm("Delete this game?")) return;

    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Game deleted");
        loadData();
      } else {
        toast.error("Failed to delete game");
      }
    } catch (error) {
      console.error("Failed to delete game:", error);
      toast.error("Error deleting game");
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="games">Games</TabsTrigger>
        <TabsTrigger value="providers">Providers</TabsTrigger>
      </TabsList>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameStats.totalGames}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enabled Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {gameStats.enabledGames}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameStats.totalProviders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Games Tab */}
      <TabsContent value="games" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Game Catalog</CardTitle>
              <CardDescription>Manage games in the system</CardDescription>
            </div>
            <Dialog
              open={isCreateGameDialogOpen}
              onOpenChange={setIsCreateGameDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Game
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Game</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="providerId">Provider</Label>
                    <select
                      id="providerId"
                      value={gameForm.providerId}
                      onChange={(e) =>
                        setGameForm({ ...gameForm, providerId: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select provider...</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="gameId">Game ID</Label>
                    <Input
                      id="gameId"
                      value={gameForm.gameId}
                      onChange={(e) =>
                        setGameForm({ ...gameForm, gameId: e.target.value })
                      }
                      placeholder="Game ID"
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={gameForm.name}
                      onChange={(e) =>
                        setGameForm({ ...gameForm, name: e.target.value })
                      }
                      placeholder="Game name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={gameForm.description}
                      onChange={(e) =>
                        setGameForm({
                          ...gameForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateGameDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createGame}>Add Game</Button>
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
                    <TableHead>Provider</TableHead>
                    <TableHead>Game ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading games...
                      </TableCell>
                    </TableRow>
                  ) : games.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No games
                      </TableCell>
                    </TableRow>
                  ) : (
                    games.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell className="font-medium">
                          {game.name}
                        </TableCell>
                        <TableCell>{game.provider_name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {game.game_id}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={game.enabled ? "default" : "secondary"}
                          >
                            {game.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(game.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateGame(game)}
                            >
                              {game.enabled ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteGame(game.id)}
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

            <Button onClick={loadData} className="mt-4" disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Providers Tab */}
      <TabsContent value="providers" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Game Providers</CardTitle>
              <CardDescription>Manage game providers</CardDescription>
            </div>
            <Dialog
              open={isCreateProviderDialogOpen}
              onOpenChange={setIsCreateProviderDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Provider</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="providerName">Name</Label>
                    <Input
                      id="providerName"
                      value={providerForm.name}
                      onChange={(e) =>
                        setProviderForm({
                          ...providerForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="Provider name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="providerType">Type</Label>
                    <select
                      id="providerType"
                      value={providerForm.type}
                      onChange={(e) =>
                        setProviderForm({
                          ...providerForm,
                          type: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="slots">Slots</option>
                      <option value="poker">Poker</option>
                      <option value="table">Table Games</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateProviderDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createProvider}>Add Provider</Button>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading providers...
                      </TableCell>
                    </TableRow>
                  ) : providers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No providers
                      </TableCell>
                    </TableRow>
                  ) : (
                    providers.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">
                          {provider.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{provider.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={provider.enabled ? "default" : "secondary"}
                          >
                            {provider.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(provider.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProvider(provider)}
                            >
                              {provider.enabled ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteProvider(provider.id)}
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

            <Button onClick={loadData} className="mt-4" disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
