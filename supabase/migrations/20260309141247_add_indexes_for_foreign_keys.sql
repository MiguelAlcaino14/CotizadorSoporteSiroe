/*
  # Add indexes for unindexed foreign keys

  ## Summary
  Adds covering indexes for all foreign key columns that lack them.
  This improves query performance on JOINs and lookups by foreign key.

  ## New Indexes
  - `cotizacion_items.cotizacion_id` → idx_cotizacion_items_cotizacion_id
  - `cotizacion_versiones.cotizacion_id` → idx_cotizacion_versiones_cotizacion_id
  - `cotizaciones.client_id` → idx_cotizaciones_client_id
  - `documentos.cotizacion_id` → idx_documentos_cotizacion_id
  - `tickets.cotizacion_id` → idx_tickets_cotizacion_id
*/

CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion_id
  ON public.cotizacion_items (cotizacion_id);

CREATE INDEX IF NOT EXISTS idx_cotizacion_versiones_cotizacion_id
  ON public.cotizacion_versiones (cotizacion_id);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_client_id
  ON public.cotizaciones (client_id);

CREATE INDEX IF NOT EXISTS idx_documentos_cotizacion_id
  ON public.documentos (cotizacion_id);

CREATE INDEX IF NOT EXISTS idx_tickets_cotizacion_id
  ON public.tickets (cotizacion_id);
