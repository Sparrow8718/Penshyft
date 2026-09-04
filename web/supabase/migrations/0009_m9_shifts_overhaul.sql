-- M9: Shift & Settings Overhaul
-- Staff work constraints, template min/max, blocked dates, availability requests

-- 1a. Staff work constraints
ALTER TABLE staff ADD COLUMN IF NOT EXISTS max_hours_per_week numeric(4,1) DEFAULT NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS max_hours_per_day  numeric(4,1) DEFAULT NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS max_days_per_week  smallint     DEFAULT NULL;

-- 1b. Template: replace headcount with min/max staff + hours
ALTER TABLE shift_template ADD COLUMN IF NOT EXISTS min_staff  int NOT NULL DEFAULT 1;
ALTER TABLE shift_template ADD COLUMN IF NOT EXISTS max_staff  int NOT NULL DEFAULT 1;
ALTER TABLE shift_template ADD COLUMN IF NOT EXISTS min_hours  numeric(4,1) DEFAULT NULL;
ALTER TABLE shift_template ADD COLUMN IF NOT EXISTS max_hours  numeric(4,1) DEFAULT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shift_template' AND column_name = 'headcount'
  ) THEN
    UPDATE shift_template SET min_staff = headcount, max_staff = headcount;
    ALTER TABLE shift_template DROP COLUMN headcount;
  END IF;
END $$;

-- 1c. Blocked dates (bank holidays)
CREATE TABLE IF NOT EXISTS site_blocked_date (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    uuid NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  date       date NOT NULL,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(site_id, date)
);
CREATE INDEX IF NOT EXISTS idx_site_blocked_date_site ON site_blocked_date(site_id);

-- 1d. Availability requests
CREATE TABLE IF NOT EXISTS availability_request (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES org(id)   ON DELETE CASCADE,
  request_type  text NOT NULL CHECK (request_type IN ('day_off','hours_limit','recurring')),
  date          date,
  start_time    time,
  end_time      time,
  weekday       smallint CHECK (weekday IS NULL OR weekday BETWEEN 0 AND 6),
  reason        text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  resolved_by   uuid REFERENCES member(id),
  resolved_at   timestamptz,
  manager_note  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_availability_request_org    ON availability_request(org_id, status);
CREATE INDEX IF NOT EXISTS idx_availability_request_staff  ON availability_request(staff_id);

-- 1e. Fix shift source constraint
ALTER TABLE shift DROP CONSTRAINT IF EXISTS shift_source_check;
ALTER TABLE shift ADD CONSTRAINT shift_source_check CHECK (source IN ('manual','generated','rota','cloned'));
