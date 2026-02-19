'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useUploadProfileAvatar, useDeleteProfileAvatar } from '@/hooks/useSettings';
import { useToast } from '@/providers/ToastProvider';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const OUTPUT_SIZE = 1024; // px (square)

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = document.createElement('img');
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
  const deleteAvatar = useDeleteProfileAvatar();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('avatar.jpg');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [localError, setLocalError] = useState<string>('');
  const [preparing, setPreparing] = useState(false);

  const isBusy = uploadAvatar.isPending || preparing || deleteAvatar.isPending;
  const hasAvatar = !!avatarUrl;

  const buttonLabel = useMemo(() => {
    return hasAvatar ? t('avatarChange') : t('avatarAdd');
  }, [hasAvatar, t]);

  const cleanupObjectUrl = useCallback(() => {
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => cleanupObjectUrl();
  }, [cleanupObjectUrl]);

  const closeCropDialog = () => {
    setCropDialogOpen(false);
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
    setCropDialogOpen(true);
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
      closeCropDialog();
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = maybeAxios?.response?.data?.error?.message || t('avatarUploadError');
      toast.error(t('avatarUploadErrorTitle'), msg);
      setLocalError(msg);
    } finally {
      setPreparing(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAvatar.mutateAsync();
      await refreshUserData();
      setPreviewDialogOpen(false);
      setDeleteConfirmOpen(false);
      toast.success(t('avatarDeletedSuccess'));
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(t('avatarUploadErrorTitle'), maybeAxios?.response?.data?.error?.message || t('avatarUploadError'));
    }
  };

  const handleEditFromPreview = () => {
    setPreviewDialogOpen(false);
    onPickFile();
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-4 transition-colors',
        !hasAvatar && 'border-2 border-destructive/50 bg-destructive/5'
      )}
    >
      {!hasAvatar && (
        <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-medium">
          {t('avatarMissingNotice')}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="button"
          onClick={() => hasAvatar && setPreviewDialogOpen(true)}
          className={cn(
            'flex items-center gap-4 w-full sm:w-auto text-left',
            hasAvatar && 'cursor-pointer hover:opacity-90 transition-opacity'
          )}
          disabled={!hasAvatar}
        >
          <div className="relative shrink-0">
            <Avatar src={avatarUrl} firstName={firstName} lastName={lastName} size="lg" className="h-14 w-14" />
            {hasAvatar && (
              <span
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 hover:bg-black/20 transition-colors"
                aria-hidden
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">{t('avatarTitle')}</div>
            <div className="text-xs text-muted-foreground">{t('avatarSubtitle')}</div>
          </div>
        </button>

        <div className="flex-1" />

        <div className="flex flex-col items-start sm:items-end gap-2">
          <Button type="button" variant="outline" onClick={onPickFile} disabled={isBusy}>
            {buttonLabel}
          </Button>
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
      </div>

      {/* Crop dialog */}
      <Dialog
        open={cropDialogOpen}
        onClose={() => {
          if (isBusy) return;
          closeCropDialog();
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
            <Button type="button" variant="ghost" onClick={closeCropDialog} disabled={isBusy}>
              {tc('cancel')}
            </Button>
            <Button type="button" onClick={handleUpload} loading={uploadAvatar.isPending} disabled={!croppedAreaPixels || preparing}>
              {uploadAvatar.isPending ? t('avatarImproving') : t('avatarCropSave')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Preview full-size dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} title={t('avatarViewFull')} className="max-w-md">
        <div className="space-y-4">
          {avatarUrl && (
            <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-gray-100">
              <Image src={avatarUrl} alt={t('avatarTitle')} fill className="object-cover" sizes="400px" unoptimized />
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button type="button" variant="outline" onClick={handleEditFromPreview} disabled={isBusy}>
              <Pencil className="h-4 w-4" />
              {t('avatarEdit')}
            </Button>
            <Button type="button" variant="destructive" onClick={() => setDeleteConfirmOpen(true)} disabled={isBusy}>
              <Trash2 className="h-4 w-4" />
              {t('avatarDelete')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={t('avatarDelete')}
        className="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('avatarDeleteConfirm')}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteAvatar.isPending}>
              {tc('cancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} loading={deleteAvatar.isPending}>
              {tc('delete')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
