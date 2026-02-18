'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useCrmOrganization, useOrganizationMembers } from '@/hooks/useOrganization';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import {
  addCard,
  changePlan,
  downgradePlan,
  listCards,
  deleteCard,
  BASE_PRICES_ILS,
  SEAT_PRICES_ILS,
  calculateMonthlyPriceILS,
  type PlanType,
  type SubscriptionCard,
} from '@/lib/subscription';
import type { OrganizationMember } from '@/types';
import { localeNames, type Locale } from '@/i18n/config';
import {
  CheckCircle2,
  CreditCard,
  Crown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Building2,
  Globe,
  Trash2,
  Plus,
  Receipt,
  Users,
} from 'lucide-react';

function maskCardLabel(card: SubscriptionCard) {
  const brand = card.brand ? card.brand.toUpperCase() : 'CARD';
  const last4 = card.last4 ? `•••• ${card.last4}` : card.buyer_card_mask || '';
  return `${brand} ${last4}`.trim();
}

function normalizeCardNumber(value: string) {
  return value.replace(/\s+/g, '').replace(/-/g, '');
}

function isValidExpiry(value: string) {
  // MM/YY
  const v = value.trim();
  if (!/^\d{2}\/\d{2}$/.test(v)) return false;
  const [mm, yy] = v.split('/').map(Number);
  if (mm < 1 || mm > 12) return false;
  // Rough "not in the past" check
  const now = new Date();
  const currentYY = Number(String(now.getFullYear()).slice(-2));
  const currentMM = now.getMonth() + 1;
  if (yy < currentYY) return false;
  if (yy === currentYY && mm < currentMM) return false;
  return true;
}

export default function BillingPage() {
  const t = useTranslations('billing');
  const tc = useTranslations('common');
  const tsub = useTranslations('subscription');
  const ts = useTranslations('settings');
  const locale = useLocale() as Locale;

  const queryClient = useQueryClient();
  const { profile, subscriptionStatus, refreshSubscription } = useAuth();
  const { data: organization } = useCrmOrganization();
  const { data: members } = useOrganizationMembers(organization?.id);

  // ─── Plan state ────────────────────────────────────────────────────
  const currentPlan: PlanType =
    (subscriptionStatus?.subscription?.plan as PlanType) || 'individual';
  const isClinic = currentPlan === 'clinic';
  const isEnterprise = currentPlan === 'enterprise';
  const isIndividual = currentPlan === 'individual';
  const isTrial = subscriptionStatus?.trial?.isActive && !subscriptionStatus?.subscription;
  const isTrialing = subscriptionStatus?.subscription?.status === 'trialing';

  const practitionerSeats = subscriptionStatus?.subscription?.practitioner_seats ?? 1;
  const secretarySeats = subscriptionStatus?.subscription?.secretary_seats ?? 0;
  const totalMonthly = calculateMonthlyPriceILS(currentPlan, practitionerSeats, secretarySeats);

  const practitionerMembers =
    members?.filter((m) => m.staff_type === 'practitioner' && m.is_active !== false) || [];

  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [downgradeStep, setDowngradeStep] = useState<'choose' | 'confirm'>('choose');
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string>('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');

  useEffect(() => {
    if (practitionerMembers.length > 0 && !selectedPractitionerId) {
      const owner = practitionerMembers.find((m) => m.role === 'owner');
      if (owner?.practitioner?.id) setSelectedPractitionerId(owner.practitioner.id);
      else if (practitionerMembers[0]?.practitioner?.id) {
        setSelectedPractitionerId(practitionerMembers[0].practitioner.id);
      }
    }
  }, [practitionerMembers, selectedPractitionerId]);

  const openDowngradeDialog = () => {
    setDowngradeStep('choose');
    setPlanError('');
    setDowngradeDialogOpen(true);
  };

  const deactivatedMembers =
    members?.filter(
      (m) => m.practitioner?.id !== selectedPractitionerId && m.is_active !== false
    ) || [];

  const getSpecialtyLabel = (member: OrganizationMember) => {
    if (!member.practitioner?.specialty) return null;
    const spec = member.practitioner.specialty;
    if (locale === 'fr' && spec.name_fr) return spec.name_fr;
    if (locale === 'he' && spec.name_he) return spec.name_he;
    return spec.name;
  };

  const getPlanIcon = () => {
    if (isEnterprise) return <Globe className="h-6 w-6 text-primary" />;
    if (isClinic) return <Building2 className="h-6 w-6 text-primary" />;
    return <Users className="h-6 w-6 text-gray-500" />;
  };

  const getPlanBadge = () => {
    if (isEnterprise) return tsub('multiSite');
    if (isClinic) return tsub('unlimitedTeam');
    return tsub('onePractitioner');
  };

  const handleUpgrade = async () => {
    setPlanError('');
    setPlanLoading(true);
    try {
      await changePlan('clinic');
      await refreshSubscription();
      setUpgradeDialogOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setPlanError(axiosError?.response?.data?.error?.message || tsub('genericError'));
    } finally {
      setPlanLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!selectedPractitionerId) return;
    setPlanError('');
    setPlanLoading(true);
    try {
      await downgradePlan(selectedPractitionerId);
      await refreshSubscription();
      setDowngradeDialogOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setPlanError(axiosError?.response?.data?.error?.message || tsub('genericError'));
    } finally {
      setPlanLoading(false);
    }
  };

  // ─── Cards (payment methods) ───────────────────────────────────────
  const {
    data: cards,
    isLoading: cardsLoading,
    isError: cardsError,
  } = useQuery({
    queryKey: ['subscription', 'cards'],
    queryFn: async () => await listCards(),
    enabled: !!profile?.id,
    retry: 1,
  });

  const addCardMutation = useMutation({
    mutationFn: addCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', 'cards'] });
      refreshSubscription();
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', 'cards'] });
      refreshSubscription();
    },
  });

  const [addCardOpen, setAddCardOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; card: SubscriptionCard | null }>({
    open: false,
    card: null,
  });

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [cardFormError, setCardFormError] = useState('');

  const resetCardForm = () => {
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setCardHolder('');
    setZipCode('');
    setCardFormError('');
  };

  const canSubmitCard = useMemo(() => {
    const number = normalizeCardNumber(cardNumber);
    if (number.length < 12) return false;
    if (!isValidExpiry(expiry)) return false;
    if (cvv.trim().length < 3) return false;
    return true;
  }, [cardNumber, expiry, cvv]);

  const handleAddCard = async () => {
    setCardFormError('');
    const number = normalizeCardNumber(cardNumber);

    if (number.length < 12) {
      setCardFormError(t('cardFormInvalid'));
      return;
    }
    if (!isValidExpiry(expiry)) {
      setCardFormError(t('cardFormInvalid'));
      return;
    }
    if (cvv.trim().length < 3) {
      setCardFormError(t('cardFormInvalid'));
      return;
    }

    try {
      await addCardMutation.mutateAsync({
        cardNumber: number,
        expirationDate: expiry.trim(),
        cvv: cvv.trim(),
        cardHolder: cardHolder.trim() || undefined,
        buyerZipCode: zipCode.trim() || undefined,
      });
      setAddCardOpen(false);
      resetCardForm();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setCardFormError(axiosError?.response?.data?.error?.message || tsub('genericError'));
    }
  };

  const cardsSorted = useMemo(() => {
    const list = cards ? [...cards] : [];
    list.sort((a, b) => Number(b.is_default) - Number(a.is_default));
    return list;
  }, [cards]);

  // ─── Render helpers ────────────────────────────────────────────────
  const planName = isEnterprise ? tsub('planEnterprise') : isClinic ? tsub('planClinic') : tsub('planIndividual');

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary text-xs w-fit">
          {localeNames[locale]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Forfait */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                {t('planTitle')}
              </CardTitle>
            </CardHeader>

            {!subscriptionStatus ? (
              <div className="space-y-4 py-2" aria-label="Chargement">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="min-w-0 space-y-2">
                      <Skeleton className="h-4 w-40 rounded-md" />
                      <Skeleton className="h-3 w-56 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isClinic || isEnterprise ? 'bg-primary/10' : 'bg-gray-100'
                      }`}
                    >
                      {getPlanIcon()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{planName}</span>
                        <Badge
                          className={
                            isClinic || isEnterprise
                              ? 'bg-primary/10 text-primary text-xs'
                              : 'bg-gray-100 text-gray-600 text-xs'
                          }
                        >
                          {getPlanBadge()}
                        </Badge>
                        {(isTrial || isTrialing) && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            {tsub('trialBadge')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {(isTrial || isTrialing)
                          ? tsub('trialBannerText', { days: subscriptionStatus?.trial?.daysRemaining ?? 0 })
                          : `${totalMonthly} ₪/${tsub('perMonth')}`}
                      </p>
                    </div>
                  </div>
                </div>

                {(isClinic || isEnterprise) && !isTrial && !isTrialing && (
                  <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{tsub('basePlan')}</span>
                      <span className="font-medium">{BASE_PRICES_ILS[currentPlan]} ₪</span>
                    </div>
                    {isClinic && practitionerSeats > 1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {practitionerSeats - 1} {tsub('extraPractitioners')}
                        </span>
                        <span className="font-medium">
                          {(practitionerSeats - 1) * SEAT_PRICES_ILS.practitioner} ₪
                        </span>
                      </div>
                    )}
                    {isClinic && secretarySeats > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {secretarySeats} {tsub('secretaries')}
                        </span>
                        <span className="font-medium">{secretarySeats * SEAT_PRICES_ILS.secretary} ₪</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-semibold">
                      <span className="text-gray-900">{tsub('totalMonthlyCost')}</span>
                      <span className="text-primary">
                        {totalMonthly} ₪/{tsub('perMonth')}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">{t('planHint')}</p>

                {!isTrial && !isTrialing && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {isIndividual && (
                      <Button onClick={() => { setUpgradeDialogOpen(true); setPlanError(''); }} className="gap-2">
                        <ArrowUp className="h-4 w-4" />
                        {tsub('upgradeToClinic')}
                      </Button>
                    )}
                    {isClinic && (
                      <Button
                        variant="ghost"
                        onClick={openDowngradeDialog}
                        className="gap-2 text-gray-500 hover:text-red-600"
                      >
                        <ArrowDown className="h-4 w-4" />
                        {tsub('downgradeToIndividual')}
                      </Button>
                    )}
                    {isEnterprise && (
                      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-3 w-full">
                        <Globe className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{tsub('enterprisePlan')}</p>
                          <p className="text-xs text-muted-foreground">{tsub('contactSalesDesc')}</p>
                        </div>
                        <a
                          href="mailto:contact@dokal.co.il"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 shrink-0"
                        >
                          {tsub('contactSales')}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Factures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {t('invoicesTitle')}
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('invoicesHint')}</p>
              <div className="rounded-xl bg-gray-50 border border-border/50 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('invoicesEmptyTitle')}</p>
                  <p className="text-sm text-muted-foreground">{t('invoicesEmptyDesc')}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Moyens de paiement */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t('paymentMethodsTitle')}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setAddCardOpen(true); setCardFormError(''); }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('addPaymentMethod')}
              </Button>
            </CardHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('paymentMethodsHint')}</p>

              {cardsLoading ? (
                <div className="space-y-2" aria-label="Chargement">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-white p-4">
                      <div className="min-w-0 space-y-2">
                        <Skeleton className="h-4 w-44 rounded-md" />
                        <Skeleton className="h-3 w-32 rounded-md" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : cardsError ? (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                  {tsub('genericError')}
                </div>
              ) : cardsSorted.length === 0 ? (
                <div className="rounded-xl bg-gray-50 border border-border/50 p-6 text-center">
                  <p className="text-sm font-semibold text-gray-900">{t('noPaymentMethodsTitle')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('noPaymentMethodsDesc')}</p>
                  <div className="mt-4 flex justify-center">
                    <Button onClick={() => setAddCardOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t('addPaymentMethod')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {cardsSorted.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-white p-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">{maskCardLabel(card)}</span>
                          {card.is_default && (
                            <Badge className="bg-primary/10 text-primary text-xs">
                              {t('defaultPaymentMethod')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('expires')}: {String(card.expiry_month).padStart(2, '0')}/{String(card.expiry_year).slice(-2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, card })}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {tc('delete')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Accès rapide organisation (info) */}
          {organization && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {t('organizationTitle')}
                </CardTitle>
                <Badge className="bg-gray-100 text-gray-700 text-xs">{organization.name}</Badge>
              </CardHeader>
              <div className="text-sm text-muted-foreground">
                {t('organizationHint')}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Add card dialog ─────────────────────────────────────────── */}
      <Dialog
        open={addCardOpen}
        onClose={() => { setAddCardOpen(false); resetCardForm(); }}
        title={t('addPaymentMethod')}
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label={tsub('cardNumber')}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="0000 0000 0000 0000"
              />
            </div>
            <Input
              label={tsub('expiry')}
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
            />
            <Input
              label={tsub('cvv')}
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="123"
            />
            <div className="sm:col-span-2">
              <Input
                label={tsub('cardHolderLabel')}
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                placeholder={tsub('cardHolderPlaceholder')}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label={tsub('zipCode')}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{tsub('securityNotice')}</p>

          {cardFormError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {cardFormError}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setAddCardOpen(false); resetCardForm(); }}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleAddCard} loading={addCardMutation.isPending} disabled={!canSubmitCard}>
              <CheckCircle2 className="h-4 w-4" />
              {tc('confirm')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── Delete card dialog ─────────────────────────────────────── */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, card: null })}
        title={t('deletePaymentMethodTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('deletePaymentMethodConfirm', {
              card: deleteDialog.card ? maskCardLabel(deleteDialog.card) : '',
            })}
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, card: null })}>
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteDialog.card) return;
                await deleteCardMutation.mutateAsync(deleteDialog.card.id);
                setDeleteDialog({ open: false, card: null });
              }}
              loading={deleteCardMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {tc('delete')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── Upgrade dialog ─────────────────────────────────────────── */}
      <Dialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        title={tsub('upgradeConfirmTitle')}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-gray-900">{tsub('planClinic')}</span>
              <Badge className="bg-primary/10 text-primary text-xs">
                {BASE_PRICES_ILS.clinic} ₪/{tsub('perMonth')}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{tsub('upgradeConfirmText')}</p>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <p>
                + {SEAT_PRICES_ILS.practitioner} ₪/{tsub('perPractitioner')}
              </p>
              <p>
                + {SEAT_PRICES_ILS.secretary} ₪/{tsub('perSecretary')}
              </p>
              <p className="text-primary/70">{tsub('basePriceIncludes')}</p>
            </div>
          </div>

          {planError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {planError}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setUpgradeDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleUpgrade} loading={planLoading}>
              <ArrowUp className="h-4 w-4" />
              {tc('confirm')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── Downgrade dialog ───────────────────────────────────────── */}
      <Dialog
        open={downgradeDialogOpen}
        onClose={() => setDowngradeDialogOpen(false)}
        title={downgradeStep === 'choose' ? tsub('downgradeChoosePractitioner') : tsub('downgradeWarningTitle')}
        className="max-w-xl"
      >
        {downgradeStep === 'choose' ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{tsub('downgradeChooseDescription')}</p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {practitionerMembers.map((member) => {
                const practId = member.practitioner?.id;
                if (!practId) return null;
                const isSelected = selectedPractitionerId === practId;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedPractitionerId(practId)}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all border-2 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <div className="w-3 h-3 rounded-full bg-primary" />}
                    </div>
                    <Avatar
                      src={member.profiles?.avatar_url}
                      firstName={member.profiles?.first_name}
                      lastName={member.profiles?.last_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </p>
                      {member.practitioner?.specialty && (
                        <p className="text-xs text-muted-foreground">{getSpecialtyLabel(member)}</p>
                      )}
                    </div>
                    {member.role === 'owner' && (
                      <Badge className="bg-amber-100 text-amber-800 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        {ts('organizationOwner')}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {planError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {planError}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDowngradeDialogOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button onClick={() => setDowngradeStep('confirm')} disabled={!selectedPractitionerId}>
                {tc('next')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">{tsub('downgradeWarningTitle')}</span>
              </div>
              <p className="text-sm text-red-600">{tsub('downgradeWarningText')}</p>
            </div>

            {practitionerMembers
              .filter((m) => m.practitioner?.id === selectedPractitionerId)
              .map((member) => (
                <div
                  key={member.id}
                  className="rounded-xl bg-green-50 border border-green-200 p-3 flex items-center gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <Avatar
                    src={member.profiles?.avatar_url}
                    firstName={member.profiles?.first_name}
                    lastName={member.profiles?.last_name}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {member.profiles?.first_name} {member.profiles?.last_name}
                    </p>
                    <p className="text-xs text-green-700">{tsub('downgradeKeepLabel')}</p>
                  </div>
                </div>
              ))}

            {deactivatedMembers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-2">{tsub('downgradeDeactivatedLabel')}</p>
                <div className="space-y-1">
                  {deactivatedMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-2 rounded-lg bg-red-50/50 p-2">
                      <Avatar
                        src={member.profiles?.avatar_url}
                        firstName={member.profiles?.first_name}
                        lastName={member.profiles?.last_name}
                        size="xs"
                      />
                      <span className="text-sm text-gray-700">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </span>
                      <Badge className="bg-red-100 text-red-700 text-[10px]">
                        {tsub('downgradeWarningMembers')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-sm text-gray-600">
                {tsub('planIndividual')} — {BASE_PRICES_ILS.individual} ₪/{tsub('perMonth')}
              </p>
            </div>

            {planError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {planError}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDowngradeStep('choose')}>
                {tc('back')}
              </Button>
              <Button variant="destructive" onClick={handleDowngrade} loading={planLoading}>
                <ArrowDown className="h-4 w-4" />
                {tsub('downgradeToIndividual')}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

