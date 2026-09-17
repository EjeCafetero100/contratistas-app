"use client";

import InduccionPlaceholder from "@/components/InduccionPlaceholder";

export default function InduccionGlpPage() {
  const icon = (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00205b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="7" width="12" height="14" rx="3" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
      <path d="M12 11c1.5 0 2.5 1 2.5 2.5a2.5 2.5 0 0 1-5 0c0-1.5 1-2.5 2.5-2.5z" />
      <line x1="9" y1="3" x2="15" y2="3" />
    </svg>
  );

  return (
    <InduccionPlaceholder
      title="INDUCCIÓN DE GLP"
      shortName="Inducción de GLP"
      icon={icon}
      description="Consulta y gestiona las inducciones relacionadas con GLP para la sede Barrancabermeja."
    />
  );
}
