'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { UpdateSocialLinksRequest } from '@/types/api';

export function useUpdateSocialLinks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateSocialLinksRequest) => {
      const { data: result } = await api.patch('/crm/social-links', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practitioner-profile'] });
      queryClient.invalidateQueries({ queryKey: ['practitioner'] });
    },
  });
}

export function getCardUrl(practitionerId: string, slug?: string | null): string {
  const siteUrl = process.env.NEXT_PUBLIC_PATIENTS_URL || 'https://dokal.co.il';
  const identifier = slug || practitionerId;
  return `${siteUrl}/he/card/${identifier}`;
}
