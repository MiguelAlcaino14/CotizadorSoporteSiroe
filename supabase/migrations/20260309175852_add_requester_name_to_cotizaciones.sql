/*
  # Add requester_name to cotizaciones and cotizacion_versiones

  ## Changes
  - `cotizaciones`: adds `requester_name` (text, nullable) — stores full name of the person who requested the quote
  - `cotizacion_versiones`: adds `requester_name` (text, nullable) — snapshot of requester at version creation time

  ## Notes
  - Nullable so existing records are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizaciones' AND column_name = 'requester_name'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN requester_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizacion_versiones' AND column_name = 'requester_name'
  ) THEN
    ALTER TABLE cotizacion_versiones ADD COLUMN requester_name text;
  END IF;
END $$;
