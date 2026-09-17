"use client";

import InduccionPlaceholder from "@/components/InduccionPlaceholder";

export default function InduccionDistoyotaPage() {
  const icon = (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00205b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="15" cy="18" r="2.5" />
      <path d="M8.5 18h4" />
      <path d="M4 15.5V8a2 2 0 0 1 2-2h4l3 4.5v5" />
      <path d="M19 5v13h3" />
      <line x1="17" y1="13" x2="22" y2="13" />
    </svg>
  );

  return (
    <InduccionPlaceholder
      title="INDUCCIÓN DE DISTOYOTA"
      shortName="Inducción de Distoyota"
      icon={icon}
      description="Consulta y gestiona las inducciones de Distoyota para la sede Barrancabermeja."
    />
  );
}
