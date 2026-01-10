'use client';

import { useState, FormEvent } from 'react';
import { ArrowLeft, Upload, User } from 'lucide-react';
import Link from 'next/link';
import { playerSchema } from '@/lib/validations/player';
import { LEAGUE_LABELS, POSITION_LABELS } from '@/types/league';
import type { SoccerPositionCode, PlayerGender } from '@/types/firestore';
import type { LeagueCode } from '@/types/league';

export default function AddAthlete() {
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    gender: '' as PlayerGender | '',
    primaryPosition: '' as SoccerPositionCode | '',
    secondaryPositions: [] as SoccerPositionCode[],
    positionNote: '',
    leagueCode: '' as LeagueCode | '',
    leagueOtherName: '',
    teamClub: '',
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSecondaryPositionToggle = (position: SoccerPositionCode) => {
    setFormData((prev) => {
      const isSelected = prev.secondaryPositions.includes(position);
      const newSecondary = isSelected
        ? prev.secondaryPositions.filter((p) => p !== position)
        : [...prev.secondaryPositions, position];
      return { ...prev, secondaryPositions: newSecondary };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGeneralError(null);

    try {
      // Validate form data with Zod
      const validatedData = playerSchema.parse(formData);

      // Create player first
      const playerResponse = await fetch('/api/players/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!playerResponse.ok) {
        // Try to get error details from API response
        let errorMessage = 'Failed to create player';
        try {
          const errorData = await playerResponse.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = `Failed to create player: ${playerResponse.status} ${playerResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const { player } = await playerResponse.json();

      // Upload photo if selected
      if (photo && player.id) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photo);
        photoFormData.append('playerId', player.id);

        const photoResponse = await fetch('/api/players/upload-photo', {
          method: 'POST',
          body: photoFormData,
        });

        if (!photoResponse.ok) {
          console.error('Failed to upload photo');
        }
      }

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        // Zod validation error
        const zodError = error as any;
        const fieldErrors: Record<string, string> = {};
        zodError.issues.forEach((issue: any) => {
          const path = issue.path.join('.');
          fieldErrors[path] = issue.message;
        });
        setErrors(fieldErrors);
      } else {
        console.error('Error creating athlete:', error);
        // Show visible error in DOM instead of alert for better testability
        setGeneralError('Failed to create athlete. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900">Add Athlete</h1>
          <p className="text-zinc-600 mt-1">Add a new athlete to track their performance</p>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
          {/* General Error Banner */}
          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
              <p className="font-medium">Error</p>
              <p className="text-sm">{generalError}</p>
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Athlete Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-zinc-400" />
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors">
                <Upload className="w-4 h-4" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Optional. JPEG, PNG, or WebP (max 5MB)</p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-900 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          {/* Birthday */}
          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-zinc-900 mb-2">
              Birthday <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="birthday"
              required
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as PlayerGender })}
                  className="w-4 h-4 text-zinc-900 focus:ring-zinc-900"
                />
                <span className="text-sm text-zinc-700">Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as PlayerGender })}
                  className="w-4 h-4 text-zinc-900 focus:ring-zinc-900"
                />
                <span className="text-sm text-zinc-700">Female</span>
              </label>
            </div>
            {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
          </div>

          {/* Primary Position */}
          <div>
            <label htmlFor="primaryPosition" className="block text-sm font-medium text-zinc-900 mb-2">
              Primary Position <span className="text-red-500">*</span>
            </label>
            <select
              id="primaryPosition"
              value={formData.primaryPosition}
              onChange={(e) => setFormData({ ...formData, primaryPosition: e.target.value as SoccerPositionCode })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            >
              <option value="">Select Primary Position</option>
              {Object.entries(POSITION_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            {errors.primaryPosition && <p className="text-red-500 text-sm mt-1">{errors.primaryPosition}</p>}
          </div>

          {/* Secondary Positions */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Secondary Positions (Optional, max 3)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(POSITION_LABELS)
                .filter(([code]) => code !== formData.primaryPosition)
                .map(([code, label]) => (
                  <label key={code} className="flex items-center gap-2 cursor-pointer p-2 rounded border border-zinc-200 hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={formData.secondaryPositions.includes(code as SoccerPositionCode)}
                      onChange={() => handleSecondaryPositionToggle(code as SoccerPositionCode)}
                      disabled={
                        formData.secondaryPositions.length >= 3 &&
                        !formData.secondaryPositions.includes(code as SoccerPositionCode)
                      }
                      className="w-4 h-4 text-zinc-900 focus:ring-zinc-900 rounded"
                    />
                    <span className="text-sm text-zinc-700">{label}</span>
                  </label>
                ))}
            </div>
            {errors.secondaryPositions && <p className="text-red-500 text-sm mt-1">{errors.secondaryPositions}</p>}
          </div>

          {/* Position Note */}
          <div>
            <label htmlFor="positionNote" className="block text-sm font-medium text-zinc-900 mb-2">
              Position Note (Optional)
            </label>
            <input
              type="text"
              id="positionNote"
              value={formData.positionNote}
              onChange={(e) => setFormData({ ...formData, positionNote: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="e.g., Can play both CB and DM"
              maxLength={100}
            />
            {errors.positionNote && <p className="text-red-500 text-sm mt-1">{errors.positionNote}</p>}
          </div>

          {/* League */}
          <div>
            <label htmlFor="leagueCode" className="block text-sm font-medium text-zinc-900 mb-2">
              League <span className="text-red-500">*</span>
            </label>
            <select
              id="leagueCode"
              value={formData.leagueCode}
              onChange={(e) => setFormData({ ...formData, leagueCode: e.target.value as LeagueCode })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            >
              <option value="">Select League</option>
              {Object.entries(LEAGUE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            {errors.leagueCode && <p className="text-red-500 text-sm mt-1">{errors.leagueCode}</p>}
          </div>

          {/* Other League Name (conditional) */}
          {formData.leagueCode === 'other' && (
            <div>
              <label htmlFor="leagueOtherName" className="block text-sm font-medium text-zinc-900 mb-2">
                League Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="leagueOtherName"
                value={formData.leagueOtherName}
                onChange={(e) => setFormData({ ...formData, leagueOtherName: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                placeholder="Type your league name (e.g., Local Elite League)"
                maxLength={100}
              />
              {errors.leagueOtherName && <p className="text-red-500 text-sm mt-1">{errors.leagueOtherName}</p>}
            </div>
          )}

          {/* Team/Club */}
          <div>
            <label htmlFor="teamClub" className="block text-sm font-medium text-zinc-900 mb-2">
              Team/Club <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="teamClub"
              value={formData.teamClub}
              onChange={(e) => setFormData({ ...formData, teamClub: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="Elite FC"
              maxLength={100}
            />
            {errors.teamClub && <p className="text-red-500 text-sm mt-1">{errors.teamClub}</p>}
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Athlete...' : 'Add Athlete'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
