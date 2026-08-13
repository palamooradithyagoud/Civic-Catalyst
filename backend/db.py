import sqlite3
import os
from datetime import datetime
from typing import Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "inventory.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Enable Foreign Keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Categories Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # 2. Suppliers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # 3. Inventory Items Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id_code TEXT UNIQUE NOT NULL,
        item_name TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        unit TEXT NOT NULL,
        current_quantity INTEGER NOT NULL DEFAULT 0,
        min_quantity INTEGER NOT NULL DEFAULT 10,
        max_quantity INTEGER NOT NULL DEFAULT 200,
        batch_number TEXT,
        expiry_date TEXT,
        supplier_id INTEGER,
        last_restocked TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
    """)

    # 4. Inventory Transactions Table (Immutable Log)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id_code TEXT UNIQUE NOT NULL,
        item_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL, -- STOCK_IN, STOCK_OUT, DISTRIBUTION, ADJUSTMENT
        quantity INTEGER NOT NULL,
        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        date TEXT NOT NULL,
        reference TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    );
    """)

    # 5. Distribution Records Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS distribution_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        beneficiary_ref TEXT NOT NULL,
        area_village TEXT NOT NULL,
        purpose TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES inventory_transactions(id),
        FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    );
    """)

    # 6. Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        alert_type TEXT NOT NULL, -- OUT_OF_STOCK, LOW_STOCK, EXPIRING_SOON, EXPIRED
        severity TEXT NOT NULL, -- CRITICAL, WARNING, INFO
        message TEXT NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    );
    """)

    conn.commit()
    conn.close()


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return dict(row) if row else {}
