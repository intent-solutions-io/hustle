'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Player {
  id: string;
  name: string;
  position: string;
}

export default function LogGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerIdParam = searchParams.get('playerId');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [formData, setFormData] = useState({
    playerId: playerIdParam || '',
    date: new Date().toISOString().split('T')[0],
    opponent: '',
    result: '',
    finalScore: '',
    minutesPlayed: '',
    goals: '',
    assists: '',
    // Goalkeeper stats
    saves: '',
    goalsAgainst: '',
    cleanSheet: false,
    // Defensive stats
    tackles: '',
    interceptions: '',
    clearances: '',
    blocks: '',
    aerialDuelsWon: '',
  });

  const selectedPlayer = players.find((p) => p.id === formData.playerId);
  const isGoalkeeper = selectedPlayer?.position === 'Goalkeeper';
  const isDefender = selectedPlayer?.position === 'Defender';

  // Fetch players
  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');

        const data = await response.json();
        const mappedPlayers: Player[] = Array.isArray(data.players)
          ? data.players.map((player: Record<string, unknown>) => ({
              id: player.id,
              name: player.name,
              position: player.position
            }))
          : [];
        setPlayers(mappedPlayers);
        setFetching(false);
      } catch (error) {
        console.error('Error fetching players:', error);
        alert('Failed to load players');
        setFetching(false);
      }
    }

    fetchPlayers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const gameData: Record<string, string | number | boolean | null> = {
        playerId: formData.playerId,
        date: formData.date,
        opponent: formData.opponent,
        result: formData.result,
        finalScore: formData.finalScore,
        minutesPlayed: parseInt(formData.minutesPlayed),
        goals: parseInt(formData.goals),
        assists: parseInt(formData.assists),
      };

      // Add goalkeeper stats if applicable
      if (isGoalkeeper) {
        gameData.saves = formData.saves ? parseInt(formData.saves) : null;
        gameData.goalsAgainst = formData.goalsAgainst ? parseInt(formData.goalsAgainst) : null;
        gameData.cleanSheet = formData.cleanSheet;
      }

      // Add defensive stats if applicable
      if (isDefender) {
        gameData.tackles = formData.tackles ? parseInt(formData.tackles) : null;
        gameData.interceptions = formData.interceptions ? parseInt(formData.interceptions) : null;
        gameData.clearances = formData.clearances ? parseInt(formData.clearances) : null;
        gameData.blocks = formData.blocks ? parseInt(formData.blocks) : null;
        gameData.aerialDuelsWon = formData.aerialDuelsWon ? parseInt(formData.aerialDuelsWon) : null;
      }

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create game');
      }

      // Redirect to athlete detail page
      router.push(`/dashboard/athletes/${formData.playerId}`);
    } catch (error) {
      console.error('Error logging game:', error);
      alert(error instanceof Error ? error.message : 'Failed to log game. Please try again.');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900 mx-auto mb-4" />
          <p className="text-zinc-600">Loading players...</p>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-zinc-200">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">�</div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">No Athletes Yet</h2>
            <p className="text-zinc-600 mb-6">You need to add an athlete before logging games</p>
            <Button asChild className="bg-zinc-900 hover:bg-zinc-800">
              <Link href="/dashboard/add-athlete">Add Your First Athlete</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-zinc-900">Log a Game</h1>
        <p className="text-zinc-600 mt-1">Record game statistics and performance</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-zinc-200">
          <CardContent className="p-6 space-y-6">
            {/* Athlete Selection */}
            <div>
              <label htmlFor="playerId" className="block text-sm font-medium text-zinc-900 mb-2">
                Athlete <span className="text-red-500">*</span>
              </label>
              <select
                id="playerId"
                required
                value={formData.playerId}
                onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              >
                <option value="">Select Athlete</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.position})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-zinc-900 mb-2">
                Game Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            {/* Opponent */}
            <div>
              <label htmlFor="opponent" className="block text-sm font-medium text-zinc-900 mb-2">
                Opponent Team <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="opponent"
                required
                value={formData.opponent}
                onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                placeholder="Eagles FC"
              />
            </div>

            {/* Result */}
            <div>
              <label htmlFor="result" className="block text-sm font-medium text-zinc-900 mb-2">
                Result <span className="text-red-500">*</span>
              </label>
              <select
                id="result"
                required
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              >
                <option value="">Select Result</option>
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
                <option value="Draw">Draw</option>
              </select>
            </div>

            {/* Final Score */}
            <div>
              <label htmlFor="finalScore" className="block text-sm font-medium text-zinc-900 mb-2">
                Final Score <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="finalScore"
                required
                value={formData.finalScore}
                onChange={(e) => setFormData({ ...formData, finalScore: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                placeholder="3-2"
              />
            </div>

            {/* Minutes Played */}
            <div>
              <label htmlFor="minutesPlayed" className="block text-sm font-medium text-zinc-900 mb-2">
                Minutes Played <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="minutesPlayed"
                required
                min="0"
                max="120"
                value={formData.minutesPlayed}
                onChange={(e) => setFormData({ ...formData, minutesPlayed: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            {/* Universal Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="goals" className="block text-sm font-medium text-zinc-900 mb-2">
                  Goals <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="goals"
                  required
                  min="0"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="assists" className="block text-sm font-medium text-zinc-900 mb-2">
                  Assists <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="assists"
                  required
                  min="0"
                  value={formData.assists}
                  onChange={(e) => setFormData({ ...formData, assists: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Goalkeeper-Specific Stats */}
            {isGoalkeeper && (
              <div className="space-y-4 pt-4 border-t border-zinc-200">
                <h3 className="text-sm font-semibold text-zinc-900">Goalkeeper Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="saves" className="block text-sm font-medium text-zinc-900 mb-2">
                      Saves
                    </label>
                    <input
                      type="number"
                      id="saves"
                      min="0"
                      value={formData.saves}
                      onChange={(e) => setFormData({ ...formData, saves: e.target.value })}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="goalsAgainst" className="block text-sm font-medium text-zinc-900 mb-2">
                      Goals Against
                    </label>
                    <input
                      type="number"
                      id="goalsAgainst"
                      min="0"
                      value={formData.goalsAgainst}
                      onChange={(e) => setFormData({ ...formData, goalsAgainst: e.target.value })}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cleanSheet"
                    checked={formData.cleanSheet}
                    onChange={(e) => setFormData({ ...formData, cleanSheet: e.target.checked })}
                    className="w-4 h-4 border-zinc-300 rounded text-zinc-900 focus:ring-zinc-900"
                  />
                  <label htmlFor="cleanSheet" className="text-sm font-medium text-zinc-900">
                    Clean Sheet
                  </label>
                </div>
              </div>
            )}

            {/* Defender-Specific Stats */}
            {isDefender && (
              <div className="space-y-4 pt-4 border-t border-zinc-200">
                <h3 className="text-sm font-semibold text-zinc-900">Defensive Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tackles" className="block text-sm font-medium text-zinc-900 mb-2">
                      Tackles
                    </label>
                    <input
                      type="number"
                      id="tackles"
                      min="0"
                      value={formData.tackles}
                      onChange={(e) => setFormData({ ...formData, tackles: e.target.value })}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="interceptions" className="block text-sm font-medium text-zinc-900 mb-2">
                      Interceptions
                    </label>
                    <input
                      type="number"
                      id="interceptions"
                      min="0"
                      value={formData.interceptions}
                      onChange={(e) => setFormData({ ...formData, interceptions: e.target.value })}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="clearances" className="block text-sm font-medium text-zinc-900 mb-2">
                      Clearances
                    </label>
                    <input
                      type="number"
                      id="clearances"
                      min="0"
                      value={formData.clearances}
                      onChange={(e) => setFormData({ ...formData, clearances: e.target.value })}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="blocks" className="block text-sm font-medium text-zinc-900 mb-2">
                      Blocks
                    </label>
                    <input
                      type="number"
                      id="blocks"
                      min="0"
                      value={formData.blocks}
                      onChange={(e) => setFormData({ ...formData, blocks: e.target.value })}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="aerialDuelsWon" className="block text-sm font-medium text-zinc-900 mb-2">
                      Aerial Duels Won
                    </label>
                    <input
                      type="number"
                      id="aerialDuelsWon"
                      min="0"
                      value={formData.aerialDuelsWon}
                      onChange={(e) => setFormData({ ...formData, aerialDuelsWon: e.target.value })}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Logging Game...
              </>
            ) : (
              'Log Game'
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
