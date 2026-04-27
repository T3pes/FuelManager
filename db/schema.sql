-- Schema iniziale per Supabase PostgreSQL
-- Tabella operatori
CREATE TABLE operators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'supervisor', 'operator', 'viewer')),
    created_at timestamptz DEFAULT now()
);

-- Tabella cisterne
CREATE TABLE tankers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    capacity numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Tabella velivoli
CREATE TABLE aircrafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    type text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Tabella rifornimenti
CREATE TABLE refuelings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id uuid REFERENCES operators(id),
    tanker_id uuid REFERENCES tankers(id),
    aircraft_id uuid REFERENCES aircrafts(id),
    quantity numeric NOT NULL,
    date timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Tabella destinatari report giornalieri
CREATE TABLE daily_report_recipients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Tabella audit log
CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action text NOT NULL,
    entity text NOT NULL,
    entity_id uuid,
    operator_id uuid REFERENCES operators(id),
    timestamp timestamptz DEFAULT now()
);

