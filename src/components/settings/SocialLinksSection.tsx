'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import Image from 'next/image';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  CreditCard,
  Globe,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { useUpdateSocialLinks, getCardUrl } from '@/hooks/useBusinessCard';
import { useUploadProfileAvatar } from '@/hooks/useSettings';
import { useToast } from '@/providers/ToastProvider';
import { useAuth } from '@/providers/AuthProvider';
import BusinessCardPreview from './BusinessCardPreview';
import type { Practitioner } from '@/types';

function SocialLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Image src={icon} alt="" width={18} height={18} className="shrink-0" />
      <span>{label}</span>
    </span>
  );
}

/** Normalise une URL en ajoutant https:// si le protocole est absent. */
function ensureHttps(value: string | null | undefined): string | null {
  const s = (value ?? '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/** Normalise l'URL au blur si l'utilisateur a oublié https:// */
function handleUrlBlur(setter: (v: string) => void, value: string) {
  const trimmed = value.trim();
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    setter(`https://${trimmed}`);
  }
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const OUTPUT_SIZE = 1024;

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
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outputSize, outputSize);
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (!blob) reject(new Error('blob_failed')); else resolve(blob); },
      'image/jpeg',
      0.92,
    );
  });
}

interface SocialLinksSectionProps {
  practitioner: Practitioner;
  avatarUrl?: string | null;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export default function SocialLinksSection({ practitioner, avatarUrl, t, tc }: SocialLinksSectionProps) {
  const toast = useToast();
  const { refreshUserData } = useAuth();
  const updateSocialLinks = useUpdateSocialLinks();
  const uploadAvatar = useUploadProfileAvatar();
  const [copied, setCopied] = useState(false);

  // Avatar crop state
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [avatarPreparing, setAvatarPreparing] = useState(false);

  const cleanupObjectUrl = useCallback(() => {
    setObjectUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
  }, []);

  useEffect(() => () => cleanupObjectUrl(), [cleanupObjectUrl]);

  const closeCropDialog = () => {
    setCropDialogOpen(false);
    cleanupObjectUrl();
    setCrop({ x: 0, y: 0 });
    setZoom(1.2);
    setCroppedAreaPixels(null);
    setAvatarPreparing(false);
  };

  const onAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error(t('avatarUploadErrorTitle'), t('avatarInvalidType')); return; }
    if (file.size > MAX_FILE_SIZE_BYTES) { toast.error(t('avatarUploadErrorTitle'), t('avatarTooLarge')); return; }
    cleanupObjectUrl();
    setObjectUrl(URL.createObjectURL(file));
    setCropDialogOpen(true);
  };

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleAvatarUpload = async () => {
    if (!objectUrl || !croppedAreaPixels) return;
    setAvatarPreparing(true);
    try {
      const blob = await cropToBlob(objectUrl, croppedAreaPixels);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await uploadAvatar.mutateAsync(file);
      await refreshUserData();
      toast.success(t('avatarUploadSuccess'));
      closeCropDialog();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(t('avatarUploadErrorTitle'), msg || t('avatarUploadError'));
    } finally {
      setAvatarPreparing(false);
    }
  };

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [wazeLink, setWazeLink] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [cardHeadline, setCardHeadline] = useState('');

  useEffect(() => {
    if (practitioner) {
      setWebsiteUrl(practitioner.website_url || '');
      setFacebookUrl(practitioner.facebook_url || '');
      setInstagramUrl(practitioner.instagram_url || '');
      setWhatsappNumber(practitioner.whatsapp_number || '');
      setLinkedinUrl(practitioner.linkedin_url || '');
      setTiktokUrl(practitioner.tiktok_url || '');
      setYoutubeUrl(practitioner.youtube_url || '');
      setWazeLink(practitioner.waze_link || '');
      setGoogleMapsLink(practitioner.google_maps_link || '');
      setCardHeadline(practitioner.card_headline || '');
    }
  }, [practitioner]);

  const handleSave = async () => {
    try {
      await updateSocialLinks.mutateAsync({
        website_url: ensureHttps(websiteUrl),
        facebook_url: ensureHttps(facebookUrl),
        instagram_url: ensureHttps(instagramUrl),
        whatsapp_number: whatsappNumber?.trim() || null,
        linkedin_url: ensureHttps(linkedinUrl),
        tiktok_url: ensureHttps(tiktokUrl),
        youtube_url: ensureHttps(youtubeUrl),
        waze_link: ensureHttps(wazeLink),
        google_maps_link: ensureHttps(googleMapsLink),
        card_headline: cardHeadline?.trim() || null,
      });
      toast.success(t('saved'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(tc('saveErrorTitle'), msg || tc('saveError'));
    }
  };

  const cardUrl = getCardUrl(practitioner.id, practitioner.card_slug);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('linkCopied'));
    } catch {
      toast.error(tc('saveErrorTitle'), tc('saveError'));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      const name = `Dr. ${practitioner.profiles?.first_name ?? ''} ${practitioner.profiles?.last_name ?? ''}`.trim();
      try {
        await navigator.share({
          title: name,
          text: cardHeadline || name,
          url: cardUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopyLink();
    }
  };

  const isAvatarBusy = uploadAvatar.isPending || avatarPreparing;

  return (
    <div className="space-y-6">
      {/* Live card preview */}
      <BusinessCardPreview
        practitioner={practitioner}
        avatarUrl={avatarUrl}
        cardHeadline={cardHeadline}
        onAvatarClick={() => avatarInputRef.current?.click()}
        onShare={handleShare}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onAvatarFileChange}
      />

      {/* Avatar crop dialog */}
      <Dialog
        open={cropDialogOpen}
        onClose={() => { if (!isAvatarBusy) closeCropDialog(); }}
        title={t('avatarCropTitle')}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">{t('avatarCropHint')}</div>
          <div className="relative w-full h-[360px] bg-gray-100 rounded-2xl overflow-hidden">
            {objectUrl && (
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
            )}
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-700">{t('avatarZoom')}</div>
            <input
              type="range" min={1} max={3} step={0.01} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
              disabled={isAvatarBusy}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeCropDialog} disabled={isAvatarBusy}>
              {tc('cancel')}
            </Button>
            <Button type="button" onClick={handleAvatarUpload} loading={uploadAvatar.isPending} disabled={!croppedAreaPixels || avatarPreparing}>
              {t('avatarCropSave')}
            </Button>
          </div>
        </div>
      </Dialog>

    <Card className="settings-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="h-4 w-4" />
          </div>
          {t('businessCardTitle')}
        </CardTitle>
      </CardHeader>
      <div className="space-y-5">
        {/* Card URL Preview */}
        <div className="rounded-xl bg-muted/40 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">{t('cardLinkLabel')}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white border border-border px-3 py-2 text-sm text-gray-600">
              {cardUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              {t('shareCard')}
            </Button>
            <a href={cardUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
                {t('previewCard')}
              </Button>
            </a>
          </div>
        </div>

        {/* Card customization */}
        <Input
          label={t('cardHeadline')}
          value={cardHeadline}
          onChange={(e) => setCardHeadline(e.target.value)}
          placeholder={t('cardHeadlinePlaceholder')}
          maxLength={120}
        />

        <div className="h-px bg-border/50" />

        {/* Social links */}
        <h4 className="text-sm font-semibold text-gray-700">{t('socialLinksTitle')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('whatsapp')}
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder={t('placeholderWhatsapp')}
          />
          <Input
            label={<SocialLabel icon="/logo/social/facebook.svg" label="Facebook" />}
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            onBlur={(e) => handleUrlBlur(setFacebookUrl, e.target.value)}
            placeholder={t('placeholderSocialFacebook')}
          />
          <Input
            label={<SocialLabel icon="/logo/social/instagram.svg" label="Instagram" />}
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            onBlur={(e) => handleUrlBlur(setInstagramUrl, e.target.value)}
            placeholder={t('placeholderSocialInstagram')}
          />
          <Input
            label={<SocialLabel icon="/logo/social/linkedin.svg" label="LinkedIn" />}
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            onBlur={(e) => handleUrlBlur(setLinkedinUrl, e.target.value)}
            placeholder={t('placeholderSocialLinkedin')}
          />
          <Input
            label={
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                <span>{t('website')}</span>
              </span>
            }
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            onBlur={(e) => handleUrlBlur(setWebsiteUrl, e.target.value)}
            placeholder={t('placeholderWebsiteUrl')}
          />
          <Input
            label={<SocialLabel icon="/logo/social/tiktok.svg" label="TikTok" />}
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            onBlur={(e) => handleUrlBlur(setTiktokUrl, e.target.value)}
            placeholder={t('placeholderSocialTiktok')}
          />
          <Input
            label={<SocialLabel icon="/logo/social/youtube.svg" label="YouTube" />}
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onBlur={(e) => handleUrlBlur(setYoutubeUrl, e.target.value)}
            placeholder={t('placeholderSocialYoutube')}
          />
        </div>

        <div className="h-px bg-border/50" />

        {/* Navigation links */}
        <h4 className="text-sm font-semibold text-gray-700">{t('navigationLinksTitle')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={<SocialLabel icon="/logo/social/waze.svg" label="Waze" />}
            value={wazeLink}
            onChange={(e) => setWazeLink(e.target.value)}
            onBlur={(e) => handleUrlBlur(setWazeLink, e.target.value)}
            placeholder={t('placeholderWaze')}
          />
          <Input
            label={<SocialLabel icon="/logo/social/google_maps.svg" label="Google Maps" />}
            value={googleMapsLink}
            onChange={(e) => setGoogleMapsLink(e.target.value)}
            onBlur={(e) => handleUrlBlur(setGoogleMapsLink, e.target.value)}
            placeholder={t('placeholderGoogleMaps')}
          />
        </div>

        <div className="flex items-center justify-end pt-1">
          <Button onClick={handleSave} loading={updateSocialLinks.isPending}>
            {tc('save')}
          </Button>
        </div>
      </div>
    </Card>
    </div>
  );
}
