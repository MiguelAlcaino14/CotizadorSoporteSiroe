/*
  # Agregar uf_value a cotizaciones y cotizacion_versiones

  1. Cambios en tablas
    - `cotizaciones`: nueva columna `uf_value` (numeric, nullable) — guarda el valor de la UF usado al crear/editar
    - `cotizacion_versiones`: nueva columna `uf_value` (numeric, nullable) — guarda el valor de la UF del snapshot de versión

  2. Notas
    - Nullable para compatibilidad con cotizaciones existentes que no tienen ítems en UF
    - El valor se persiste por cotización, no se recalcula al abrir
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizaciones' AND column_name = 'uf_value'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN uf_value numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizacion_versiones' AND column_name = 'uf_value'
  ) THEN
    ALTER TABLE cotizacion_versiones ADD COLUMN uf_value numeric;
  END IF;
END $$;
