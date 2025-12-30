'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, BookOpen, Plus, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { JournalEditor } from '@/components/journal/JournalEditor';
import type { JournalEntry, JournalContext, JournalMoodTag, JournalEnergyTag } from '@/types/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function JournalPage() {
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!playerId) return;
    fetchEntries();
  }, [playerId, contextFilter]);

  async function fetchEntries(cursor?: string) {
    if (!playerId) return;

    try {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (contextFilter !== 'all') params.set('context', contextFilter);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');

      const res = await fetch(`/api/players/${playerId}/journal?${params}`);
      if (!res.ok) throw new Error('Failed to fetch journal entries');

      const data = await res.json();

      if (cursor) {
        setEntries(prev => [...prev, ...data.entries]);
      } else {
        setEntries(data.entries);
      }
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  async function handleSaveEntry(data: {
    content: string;
    moodTag: JournalMoodTag | null;
    energyTag: JournalEnergyTag | null;
  }) {
    if (!playerId) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/players/${playerId}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content,
          context: 'daily_journal' as JournalContext,
          moodTag: data.moodTag,
          energyTag: data.energyTag,
          date: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Failed to save journal entry');

      setShowEditor(false);
      fetchEntries(); // Refresh list
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!playerId) return;

    try {
      const res = await fetch(`/api/players/${playerId}/journal/${entryId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete journal entry');

      setEntries(prev => prev.filter(e => e.id !== entryId));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  }

  if (!playerId) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/dream-gym"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dream Gym
        </Link>
        <Card className="border-zinc-200">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-600">Please select an athlete first.</p>
            <Link href="/dashboard/dream-gym">
              <Button className="mt-4">Go to Dream Gym</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/dream-gym?playerId=${playerId}`}
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dream Gym
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Training Journal
          </h1>
          <p className="text-zinc-600 mt-1">Track thoughts, reflections, and mental progress</p>
        </div>
        <Button className="gap-2" onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-600">Filter by context:</span>
        </div>
        <Select value={contextFilter} onValueChange={setContextFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Entries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entries</SelectItem>
            <SelectItem value="workout_reflection">Workout Reflections</SelectItem>
            <SelectItem value="mental_checkin">Mental Check-ins</SelectItem>
            <SelectItem value="game_reflection">Game Reflections</SelectItem>
            <SelectItem value="daily_journal">Daily Journal</SelectItem>
            <SelectItem value="quick_entry">Quick Entries</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-zinc-200">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">No Journal Entries Yet</h2>
            <p className="text-zinc-600 mb-6">
              Start journaling to track your mental game and workout reflections.
            </p>
            <Button onClick={() => setShowEditor(true)}>Write First Entry</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {entries.map(entry => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onDelete={() => handleDeleteEntry(entry.id)}
              />
            ))}
          </div>

          {nextCursor && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchEntries(nextCursor)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* New Entry Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !saving && setShowEditor(false)}
          />
          {/* Modal */}
          <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
            <div className="bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-lg font-semibold text-zinc-900">New Journal Entry</h2>
                <button
                  onClick={() => setShowEditor(false)}
                  disabled={saving}
                  className="p-1 text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <JournalEditor
                  context="daily_journal"
                  onSave={handleSaveEntry}
                  onCancel={() => setShowEditor(false)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
