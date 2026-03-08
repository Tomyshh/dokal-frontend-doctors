import { useQuery } from '@tanstack/react-query';
import {
  fetchPlanPricing,
  getPlanPricingMapOrDefault,
  type PlanPricingMap,
} from '@/lib/subscription';

export function usePlanPricing() {
  const query = useQuery({
    queryKey: ['subscription', 'plan-pricing'],
    queryFn: fetchPlanPricing,
    staleTime: 60_000,
  });

  const pricingMap: PlanPricingMap = getPlanPricingMapOrDefault(query.data);

  return {
    ...query,
    pricingMap,
  };
}
