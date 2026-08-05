'use client';
import { useState } from 'react';

export default function Logo({ className, src = '/biocells-logo.png', alt = 'BIOCELLS', fallbackText = 'BC' }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    // fallback si no carga la imagen
    return <span className={className} aria-label={alt}>{fallbackText}</span>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setBroken(true)}
      loading="lazy"
      decoding="async"
    />
  );
}
