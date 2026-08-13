-- ══════════════════════════════════════════════════════════════════════════════
-- CIVIC CATALYST — SUPABASE POSTGRESQL COMPLETE DATABASE SCHEMA
-- Copy and paste this complete SQL script into Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vgxdpcowbuharsamwbra/sql/new
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Categories Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. Suppliers Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. Medical Inventory Items Table (Tablets, Syrups, Vaccines) ────────────
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id SERIAL PRIMARY KEY,
    item_id_code VARCHAR(100) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name VARCHAR(255),
    unit VARCHAR(50) NOT NULL,
    current_quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 10,
    max_quantity INTEGER NOT NULL DEFAULT 500,
    batch_number VARCHAR(100),
    expiry_date DATE,
    supplier_id INTEGER REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    last_restocked DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Healthy',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. Inventory Transactions Log ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id_code VARCHAR(100) UNIQUE NOT NULL,
    item_id INTEGER REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- STOCK_IN, DISTRIBUTION, ADJUSTMENT
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 5. Distribution Records (Deliveries to Villages & Beneficiaries) ───────
CREATE TABLE IF NOT EXISTS public.distribution_records (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES public.inventory_transactions(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) DEFAULT 'Units',          -- e.g. Strips, Kits, Vials
    quantity INTEGER NOT NULL,
    beneficiary_ref VARCHAR(255) NOT NULL,
    area_village VARCHAR(255) NOT NULL, -- Ward 1, Ward 2, Ward 3, Ward 4
    purpose VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 6. Alerts Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    item_name VARCHAR(255),
    alert_type VARCHAR(50) NOT NULL, -- OUT_OF_STOCK, LOW_STOCK, EXPIRING_SOON, EXPIRED
    severity VARCHAR(50) NOT NULL, -- CRITICAL, WARNING, INFO
    message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 7. Medicine Requests Table (ASHA -> Mandal Request Workflow) ─────────────
CREATE TABLE IF NOT EXISTS public.medicine_requests (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(100) UNIQUE NOT NULL,
    asha_worker_name VARCHAR(255) NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    requested_quantity INTEGER NOT NULL,
    approved_quantity INTEGER DEFAULT 0,
    dispatched_quantity INTEGER DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'Units',
    urgency VARCHAR(50) NOT NULL DEFAULT 'Normal',
    reason TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    dispatch_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 8. Civic Complaints Table (Citizen -> Gram Panchayat Reporting) ──────────
CREATE TABLE IF NOT EXISTS public.complaints (
    id SERIAL PRIMARY KEY,
    complaint_id_code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'Roads & Infrastructure',
    location VARCHAR(255) NOT NULL,
    urgency VARCHAR(50) NOT NULL DEFAULT 'High',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    villager_name VARCHAR(255) NOT NULL,
    villager_id VARCHAR(100),
    village VARCHAR(255) DEFAULT 'Shyampet',
    image_url TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    date_label VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 9. Enable Row Level Security & Public Access Policies ────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to categories" ON public.categories;
CREATE POLICY "Allow public access to categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to suppliers" ON public.suppliers;
CREATE POLICY "Allow public access to suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to inventory_items" ON public.inventory_items;
CREATE POLICY "Allow public access to inventory_items" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "Allow public access to inventory_transactions" ON public.inventory_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to distribution_records" ON public.distribution_records;
CREATE POLICY "Allow public access to distribution_records" ON public.distribution_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to alerts" ON public.alerts;
CREATE POLICY "Allow public access to alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to medicine_requests" ON public.medicine_requests;
CREATE POLICY "Allow public access to medicine_requests" ON public.medicine_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to complaints" ON public.complaints;
CREATE POLICY "Allow public access to complaints" ON public.complaints FOR ALL USING (true) WITH CHECK (true);

-- ── 10. Initial Seed Data ────────────────────────────────────────────────────
INSERT INTO public.categories (id, name, description) VALUES
(1, 'Medicines', 'Essential community tablets, syrups, and supplements'),
(2, 'Maternal Health Supplies', 'Iron tablets, delivery kits, and ANC care'),
(3, 'Child Health Supplies', 'Vaccines, ORS kits, and pediatric syrups'),
(4, 'Hygiene Supplies', 'Chlorine tablets and personal sanitization'),
(5, 'Diagnostic Supplies', 'HB strips, RDT kits, and thermometers')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.suppliers (id, name, contact_person, phone, email) VALUES
(1, 'District Medical Warehouse', 'Dr. Sharma', '+91-9876543210', 'supply@districtphc.gov.in'),
(2, 'PHC Central Depot', 'Pharmacist Anil', '+91-9876543212', 'phc.depot@ruralhealth.org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory_items 
(id, item_id_code, item_name, category_id, category_name, unit, current_quantity, min_quantity, max_quantity, batch_number, expiry_date, supplier_id, supplier_name, status) VALUES
(1, 'ASH-INV-001', 'Paracetamol 500mg Tablets', 1, 'Medicines', 'Strips', 140, 20, 300, 'BAT-PCM-2026', '2027-08-13', 1, 'District Medical Warehouse', 'Healthy'),
(2, 'ASH-INV-002', 'Paracetamol 125mg Syrup', 1, 'Medicines', 'Bottles', 0, 15, 100, 'BAT-PCM-SYP', '2027-02-09', 2, 'PHC Central Depot', 'Out of Stock'),
(3, 'ASH-INV-003', 'Iron & Folic Acid Tablets (IFA Blue)', 2, 'Maternal Health Supplies', 'Strips', 8, 30, 400, 'BAT-IFA-901', '2026-08-31', 1, 'District Medical Warehouse', 'Low Stock'),
(4, 'ASH-INV-004', 'ORS & Zinc Hydration Kits', 3, 'Child Health Supplies', 'Kits', 0, 20, 150, 'BAT-ORS-2026', '2027-02-09', 2, 'PHC Central Depot', 'Out of Stock'),
(5, 'ASH-INV-005', 'OPV Polio Vaccine Vials', 3, 'Child Health Supplies', 'Vials', 4, 15, 80, 'BAT-OPV-44', '2026-11-11', 2, 'PHC Central Depot', 'Low Stock')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.complaints
(complaint_id_code, title, description, category, location, urgency, status, villager_name, villager_id, village, ai_generated, date_label) VALUES
('C-001', 'Broken road near main market', 'Deep pothole and asphalt damage obstructing traffic near central market entrance.', 'Roads & Infrastructure', 'Market Road, Ward 4', 'High', 'pending', 'Ramesh Kumar', 'vil_001', 'Shyampet', true, 'Today, 9:15 AM'),
('C-002', 'Water supply disruption in Ward 2', 'Burst main pipeline causing clean water leak and low pressure across residential houses.', 'Water Supply', 'Ward 2 Residential Area', 'High', 'in_progress', 'Suresh Reddy', 'vil_002', 'Shyampet', true, 'Yesterday, 6:00 PM'),
('C-003', 'Garbage clearance near primary school', 'Unsegregated garbage accumulation creating unhygienic conditions near school entrance.', 'Sanitation', 'Primary School Lane', 'Medium', 'resolved', 'Meena Patel', 'vil_003', 'Shyampet', false, '12 Aug, 2:45 PM')
ON CONFLICT (complaint_id_code) DO NOTHING;

-- ── 11. Schema Migration Patch (run on existing deployments) ─────────────────
-- If distribution_records table already exists without the 'unit' column, add it:
ALTER TABLE public.distribution_records
    ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'Units';
