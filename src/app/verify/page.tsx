'use client'

import { useEffect, useState } from 'react'

interface PlayerOption {
  id: string
  name: string
  pendingCount: number
}

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
  const [players, setPlayers] = useState<PlayerOption[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [loadingGames, setLoadingGames] = useState(false)
  const [verifyingGameId, setVerifyingGameId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const initialParams = new URLSearchParams(window.location.search)
    const initialPlayerId = initialParams.get('playerId')

    const loadPlayers = async () => {
      try {
        const response = await fetch('/api/players')
        if (!response.ok) {
          throw new Error('Unable to load athletes')
        }
        const data = await response.json()
        const rawPlayers: Array<{ id: string; name: string; pendingGames?: number }> = Array.isArray(data.players)
          ? data.players
          : []

        const mapped: PlayerOption[] = rawPlayers.map((player) => ({
          id: player.id,
          name: player.name,
          pendingCount: typeof player.pendingGames === 'number' ? player.pendingGames : 0
        }))
        setPlayers(mapped)

        if (initialPlayerId && mapped.some((p) => p.id === initialPlayerId)) {
          setSelectedPlayerId(initialPlayerId)
          return
        }

        const firstWithPending = mapped.find((player) => player.pendingCount > 0)
        if (firstWithPending) {
          setSelectedPlayerId(firstWithPending.id)
        } else if (mapped.length > 0) {
          setSelectedPlayerId(mapped[0].id)
        } else {
          setSelectedPlayerId(null)
        }
      } catch (err) {
        console.error('Failed to load players', err)
        setError('Unable to load athletes for verification')
      } finally {
        setLoadingPlayers(false)
      }
    }

    loadPlayers()
  }, [])

  useEffect(() => {
    const fetchUnverifiedGames = async (playerId: string | null) => {
      if (!playerId) {
        setGames([])
        return
      }

      try {
        setLoadingGames(true)
        const response = await fetch(`/api/games?playerId=${encodeURIComponent(playerId)}`)
        const data = await response.json()
        const unverified = (data.games || []).filter((g: Game) => !g.verified)
        setGames(unverified)
        window.history.replaceState(null, '', `?playerId=${playerId}`)
      } catch (err) {
        console.error('Failed to fetch games:', err)
        setError('Unable to fetch games for verification')
      } finally {
        setLoadingGames(false)
      }
    }

    fetchUnverifiedGames(selectedPlayerId)
  }, [selectedPlayerId])

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

  if (loadingPlayers) {
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

          {players.length > 0 ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select athlete</label>
              <select
                value={selectedPlayerId ?? ''}
                onChange={(event) => {
                  setSelectedPlayerId(event.target.value || null)
                  setVerifyingGameId(null)
                  setPin('')
                  setSuccess('')
                  setError('')
                }}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} {player.pendingCount > 0 ? `(${player.pendingCount} pending)` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <p className="text-yellow-800">
                Add your first athlete to start logging games and verification requests.
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

          {loadingGames && selectedPlayerId && (
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">Loading pending games…</p>
            </div>
          )}

          {games.length === 0 && !loadingGames && selectedPlayerId && (
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">
                ✓ All games are verified!
              </p>
              <p className="text-gray-500 mt-2">
                No pending verifications at this time.
              </p>
            </div>
          )}

          {games.length > 0 && !loadingGames && (
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
