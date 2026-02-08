'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Review } from '@/types';
import type { ReplyReviewRequest } from '@/types/api';

export function useCrmReviews() {
  return useQuery({
    queryKey: ['crm-reviews'],
    queryFn: async () => {
      const { data } = await api.get<Review[]>('/crm/reviews');
      return data;
    },
  });
}

export function useReplyReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReplyReviewRequest }) => {
      await api.patch(`/crm/reviews/${id}/reply`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-reviews'] });
    },
  });
}
