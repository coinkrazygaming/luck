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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  Play,
  Square,
  Users,
  DollarSign,
  RefreshCw,
} from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  current_participants: number;
  created_at: string;
}

interface AdminTournamentsProps {
  token: string | null;
}

export function AdminTournaments({ token }: AdminTournamentsProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [stats, setStats] = useState({
    activeTournaments: 0,
    totalParticipants: 0,
    totalPrizePool: 0,
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "slots",
    entryFee: 0,
    prizePool: 1000,
    maxParticipants: 100,
  });

  useEffect(() => {
    if (token) {
      loadTournaments();
      loadStats();
    }
  }, [token]);

  const loadTournaments = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await fetch("/api/admin/tournaments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments);
      } else {
        toast.error("Failed to load tournaments");
      }
    } catch (error) {
      console.error("Failed to load tournaments:", error);
      toast.error("Error loading tournaments");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/admin/tournaments/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load tournament stats:", error);
    }
  };

  const createTournament = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          entryFee: formData.entryFee,
          prizePool: formData.prizePool,
          maxParticipants: formData.maxParticipants,
        }),
      });

      if (response.ok) {
        toast.success("Tournament created");
        setIsCreateDialogOpen(false);
        setFormData({
          name: "",
          description: "",
          type: "slots",
          entryFee: 0,
          prizePool: 1000,
          maxParticipants: 100,
        });
        loadTournaments();
        loadStats();
      } else {
        toast.error("Failed to create tournament");
      }
    } catch (error) {
      console.error("Failed to create tournament:", error);
      toast.error("Error creating tournament");
    }
  };

  const updateTournament = async () => {
    if (!token || !selectedTournament) return;

    try {
      const response = await fetch(
        `/api/admin/tournaments/${selectedTournament.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            prizePool: formData.prizePool,
            maxParticipants: formData.maxParticipants,
          }),
        },
      );

      if (response.ok) {
        toast.success("Tournament updated");
        setIsEditDialogOpen(false);
        loadTournaments();
      } else {
        toast.error("Failed to update tournament");
      }
    } catch (error) {
      console.error("Failed to update tournament:", error);
      toast.error("Error updating tournament");
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    if (!token) return;

    if (!window.confirm("Delete this tournament?")) return;

    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Tournament deleted");
        loadTournaments();
        loadStats();
      } else {
        toast.error("Failed to delete tournament");
      }
    } catch (error) {
      console.error("Failed to delete tournament:", error);
      toast.error("Error deleting tournament");
    }
  };

  const changeTournamentStatus = async (
    tournamentId: string,
    action: "start" | "end" | "cancel",
  ) => {
    if (!token) return;

    try {
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/${action}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        toast.success(`Tournament ${action}ed`);
        loadTournaments();
        loadStats();
      } else {
        toast.error(`Failed to ${action} tournament`);
      }
    } catch (error) {
      console.error(`Failed to ${action} tournament:`, error);
      toast.error(`Error ${action}ing tournament`);
    }
  };

  const openEditDialog = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description,
      type: tournament.type,
      entryFee: tournament.entry_fee,
      prizePool: tournament.prize_pool,
      maxParticipants: tournament.max_participants,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Active Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTournaments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Total Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Total Prize Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalPrizePool.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Management Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tournaments</CardTitle>
            <CardDescription>Create and manage tournaments</CardDescription>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Tournament
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Tournament</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Tournament name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tournament description"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slots">Slots</SelectItem>
                      <SelectItem value="poker">Poker</SelectItem>
                      <SelectItem value="bingo">Bingo</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entryFee">Entry Fee</Label>
                    <Input
                      id="entryFee"
                      type="number"
                      value={formData.entryFee}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entryFee: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="prizePool">Prize Pool</Label>
                    <Input
                      id="prizePool"
                      type="number"
                      value={formData.prizePool}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prizePool: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxParticipants: parseInt(e.target.value) || 100,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createTournament}>Create</Button>
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
                  <TableHead>Participants</TableHead>
                  <TableHead>Prize Pool</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading tournaments...
                    </TableCell>
                  </TableRow>
                ) : tournaments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No tournaments
                    </TableCell>
                  </TableRow>
                ) : (
                  tournaments.map((tournament) => (
                    <TableRow key={tournament.id}>
                      <TableCell className="font-medium">
                        {tournament.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tournament.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tournament.status)}>
                          {tournament.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tournament.current_participants} /{" "}
                        {tournament.max_participants}
                      </TableCell>
                      <TableCell>${tournament.prize_pool.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(tournament.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end flex-wrap">
                          {tournament.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                changeTournamentStatus(tournament.id, "start")
                              }
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}

                          {tournament.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                changeTournamentStatus(tournament.id, "end")
                              }
                            >
                              <Square className="h-3 w-3" />
                            </Button>
                          )}

                          <Dialog
                            open={
                              isEditDialogOpen &&
                              selectedTournament?.id === tournament.id
                            }
                            onOpenChange={setIsEditDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(tournament)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Tournament</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-name">Name</Label>
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
                                  <Label htmlFor="edit-description">
                                    Description
                                  </Label>
                                  <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        description: e.target.value,
                                      })
                                    }
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-prizePool">
                                      Prize Pool
                                    </Label>
                                    <Input
                                      id="edit-prizePool"
                                      type="number"
                                      value={formData.prizePool}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          prizePool:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="edit-maxParticipants">
                                      Max Participants
                                    </Label>
                                    <Input
                                      id="edit-maxParticipants"
                                      type="number"
                                      value={formData.maxParticipants}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          maxParticipants:
                                            parseInt(e.target.value) || 100,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsEditDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={updateTournament}>Save</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTournament(tournament.id)}
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

          <Button onClick={loadTournaments} className="mt-4" disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
