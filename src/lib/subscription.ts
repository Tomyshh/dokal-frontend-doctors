import api from '@/lib/api';

// ─── Plan Types ──────────────────────────────────────────────────────

export type PlanType = 'individual' | 'clinic';

export const PLAN_PRICES: Record<PlanType, number> = {
  individual: 29000, // 290 ILS in agorot
  clinic: 49000,     // 490 ILS in agorot
};

export const PLAN_PRICES_ILS: Record<PlanType, number> = {
  individual: 290,
  clinic: 490,
};

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
  plan: PlanType;
  price_agorot: number;
  status: 'active' | 'cancelled' | 'paused';
  current_period_start: string;
  current_period_end: string;
  next_payment_date: string;
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

export async function startTrial(): Promise<StartTrialResponse> {
  const { data } = await api.post<StartTrialResponse>(`${BASE}/start-trial`, {});
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

// ─── Plan Upgrade / Downgrade ─────────────────────────────────────────

export interface PlanChangeResponse {
  subscription: Subscription;
}

export async function upgradePlan(): Promise<PlanChangeResponse> {
  const { data } = await api.post<PlanChangeResponse>(`${BASE}/upgrade`, {});
  return data;
}

export async function downgradePlan(keepPractitionerId: string): Promise<PlanChangeResponse> {
  const { data } = await api.post<PlanChangeResponse>(`${BASE}/downgrade`, {
    keep_practitioner_id: keepPractitionerId,
  });
  return data;
}
