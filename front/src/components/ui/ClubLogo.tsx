'use client';

interface ClubLogoProps {
  logo?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
};

/**
 * Affiche le logo du club (base64 ou URL) ou un fallback avec l'initiale.
 */
export default function ClubLogo({ logo, name, size = 'md', className = '' }: ClubLogoProps) {
  const sizeClass = sizeMap[size];

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={`Logo ${name}`}
        className={`${sizeClass} rounded-md object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-md bg-gradient-to-br from-accent-green to-accent-blue flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
