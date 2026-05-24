'use client';

import { useState, useRef } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { useUserPhotoUpload } from '@/hooks/useUserPhotoUpload';
import { getInitials, getAvatarColor } from '@/lib/player-utils';
import { cn } from '@/lib/utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_DISPLAY: Record<string, string> = {
  free: '2 MB',
  starter: '5 MB',
  plus: '10 MB',
  pro: '20 MB',
};

interface UserProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  userName: string;
  plan: string;
  onUploadComplete?: (url: string) => void;
  onDeleteComplete?: () => void;
}

export function UserProfilePhotoUpload({
  currentPhotoUrl,
  userName,
  plan,
  onUploadComplete,
  onDeleteComplete,
}: UserProfilePhotoUploadProps) {
  const { uploadPhoto, deletePhoto, uploading, deleting, error } = useUserPhotoUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const result = await uploadPhoto(file);
      setPreviewUrl(result.url);
      // Notify header to re-fetch the session/profile photo.
      window.dispatchEvent(new Event('user-photo-updated'));
      onUploadComplete?.(result.url);
    } catch {
      // Revert preview on failure
      setPreviewUrl(currentPhotoUrl || null);
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async () => {
    try {
      await deletePhoto();
      setPreviewUrl(null);
      // Notify header to re-fetch the session/profile photo.
      window.dispatchEvent(new Event('user-photo-updated'));
      onDeleteComplete?.();
    } catch {
      // error state is handled by the hook
    }
  };

  const initials = getInitials(userName);
  const avatarColor = getAvatarColor(userName);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar with camera overlay */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative w-24 h-24 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'w-full h-full flex items-center justify-center text-white font-display font-semibold text-2xl',
                avatarColor
              )}
            >
              {initials}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        </button>

        {/* Delete button */}
        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md border border-zinc-200 flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            )}
          </button>
        )}
      </div>

      {/* Helper text */}
      <div className="text-center">
        <p className="font-body text-xs text-zinc-400">
          JPG, PNG, or WebP · Max {MAX_SIZE_DISPLAY[plan] || '2 MB'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="font-body text-xs text-red-500 text-center">{error}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
