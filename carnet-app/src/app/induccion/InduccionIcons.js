export function InduccionIcon({ type, className = "cd-svg-icon", size = 32, color = "#00205b" }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  switch (type) {
    case "truck":
      // Camión / Transporte de Carga Principal
      return (
        <svg {...commonProps} className={className}>
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
          <line x1="8" y1="18.5" x2="16" y2="18.5" />
        </svg>
      );

    case "heavy-truck":
      // Tractomula T1 Larga Distancia
      return (
        <svg {...commonProps} className={className}>
          <rect x="1" y="4" width="13" height="12" rx="1" />
          <path d="M14 9h5l3 3v4h-8V9z" />
          <circle cx="4.5" cy="18.5" r="2" />
          <circle cx="9.5" cy="18.5" r="2" />
          <circle cx="18.5" cy="18.5" r="2" />
          <line x1="6.5" y1="18.5" x2="7.5" y2="18.5" />
          <line x1="11.5" y1="18.5" x2="16.5" y2="18.5" />
        </svg>
      );

    case "delivery-truck":
      // Camión Reparto Urbano T2
      return (
        <svg {...commonProps} className={className}>
          <rect x="2" y="5" width="13" height="11" rx="1" />
          <path d="M15 9h4l2 3v4h-6V9z" />
          <circle cx="6" cy="18.5" r="2" />
          <circle cx="17" cy="18.5" r="2" />
          <path d="M5 8h4" />
          <path d="M5 11h6" />
        </svg>
      );

    case "support-truck":
      // Terceros y Apoyo T4
      return (
        <svg {...commonProps} className={className}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );

    case "scooter":
      // Marketplace Mkp
      return (
        <svg {...commonProps} className={className}>
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path d="M6 15h7l2-5h3" />
          <line x1="18" y1="10" x2="18" y2="7" />
          <rect x="7" y="9" width="5" height="5" rx="1" />
        </svg>
      );

    case "forklift":
      // Montacargas / Distoyota
      return (
        <svg {...commonProps} className={className}>
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="15" cy="18" r="2.5" />
          <path d="M8.5 18h4" />
          <path d="M4 15.5V8a2 2 0 0 1 2-2h4l3 4.5v5" />
          <path d="M19 5v13h3" />
          <line x1="17" y1="13" x2="22" y2="13" />
        </svg>
      );

    case "users":
      // Contratistas y Visitantes
      return (
        <svg {...commonProps} className={className}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "gas":
      // GLP - Cilindro y Fuego Seguro
      return (
        <svg {...commonProps} className={className}>
          <rect x="6" y="7" width="12" height="14" rx="3" />
          <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
          <path d="M12 11c1.5 0 2.5 1 2.5 2.5a2.5 2.5 0 0 1-5 0c0-1.5 1-2.5 2.5-2.5z" />
          <line x1="9" y1="3" x2="15" y2="3" />
        </svg>
      );

    default:
      return (
        <svg {...commonProps} className={className}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
  }
}
