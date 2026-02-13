import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, Users, Dice1, TrendingUp } from "lucide-react";

interface GameRoomConfig {
  minPlayers: number;
  maxPlayers: number;
  minBet: number;
  maxBet: number;
  entryFee: number;
  prizePool: number;
  duration: number;
  enabled: boolean;
}

interface AdminGameRoomSettingsProps {
  token: string;
}

export function AdminGameRoomSettings({ token }: AdminGameRoomSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);

  const [bingoRooms, setBingoRooms] = useState<GameRoomConfig>({
    minPlayers: 2,
    maxPlayers: 100,
    minBet: 1,
    maxBet: 100,
    entryFee: 0.99,
    prizePool: 500,
    duration: 15,
    enabled: true,
  });

  const [pokerRooms, setPokerRooms] = useState<GameRoomConfig>({
    minPlayers: 2,
    maxPlayers: 9,
    minBet: 5,
    maxBet: 500,
    entryFee: 2.99,
    prizePool: 1000,
    duration: 30,
    enabled: true,
  });

  const [sportsParlay, setSportsParlay] = useState<GameRoomConfig>({
    minPlayers: 1,
    maxPlayers: 999,
    minBet: 0.25,
    maxBet: 1000,
    entryFee: 0,
    prizePool: 5000,
    duration: 5,
    enabled: true,
  });

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/game-rooms/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bingo: bingoRooms,
          poker: pokerRooms,
          sportsParlay: sportsParlay,
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");
      toast.success("Game room settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const RoomConfigForm = ({
    config,
    onChange,
    title,
    icon: Icon,
  }: {
    config: GameRoomConfig;
    onChange: (config: GameRoomConfig) => void;
    title: string;
    icon: any;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <span className="font-medium">Room Status</span>
          <Badge className={config.enabled ? "bg-green-500" : "bg-red-500"}>
            {config.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${title}-minPlayers`}>Minimum Players</Label>
            <Input
              id={`${title}-minPlayers`}
              type="number"
              value={config.minPlayers}
              onChange={(e) =>
                onChange({ ...config, minPlayers: parseInt(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor={`${title}-maxPlayers`}>Maximum Players</Label>
            <Input
              id={`${title}-maxPlayers`}
              type="number"
              value={config.maxPlayers}
              onChange={(e) =>
                onChange({ ...config, maxPlayers: parseInt(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor={`${title}-minBet`}>Minimum Bet ($)</Label>
            <Input
              id={`${title}-minBet`}
              type="number"
              step="0.01"
              value={config.minBet}
              onChange={(e) =>
                onChange({ ...config, minBet: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor={`${title}-maxBet`}>Maximum Bet ($)</Label>
            <Input
              id={`${title}-maxBet`}
              type="number"
              step="0.01"
              value={config.maxBet}
              onChange={(e) =>
                onChange({ ...config, maxBet: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor={`${title}-entryFee`}>Entry Fee ($)</Label>
            <Input
              id={`${title}-entryFee`}
              type="number"
              step="0.01"
              value={config.entryFee}
              onChange={(e) =>
                onChange({ ...config, entryFee: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor={`${title}-prizePool`}>Prize Pool ($)</Label>
            <Input
              id={`${title}-prizePool`}
              type="number"
              step="0.01"
              value={config.prizePool}
              onChange={(e) =>
                onChange({ ...config, prizePool: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor={`${title}-duration`}>
              Average Duration (minutes)
            </Label>
            <Input
              id={`${title}-duration`}
              type="number"
              value={config.duration}
              onChange={(e) =>
                onChange({ ...config, duration: parseInt(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor={`${title}-enabled`}>Enabled</Label>
            <select
              id={`${title}-enabled`}
              value={config.enabled ? "yes" : "no"}
              onChange={(e) =>
                onChange({ ...config, enabled: e.target.value === "yes" })
              }
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Configuration Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-secondary rounded">
              <span>Player Range</span>
              <span className="font-medium">
                {config.minPlayers} - {config.maxPlayers}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-secondary rounded">
              <span>Bet Range</span>
              <span className="font-medium">
                ${config.minBet.toFixed(2)} - ${config.maxBet.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-secondary rounded">
              <span>Entry Fee</span>
              <span className="font-medium">${config.entryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2 bg-secondary rounded">
              <span>Prize Pool</span>
              <span className="font-medium text-green-600">
                ${config.prizePool.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-secondary rounded">
              <span>Avg Duration</span>
              <span className="font-medium">{config.duration} min</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="bingo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bingo" className="gap-2">
            <Users className="h-4 w-4" />
            Bingo Rooms
          </TabsTrigger>
          <TabsTrigger value="poker" className="gap-2">
            <Dice1 className="h-4 w-4" />
            Poker Tables
          </TabsTrigger>
          <TabsTrigger value="sports" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Sports Parlay
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bingo">
          <RoomConfigForm
            config={bingoRooms}
            onChange={setBingoRooms}
            title="Bingo Rooms Configuration"
            icon={Users}
          />
        </TabsContent>

        <TabsContent value="poker">
          <RoomConfigForm
            config={pokerRooms}
            onChange={setPokerRooms}
            title="Poker Tables Configuration"
            icon={Dice1}
          />
        </TabsContent>

        <TabsContent value="sports">
          <RoomConfigForm
            config={sportsParlay}
            onChange={setSportsParlay}
            title="Sports Parlay Configuration"
            icon={TrendingUp}
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Save All Settings</CardTitle>
          <CardDescription>
            Save all game room configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            size="lg"
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save All Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
