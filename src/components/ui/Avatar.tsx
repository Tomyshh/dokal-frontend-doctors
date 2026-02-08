import { cn, getInitials } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({ src, firstName, lastName, size = 'md', className }: AvatarProps) {
  const initials = getInitials(firstName, lastName);

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden', sizeClasses[size], className)}>
        <Image
          src={src}
          alt={`${firstName || ''} ${lastName || ''}`}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
