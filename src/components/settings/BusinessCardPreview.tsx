'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import {
  Mail,
  Phone,
  MapPin,
  UserPlus,
  ExternalLink,
  Share2,
  Pencil,
} from 'lucide-react';
import type { Practitioner } from '@/types';

interface BusinessCardPreviewProps {
  practitioner: Practitioner;
  avatarUrl?: string | null;
  cardHeadline: string;
  onAvatarClick?: () => void;
  onShare?: () => void;
}

export default function BusinessCardPreview({
  practitioner,
  avatarUrl,
  cardHeadline,
  onAvatarClick,
  onShare,
}: BusinessCardPreviewProps) {
  const t = useTranslations('settings');

  const firstName = practitioner.profiles?.first_name ?? '';
  const lastName = practitioner.profiles?.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const specialty = practitioner.specialties?.name_fr || practitioner.specialties?.name || '';
  const orgName = practitioner.organizations?.name || '';
  const line = [practitioner.street_number, practitioner.address_line]
    .map((x) => (x || '').trim())
    .filter(Boolean)
    .join(' ');
  const address = [line, practitioner.city].filter(Boolean).join(', ');
  const hasEmail = !!practitioner.email?.trim();
  const hasPhone = !!practitioner.phone?.trim();
  const hasLinkedin = !!practitioner.linkedin_url?.trim();

  return (
    <div className="mx-auto w-full max-w-[360px]">
      <p className="mb-3 text-sm font-medium text-gray-700">{t('cardPreviewLabel')}</p>
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)] ring-1 ring-black/[0.04]">

        {/* Gradient header with decorative bubbles */}
        <div className="relative h-[140px] overflow-hidden bg-gradient-to-br from-[#11a89c] via-[#22c7b5] to-[#73ddd1]">
          <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/[0.08]" />
          <div className="absolute left-10 top-16 h-10 w-10 rounded-full bg-white/[0.06]" />
          <div className="absolute right-4 top-4 h-14 w-14 rounded-full bg-white/[0.07]" />
          <div className="absolute right-10 top-[70px] h-9 w-9 rounded-full bg-white/[0.06]" />

          {/* Logo */}
          <div className="absolute left-4 top-4">
            <div className="flex h-7 items-center rounded-md bg-white px-2.5">
              <span className="text-xs font-bold tracking-wide text-[#3f6f6e]">Dokal</span>
            </div>
          </div>

          {/* Share */}
          <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <Share2 className="h-3 w-3 text-white" />
          </div>

          {/* Wave bottom */}
          <div className="absolute -bottom-5 left-[-6%] right-[-6%] h-10 rounded-[50%] bg-white" />
        </div>

        {/* Avatar overlapping the wave */}
        <div className="relative -mt-10 flex justify-center">
          <button
            type="button"
            onClick={onAvatarClick}
            className="group relative rounded-full"
            title={t('cardEditAvatar')}
          >
            <Avatar
              src={avatarUrl}
              firstName={firstName}
              lastName={lastName}
              size="lg"
              className="h-[72px] w-[72px] border-[3px] border-white text-xl shadow-md"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/25">
              <Pencil className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-3 text-center">
          {/* Name */}
          <h3 className="text-lg font-bold text-[#101828]">
            {fullName || '—'}
          </h3>

          {/* Headline or specialty */}
          {cardHeadline ? (
            <p className="mt-0.5 text-sm font-semibold text-[#198f84]">{cardHeadline}</p>
          ) : specialty ? (
            <p className="mt-0.5 text-sm font-semibold text-[#198f84]">{specialty}</p>
          ) : null}

          {/* Organization */}
          {orgName && (
            <p className="mt-0.5 text-xs text-[#7a7f89]">{orgName}</p>
          )}

          {/* Contact icons */}
          {(hasLinkedin || hasEmail || hasPhone) && (
            <div className="mx-auto mt-4 flex items-start justify-center gap-5">
              {hasLinkedin && (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-[#2867B2] bg-white">
                    <Image src="/logo/social/linkedin.svg" alt="LinkedIn" width={18} height={18} />
                  </div>
                  <span className="text-[10px] text-[#5f6673]">LinkedIn</span>
                </div>
              )}
              {hasEmail && (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-[#d8a90d] bg-white text-[#d8a90d]">
                    <Mail className="h-[18px] w-[18px]" />
                  </div>
                  <span className="text-[10px] text-[#5f6673]">{t('cardEmailLabel')}</span>
                </div>
              )}
              {hasPhone && (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-[#d8a90d] bg-white text-[#d8a90d]">
                    <Phone className="h-[18px] w-[18px]" />
                  </div>
                  <span className="text-[10px] text-[#5f6673]">{t('cardPhoneLabel')}</span>
                </div>
              )}
            </div>
          )}

          {/* Save contact */}
          <div className="mt-4 flex h-10 items-center justify-center gap-2 rounded-full bg-[#0f9b88] text-xs font-semibold text-white shadow-sm">
            <UserPlus className="h-3.5 w-3.5" />
            <span>{t('cardSaveContact')}</span>
          </div>

          {/* Address */}
          {address && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-xs font-medium text-[#545b66]">{t('address')}</span>
                <MapPin className="h-3.5 w-3.5 text-[#159a8a]" />
              </div>
              <p className="mt-0.5 text-xs text-[#69707d]">{address}</p>
            </div>
          )}

          {/* Book appointment */}
          <div className="mt-3 flex h-10 items-center justify-center gap-2 rounded-full border-[1.5px] border-[#0f9b88] text-xs font-semibold text-[#0f9b88]">
            <span>{t('cardBookAppointment')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* Share button */}
      <button
        type="button"
        onClick={onShare}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary/90 active:bg-primary/80"
      >
        <Share2 className="h-5 w-5" />
        <span>{t('shareCard')}</span>
      </button>
    </div>
  );
}
