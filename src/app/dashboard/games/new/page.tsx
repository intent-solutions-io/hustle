'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingButton } from '@/components/ui/loading-button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { gameSchema, type GameFormData } from '@/lib/validations/game-schema';

interface Athlete {
  id: string;
  name: string;
  position: string;
}

export default function NewGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledPlayerId = searchParams.get('playerId');

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      playerId: prefilledPlayerId || '',
      date: '',
      opponent: '',
      result: undefined,
      yourScore: 0,
      opponentScore: 0,
      minutesPlayed: 0,
      goals: 0,
      assists: 0,
      tackles: 0,
      interceptions: 0,
      clearances: 0,
      blocks: 0,
      aerialDuelsWon: 0,
      saves: 0,
      goalsAgainst: 0,
      cleanSheet: false,
    },
  });

  // Fetch athletes on mount
  useEffect(() => {
    fetch('/api/players')
      .then((res) => res.json())
      .then((data) => {
        const mappedAthletes: Athlete[] = Array.isArray(data.players)
          ? data.players.map((player: any) => ({
              id: player.id,
              name: player.name,
              position: player.position
            }))
          : []

        setAthletes(mappedAthletes);

        // If pre-filled, find and set athlete
        if (prefilledPlayerId) {
          const athlete = mappedAthletes.find((a) => a.id === prefilledPlayerId);
          if (athlete) {
            setSelectedAthlete(athlete);
            setValue('playerId', athlete.id);
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching athletes:', error);
        setErrorMessage('Failed to load athletes. Please refresh the page.');
      });
  }, [prefilledPlayerId, setValue]);

  // Watch for goalsAgainst changes to disable cleanSheet if > 0
  const goalsAgainst = watch('goalsAgainst');
  useEffect(() => {
    if (goalsAgainst && goalsAgainst > 0) {
      setValue('cleanSheet', false);
    }
  }, [goalsAgainst, setValue]);

  const onSubmit = async (data: GameFormData) => {
    setIsSubmitting(true);
    setErrorMessage('');

    // Transform data for API
    const gameData = {
      playerId: data.playerId,
      date: data.date,
      opponent: data.opponent,
      result: data.result,
      yourScore: data.yourScore,
      opponentScore: data.opponentScore,
      minutesPlayed: data.minutesPlayed,
      goals: data.goals,
      assists: selectedAthlete?.position !== 'Goalkeeper' ? (data.assists || 0) : null,
      tackles: selectedAthlete?.position !== 'Goalkeeper' ? (data.tackles || 0) : null,
      interceptions: selectedAthlete?.position !== 'Goalkeeper' ? (data.interceptions || 0) : null,
      clearances: selectedAthlete?.position !== 'Goalkeeper' ? (data.clearances || 0) : null,
      blocks: selectedAthlete?.position !== 'Goalkeeper' ? (data.blocks || 0) : null,
      aerialDuelsWon: selectedAthlete?.position !== 'Goalkeeper' ? (data.aerialDuelsWon || 0) : null,
      saves: selectedAthlete?.position === 'Goalkeeper' ? (data.saves || 0) : null,
      goalsAgainst: selectedAthlete?.position === 'Goalkeeper' ? (data.goalsAgainst || 0) : null,
      cleanSheet: selectedAthlete?.position === 'Goalkeeper' ? (data.cleanSheet || false) : null,
    };

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData),
      });

      if (response.ok) {
        // Success - redirect to athlete detail if available, otherwise dashboard
        if (data.playerId) {
          router.push(`/dashboard/athletes/${data.playerId}`);
        } else {
          router.push('/dashboard');
        }
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to save game. Please try again.');
      }
    } catch (error) {
      console.error('Error saving game:', error);
      setErrorMessage('Failed to save game. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGoalkeeper = selectedAthlete?.position === 'Goalkeeper';

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-6">
      <div className="md:max-w-2xl md:mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-zinc-700 hover:text-zinc-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Log a Game</h1>
          <p className="text-sm text-zinc-600 mt-1">
            Record comprehensive game statistics for your athlete
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Game Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Game Details</CardTitle>
              <CardDescription>Basic information about the game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Athlete Selector */}
              <div>
                <Label htmlFor="playerId">
                  Athlete <span className="text-red-600">*</span>
                </Label>
                {prefilledPlayerId ? (
                  <div className="mt-2 p-3 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-700">
                    {selectedAthlete?.name} - {selectedAthlete?.position} (Pre-selected)
                  </div>
                ) : (
                  <Select
                    value={watch('playerId')}
                    onValueChange={(value) => {
                      setValue('playerId', value, { shouldValidate: true });
                      const athlete = athletes.find((a) => a.id === value);
                      setSelectedAthlete(athlete || null);
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select an athlete" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.length === 0 ? (
                        <div className="p-2 text-sm text-zinc-500">No athletes found. Add an athlete first.</div>
                      ) : (
                        athletes.map((athlete) => (
                          <SelectItem key={athlete.id} value={athlete.id}>
                            {athlete.name} - {athlete.position}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {errors.playerId && (
                  <p className="text-sm text-red-600 mt-1">{errors.playerId.message}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="date">
                  Game Date <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                  className="mt-2"
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.date && (
                  <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
                )}
              </div>

              {/* Opponent */}
              <div>
                <Label htmlFor="opponent">
                  Opponent Team <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="opponent"
                  type="text"
                  {...register('opponent')}
                  placeholder="e.g., Lincoln High School"
                  className="mt-2"
                />
                {errors.opponent && (
                  <p className="text-sm text-red-600 mt-1">{errors.opponent.message}</p>
                )}
              </div>

              {/* Result */}
              <div>
                <Label>
                  Result <span className="text-red-600">*</span>
                </Label>
                <RadioGroup
                  value={watch('result')}
                  onValueChange={(value) => setValue('result', value as 'Win' | 'Loss' | 'Draw', { shouldValidate: true })}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Win" id="win" />
                    <Label htmlFor="win" className="font-normal cursor-pointer">Win</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Loss" id="loss" />
                    <Label htmlFor="loss" className="font-normal cursor-pointer">Loss</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Draw" id="draw" />
                    <Label htmlFor="draw" className="font-normal cursor-pointer">Draw</Label>
                  </div>
                </RadioGroup>
                {errors.result && (
                  <p className="text-sm text-red-600 mt-1">{errors.result.message}</p>
                )}
              </div>

              {/* Final Score */}
              <div>
                <Label>
                  Final Score <span className="text-red-600">*</span>
                </Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      {...register('yourScore', { valueAsNumber: true })}
                      min={0}
                      max={20}
                      placeholder="0"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Your team</p>
                  </div>
                  <span className="text-2xl text-zinc-400">-</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      {...register('opponentScore', { valueAsNumber: true })}
                      min={0}
                      max={20}
                      placeholder="0"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Opponent</p>
                  </div>
                </div>
                {(errors.yourScore || errors.opponentScore) && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.yourScore?.message || errors.opponentScore?.message}
                  </p>
                )}
              </div>

              {/* Minutes Played */}
              <div>
                <Label htmlFor="minutes">
                  Minutes Played <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="minutes"
                  type="number"
                  {...register('minutesPlayed', { valueAsNumber: true })}
                  min={0}
                  max={120}
                  placeholder="90"
                  className="mt-2 w-32"
                />
                <p className="text-xs text-zinc-500 mt-1">Maximum 120 minutes (typical game is 90 minutes)</p>
                {errors.minutesPlayed && (
                  <p className="text-sm text-red-600 mt-1">{errors.minutesPlayed.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Stats</CardTitle>
              <CardDescription>
                {isGoalkeeper
                  ? 'Goalkeeper statistics for this game'
                  : 'Field player statistics for this game'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Goals (all positions) */}
              <div>
                <Label htmlFor="goals">Goals Scored</Label>
                <Input
                  id="goals"
                  type="number"
                  {...register('goals', { valueAsNumber: true })}
                  min={0}
                  max={20}
                  placeholder="0"
                  className="mt-2 w-32"
                />
                <p className="text-xs text-zinc-500 mt-1">Number of goals scored by the athlete</p>
                {errors.goals && (
                  <p className="text-sm text-red-600 mt-1">{errors.goals.message}</p>
                )}
              </div>

              {/* Position-specific fields */}
              {isGoalkeeper ? (
                <>
                  {/* Saves */}
                  <div>
                    <Label htmlFor="saves">Saves</Label>
                    <Input
                      id="saves"
                      type="number"
                      {...register('saves', { valueAsNumber: true })}
                      min={0}
                      max={50}
                      placeholder="0"
                      className="mt-2 w-32"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Number of saves made by the goalkeeper</p>
                    {errors.saves && (
                      <p className="text-sm text-red-600 mt-1">{errors.saves.message}</p>
                    )}
                  </div>

                  {/* Goals Against */}
                  <div>
                    <Label htmlFor="goalsAgainst">Goals Against</Label>
                    <Input
                      id="goalsAgainst"
                      type="number"
                      {...register('goalsAgainst', { valueAsNumber: true })}
                      min={0}
                      max={20}
                      placeholder="0"
                      className="mt-2 w-32"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Number of goals conceded</p>
                    {errors.goalsAgainst && (
                      <p className="text-sm text-red-600 mt-1">{errors.goalsAgainst.message}</p>
                    )}
                  </div>

                  {/* Clean Sheet */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cleanSheet"
                      checked={watch('cleanSheet') || false}
                      onCheckedChange={(checked) => setValue('cleanSheet', checked as boolean)}
                      disabled={goalsAgainst ? goalsAgainst > 0 : false}
                    />
                    <Label
                      htmlFor="cleanSheet"
                      className={`font-normal cursor-pointer ${goalsAgainst && goalsAgainst > 0 ? 'text-zinc-400' : ''}`}
                    >
                      Clean Sheet (no goals conceded)
                    </Label>
                  </div>
                  {goalsAgainst && goalsAgainst > 0 && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Clean sheet is disabled when goals against is greater than 0
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* Assists */}
                  <div>
                    <Label htmlFor="assists">Assists</Label>
                    <Input
                      id="assists"
                      type="number"
                      {...register('assists', { valueAsNumber: true })}
                      min={0}
                      max={20}
                      placeholder="0"
                      className="mt-2 w-32"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Number of assists provided</p>
                    {errors.assists && (
                      <p className="text-sm text-red-600 mt-1">{errors.assists.message}</p>
                    )}
                  </div>

                  {/* Defensive Stats Section */}
                  <div className="pt-4 border-t border-zinc-200">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-4">Defensive Stats (Optional)</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tackles */}
                      <div>
                        <Label htmlFor="tackles">Tackles</Label>
                        <Input
                          id="tackles"
                          type="number"
                          {...register('tackles', { valueAsNumber: true })}
                          min={0}
                          max={50}
                          placeholder="0"
                          className="mt-2 w-full"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Successful tackles made</p>
                      </div>

                      {/* Interceptions */}
                      <div>
                        <Label htmlFor="interceptions">Interceptions</Label>
                        <Input
                          id="interceptions"
                          type="number"
                          {...register('interceptions', { valueAsNumber: true })}
                          min={0}
                          max={30}
                          placeholder="0"
                          className="mt-2 w-full"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Passes intercepted</p>
                      </div>

                      {/* Clearances */}
                      <div>
                        <Label htmlFor="clearances">Clearances</Label>
                        <Input
                          id="clearances"
                          type="number"
                          {...register('clearances', { valueAsNumber: true })}
                          min={0}
                          max={50}
                          placeholder="0"
                          className="mt-2 w-full"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Defensive clearances</p>
                      </div>

                      {/* Blocks */}
                      <div>
                        <Label htmlFor="blocks">Blocks</Label>
                        <Input
                          id="blocks"
                          type="number"
                          {...register('blocks', { valueAsNumber: true })}
                          min={0}
                          max={20}
                          placeholder="0"
                          className="mt-2 w-full"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Shots/crosses blocked</p>
                      </div>

                      {/* Aerial Duels Won */}
                      <div>
                        <Label htmlFor="aerialDuelsWon">Aerial Duels Won</Label>
                        <Input
                          id="aerialDuelsWon"
                          type="number"
                          {...register('aerialDuelsWon', { valueAsNumber: true })}
                          min={0}
                          max={30}
                          placeholder="0"
                          className="mt-2 w-full"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Headers won</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving game...' : 'Save Game'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
