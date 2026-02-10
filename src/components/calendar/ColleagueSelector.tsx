'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import { useCrmOrganization, useOrganizationMembers } from '@/hooks/useOrganization';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { Users, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ColleagueSelectorProps {
  /** null = my calendar, 'all' = all practitioners, uuid = specific colleague */
  value: string | null;
  onChange: (practitionerId: string | null) => void;
}

export default function ColleagueSelector({ value, onChange }: ColleagueSelectorProps) {
  const t = useTranslations('calendar');
  const { profile } = useAuth();
  const { data: organization } = useCrmOrganization();
  const { data: members } = useOrganizationMembers(organization?.id);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show for clinic-type organizations
  if (!organization || organization.type !== 'clinic') return null;

  // Filter to active practitioner members only
  const practitioners = (members || []).filter(
    (m) => m.staff_type === 'practitioner' && m.is_active !== false
  );

  // Find currently selected member
  const selectedMember = value && value !== 'all'
    ? practitioners.find((m) => m.user_id === value)
    : null;

  const label = value === 'all'
    ? t('allPractitioners')
    : selectedMember
      ? `${selectedMember.profiles?.first_name || ''} ${selectedMember.profiles?.last_name || ''}`.trim()
      : t('myCalendar');

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-white text-sm',
          'hover:bg-muted/50 transition-colors min-w-[180px]',
          open && 'ring-2 ring-primary/20 border-primary'
        )}
      >
        {selectedMember ? (
          <Avatar
            src={selectedMember.profiles?.avatar_url}
            firstName={selectedMember.profiles?.first_name}
            lastName={selectedMember.profiles?.last_name}
            size="xs"
          />
        ) : (
          <Users className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="truncate flex-1 text-left text-gray-700">{label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-[260px] bg-white rounded-xl border border-border shadow-lg z-50 py-1 max-h-[320px] overflow-y-auto">
          {/* My calendar */}
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors',
              value === null && 'bg-primary-50 text-primary font-medium'
            )}
          >
            <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            <span>{t('myCalendar')}</span>
          </button>

          {/* All practitioners */}
          <button
            type="button"
            onClick={() => { onChange('all'); setOpen(false); }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors',
              value === 'all' && 'bg-primary-50 text-primary font-medium'
            )}
          >
            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Users className="h-3.5 w-3.5 text-gray-500" />
            </div>
            <span>{t('allPractitioners')}</span>
          </button>

          {/* Separator */}
          {practitioners.length > 0 && <div className="border-t border-border my-1" />}

          {/* Individual practitioners */}
          {practitioners
            .filter((m) => m.user_id !== profile?.id)
            .map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => { onChange(member.user_id); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors',
                value === member.user_id && 'bg-primary-50 text-primary font-medium'
              )}
            >
              <Avatar
                src={member.profiles?.avatar_url}
                firstName={member.profiles?.first_name}
                lastName={member.profiles?.last_name}
                size="sm"
              />
              <div className="min-w-0 text-left">
                <p className="truncate font-medium text-gray-900">
                  {member.profiles?.first_name} {member.profiles?.last_name}
                </p>
                {member.practitioner?.specialty && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {member.practitioner.specialty.name_fr || member.practitioner.specialty.name}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
