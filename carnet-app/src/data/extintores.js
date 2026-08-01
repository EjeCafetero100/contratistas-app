// Función auxiliar para sumar días a una fecha
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const today = new Date();

export const extintoresMockData = [
  { id: "EXT-001", ubicacion: "Oficina Principal", tipo: "CO2", capacidad: "10 lbs", fechaVencimiento: addDays(today, 15), observacion: "Vence pronto" }, 
  { id: "EXT-002", ubicacion: "Bodega Zona A", tipo: "PQS", capacidad: "20 lbs", fechaVencimiento: addDays(today, 45), observacion: "Manguera con ligero desgaste" }, 
  { id: "EXT-003", ubicacion: "Pasillo Central", tipo: "Solagua", capacidad: "2.5 Gal", fechaVencimiento: addDays(today, 120), observacion: "Revisado ok" }, 
  { id: "EXT-004", ubicacion: "Comedor", tipo: "PQS", capacidad: "10 lbs", fechaVencimiento: addDays(today, 5), observacion: "Urgente recarga" }, 
  { id: "EXT-005", ubicacion: "Sala de Juntas", tipo: "CO2", capacidad: "5 lbs", fechaVencimiento: addDays(today, 35), observacion: "Falta señalización" }, 
  { id: "EXT-006", ubicacion: "Recepción", tipo: "PQS", capacidad: "10 lbs", fechaVencimiento: addDays(today, 95), observacion: "" }, 
  { id: "EXT-007", ubicacion: "Parqueadero VIP", tipo: "PQS", capacidad: "20 lbs", fechaVencimiento: addDays(today, 55), observacion: "Etiqueta ilegible" }, 
  { id: "EXT-008", ubicacion: "Cuarto de Máquinas", tipo: "CO2", capacidad: "15 lbs", fechaVencimiento: addDays(today, 25), observacion: "Programado para cambio" }, 
  { id: "EXT-009", ubicacion: "Bodega Zona B", tipo: "PQS", capacidad: "20 lbs", fechaVencimiento: addDays(today, 200), observacion: "Nuevo" }, 
  { id: "EXT-010", ubicacion: "Laboratorio", tipo: "Solagua", capacidad: "2.5 Gal", fechaVencimiento: addDays(today, 80), observacion: "" }, 
];
