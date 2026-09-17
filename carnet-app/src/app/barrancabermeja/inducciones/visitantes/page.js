"use client";

import InduccionPlaceholder from "@/components/InduccionPlaceholder";

export default function InduccionVisitantesPage() {
  const icon = (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00205b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="2.5" />
      <path d="M5.5 17c0-1.8 1.6-3 3.5-3s3.5 1.2 3.5 3" />
      <line x1="15" y1="9" x2="19" y2="9" />
      <line x1="15" y1="13" x2="19" y2="13" />
    </svg>
  );

  return (
    <InduccionPlaceholder
      title="INDUCCIÓN DE VISITANTES"
      shortName="Inducción de Visitantes"
      icon={icon}
      description="Consulta y gestiona las inducciones dirigidas a visitantes para la sede Barrancabermeja."
    />
  );
}
