-- ==============================================================================
-- SCHEMA SUPABASE: TELEMETRÍA Y GESTIÓN DE CONSECUENCIAS (BARRANCABERMEJA)
-- ==============================================================================

-- 1. Tabla de Eventos de Telemetría e Infracciones
CREATE TABLE IF NOT EXISTS public.telemetria_eventos (
  id BIGSERIAL PRIMARY KEY,
  cd VARCHAR(100) DEFAULT 'Barrancabermeja',
  fecha DATE,
  mes VARCHAR(50),
  semana VARCHAR(50),
  placa VARCHAR(20),
  motivo VARCHAR(100),
  tipo_evento VARCHAR(255),
  responsable VARCHAR(255),
  total INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Gestión de Consecuencias de Conductores
CREATE TABLE IF NOT EXISTS public.telemetria_gestion_consecuencia (
  id BIGSERIAL PRIMARY KEY,
  cd VARCHAR(100) DEFAULT 'Barrancabermeja',
  nombre_conductor VARCHAR(255),
  reporte_credit VARCHAR(100),
  cedula VARCHAR(50),
  fecha_reporte_credit DATE,
  reincidente VARCHAR(10) DEFAULT 'NO',
  medidas_aplicadas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices de Búsqueda Rápida para el Dashboard
CREATE INDEX IF NOT EXISTS idx_telemetria_eventos_cd ON public.telemetria_eventos(cd);
CREATE INDEX IF NOT EXISTS idx_telemetria_eventos_fecha ON public.telemetria_eventos(fecha);
CREATE INDEX IF NOT EXISTS idx_telemetria_eventos_placa ON public.telemetria_eventos(placa);
CREATE INDEX IF NOT EXISTS idx_telemetria_gestion_cd ON public.telemetria_gestion_consecuencia(cd);
CREATE INDEX IF NOT EXISTS idx_telemetria_gestion_cedula ON public.telemetria_gestion_consecuencia(cedula);

-- 4. Seguridad de Nivel de Fila (RLS)
ALTER TABLE public.telemetria_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetria_gestion_consecuencia ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'telemetria_eventos' AND policyname = 'Permitir acceso a telemetria_eventos'
  ) THEN
    CREATE POLICY "Permitir acceso a telemetria_eventos" ON public.telemetria_eventos FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'telemetria_gestion_consecuencia' AND policyname = 'Permitir acceso a telemetria_gestion_consecuencia'
  ) THEN
    CREATE POLICY "Permitir acceso a telemetria_gestion_consecuencia" ON public.telemetria_gestion_consecuencia FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
