'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Player {
  id: string
  name: string
  position: string
}

export default function NewGamePage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    playerId: '',
    opponent: '',
    result: 'Win',
    finalScore: '',
    minutesPlayed: '',
    goals: '0',
    assists: '0',
    saves: '',
    goalsAgainst: '',
    cleanSheet: false
  })

  // Fetch players on mount (in production, this would filter by logged-in parent)
  useEffect(() => {
    fetch('/api/players')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.players)) {
          const mapped: Player[] = data.players.map((player: any) => ({
            id: player.id,
            name: player.name,
            position: player.position
          }))
          setPlayers(mapped)
          if (mapped.length > 0) {
            setFormData(prev => ({ ...prev, playerId: mapped[0].id }))
          }
        }
      })
      .catch(err => console.error('Failed to fetch players:', err))
  }, [])

  const selectedPlayer = players.find(p => p.id === formData.playerId)
  const isGoalkeeper = selectedPlayer?.position.toLowerCase().includes('goalkeeper') ||
                       selectedPlayer?.position.toLowerCase().includes('gk')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        playerId: formData.playerId,
        opponent: formData.opponent,
        result: formData.result,
        finalScore: formData.finalScore,
        minutesPlayed: parseInt(formData.minutesPlayed),
        goals: parseInt(formData.goals),
        assists: parseInt(formData.assists),
        ...(isGoalkeeper && {
          saves: formData.saves ? parseInt(formData.saves) : null,
          goalsAgainst: formData.goalsAgainst ? parseInt(formData.goalsAgainst) : null,
          cleanSheet: formData.cleanSheet
        })
      }

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create game log')
      }

      // Success - redirect to games list or show success message
      alert('Game logged successfully!')
      router.push('/games')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log game')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Log New Game</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Player Selection */}
            <div>
              <label htmlFor="playerId" className="block text-sm font-medium text-gray-700 mb-2">
                Player
              </label>
              <select
                id="playerId"
                value={formData.playerId}
                onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a player</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.position})
                  </option>
                ))}
              </select>
            </div>

            {/* Opponent */}
            <div>
              <label htmlFor="opponent" className="block text-sm font-medium text-gray-700 mb-2">
                Opponent
              </label>
              <input
                type="text"
                id="opponent"
                value={formData.opponent}
                onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                required
                placeholder="e.g., Lincoln High School"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Result */}
            <div>
              <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-2">
                Result
              </label>
              <select
                id="result"
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
                <option value="Tie">Tie</option>
              </select>
            </div>

            {/* Final Score */}
            <div>
              <label htmlFor="finalScore" className="block text-sm font-medium text-gray-700 mb-2">
                Final Score
              </label>
              <input
                type="text"
                id="finalScore"
                value={formData.finalScore}
                onChange={(e) => setFormData({ ...formData, finalScore: e.target.value })}
                required
                placeholder="e.g., 3-2"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Minutes Played */}
            <div>
              <label htmlFor="minutesPlayed" className="block text-sm font-medium text-gray-700 mb-2">
                Minutes Played
              </label>
              <input
                type="number"
                id="minutesPlayed"
                value={formData.minutesPlayed}
                onChange={(e) => setFormData({ ...formData, minutesPlayed: e.target.value })}
                required
                min="0"
                max="120"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Goals */}
            <div>
              <label htmlFor="goals" className="block text-sm font-medium text-gray-700 mb-2">
                Goals
              </label>
              <input
                type="number"
                id="goals"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Assists */}
            <div>
              <label htmlFor="assists" className="block text-sm font-medium text-gray-700 mb-2">
                Assists
              </label>
              <input
                type="number"
                id="assists"
                value={formData.assists}
                onChange={(e) => setFormData({ ...formData, assists: e.target.value })}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Goalkeeper-specific fields */}
            {isGoalkeeper && (
              <>
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Goalkeeper Stats</h2>

                  {/* Saves */}
                  <div className="mb-4">
                    <label htmlFor="saves" className="block text-sm font-medium text-gray-700 mb-2">
                      Saves
                    </label>
                    <input
                      type="number"
                      id="saves"
                      value={formData.saves}
                      onChange={(e) => setFormData({ ...formData, saves: e.target.value })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Goals Against */}
                  <div className="mb-4">
                    <label htmlFor="goalsAgainst" className="block text-sm font-medium text-gray-700 mb-2">
                      Goals Against
                    </label>
                    <input
                      type="number"
                      id="goalsAgainst"
                      value={formData.goalsAgainst}
                      onChange={(e) => setFormData({ ...formData, goalsAgainst: e.target.value })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Clean Sheet */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="cleanSheet"
                      checked={formData.cleanSheet}
                      onChange={(e) => setFormData({ ...formData, cleanSheet: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="cleanSheet" className="ml-2 block text-sm text-gray-700">
                      Clean Sheet
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || players.length === 0}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Logging Game...' : 'Log Game'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
