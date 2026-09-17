"use client";

import InduccionPlaceholder from "@/components/InduccionPlaceholder";

export default function InduccionContratistasPage() {
  const icon = (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00205b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18h20" />
      <path d="M4 18v-2a8 8 0 0 1 16 0v2" />
      <path d="M10 10V6a2 2 0 0 1 4 0v4" />
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  );

  return (
    <InduccionPlaceholder
      title="INDUCCIÓN DE CONTRATISTAS"
      shortName="Inducción de Contratistas"
      icon={icon}
      description="Consulta y gestiona las inducciones dirigidas a contratistas para la sede Barrancabermeja."
    />
  );
}
