import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vgxdpcowbuharsamwbra.supabase.co")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZneGRwY293YnVoYXJzYW13YnJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjYzNTk4MiwiZXhwIjoyMTAyMjExOTgyfQ.SdisTL88iYVKaOg2FPcTckamQer68lXf5062CUfzRgM")

sql = """
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
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to complaints" ON public.complaints;
CREATE POLICY "Allow public access to complaints" ON public.complaints FOR ALL USING (true) WITH CHECK (true);
"""

# Try /pg/query endpoint
r = requests.post(
    f"{SUPABASE_URL}/pg/query",
    headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    },
    json={"query": sql},
)
print("pg/query status:", r.status_code, r.text)

# Try /sql endpoint if pg/query is not enabled
if r.status_code != 200 and r.status_code != 201:
    r2 = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
        },
        json={"sql": sql},
    )
    print("exec_sql status:", r2.status_code, r2.text)
