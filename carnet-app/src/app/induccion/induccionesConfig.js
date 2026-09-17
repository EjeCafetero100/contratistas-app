// Catálogo centralizado y modular de inducciones para AB InBev / SafeTogether
// Facilita la adición de nuevas inducciones en el futuro simplemente agregando un objeto a esta configuración.

export const MAIN_INDUCTION_CARDS = [
  {
    id: "conductores",
    title: "INDUCCIÓN DE CONDUCTORES",
    shortTitle: "Conductores",
    badge: "SEGURIDAD VIAL • T1, T2, T4, MKP",
    categoryTag: "Conductores",
    categoryIcon: "🚚",
    tagColor: "#fcd116",
    image: "/images/inducciones/conductores.jpg",
    description: "Conoce las normas de seguridad vial, requisitos para conducir y buenas prácticas para una operación segura.",
    iconType: "truck",
    buttonText: "INGRESAR",
    isSubpanel: true,
    targetView: "subpanel-conductores"
  },
  {
    id: "contratistas",
    title: "INDUCCIÓN DE VISITANTES Y CONTRATISTAS",
    shortTitle: "Visitantes y Contratistas",
    badge: "INGRESO & CIRCULACIÓN • EPP",
    categoryTag: "Visitantes y Contratistas",
    categoryIcon: "👷",
    tagColor: "#fcd116",
    image: "/images/inducciones/contratistas.jpg",
    description: "Conoce las normas de ingreso, circulación, elementos de protección y requisitos de seguridad dentro de nuestras instalaciones.",
    iconType: "users",
    buttonText: "INGRESAR",
    isSubpanel: false,
    targetView: "contratistas"
  },
  {
    id: "glp",
    title: "INDUCCIÓN GLP",
    shortTitle: "GLP",
    badge: "RIESGOS & PREVENCIÓN • GLP",
    categoryTag: "Operación GLP",
    categoryIcon: "🔥",
    tagColor: "#fcd116",
    image: "/images/inducciones/glp.jpg",
    description: "Conoce los riesgos asociados al GLP, medidas preventivas, elementos de protección y actuación segura durante su manipulación.",
    iconType: "gas",
    buttonText: "INGRESAR",
    isSubpanel: false,
    targetView: "glp"
  },
  {
    id: "distoyota",
    title: "INDUCCIÓN DISTOYOTA",
    shortTitle: "Distoyota",
    badge: "MONTACARGAS & LOGÍSTICA • DISTOYOTA",
    categoryTag: "Distoyota",
    categoryIcon: "🚜",
    tagColor: "#fcd116",
    image: "/images/inducciones/distoyota.jpg",
    description: "Conoce los lineamientos, normas de seguridad y requisitos necesarios para realizar actividades de manera segura en Distoyota.",
    iconType: "forklift",
    buttonText: "INGRESAR",
    isSubpanel: false,
    targetView: "distoyota"
  }
];

export const DRIVER_INDUCTION_CARDS = [
  {
    id: "t1",
    code: "T1",
    title: "INDUCCIÓN T1",
    subtitle: "Transporte Primario (Larga Distancia)",
    badge: "FLOTA T1 • TRACTOMULAS",
    description: "Inducción para conductores de tractomulas e interplantas. Enfoque en gestión de fatiga, amarre seguro y velocidad en carretera.",
    iconType: "heavy-truck",
    buttonText: "INGRESAR A T1",
    targetView: "t1"
  },
  {
    id: "t2",
    code: "T2",
    title: "INDUCCIÓN T2",
    subtitle: "Transporte Secundario (Reparto Local)",
    badge: "FLOTA T2 • REPARTO URBANO",
    description: "Inducción para camiones de reparto urbano y entrega a clientes. Enfoque en interacción con peatones, descargue seguro y ergonomía.",
    iconType: "delivery-truck",
    buttonText: "INGRESAR A T2",
    targetView: "t2"
  },
  {
    id: "t4",
    code: "T4",
    title: "INDUCCIÓN T4",
    subtitle: "Transporte Terceros y Flota de Apoyo",
    badge: "FLOTA T4 • TERCEROS",
    description: "Inducción para vehículos tercerizados de apoyo en picos operativos. Enfoque en cumplimiento documental y adhesión SafeTogether.",
    iconType: "support-truck",
    buttonText: "INGRESAR A T4",
    targetView: "t4"
  },
  {
    id: "mkp",
    code: "MKP",
    title: "INDUCCIÓN MKP",
    subtitle: "Marketplace y Última Milla",
    badge: "FLOTA MKP • ÚLTIMA MILLA",
    description: "Inducción para conductores y auxiliares de la plataforma Marketplace. Enfoque en trazabilidad, servicio seguro y paquetería.",
    iconType: "scooter",
    buttonText: "INGRESAR A MKP",
    targetView: "mkp"
  }
];

export const INDUCTION_MODULE_DETAILS = {
  t1: {
    id: "t1",
    category: "conductores",
    categoryName: "Conductores",
    fullTitle: "Inducción T1 — Transporte Primario (Larga Distancia)",
    shortName: "T1 - Primario",
    tag: "Flota T1 • Tractomulas",
    requiresPlaca: true,
    summary: "Capacitación obligatoria para conductores de tractomulas e interplantas enfocada en seguridad vial nacional, control de fatiga y estabilidad de carga.",
    rules: [
      "Uso obligatorio de cinturón de seguridad en todo momento durante la conducción.",
      "Velocidad máxima de 10 km/h dentro del Centro de Distribución y 60 km/h en carretera nacional.",
      "Inspección preoperacional diaria de tractomula y remolque (frenos, llantas, luces y quinta rueda).",
      "Inspección minuciosa de carpas, fajas y trincas de sujeción antes de iniciar la marcha.",
      "Prohibido descender del vehículo sin EPP completo (casco con barboquejo, chaleco reflectivo y botas con puntera).",
      "Pausa activa obligatoria cada 2 horas o 200 km de recorrido para control efectivo de la fatiga."
    ],
    warningNotice: "La omisión de cualquiera de estas normas implica suspensión inmediata del turno y revisión del permiso de conducción interplantas.",
    quiz: [
      {
        question: "¿Cuál es la velocidad máxima permitida dentro del Centro de Distribución para tractomulas T1?",
        options: ["10 km/h", "20 km/h", "30 km/h"],
        correctIndex: 0
      },
      {
        question: "¿Qué elemento es mandatorio revisar antes de iniciar el viaje?",
        options: ["Solo la radio y bocina", "Sujeción de carga, carpas, fajas y frenos", "Nivel de aire acondicionado"],
        correctIndex: 1
      },
      {
        question: "¿Cada cuánto tiempo se debe realizar pausa activa para control de fatiga?",
        options: ["Cada 6 horas", "Cada 2 horas o 200 km de recorrido", "Solo al llegar al destino final"],
        correctIndex: 1
      }
    ]
  },
  t2: {
    id: "t2",
    category: "conductores",
    categoryName: "Conductores",
    fullTitle: "Inducción T2 — Transporte Secundario (Reparto y Distribución)",
    shortName: "T2 - Secundario",
    tag: "Flota T2 • Reparto Urbano",
    requiresPlaca: true,
    summary: "Capacitación enfocada en distribución urbana segura, prevención de atropellamientos a peatones y ciclistas, descargue ergonómico y parqueo en cliente.",
    rules: [
      "Aplicar protocolo de parqueo seguro: freno de mano activo y cuñas en llantas traseras en cada entrega.",
      "Prohibido maniobrar en reversa sin la debida guía del auxiliar de reparto o confirmación visual total.",
      "Manipulación de canastillas y barriles: postura ergonómica con flexión de rodillas y carga máxima de 25 kg por persona.",
      "Atención extrema a ciclistas, motociclistas y peatones en puntos ciegos durante la circulación urbana.",
      "Uso obligatorio de guantes antideslizantes para maniobras de estiba y manipulación de producto.",
      "Cero tolerancia al uso de teléfono celular mientras el motor del vehículo esté encendido."
    ],
    warningNotice: "El auxilio en reversa es mandatorio. Cualquier impacto por reversa no asistida es causal de falta grave en el estándar SafeTogether.",
    quiz: [
      {
        question: "¿Qué se debe colocar obligatoriamente al estacionar el camión de reparto para entregas?",
        options: ["Solo luces de parqueo", "Freno de seguridad y cuñas en llantas", "Poner en neutro"],
        correctIndex: 1
      },
      {
        question: "¿Cuál es el peso máximo recomendado para levantamiento individual?",
        options: ["50 kg", "25 kg", "15 kg"],
        correctIndex: 1
      },
      {
        question: "¿Está permitido manipular el celular mientras se conduce si se usa manos libres?",
        options: ["Sí, en vías amplias", "No, cero tolerancia con motor encendido", "Solo para responder a logística"],
        correctIndex: 1
      }
    ]
  },
  t4: {
    id: "t4",
    category: "conductores",
    categoryName: "Conductores",
    fullTitle: "Inducción T4 — Transporte Terceros y Flota de Apoyo",
    shortName: "T4 - Terceros",
    tag: "Flota T4 • Terceros y Apoyo",
    requiresPlaca: true,
    summary: "Formación de alineación operativa y documental para transportadores de apoyo contratados en temporadas altas y refuerzos logísticos.",
    rules: [
      "Planilla de Seguridad Social (ARL riesgo 4 o 5) vigente y validada en portería antes de ingresar.",
      "SOAT y Revisión Técnico-Mecánica vigentes, sin comparendos graves ni vencimientos próximos.",
      "Porte obligatorio de Kit de Carretera completo, extintor vigente de 20 lbs y botiquín reglamentario.",
      "Acatar de manera estricta las directrices de los supervisores de patio y personal de logística interna.",
      "Prohibido el ingreso de acompañantes o menores de edad en cabina o zonas operativas.",
      "Permanecer en la zona peatonal delimitada en amarillo durante el proceso de cargue con montacargas."
    ],
    warningNotice: "El conductor tercero debe estar siempre visible para el operador de montacargas y permanecer fuera de la zona de radio de giro.",
    quiz: [
      {
        question: "¿Qué nivel de riesgo de ARL es mandatorio para conductores en la operación?",
        options: ["Riesgo 1", "Riesgo 2", "Riesgo 4 o 5"],
        correctIndex: 2
      },
      {
        question: "¿Se permite el ingreso de familiares o acompañantes a las instalaciones?",
        options: ["No, totalmente prohibido", "Sí, si esperan en la cabina", "Solo si firman un permiso"],
        correctIndex: 0
      },
      {
        question: "¿Dónde debe permanecer el conductor mientras el montacargas carga el vehículo?",
        options: ["En la plataforma de carga", "En la zona segura peatonal delimitada", "Dentro de la bodega"],
        correctIndex: 1
      }
    ]
  },
  mkp: {
    id: "mkp",
    category: "conductores",
    categoryName: "Conductores",
    fullTitle: "Inducción MKP — Marketplace y Flota de Última Milla",
    shortName: "Mkp - Marketplace",
    tag: "Flota Mkp • Última Milla",
    requiresPlaca: true,
    summary: "Normativa de seguridad vial y manipulación de paquetes para conductores de motocicletas, motocarros y vans ligeras adscritas a Marketplace.",
    rules: [
      "Verificación de identidad en la aplicación y carnet digital de autorización activo.",
      "Aseguramiento adecuado de cajas y paquetes dentro del compartimento para evitar volcamientos.",
      "Para motociclistas: casco reglamentario certificado con visor transparente y chaleco reflectivo visible.",
      "Prohibido transportar mercancías inflamables, cilindros no autorizados o sustancias peligrosas.",
      "Reportar inmediatamente cualquier siniestro vial, caída o conato al supervisor de operaciones.",
      "Trato respetuoso y protocolo de seguridad personal en la entrega final al cliente."
    ],
    warningNotice: "El porte de elementos de protección personal certificados es condición indispensable para despachar rutas de Marketplace.",
    quiz: [
      {
        question: "¿Cómo deben transportarse los paquetes en el vehículo o maletero?",
        options: ["Sueltos sobre el asiento", "Asegurados e inmovilizados para evitar caídas", "Apilados sin amarrar"],
        correctIndex: 1
      },
      {
        question: "¿Qué elemento es obligatorio para operadores de motocicleta?",
        options: ["Gorra institucional", "Casco certificado reglamentario y chaleco reflectivo", "Guantes de tela común"],
        correctIndex: 1
      },
      {
        question: "¿A quién se debe reportar cualquier novedad o siniestro en ruta?",
        options: ["A nadie si no hay heridos", "Inmediatamente al supervisor de operaciones", "Al final de la semana"],
        correctIndex: 1
      }
    ]
  },
  distoyota: {
    id: "distoyota",
    category: "contratistas",
    categoryName: "Distoyota",
    fullTitle: "Inducción Especializada Distoyota — Mantenimiento de Montacargas",
    shortName: "Distoyota",
    tag: "Distoyota S.A.S • Montacargas",
    requiresPlaca: false,
    summary: "Protocolos técnicos de taller, bloqueo y etiquetado (LOTO), elevación segura y prevención de riesgos para mecánicos de Distoyota.",
    rules: [
      "Bloqueo y Etiquetado (LOTO): Desconectar batería o cerrar válvula de gas antes de cualquier intervención técnica.",
      "Uso obligatorio de calzado dieléctrico con puntera, gafas de seguridad y guantes de protección mecánica.",
      "Delimitar el área de trabajo con conos y cinta reflectiva cuando se realice mantenimiento en patio.",
      "Prohibido dejar montacargas elevados sobre gatos hidráulicos sin torres de seguridad fijas y certificadas.",
      "Pruebas de freno y dirección únicamente en zonas autorizadas y a velocidad reducida (máx 5 km/h).",
      "Disposición adecuada de residuos peligrosos (aceites usados, filtros, trapos contaminados) en puntos RESPEL."
    ],
    warningNotice: "Nunca se debe ingresar bajo un mástil elevado sin el bloqueo mecánico de seguridad de vástagos instalado.",
    quiz: [
      {
        question: "¿Cuál es el procedimiento obligatorio antes de intervenir mecánicamente un montacargas?",
        options: ["Solo apagar la llave", "Aplicar Bloqueo y Etiquetado (LOTO) y desconectar fuentes de energía", "Dejarlo en marcha mínima"],
        correctIndex: 1
      },
      {
        question: "¿Qué se debe emplear para asegurar el equipo elevado durante labores mecánicas?",
        options: ["Solo el gato hidráulico", "Torres fijas de seguridad certificadas", "Bloques de madera improvisados"],
        correctIndex: 1
      },
      {
        question: "¿Dónde se deben depositar los filtros y aceites usados?",
        options: ["En la basura ordinaria", "En los recipientes asignados para residuos peligrosos (RESPEL)", "En el sifón del taller"],
        correctIndex: 1
      }
    ]
  },
  contratistas: {
    id: "contratistas",
    category: "contratistas",
    categoryName: "Contratistas y Visitantes",
    fullTitle: "Inducción Contratistas y Visitantes Administrativos",
    shortName: "Contratistas y Visitantes",
    tag: "Contratistas & Obras",
    requiresPlaca: false,
    summary: "Lineamientos generales de SST para contratistas de obras civiles, mantenimiento locativo, aseo, proveedores y visitas técnicas a instalaciones.",
    rules: [
      "Presentar planilla de pago vigente de Seguridad Social (EPS, ARL riesgo correspondiente y AFP) en portería.",
      "Todo trabajo en alturas (superior a 2 metros), en caliente o en espacios confinados requiere Permiso de Trabajo firmado por SST.",
      "Transitar estrictamente por los senderos peatonales delimitados en amarillo. NUNCA cruzar por calzadas de montacargas.",
      "Uso mandatorio de chaleco reflectivo de alta visibilidad y calzado de seguridad con puntera para ingresar a bodegas.",
      "Identificar rutas de evacuación, alarmas y el Punto de Encuentro asignado en el Centro de Distribución.",
      "Reportar inmediatamente al supervisor de EHS cualquier conato, incidente o condición insegura identificada."
    ],
    warningNotice: "El ingreso a áreas operativas sin EPP o sin el Permiso de Trabajo Seguro causará la expulsión inmediata de la sede.",
    quiz: [
      {
        question: "¿Por dónde deben transitar los contratistas y visitantes peatonales?",
        options: ["Por el centro de las bodegas", "Estrictamente por los senderos peatonales delimitados en amarillo", "Por cualquier zona libre de camiones"],
        correctIndex: 1
      },
      {
        question: "¿Qué documento es obligatorio para labores en alturas o trabajos en caliente?",
        options: ["Permiso de Trabajo Seguro (PTS) firmado por SST/EHS", "Autorización verbal del cliente", "Fotocopia del documento"],
        correctIndex: 0
      },
      {
        question: "¿Cuáles son los elementos mínimos para ingresar a áreas de bodega?",
        options: ["Zapatos deportivos", "Chaleco reflectivo y calzado de seguridad con puntera", "Gafas oscuras"],
        correctIndex: 1
      }
    ]
  },
  glp: {
    id: "glp",
    category: "contratistas",
    categoryName: "GLP",
    fullTitle: "Inducción Especializada en Manipulación Segura de GLP",
    shortName: "GLP",
    tag: "Seguridad GLP",
    requiresPlaca: false,
    summary: "Formación especializada sobre riesgos, almacenamiento, detección de fugas y cambio seguro de cilindros de Gas Licuado de Petróleo para montacargas.",
    rules: [
      "Almacenar cilindros siempre en posición vertical, en zona techada con ventilación natural permanente y cadenas de fijación.",
      "Verificar ausencia de fugas aplicando solución de agua jabonosa en uniones y mangueras. NUNCA emplear fuego directo.",
      "Prohibido fumar, generar chispas o usar celulares en un radio de 15 metros de la estación de almacenamiento de cilindros.",
      "Uso de guantes de carnaza y gafas de protección ocular al realizar acople y desacople de mangueras de GLP.",
      "En caso de escape persistente: cerrar válvula principal, evacuar en sentido contrario al viento y activar brigada de emergencia.",
      "Contar con extintor tipo BC o ABC de 20 lbs con carga vigente a menos de 5 metros de la estación de cambio de gas."
    ],
    warningNotice: "El GLP es más denso que el aire y tiende a acumularse en el suelo y drenajes en caso de fuga, generando riesgo inminente de explosión.",
    quiz: [
      {
        question: "¿Cómo se debe verificar la presencia de fugas en conexiones de cilindros de GLP?",
        options: ["Con un fósforo o encendedor", "Con solución de agua jabonosa y brocha", "Acercando la mano para sentir el viento"],
        correctIndex: 1
      },
      {
        question: "¿En qué posición deben almacenarse los cilindros de gas GLP?",
        options: ["Acostados para evitar caídas", "Siempre en posición vertical y encadenados", "En cualquier posición si tienen tapa"],
        correctIndex: 1
      },
      {
        question: "¿Cuál es la distancia mínima sin fuentes de ignición o chispas respecto al banco de cilindros?",
        options: ["3 metros", "5 metros", "15 metros"],
        correctIndex: 2
      }
    ]
  }
};
