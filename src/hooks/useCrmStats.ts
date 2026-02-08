'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CrmStats } from '@/types';
import type { CrmStatsQuery } from '@/types/api';

export function useCrmStats(params: CrmStatsQuery) {
  return useQuery({
    queryKey: ['crm-stats', params],
    queryFn: async () => {
      const { data } = await api.get<CrmStats>('/crm/dashboard/stats', { params });
      return data;
    },
  });
}
