-- Shift pattern system: recurring shift definitions with auto-generation
-- Patterns define what shifts to create; individual shift rows are materialized from them.

-- 1. Shift pattern table
CREATE TABLE IF NOT EXISTS shift_pattern (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           uuid NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  role_id           uuid NOT NULL REFERENCES role(id),
  area_id           uuid REFERENCES area(id),
  weekdays          smallint[] NOT NULL,
  start_time        time NOT NULL,
  end_time          time NOT NULL,
  min_staff         int NOT NULL DEFAULT 1,
  notes             text,
  start_date        date NOT NULL,
  end_date          date,
  auto_generate     boolean NOT NULL DEFAULT false,
  active            boolean NOT NULL DEFAULT true,
  last_generated_to date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_pattern_site   ON shift_pattern(site_id);
CREATE INDEX IF NOT EXISTS idx_shift_pattern_active ON shift_pattern(site_id, active) WHERE active = true;

-- RLS for shift_pattern (site-scoped, same as shift table)
ALTER TABLE shift_pattern ENABLE ROW LEVEL SECURITY;
CREATE POLICY shift_pattern_rw ON shift_pattern FOR ALL
  USING  (caller_can_access_site(site_id))
  WITH CHECK (caller_can_access_site(site_id));

-- 2. Link shifts to their parent pattern
ALTER TABLE shift ADD COLUMN IF NOT EXISTS pattern_id uuid REFERENCES shift_pattern(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_shift_pattern_id ON shift(pattern_id) WHERE pattern_id IS NOT NULL;

-- 3. Add 'pattern' to allowed shift sources
ALTER TABLE shift DROP CONSTRAINT IF EXISTS shift_source_check;
ALTER TABLE shift ADD CONSTRAINT shift_source_check
  CHECK (source IN ('manual','generated','rota','cloned','pattern'));

-- 4. Org-level generation horizon
ALTER TABLE org ADD COLUMN IF NOT EXISTS generation_horizon_unit  text NOT NULL DEFAULT 'months'
  CHECK (generation_horizon_unit IN ('days','months'));
ALTER TABLE org ADD COLUMN IF NOT EXISTS generation_horizon_value int  NOT NULL DEFAULT 1
  CHECK (generation_horizon_value BETWEEN 1 AND 365);
