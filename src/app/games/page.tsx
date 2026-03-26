'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [playerId, setPlayerId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, get playerId from auth context or parent selection
    // For now, fetch all games or use a test player ID
    const testPlayerId = new URLSearchParams(window.location.search).get('playerId')

    if (testPlayerId) {
      setPlayerId(testPlayerId)
      fetchGames(testPlayerId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchGames = async (pid: string) => {
    try {
      const response = await fetch(`/api/games?playerId=${pid}`)
      const data = await response.json()
      setGames(data.games || [])
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Game Logs</h1>
          <Link
            href="/games/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Log New Game
          </Link>
        </div>

        {!playerId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-yellow-800">
              No player selected. Add <code className="bg-yellow-100 px-2 py-1 rounded">?playerId=xxx</code> to the URL to view games.
            </p>
          </div>
        )}

        {games.length === 0 && playerId && (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">No games logged yet.</p>
            <Link
              href="/games/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Log your first game →
            </Link>
          </div>
        )}

        {games.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {games.map((game) => (
                  <tr key={game.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(game.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {game.opponent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        game.result === 'Win' ? 'bg-green-100 text-green-800' :
                        game.result === 'Loss' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {game.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {game.finalScore}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {game.goals > 0 && <span className="mr-3">⚽ {game.goals}</span>}
                      {game.assists > 0 && <span className="mr-3">🎯 {game.assists}</span>}
                      {game.saves !== null && <span className="mr-3">🧤 {game.saves}</span>}
                      {game.cleanSheet && <span>🛡️ CS</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {game.verified ? (
                        <span className="text-green-600 text-sm">✓ Verified</span>
                      ) : (
                        <span className="text-yellow-600 text-sm">⏳ Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
