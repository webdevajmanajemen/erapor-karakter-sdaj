import React, { useState } from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  logoUrl?: string;
}

const DEFAULT_OFFICIAL_LOGO = '/assets/aistudio/logo-AJ-rapor_c08ed6e7.png';

export function SchoolLogo({ className = '', size = 'md', logoUrl }: SchoolLogoProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const effectiveUrl = (!hasImageError && (logoUrl || DEFAULT_OFFICIAL_LOGO)) || '';

  const dimClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }[size];

  // If we have an image URL and it hasn't errored out, show the official logo image
  if (effectiveUrl && !hasImageError) {
    return (
      <div
        className={`relative shrink-0 flex items-center justify-center bg-white rounded-xl shadow-xs border border-slate-200/80 p-1 select-none ${dimClasses} ${className}`}
        title="SD Islam Alam & Sains Al-Jannah"
      >
        <img
          src={effectiveUrl}
          alt="Logo SD Islam Alam & Sains Al-Jannah"
          onError={() => setHasImageError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d4ed8] via-[#1e40af] to-[#0f172a] text-white shadow-md border-2 border-amber-400/50 p-1.5 shrink-0 select-none ${dimensions} ${className}`}
      title="SD Islam Alam & Sains Al-Jannah"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer Ring - Gold/Orange */}
        <circle cx="50" cy="50" r="46" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="42" fill="#1e3a8a" />

        {/* 1. KARAKTER SAINS (OREN / KUNING) - Science Atom Orbit */}
        <ellipse
          cx="50"
          cy="50"
          rx="32"
          ry="12"
          stroke="#ea580c"
          strokeWidth="1.8"
          transform="rotate(-30 50 50)"
          strokeOpacity="0.9"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="32"
          ry="12"
          stroke="#f59e0b"
          strokeWidth="1.8"
          transform="rotate(35 50 50)"
          strokeOpacity="0.9"
        />
        <circle cx="73" cy="36" r="3" fill="#ea580c" />
        <circle cx="27" cy="64" r="3" fill="#fbbf24" />

        {/* 2. KARAKTER ALAM (HIJAU) - Nature Sprout & Foliage */}
        <path
          d="M50 48C45 34 33 30 28 35C24 40 26 50 37 53C42 54 46 51 50 48Z"
          fill="#16a34a"
        />
        <path
          d="M50 48C55 34 67 30 72 35C76 40 74 50 63 53C58 54 54 51 50 48Z"
          fill="#22c55e"
        />

        {/* 3. KARAKTER ISLAM (BIRU & GOLD) - Crescent, Dome & Holy Quran */}
        <path
          d="M48 20C40 20 33 26 33 34C33 42 40 48 48 48C43 45 40 40 40 34C40 28 43 23 48 20Z"
          fill="#38bdf8"
        />
        <path
          d="M54 27L55.5 30.5L59 31L56.5 33.5L57 37L54 35.2L51 37L51.5 33.5L49 31L52.5 30.5L54 27Z"
          fill="#fcd34d"
        />

        {/* Base Dome / Open Quran Book */}
        <path
          d="M32 64C40 60 48 62 50 67C52 62 60 60 68 64V73C60 69 52 71 50 76C48 71 40 69 32 73V64Z"
          fill="#ffffff"
        />
        <path
          d="M50 67V76"
          stroke="#1d4ed8"
          strokeWidth="1.5"
        />

        {/* School Initial */}
        <text
          x="50"
          y="87"
          textAnchor="middle"
          fill="#fcd34d"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="sans-serif"
          letterSpacing="0.5"
        >
          AL-JANNAH
        </text>
      </svg>
    </div>
  );
}
