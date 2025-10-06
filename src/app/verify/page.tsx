'use client'

import { useEffect, useState } from 'react'

interface Game {
  id: string
  date: string
  opponent: string
  result: string
  finalScore: string
  minutesPlayed: number
  goals: number
  assists: number
  saves: number | null
  goalsAgainst: number | null
  cleanSheet: boolean | null
  verified: boolean
  player: {
    name: string
    position: string
  }
}

export default function VerifyPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingGameId, setVerifyingGameId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchUnverifiedGames()
  }, [])

  const fetchUnverifiedGames = async () => {
    try {
      // In production, get playerId from auth context
      const playerId = new URLSearchParams(window.location.search).get('playerId')

      if (!playerId) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/games?playerId=${playerId}`)
      const data = await response.json()

      // Filter for unverified games only
      const unverified = (data.games || []).filter((g: Game) => !g.verified)
      setGames(unverified)
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (gameId: string) => {
    setError('')
    setSuccess('')

    if (!pin || pin.length < 4) {
      setError('Please enter a valid PIN (4-6 digits)')
      return
    }

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, pin })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setSuccess('Game verified successfully!')
      setPin('')
      setVerifyingGameId(null)

      // Remove verified game from list
      setGames(games.filter(g => g.id !== gameId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  const playerId = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('playerId')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Verify Game Logs</h1>

          {!playerId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <p className="text-yellow-800">
                No player selected. Add <code className="bg-yellow-100 px-2 py-1 rounded">?playerId=xxx</code> to the URL.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {games.length === 0 && playerId && (
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">
                ✓ All games are verified!
              </p>
              <p className="text-gray-500 mt-2">
                No pending verifications at this time.
              </p>
            </div>
          )}

          {games.length > 0 && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                You have {games.length} game{games.length !== 1 ? 's' : ''} pending verification.
              </p>

              {games.map((game) => (
                <div
                  key={game.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {game.player.name} vs {game.opponent}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(game.date).toLocaleDateString()} • {game.player.position}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      game.result === 'Win' ? 'bg-green-100 text-green-800' :
                      game.result === 'Loss' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {game.result}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Final Score</p>
                      <p className="text-lg font-semibold">{game.finalScore}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Minutes</p>
                      <p className="text-lg font-semibold">{game.minutesPlayed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Goals</p>
                      <p className="text-lg font-semibold">{game.goals}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Assists</p>
                      <p className="text-lg font-semibold">{game.assists}</p>
                    </div>
                    {game.saves !== null && (
                      <div>
                        <p className="text-xs text-gray-500">Saves</p>
                        <p className="text-lg font-semibold">{game.saves}</p>
                      </div>
                    )}
                    {game.cleanSheet && (
                      <div>
                        <p className="text-xs text-gray-500">Clean Sheet</p>
                        <p className="text-lg font-semibold">✓</p>
                      </div>
                    )}
                  </div>

                  {verifyingGameId === game.id ? (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="Enter your 4-6 digit PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleVerify(game.id)}
                        className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => {
                          setVerifyingGameId(null)
                          setPin('')
                          setError('')
                        }}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setVerifyingGameId(game.id)}
                      className="w-full px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                    >
                      Verify with PIN
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
