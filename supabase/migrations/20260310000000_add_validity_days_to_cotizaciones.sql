ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS validity_days integer NOT NULL DEFAULT 30;
