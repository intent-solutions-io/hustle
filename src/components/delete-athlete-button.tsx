'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteAthleteButtonProps {
  athleteId: string;
  athleteName: string;
}

export function DeleteAthleteButton({ athleteId, athleteName }: DeleteAthleteButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/players/${athleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete athlete');
      }

      // Redirect to athletes list
      router.push('/dashboard/athletes');
      router.refresh();
    } catch (error) {
      console.error('Error deleting athlete:', error);
      alert('Failed to delete athlete. Please try again.');
      setDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
          {/* Warning Icon */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Delete Athlete</h3>
              <p className="text-sm text-zinc-600">This action cannot be undone</p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Are you sure you want to delete <strong>{athleteName}</strong>?
            </p>
            <p className="text-sm text-red-700 mt-2">
              This will permanently delete:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
              <li>Athlete profile</li>
              <li>All game logs</li>
              <li>All statistics</li>
              <li>Photo and personal information</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setShowConfirm(true)}
      variant="outline"
      className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
}
