'use client';

import { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft, Upload, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EditAthletePageProps {
  params: {
    id: string;
  };
}

interface PlayerData {
  id: string;
  name: string;
  birthday: string;
  position: string;
  teamClub: string;
  photoUrl: string | null;
}

export default function EditAthletePage({ params }: EditAthletePageProps) {
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    position: '',
    teamClub: '',
  });

  // Fetch existing athlete data
  useEffect(() => {
    async function fetchAthlete() {
      try {
        const response = await fetch(`/api/players`);
        if (!response.ok) throw new Error('Failed to fetch athletes');

        const data = await response.json();
        const athlete = data.players.find((p: PlayerData) => p.id === id);

        if (!athlete) {
          alert('Athlete not found');
          router.push('/dashboard/athletes');
          return;
        }

        // Pre-fill form
        setFormData({
          name: athlete.name,
          birthday: new Date(athlete.birthday).toISOString().split('T')[0],
          position: athlete.position,
          teamClub: athlete.teamClub,
        });

        // Set photo preview if exists
        if (athlete.photoUrl) {
          setPhotoPreview(athlete.photoUrl);
        }

        setFetching(false);
      } catch (error) {
        console.error('Error fetching athlete:', error);
        alert('Failed to load athlete data');
        setFetching(false);
      }
    }

    fetchAthlete();
  }, [id, router]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update player
      const playerResponse = await fetch(`/api/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!playerResponse.ok) {
        throw new Error('Failed to update player');
      }

      // Upload new photo if selected
      if (photo) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photo);
        photoFormData.append('playerId', id);

        const photoResponse = await fetch('/api/players/upload-photo', {
          method: 'POST',
          body: photoFormData,
        });

        if (!photoResponse.ok) {
          console.error('Failed to upload photo');
        }
      }

      // Redirect to athlete detail
      router.push(`/dashboard/athletes/${id}`);
    } catch (error) {
      console.error('Error updating athlete:', error);
      alert('Failed to update athlete. Please try again.');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900 mx-auto mb-4" />
          <p className="text-zinc-600">Loading athlete data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/dashboard/athletes/${id}`}
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Athlete
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900">Edit Athlete</h1>
          <p className="text-zinc-600 mt-1">Update athlete profile information</p>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
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
                {photoPreview ? 'Change Photo' : 'Upload Photo'}
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

          {/* Position */}
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-zinc-900 mb-2">
              Position <span className="text-red-500">*</span>
            </label>
            <select
              id="position"
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            >
              <option value="">Select position</option>
              <option value="Forward">Forward</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Defender">Defender</option>
              <option value="Goalkeeper">Goalkeeper</option>
            </select>
          </div>

          {/* Team/Club */}
          <div>
            <label htmlFor="teamClub" className="block text-sm font-medium text-zinc-900 mb-2">
              Team/Club <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="teamClub"
              required
              value={formData.teamClub}
              onChange={(e) => setFormData({ ...formData, teamClub: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="City Soccer Club"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-zinc-900 text-white px-6 py-3 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <Link
              href={`/dashboard/athletes/${id}`}
              className="px-6 py-3 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
