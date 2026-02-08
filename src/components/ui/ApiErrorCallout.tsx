import type { ReactNode } from 'react';
import axios from 'axios';

function getErrorDetails(error: unknown): { title: string; description?: ReactNode } {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const code = (error.response?.data as any)?.error?.code;
    const message =
      (error.response?.data as any)?.error?.message ||
      error.message ||
      'Erreur réseau';

    return {
      title: status ? `Erreur API (${status})` : 'Erreur API',
      description: (
        <div className="space-y-1">
          <div className="text-sm text-red-800">{message}</div>
          <div className="text-xs text-red-700/80">
            {method && url ? `${method} ${url}` : null}
            {code ? ` • ${code}` : null}
          </div>
        </div>
      ),
    };
  }

  return {
    title: 'Erreur',
    description: (
      <div className="text-sm text-red-800">
        {error instanceof Error ? error.message : 'Une erreur est survenue.'}
      </div>
    ),
  };
}

export function ApiErrorCallout({ error, action }: { error: unknown; action?: ReactNode }) {
  const details = getErrorDetails(error);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-red-900">{details.title}</div>
          <div className="mt-1">{details.description}</div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

