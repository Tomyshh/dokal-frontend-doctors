'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import {
  useConfirmAppointment,
  useCancelAppointment,
  useCompleteAppointment,
  useNoShowAppointment,
} from '@/hooks/useAppointments';
import { Check, X, CheckCircle2, UserX } from 'lucide-react';
import type { AppointmentStatus } from '@/types';

interface AppointmentActionsProps {
  appointmentId: string;
  status: AppointmentStatus;
}

export default function AppointmentActions({ appointmentId, status }: AppointmentActionsProps) {
  const t = useTranslations('appointments');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [practitionerNotes, setPractitionerNotes] = useState('');

  const confirmMutation = useConfirmAppointment();
  const cancelMutation = useCancelAppointment();
  const completeMutation = useCompleteAppointment();
  const noShowMutation = useNoShowAppointment();

  const handleConfirm = () => {
    confirmMutation.mutate(appointmentId);
  };

  const handleCancel = () => {
    cancelMutation.mutate(
      { id: appointmentId, data: { cancellation_reason: cancelReason || undefined } },
      { onSuccess: () => setCancelDialogOpen(false) }
    );
  };

  const handleComplete = () => {
    completeMutation.mutate(
      { id: appointmentId, data: { practitioner_notes: practitionerNotes || undefined } },
      { onSuccess: () => setCompleteDialogOpen(false) }
    );
  };

  const handleNoShow = () => {
    noShowMutation.mutate(appointmentId);
  };

  if (status === 'completed' || status === 'cancelled_by_patient' || status === 'cancelled_by_practitioner' || status === 'no_show') {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {status === 'pending' && (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleConfirm}
          loading={confirmMutation.isPending}
          title={t('confirm')}
          className="text-green-600 hover:bg-green-50"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}

      {(status === 'pending' || status === 'confirmed') && (
        <>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setCompleteDialogOpen(true)}
            title={t('complete')}
            className="text-blue-600 hover:bg-blue-50"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleNoShow}
            loading={noShowMutation.isPending}
            title={t('noShow')}
            className="text-gray-500 hover:bg-gray-100"
          >
            <UserX className="h-4 w-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setCancelDialogOpen(true)}
            title={t('cancel')}
            className="text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} title={t('cancelTitle')}>
        <p className="text-sm text-muted-foreground mb-4">{t('cancelMessage')}</p>
        <Textarea
          placeholder={t('cancelReason')}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={handleCancel} loading={cancelMutation.isPending}>
            {t('cancel')}
          </Button>
        </div>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} title={t('completeTitle')}>
        <Textarea
          label={t('notes')}
          placeholder={t('notes')}
          value={practitionerNotes}
          onChange={(e) => setPractitionerNotes(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button variant="success" onClick={handleComplete} loading={completeMutation.isPending}>
            {t('complete')}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
