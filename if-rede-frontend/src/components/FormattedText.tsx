'use client';

import Link from 'next/link';
import React from 'react';

interface FormattedTextProps {
  text?: string;
  className?: string;
}

export default function FormattedText({ text = '', className = '' }: FormattedTextProps) {
  if (!text) return null;

  // Regex para capturar marcações do tipo @username.
  // Usernames válidos no IFC contêm apenas letras minúsculas, números, hifens, underscores ou pontos.
  const regex = /@([a-zA-Z0-9_.-]+)/g;

  const parts = text.split(regex);
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        // Partes ímpares do split por um único grupo de captura regex correspondem ao valor capturado.
        if (i % 2 !== 0) {
          const username = part;
          return (
            <Link
              key={i}
              href={`/profile/${username.toLowerCase()}`}
              onClick={(e) => e.stopPropagation()}
              className="text-if-purple hover:underline font-semibold"
            >
              @{username}
            </Link>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
