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
}

export default function BusinessCardPreview({
  practitioner,
  avatarUrl,
  cardHeadline,
  onAvatarClick,
}: BusinessCardPreviewProps) {
  const t = useTranslations('settings');

  const firstName = practitioner.profiles?.first_name ?? '';
  const lastName = practitioner.profiles?.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const specialty = practitioner.specialties?.name_fr || practitioner.specialties?.name || '';
  const orgName = practitioner.organizations?.name || '';
  const address = [practitioner.address_line, practitioner.city].filter(Boolean).join(', ');
  const hasEmail = !!practitioner.email?.trim();
  const hasPhone = !!practitioner.phone?.trim();
  const hasLinkedin = !!practitioner.linkedin_url?.trim();

  return (
    <div className="mx-auto w-full max-w-[390px]">
      <p className="mb-3 text-sm font-medium text-gray-700">{t('cardPreviewLabel')}</p>
      <div className="overflow-hidden rounded-[30px] border border-black/5 bg-[#f6f6f7] shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
        {/* Header with gradient + bubbles + white wave */}
        <div className="relative h-[260px] bg-gradient-to-br from-[#11a89c] via-[#22c7b5] to-[#73ddd1]">
          <div className="absolute -left-8 -top-10 h-44 w-44 rounded-full bg-white/16" />
          <div className="absolute left-8 top-24 h-20 w-20 rounded-full bg-white/12" />
          <div className="absolute right-2 top-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute right-8 top-32 h-16 w-16 rounded-full bg-white/10" />
          <div className="absolute left-5 top-5">
            <div className="flex h-12 items-center rounded-xl bg-white px-4 shadow-sm">
              <span className="text-[36px] leading-none text-[#3f6f6e]">Dokal</span>
            </div>
          </div>
          <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/16">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div className="absolute -bottom-8 left-[-8%] right-[-8%] h-20 rounded-[100%] bg-[#f6f6f7]" />
        </div>

        {/* Avatar */}
        <div className="relative -mt-16 flex justify-center">
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
              className="h-40 w-40 border-[6px] border-[#f6f6f7] text-5xl shadow-[0_6px_16px_rgba(0,0,0,0.14)]"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/25">
              <Pencil className="h-7 w-7 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 pt-5 text-center">
          <h3 className="text-[52px] font-bold leading-tight text-[#101828]">
            {fullName || '—'}
          </h3>
          {cardHeadline ? (
            <p className="mt-2 text-[42px] font-semibold text-[#198f84]">{cardHeadline}</p>
          ) : specialty ? (
            <p className="mt-2 text-[42px] font-semibold text-[#198f84]">{specialty}</p>
          ) : null}
          {orgName && (
            <p className="mt-1 text-[34px] text-[#7a7f89]">{orgName}</p>
          )}

          {/* Contact methods */}
          {(hasLinkedin || hasEmail || hasPhone) && (
            <div className="mx-auto mt-8 flex max-w-[560px] items-start justify-center gap-8">
              {hasLinkedin && (
                <div className="flex min-w-[120px] flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2f6fd6] bg-white">
                    <Image src="/logo/social/linkedin.svg" alt="LinkedIn" width={28} height={28} />
                  </div>
                  <span className="text-[30px] leading-none text-[#5f6673]">LinkedIn</span>
                </div>
              )}
              {hasEmail && (
                <div className="flex min-w-[120px] flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d8b10d] bg-white text-[#d8b10d]">
                    <Mail className="h-8 w-8" />
                  </div>
                  <span className="text-[30px] leading-none text-[#5f6673]">{t('cardEmailLabel')}</span>
                </div>
              )}
              {hasPhone && (
                <div className="flex min-w-[120px] flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d8b10d] bg-white text-[#d8b10d]">
                    <Phone className="h-8 w-8" />
                  </div>
                  <span className="text-[30px] leading-none text-[#5f6673]">{t('cardPhoneLabel')}</span>
                </div>
              )}
            </div>
          )}

          {/* Save contact button */}
          <div className="mt-8 flex h-20 items-center justify-center gap-3 rounded-full bg-[#0f9b88] px-5 text-[34px] font-semibold text-white shadow-sm">
            <span>{t('cardSaveContact')}</span>
            <UserPlus className="h-7 w-7" />
          </div>

          {/* Address */}
          {address && (
            <div className="mt-8 space-y-1 text-[#69707d]">
              <div className="flex items-center justify-center gap-2 text-[32px] font-medium text-[#545b66]">
                <span>{t('address')}</span>
                <MapPin className="h-6 w-6 text-[#159a8a]" />
              </div>
              <p className="text-[31px]">{address}</p>
            </div>
          )}

          {/* Book appointment button */}
          <div className="mt-7 flex h-20 items-center justify-center gap-3 rounded-full border-[3px] border-[#0f9b88] bg-transparent px-5 text-[34px] font-semibold text-[#0f9b88]">
            <span>{t('cardBookAppointment')}</span>
            <ExternalLink className="h-7 w-7" />
          </div>
        </div>
      </div>
    </div>
  );
}
