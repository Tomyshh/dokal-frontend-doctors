'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useCrmReviews, useReplyReview } from '@/hooks/useReviews';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Star, MessageCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ReviewsPage() {
  const t = useTranslations('reviews');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { data: reviews, isLoading } = useCrmReviews();
  const replyMutation = useReplyReview();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    replyMutation.mutate(
      { id: reviewId, data: { practitioner_reply: replyText.trim() } },
      {
        onSuccess: () => {
          setReplyingTo(null);
          setReplyText('');
        },
      }
    );
  };

  const averageRating = reviews?.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-yellow-50 p-3">
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('averageRating')}</p>
              <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary-50 p-3">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('totalReviews')}</p>
              <p className="text-3xl font-bold text-gray-900">{reviews?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>

        {isLoading ? (
          <Spinner />
        ) : !reviews?.length ? (
          <EmptyState icon={Star} title={t('noReviews')} />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-border/50 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={review.profiles?.avatar_url}
                      firstName={review.profiles?.first_name}
                      lastName={review.profiles?.last_name}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {review.profiles?.first_name} {review.profiles?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.created_at, 'dd MMM yyyy', locale)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-gray-700 mt-3">{review.comment}</p>
                )}

                {/* Practitioner Reply */}
                {review.practitioner_reply && (
                  <div className="mt-3 ml-8 p-3 rounded-xl bg-primary-50 border border-primary-100">
                    <p className="text-xs font-medium text-primary mb-1">
                      {t('yourReply')}
                    </p>
                    <p className="text-sm text-gray-700">{review.practitioner_reply}</p>
                  </div>
                )}

                {/* Reply Form */}
                {!review.practitioner_reply && (
                  <div className="mt-3">
                    {replyingTo === review.id ? (
                      <div className="space-y-3">
                        <Textarea
                          placeholder={t('replyPlaceholder')}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleReply(review.id)} loading={replyMutation.isPending}>
                            {t('reply')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setReplyingTo(null); setReplyText(''); }}>
                            {tc('cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setReplyingTo(review.id)}>
                        <MessageCircle className="h-4 w-4" />
                        {t('reply')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
