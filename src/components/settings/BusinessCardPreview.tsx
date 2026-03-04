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

  return (
    <div className="mx-auto w-full max-w-[370px]">
      <p className="text-sm font-medium text-gray-700 mb-3">{t('cardPreviewLabel')}</p>
      <div className="rounded-2xl shadow-lg overflow-hidden bg-white border border-border/40">
        {/* Green gradient header */}
        <div className="relative h-36 bg-gradient-to-br from-primary to-primary/80">
          <div className="absolute top-3 left-3">
            <div className="relative h-6 w-16">
              <Image
                src="/logo/Dokal.png"
                alt="Dokal"
                fill
                className="object-contain object-left brightness-0 invert"
              />
            </div>
          </div>
          <div className="absolute top-3 right-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Share2 className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* Avatar overlapping header */}
        <div className="relative -mt-14 flex justify-center">
          <button
            type="button"
            onClick={onAvatarClick}
            className="group relative rounded-full ring-4 ring-white"
            title={t('cardEditAvatar')}
          >
            <Avatar
              src={avatarUrl}
              firstName={firstName}
              lastName={lastName}
              size="lg"
              className="h-24 w-24 text-2xl"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/30 transition-colors">
              <Pencil className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>
        </div>

        {/* Card body */}
        <div className="px-5 pt-3 pb-5 text-center space-y-3">
          {/* Name */}
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {fullName || '—'}
            </h3>
            {cardHeadline ? (
              <p className="text-sm text-primary font-medium mt-0.5">{cardHeadline}</p>
            ) : specialty ? (
              <p className="text-sm text-primary font-medium mt-0.5">{specialty}</p>
            ) : null}
            {orgName && (
              <p className="text-xs text-gray-500 mt-0.5">{orgName}</p>
            )}
          </div>

          {/* Contact icons */}
          {(hasEmail || hasPhone) && (
            <div className="flex items-center justify-center gap-6 pt-1">
              {hasEmail && (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] text-gray-500">{t('cardEmailLabel')}</span>
                </div>
              )}
              {hasPhone && (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] text-gray-500">{t('cardPhoneLabel')}</span>
                </div>
              )}
            </div>
          )}

          {/* Save contact button */}
          <div className="rounded-xl bg-primary text-white py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2">
            <UserPlus className="h-4 w-4" />
            {t('cardSaveContact')}
          </div>

          {/* Address */}
          {address && (
            <div className="flex items-start gap-2 text-sm text-gray-600 pt-1 justify-center">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{address}</span>
            </div>
          )}

          {/* Book appointment button */}
          <div className="rounded-xl border-2 border-primary text-primary py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2">
            <ExternalLink className="h-4 w-4" />
            {t('cardBookAppointment')}
          </div>
        </div>
      </div>
    </div>
  );
}
