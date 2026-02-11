import api from '@/lib/api';

// ─── Plan Types ──────────────────────────────────────────────────────

export type PlanType = 'individual' | 'clinic' | 'enterprise';

// ─── Pricing Constants (agorot = 1/100 ILS) ─────────────────────────

export const BASE_PRICES_AGOROT: Record<PlanType, number> = {
  individual: 32900,  // 329 ILS
  clinic:     34900,  // 349 ILS
  enterprise: 199000, // 1990 ILS
};

export const BASE_PRICES_ILS: Record<PlanType, number> = {
  individual: 329,
  clinic:     349,
  enterprise: 1990,
};

export const SEAT_PRICES_AGOROT = {
  practitioner: 31900, // 319 ILS
  secretary:    14900, // 149 ILS
} as const;

export const SEAT_PRICES_ILS = {
  practitioner: 319,
  secretary:    149,
} as const;

export const TRIAL_DURATION_DAYS = 60;

// ─── Price Calculation ───────────────────────────────────────────────

/**
 * Calculate the total monthly price for a given plan and seat count.
 * For Individual: flat base price (no extra seats).
 * For Clinic: base + (extra practitioners * 319) + (secretaries * 149).
 *   The first practitioner is included in the base.
 * For Enterprise: custom (returns base as minimum).
 */
export function calculateMonthlyPriceAgorot(
  plan: PlanType,
  practitionerSeats: number,
  secretarySeats: number,
): number {
  const base = BASE_PRICES_AGOROT[plan];

  if (plan === 'individual') return base;

  if (plan === 'clinic') {
    const extraPractitioners = Math.max(0, practitionerSeats - 1); // first included
    return (
      base +
      extraPractitioners * SEAT_PRICES_AGOROT.practitioner +
      secretarySeats * SEAT_PRICES_AGOROT.secretary
    );
  }

  // Enterprise — base is the minimum, actual pricing is custom
  return base;
}

export function calculateMonthlyPriceILS(
  plan: PlanType,
  practitionerSeats: number,
  secretarySeats: number,
): number {
  return calculateMonthlyPriceAgorot(plan, practitionerSeats, secretarySeats) / 100;
}

// Keep legacy aliases for backward-compat during transition
export const PLAN_PRICES: Record<PlanType, number> = BASE_PRICES_AGOROT;
export const PLAN_PRICES_ILS: Record<PlanType, number> = BASE_PRICES_ILS;

// ─── Types ───────────────────────────────────────────────────────────

export interface SubscriptionCard {
  id: string;
  brand: string;
  last4: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
  label: string | null;
  buyer_card_mask: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan: PlanType;
  practitioner_seats: number;
  secretary_seats: number;
  total_price_agorot: number;
  price_agorot: number; // legacy — same as total_price_agorot
  status: 'active' | 'trialing' | 'cancelled' | 'paused' | 'past_due' | 'expired';
  current_period_start: string;
  current_period_end: string;
  next_payment_date: string;
  trial_start: string | null;
  trial_end: string | null;
  cancelled_at: string | null;
  paused_at: string | null;
}

export interface TrialInfo {
  isActive: boolean;
  startDate: string;
  endDate: string;
  daysRemaining: number;
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  trial: TrialInfo | null;
  subscription: Subscription | null;
  paymeStatus: string | null;
}

export interface AddCardPayload {
  cardNumber: string;
  expirationDate: string; // MM/YY
  cvv: string;
  cardHolder?: string;
  cardName?: string;
  buyerZipCode?: string;
}

export interface AddCardResponse {
  paymentCredentialId: string;
  buyerKey: string;
  buyerCard: string;
  card: SubscriptionCard;
}

export interface SubscribeWithCardIdPayload {
  cardId: string;
  plan?: PlanType;
}

export interface SubscribeWithNewCardPayload {
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  cardHolder?: string;
  buyerZipCode?: string;
  plan?: PlanType;
}

export type SubscribePayload = SubscribeWithCardIdPayload | SubscribeWithNewCardPayload;

export interface SubscribeResponse {
  salePaymeId: string;
  subCode: string;
  subID: string;
  chargedPriceInCents: number;
  nextPaymentDate: string;
  subscription: Subscription;
}

export interface StartTrialResponse {
  trial: TrialInfo;
}

export interface CancelResponse {
  status: 'cancelled';
  accessUntil: string;
}

export interface PauseResumeResponse {
  status: 'paused' | 'active';
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ─── API Functions ───────────────────────────────────────────────────

const BASE = '/subscription';

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { data } = await api.get<SubscriptionStatus>(`${BASE}/status`);
  return data;
}

export async function startTrial(plan?: PlanType): Promise<StartTrialResponse> {
  const { data } = await api.post<StartTrialResponse>(`${BASE}/start-trial`, {
    plan: plan ?? 'individual',
  });
  return data;
}

export async function addCard(payload: AddCardPayload): Promise<AddCardResponse> {
  const { data } = await api.post<AddCardResponse>(`${BASE}/cards`, payload);
  return data;
}

export async function listCards(): Promise<SubscriptionCard[]> {
  const { data } = await api.get<SubscriptionCard[]>(`${BASE}/cards`);
  return data;
}

export async function deleteCard(id: string): Promise<void> {
  await api.delete(`${BASE}/cards/${id}`);
}

export async function subscribe(payload: SubscribePayload): Promise<SubscribeResponse> {
  const { data } = await api.post<SubscribeResponse>(`${BASE}/subscribe`, payload);
  return data;
}

export async function cancelSubscription(): Promise<CancelResponse> {
  const { data } = await api.post<CancelResponse>(`${BASE}/cancel`, {});
  return data;
}

export async function pauseSubscription(): Promise<PauseResumeResponse> {
  const { data } = await api.post<PauseResumeResponse>(`${BASE}/pause`, {});
  return data;
}

export async function resumeSubscription(): Promise<PauseResumeResponse> {
  const { data } = await api.post<PauseResumeResponse>(`${BASE}/resume`, {});
  return data;
}

// ─── Plan Change ─────────────────────────────────────────────────────

export interface PlanChangeResponse {
  subscription: Subscription;
}

export async function changePlan(newPlan: PlanType): Promise<PlanChangeResponse> {
  const { data } = await api.post<PlanChangeResponse>(`${BASE}/change-plan`, {
    plan: newPlan,
  });
  return data;
}

export async function updateSeats(seats: {
  practitioner_seats?: number;
  secretary_seats?: number;
}): Promise<PlanChangeResponse> {
  const { data } = await api.post<PlanChangeResponse>(`${BASE}/update-seats`, seats);
  return data;
}

// Legacy aliases (still used in settings page during transition)
export async function upgradePlan(): Promise<PlanChangeResponse> {
  return changePlan('clinic');
}

export async function downgradePlan(keepPractitionerId: string): Promise<PlanChangeResponse> {
  const { data } = await api.post<PlanChangeResponse>(`${BASE}/downgrade`, {
    keep_practitioner_id: keepPractitionerId,
  });
  return data;
}
