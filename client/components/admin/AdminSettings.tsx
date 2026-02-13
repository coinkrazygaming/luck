import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, Save, AlertCircle } from "lucide-react";

interface AdminSettingsProps {
  token: string | null;
}

export function AdminSettings({ token }: AdminSettingsProps) {
  const [gameSettings, setGameSettings] = useState({
    rtp: 94.5,
    maxBet: 100,
    minBet: 0.01,
    maxWin: 10000,
  });

  const [responsibleGaming, setResponsibleGaming] = useState({
    dailyLossLimit: 500,
    sessionTimeLimit: 4,
    maxBetsPerSession: 1000,
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    withdrawalProcessingTime: 24,
    bonusPercentage: 100,
    referralBonusPercentage: 10,
  });

  const [saving, setSaving] = useState(false);

  const saveGameSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Game settings saved successfully");
    } catch (error) {
      toast.error("Failed to save game settings");
    } finally {
      setSaving(false);
    }
  };

  const saveResponsibleGaming = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Responsible gaming settings saved");
    } catch (error) {
      toast.error("Failed to save responsible gaming settings");
    } finally {
      setSaving(false);
    }
  };

  const saveSystemSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("System settings saved successfully");
    } catch (error) {
      toast.error("Failed to save system settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs defaultValue="game" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="game">Game Settings</TabsTrigger>
        <TabsTrigger value="responsible">Responsible Gaming</TabsTrigger>
        <TabsTrigger value="system">System Settings</TabsTrigger>
      </TabsList>

      {/* Game Settings */}
      <TabsContent value="game" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Game Configuration</CardTitle>
            <CardDescription>
              Configure game parameters and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="rtp">Return to Player (RTP) %</Label>
                <Input
                  id="rtp"
                  type="number"
                  min="80"
                  max="99"
                  step="0.1"
                  value={gameSettings.rtp}
                  onChange={(e) =>
                    setGameSettings({
                      ...gameSettings,
                      rtp: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  80-99% recommended
                </p>
              </div>

              <div>
                <Label htmlFor="maxBet">Maximum Bet</Label>
                <Input
                  id="maxBet"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={gameSettings.maxBet}
                  onChange={(e) =>
                    setGameSettings({
                      ...gameSettings,
                      maxBet: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="minBet">Minimum Bet</Label>
                <Input
                  id="minBet"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={gameSettings.minBet}
                  onChange={(e) =>
                    setGameSettings({
                      ...gameSettings,
                      minBet: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxWin">Maximum Win per Spin</Label>
                <Input
                  id="maxWin"
                  type="number"
                  step="100"
                  value={gameSettings.maxWin}
                  onChange={(e) =>
                    setGameSettings({
                      ...gameSettings,
                      maxWin: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <Button onClick={saveGameSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Game Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Responsible Gaming */}
      <TabsContent value="responsible" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Responsible Gaming Controls</CardTitle>
            <CardDescription>
              Enforce responsible gaming limits and protections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Important</p>
                <p>
                  These settings help protect players from problem gambling. Set
                  limits appropriately for your jurisdiction.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="dailyLossLimit">Daily Loss Limit ($)</Label>
                <Input
                  id="dailyLossLimit"
                  type="number"
                  min="1"
                  step="1"
                  value={responsibleGaming.dailyLossLimit}
                  onChange={(e) =>
                    setResponsibleGaming({
                      ...responsibleGaming,
                      dailyLossLimit: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum loss per day per user
                </p>
              </div>

              <div>
                <Label htmlFor="sessionTimeLimit">
                  Session Time Limit (hours)
                </Label>
                <Input
                  id="sessionTimeLimit"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={responsibleGaming.sessionTimeLimit}
                  onChange={(e) =>
                    setResponsibleGaming({
                      ...responsibleGaming,
                      sessionTimeLimit: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Force logout after N hours
                </p>
              </div>

              <div>
                <Label htmlFor="maxBetsPerSession">Max Bets per Session</Label>
                <Input
                  id="maxBetsPerSession"
                  type="number"
                  min="1"
                  step="100"
                  value={responsibleGaming.maxBetsPerSession}
                  onChange={(e) =>
                    setResponsibleGaming({
                      ...responsibleGaming,
                      maxBetsPerSession: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum number of consecutive bets
                </p>
              </div>
            </div>

            <Button
              onClick={saveResponsibleGaming}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Responsible Gaming Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* System Settings */}
      <TabsContent value="system" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              Configure overall system parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <Select
                  value={systemSettings.maintenanceMode ? "on" : "off"}
                  onValueChange={(value) =>
                    setSystemSettings({
                      ...systemSettings,
                      maintenanceMode: value === "on",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="on">On</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Blocks all user access during maintenance
                </p>
              </div>

              <div>
                <Label htmlFor="withdrawalProcessing">
                  Withdrawal Processing Time (hours)
                </Label>
                <Input
                  id="withdrawalProcessing"
                  type="number"
                  min="1"
                  step="1"
                  value={systemSettings.withdrawalProcessingTime}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      withdrawalProcessingTime: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="bonusPercentage">Welcome Bonus %</Label>
                <Input
                  id="bonusPercentage"
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  value={systemSettings.bonusPercentage}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      bonusPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage of first deposit
                </p>
              </div>

              <div>
                <Label htmlFor="referralBonus">Referral Bonus %</Label>
                <Input
                  id="referralBonus"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={systemSettings.referralBonusPercentage}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      referralBonusPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage for each successful referral
                </p>
              </div>
            </div>

            <Button onClick={saveSystemSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save System Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
