import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { toast } from "sonner";

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

interface SlotsGamesGridProps {
  filter?: string;
}

export function SlotsGamesGrid({ filter }: SlotsGamesGridProps) {
  const [games, setGames] = useState<SlotGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<SlotGame | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch("/api/slots");
        if (!response.ok) throw new Error("Failed to fetch games");
        const data = await response.json();
        setGames(data);
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast.error("Failed to load slot games");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {games.map((game) => (
          <Card
            key={game.id}
            className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => setSelectedGame(game)}
          >
            <div className="relative h-40 bg-gradient-to-br from-purple-900 to-gray-900 overflow-hidden">
              <img
                src={game.thumbnail}
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">{game.name}</CardTitle>
              <CardDescription className="text-xs">{game.provider}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  RTP {game.rtp}%
                </Badge>
                <Badge variant="outline" className={`text-xs ${getVolatilityColor(game.volatility)}`}>
                  {game.volatility}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div>Lines: {game.paylines}</div>
                <div>Bet: ${game.min_bet} - ${game.max_bet}</div>
              </div>

              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Play Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Game Details Modal */}
      {selectedGame && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedGame(null)}
        >
          <Card className="max-w-2xl w-full max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <div>
                  <h2>{selectedGame.name}</h2>
                  <p className="text-sm text-muted-foreground font-normal mt-1">
                    {selectedGame.provider}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="text-xl text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm">{selectedGame.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Return to Player</p>
                  <p className="text-lg font-bold">{selectedGame.rtp}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Volatility</p>
                  <Badge className={getVolatilityColor(selectedGame.volatility)}>
                    {selectedGame.volatility}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paylines</p>
                  <p className="text-lg font-bold">{selectedGame.paylines.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bet Range</p>
                  <p className="text-sm font-semibold">
                    ${selectedGame.min_bet} - ${selectedGame.max_bet}
                  </p>
                </div>
              </div>

              {selectedGame.features && selectedGame.features.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedGame.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Launch Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
