'use client';

import { useState, useEffect } from 'react';
import {
  Globe,
  Share2,
  Copy,
  Check,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useUpdateSocialLinks, getCardUrl } from '@/hooks/useBusinessCard';
import { useToast } from '@/providers/ToastProvider';
import type { Practitioner } from '@/types';

interface SocialLinksSectionProps {
  practitioner: Practitioner;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export default function SocialLinksSection({ practitioner, t, tc }: SocialLinksSectionProps) {
  const toast = useToast();
  const updateSocialLinks = useUpdateSocialLinks();
  const [copied, setCopied] = useState(false);

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
  const [cardSlug, setCardSlug] = useState('');

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
      setCardSlug(practitioner.card_slug || '');
    }
  }, [practitioner]);

  const handleSave = async () => {
    try {
      await updateSocialLinks.mutateAsync({
        website_url: websiteUrl || null,
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        whatsapp_number: whatsappNumber || null,
        linkedin_url: linkedinUrl || null,
        tiktok_url: tiktokUrl || null,
        youtube_url: youtubeUrl || null,
        waze_link: wazeLink || null,
        google_maps_link: googleMapsLink || null,
        card_headline: cardHeadline || null,
        card_slug: cardSlug || null,
      });
      toast.success(t('saved'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(tc('saveErrorTitle'), msg || tc('saveError'));
    }
  };

  const cardUrl = getCardUrl(practitioner.id, cardSlug || practitioner.card_slug);

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

  return (
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
        <div className="space-y-4">
          <Input
            label={t('cardHeadline')}
            value={cardHeadline}
            onChange={(e) => setCardHeadline(e.target.value)}
            placeholder={t('cardHeadlinePlaceholder')}
            maxLength={120}
          />
          <Input
            label={t('cardSlug')}
            value={cardSlug}
            onChange={(e) => setCardSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="dr-prenom-nom"
          />
        </div>

        <div className="h-px bg-border/50" />

        {/* Social links */}
        <h4 className="text-sm font-semibold text-gray-700">{t('socialLinksTitle')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('whatsapp')}
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+972501234567"
          />
          <Input
            label="Facebook"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder="https://facebook.com/..."
          />
          <Input
            label="Instagram"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/..."
          />
          <Input
            label="LinkedIn"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
          <Input
            label={t('website')}
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
          />
          <Input
            label="TikTok"
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            placeholder="https://tiktok.com/@..."
          />
          <Input
            label="YouTube"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/..."
          />
        </div>

        <div className="h-px bg-border/50" />

        {/* Navigation links */}
        <h4 className="text-sm font-semibold text-gray-700">{t('navigationLinksTitle')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Waze"
            value={wazeLink}
            onChange={(e) => setWazeLink(e.target.value)}
            placeholder="https://waze.com/ul/..."
          />
          <Input
            label="Google Maps"
            value={googleMapsLink}
            onChange={(e) => setGoogleMapsLink(e.target.value)}
            placeholder="https://maps.google.com/..."
          />
        </div>

        <div className="flex items-center justify-end pt-1">
          <Button onClick={handleSave} loading={updateSocialLinks.isPending}>
            {tc('save')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
