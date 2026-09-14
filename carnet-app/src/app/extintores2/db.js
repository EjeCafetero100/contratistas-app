// db.js
// Esta es la base de datos inventada para el módulo Extintores 2.
// Puedes editarla agregando, modificando o eliminando registros.
// Para las fechas de vencimiento, utiliza el formato 'YYYY-MM-DD'.

export const extintoresData = [
  {
    id: "EXT2-001",
    ubicacion: "Pasillo Principal",
    tipo: "PQS",
    capacidad: "10 lbs",
    // Verde (> 90 días) - Ejemplo: Vence en unos 120 días desde el 2026-07-24
    fechaVencimiento: "2026-11-21"
  },
  {
    id: "EXT2-002",
    ubicacion: "Bodega de Insumos",
    tipo: "CO2",
    capacidad: "15 lbs",
    // Amarillo (30 - 90 días) - Ejemplo: Vence en unos 45 días
    fechaVencimiento: "2026-09-07"
  },
  {
    id: "EXT2-003",
    ubicacion: "Comedor",
    tipo: "Solagua",
    capacidad: "2.5 Gal",
    // Rojo (< 30 días) - Ejemplo: Vence en unos 10 días
    fechaVencimiento: "2026-08-03"
  },
  {
    id: "EXT2-004",
    ubicacion: "Recepción",
    tipo: "PQS",
    capacidad: "10 lbs",
    // Verde (> 90 días)
    fechaVencimiento: "2027-01-15"
  },
  {
    id: "EXT2-005",
    ubicacion: "Laboratorio",
    tipo: "CO2",
    capacidad: "10 lbs",
    // Amarillo (30 - 90 días)
    fechaVencimiento: "2026-09-20"
  },
  {
    id: "EXT2-006",
    ubicacion: "Sala de Juntas",
    tipo: "PQS",
    capacidad: "20 lbs",
    // Rojo (< 30 días)
    fechaVencimiento: "2026-07-28"
  }
];
