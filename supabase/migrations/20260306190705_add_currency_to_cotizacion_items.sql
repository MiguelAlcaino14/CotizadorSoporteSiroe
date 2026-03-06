/*
  # Add currency column to cotizacion_items

  ## Changes
  - Adds `currency` column (text, default 'CLP') to `cotizacion_items` table
    so each line item can independently be priced in CLP or UF.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizacion_items' AND column_name = 'currency'
  ) THEN
    ALTER TABLE cotizacion_items ADD COLUMN currency text NOT NULL DEFAULT 'CLP';
  END IF;
END $$;
