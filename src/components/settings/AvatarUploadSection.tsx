'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useUploadProfileAvatar } from '@/hooks/useSettings';
import { useToast } from '@/providers/ToastProvider';
import { useAuth } from '@/providers/AuthProvider';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const OUTPUT_SIZE = 1024; // px (square)

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image_load_failed'));
    img.src = src;
  });
}

async function cropToBlob(imageSrc: string, crop: Area, outputSize = OUTPUT_SIZE): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_not_supported');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // react-easy-crop gives pixel coords in the image's natural coordinate space.
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('blob_failed'));
        else resolve(blob);
      },
      'image/jpeg',
      0.92,
    );
  });
}

export default function AvatarUploadSection({
  avatarUrl,
  firstName,
  lastName,
}: {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const toast = useToast();
  const { refreshUserData } = useAuth();
  const uploadAvatar = useUploadProfileAvatar();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('avatar.jpg');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [localError, setLocalError] = useState<string>('');
  const [preparing, setPreparing] = useState(false);

  const isBusy = uploadAvatar.isPending || preparing;

  const buttonLabel = useMemo(() => {
    return avatarUrl ? t('avatarChange') : t('avatarAdd');
  }, [avatarUrl, t]);

  const cleanupObjectUrl = useCallback(() => {
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => cleanupObjectUrl();
  }, [cleanupObjectUrl]);

  const closeDialog = () => {
    setDialogOpen(false);
    cleanupObjectUrl();
    setCrop({ x: 0, y: 0 });
    setZoom(1.2);
    setCroppedAreaPixels(null);
    setLocalError('');
    setPreparing(false);
  };

  const onPickFile = () => {
    inputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError('');
    const file = e.target.files?.[0] || null;
    // Allow re-selecting same file later
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLocalError(t('avatarInvalidType'));
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError(t('avatarTooLarge'));
      return;
    }

    cleanupObjectUrl();
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setFileName(file.name || 'avatar.jpg');
    setDialogOpen(true);
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleUpload = async () => {
    if (!objectUrl || !croppedAreaPixels) return;

    setLocalError('');
    setPreparing(true);
    try {
      const blob = await cropToBlob(objectUrl, croppedAreaPixels);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

      await uploadAvatar.mutateAsync(file);
      await refreshUserData();

      toast.success(t('avatarUploadSuccess'), t('avatarUploadProcessingHint'));
      closeDialog();
    } catch (err: unknown) {
      // Keep the dialog open so the user can retry.
      const maybeAxios = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = maybeAxios?.response?.data?.error?.message || t('avatarUploadError');
      toast.error(t('avatarUploadErrorTitle'), msg);
      setLocalError(msg);
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <Avatar src={avatarUrl} firstName={firstName} lastName={lastName} size="lg" className="h-14 w-14" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900">{t('avatarTitle')}</div>
          <div className="text-xs text-muted-foreground">{t('avatarSubtitle')}</div>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-start sm:items-end gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onPickFile} disabled={isBusy}>
            {buttonLabel}
          </Button>
        </div>
        {localError ? <p className="text-xs text-destructive">{localError}</p> : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
          aria-label={t('avatarFileInputLabel')}
        />
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (isBusy) return;
          closeDialog();
        }}
        title={t('avatarCropTitle')}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">{t('avatarCropHint')}</div>

          <div className="relative w-full h-[360px] bg-gray-100 rounded-2xl overflow-hidden">
            {objectUrl ? (
              <Cropper
                image={objectUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700">{t('avatarZoom')}</div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label={t('avatarZoom')}
                disabled={isBusy}
              />
            </div>
            <div className="text-xs text-muted-foreground sm:text-right truncate" title={fileName}>
              {fileName}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeDialog} disabled={isBusy}>
              {tc('cancel')}
            </Button>
            <Button type="button" onClick={handleUpload} loading={isBusy} disabled={!croppedAreaPixels}>
              {t('avatarCropSave')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

