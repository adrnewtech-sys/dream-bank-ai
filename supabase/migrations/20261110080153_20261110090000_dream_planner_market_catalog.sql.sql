/*
# Dream Planner market catalog and goal types

1. Changes
- `savings_goals` gains `dream_type` (car, bike, travel, other) so the planner knows which market to search.
- New table `market_vehicles` holds car, bike and scooter models with market price estimates.
- New table `travel_destinations` holds destinations with estimated trip costs.

2. Security
- RLS enabled on both catalog tables.
- Catalog tables are shared reference data, so authenticated users may read them. No client writes.
- `savings_goals` keeps its existing owner-scoped policies.

3. Notes
- Prices are approximate ex-showroom or typical trip costs in INR, taken from published listings in late 2026. They should be refreshed periodically.
- Seed rows use fixed ids so the migration is safe to re-run on a fresh database.
*/

ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS dream_type text NOT NULL DEFAULT 'other';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'savings_goals_dream_type_check'
  ) THEN
    ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_dream_type_check
      CHECK (dream_type IN ('car', 'bike', 'travel', 'other'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS market_vehicles (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('car', 'bike', 'scooter')),
  brand text NOT NULL,
  model text NOT NULL,
  price_inr integer NOT NULL CHECK (price_inr > 0),
  price_basis text NOT NULL,
  UNIQUE (kind, brand, model)
);

CREATE TABLE IF NOT EXISTS travel_destinations (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  country text NOT NULL,
  trip_cost_inr integer NOT NULL CHECK (trip_cost_inr > 0),
  highlight text NOT NULL,
  UNIQUE (name, country)
);

ALTER TABLE market_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_destinations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON market_vehicles TO authenticated;
GRANT SELECT ON travel_destinations TO authenticated;

DROP POLICY IF EXISTS "select_market_vehicles" ON market_vehicles;
CREATE POLICY "select_market_vehicles" ON market_vehicles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "select_travel_destinations" ON travel_destinations;
CREATE POLICY "select_travel_destinations" ON travel_destinations FOR SELECT
  TO authenticated USING (true);

INSERT INTO market_vehicles (id, kind, brand, model, price_inr, price_basis) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'car', 'Tata', 'Punch', 565000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000002', 'car', 'Hyundai', 'Exter', 581000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000003', 'car', 'Maruti Suzuki', 'Dzire', 626000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000004', 'car', 'Tata', 'Altroz', 630000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000005', 'car', 'Maruti Suzuki', 'Fronx', 685000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000006', 'car', 'Tata', 'Nexon', 737000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000007', 'car', 'Mahindra', 'XUV 3XO', 737000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000008', 'car', 'Kia', 'Sonet', 741000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000009', 'car', 'Hyundai', 'Venue', 800000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000010', 'car', 'Maruti Suzuki', 'Brezza', 826000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000011', 'car', 'Hyundai', 'Creta', 1080000, 'Ex-showroom starting price, 2026'),
  ('a0000000-0000-4000-8000-000000000012', 'car', 'Mahindra', 'Thar Roxx', 1230000, 'Ex-showroom starting price, 2026'),
  ('b0000000-0000-4000-8000-000000000001', 'bike', 'TVS', 'Raider 125', 92000, 'Ex-showroom estimate, 2026'),
  ('b0000000-0000-4000-8000-000000000002', 'bike', 'Honda', 'SP 125', 87000, 'Ex-showroom estimate, 2026'),
  ('b0000000-0000-4000-8000-000000000003', 'bike', 'Hero', 'Xtreme 125R', 93000, 'Ex-showroom estimate, 2026'),
  ('b0000000-0000-4000-8000-000000000004', 'bike', 'Yamaha', 'FZ-S Fi', 114000, 'Ex-showroom estimate, 2026'),
  ('b0000000-0000-4000-8000-000000000005', 'bike', 'Bajaj', 'Pulsar 150', 115000, 'Ex-showroom estimate, 2026'),
  ('b0000000-0000-4000-8000-000000000006', 'bike', 'Royal Enfield', 'Hunter 350', 139000, 'Ex-showroom estimate, 2026'),
  ('b0000000-0000-4000-8000-000000000007', 'bike', 'Royal Enfield', 'Classic 350', 193000, 'Ex-showroom estimate, 2026'),
  ('b0000000-0000-4000-8000-000000000008', 'bike', 'KTM', '200 Duke', 185000, 'Ex-showroom estimate, 2026'),
  ('c0000000-0000-4000-8000-000000000001', 'scooter', 'Honda', 'Activa 6G', 78000, 'Ex-showroom estimate, 2026'),
  ('c0000000-0000-4000-8000-000000000002', 'scooter', 'TVS', 'Jupiter', 80000, 'Ex-showroom estimate, 2026'),
  ('c0000000-0000-4000-8000-000000000003', 'scooter', 'Suzuki', 'Access 125', 82000, 'Ex-showroom estimate, 2026'),
  ('c0000000-0000-4000-8000-000000000004', 'scooter', 'Honda', 'Dio', 80000, 'Ex-showroom estimate, 2026')
ON CONFLICT (kind, brand, model) DO NOTHING;

INSERT INTO travel_destinations (id, name, country, trip_cost_inr, highlight) VALUES
  ('d0000000-0000-4000-8000-000000000001', 'Goa', 'India', 25000, 'Beaches and nightlife'),
  ('d0000000-0000-4000-8000-000000000002', 'Manali', 'India', 30000, 'Mountains and snow'),
  ('d0000000-0000-4000-8000-000000000003', 'Munnar', 'India', 32000, 'Tea gardens and hill views'),
  ('d0000000-0000-4000-8000-000000000004', 'Ladakh', 'India', 65000, 'High-altitude road trips'),
  ('d0000000-0000-4000-8000-000000000005', 'Phuket', 'Thailand', 85000, 'Islands and beaches'),
  ('d0000000-0000-4000-8000-000000000006', 'Bali', 'Indonesia', 95000, 'Culture and surf'),
  ('d0000000-0000-4000-8000-000000000007', 'Dubai', 'UAE', 140000, 'Shopping and skyline'),
  ('d0000000-0000-4000-8000-000000000008', 'Singapore', 'Singapore', 160000, 'City and food'),
  ('d0000000-0000-4000-8000-000000000009', 'Japan', 'Japan', 260000, 'Cherry blossoms and cities'),
  ('d0000000-0000-4000-8000-000000000010', 'Paris', 'France', 320000, 'Museums and cafes'),
  ('d0000000-0000-4000-8000-000000000011', 'Switzerland', 'Switzerland', 420000, 'Alps and scenic trains'),
  ('d0000000-0000-4000-8000-000000000012', 'New York', 'USA', 450000, 'Broadway and landmarks')
ON CONFLICT (name, country) DO NOTHING;
