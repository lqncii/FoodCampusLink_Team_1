import psycopg2
import psycopg2.extras
from datetime import datetime
from contextlib import contextmanager
 
 
class Database:
 
    def __init__(self, host, dbname, user, password, port=5432, sslmode="require"):
        self.conn = psycopg2.connect(
            host=host,
            dbname=dbname,
            user=user,
            password=password,
            port=port,
            sslmode=sslmode,
            cursor_factory=psycopg2.extras.RealDictCursor,
        )
        self.create_tables()
 
    @contextmanager
    def cursor(self):
        cur = self.conn.cursor()
        try:
            yield cur
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise
        finally:
            cur.close()
         
 #I am not even sure if i need to have this in here because i already created the tables but god forbid something gets deleted tbh 
    def create_tables(self):
        """Idempotent: only creates tables if they don't already exist."""
        with self.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS roles (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    last_name TEXT NOT NULL,
                    first_name TEXT NOT NULL,
                    date_birth DATE,
                    phone_number TEXT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role INTEGER REFERENCES roles(id),
                    balance NUMERIC(10,2) DEFAULT 0
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS vendors (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    phone_number TEXT,
                    email TEXT,
                    address TEXT,
                    city TEXT,
                    state TEXT,
                    zip_code TEXT
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS menus (
                    id SERIAL PRIMARY KEY,
                    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
                    item_name TEXT NOT NULL,
                    item_description TEXT,
                    item_price DECIMAL NOT NULL
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
                    date_time TIMESTAMP NOT NULL,
                    status TEXT NOT NULL,
                    discount DECIMAL DEFAULT 0,
                    total_price DECIMAL NOT NULL
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS order_items (
                    id SERIAL PRIMARY KEY,
                    order_id INTEGER NOT NULL REFERENCES orders(id),
                    menu_item_id INTEGER NOT NULL REFERENCES menus(id),
                    quantity INTEGER NOT NULL,
                    item_price_at_order DECIMAL NOT NULL,
                    item_total_price DECIMAL NOT NULL
                )
            """)
 
    def close(self):
        self.conn.close()
 
 
# ---------------------------------------------------------------------------
# roles
# ---------------------------------------------------------------------------
 
class RoleCRUD:
    def __init__(self, db: Database):
        self.db = db
 
    def create(self, title, description=None):
        with self.db.cursor() as cur:
            cur.execute(
                "INSERT INTO roles (title, description) VALUES (%s, %s) RETURNING id",
                (title, description),
            )
            return cur.fetchone()["id"]
 
    def get(self, role_id):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM roles WHERE id = %s", (role_id,))
            return cur.fetchone()
 
    def get_all(self):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM roles")
            return cur.fetchall()
 
    def update(self, role_id, **fields):
        if not fields:
            return False
        set_clause = ", ".join(f"{k} = %s" for k in fields)
        values = list(fields.values()) + [role_id]
        with self.db.cursor() as cur:
            cur.execute(f"UPDATE roles SET {set_clause} WHERE id = %s", values)
            return cur.rowcount > 0
 
    def delete(self, role_id):
        with self.db.cursor() as cur:
            cur.execute("DELETE FROM roles WHERE id = %s", (role_id,))
            return cur.rowcount > 0
 
 
# ---------------------------------------------------------------------------
# users
# ---------------------------------------------------------------------------
 
class UserCRUD:
    def __init__(self, db: Database):
        self.db = db
 
    def create(self, last_name, first_name, email, password, date_birth=None,
               phone_number=None, role=None, balance=0):
        with self.db.cursor() as cur:
            cur.execute(
                """INSERT INTO users
                   (last_name, first_name, date_birth, phone_number, email, password, role)
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (last_name, first_name, date_birth, phone_number, email, password, role, balance),
            )
            return cur.fetchone()["id"]
 
    def get(self, user_id):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            return cur.fetchone()
 
    def get_by_email(self, email):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            return cur.fetchone()
 
    def get_all(self):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM users")
            return cur.fetchall()
 
    def update(self, user_id, **fields):
        if not fields:
            return False
        set_clause = ", ".join(f"{k} = %s" for k in fields)
        values = list(fields.values()) + [user_id]
        with self.db.cursor() as cur:
            cur.execute(f"UPDATE users SET {set_clause} WHERE id = %s", values)
            return cur.rowcount > 0
 
    def delete(self, user_id):
        with self.db.cursor() as cur:
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
            return cur.rowcount > 0
 
 
# ---------------------------------------------------------------------------
# vendors
# ---------------------------------------------------------------------------
 
class VendorCRUD:
    def __init__(self, db: Database):
        self.db = db
 
    def create(self, name, phone_number=None, email=None, address=None,
               city=None, state=None, zip_code=None):
        with self.db.cursor() as cur:
            cur.execute(
                """INSERT INTO vendors
                   (name, phone_number, email, address, city, state, zip_code)
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (name, phone_number, email, address, city, state, zip_code),
            )
            return cur.fetchone()["id"]
 
    def get(self, vendor_id):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM vendors WHERE id = %s", (vendor_id,))
            return cur.fetchone()
 
    def get_all(self):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM vendors")
            return cur.fetchall()
 
    def update(self, vendor_id, **fields):
        if not fields:
            return False
        set_clause = ", ".join(f"{k} = %s" for k in fields)
        values = list(fields.values()) + [vendor_id]
        with self.db.cursor() as cur:
            cur.execute(f"UPDATE vendors SET {set_clause} WHERE id = %s", values)
            return cur.rowcount > 0
 
    def delete(self, vendor_id):
        with self.db.cursor() as cur:
            cur.execute("DELETE FROM vendors WHERE id = %s", (vendor_id,))
            return cur.rowcount > 0
 
 
# ---------------------------------------------------------------------------
# menus
# ---------------------------------------------------------------------------
 
class MenuCRUD:
    def __init__(self, db: Database):
        self.db = db
 
    def create(self, vendor_id, item_name, item_price, item_description=None):
        with self.db.cursor() as cur:
            cur.execute(
                """INSERT INTO menus (vendor_id, item_name, item_description, item_price)
                   VALUES (%s, %s, %s, %s) RETURNING id""",
                (vendor_id, item_name, item_description, item_price),
            )
            return cur.fetchone()["id"]
 
    def get(self, menu_id):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM menus WHERE id = %s", (menu_id,))
            return cur.fetchone()
 
    def get_by_vendor(self, vendor_id):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM menus WHERE vendor_id = %s", (vendor_id,))
            return cur.fetchall()
 
    def get_all(self):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM menus")
            return cur.fetchall()
 
    def update(self, menu_id, **fields):
        if not fields:
            return False
        set_clause = ", ".join(f"{k} = %s" for k in fields)
        values = list(fields.values()) + [menu_id]
        with self.db.cursor() as cur:
            cur.execute(f"UPDATE menus SET {set_clause} WHERE id = %s", values)
            return cur.rowcount > 0
 
    def delete(self, menu_id):
        with self.db.cursor() as cur:
            cur.execute("DELETE FROM menus WHERE id = %s", (menu_id,))
            return cur.rowcount > 0
 
 
# ---------------------------------------------------------------------------
# orders
# ---------------------------------------------------------------------------
 
class OrdersCRUD:
    def __init__(self, db: Database):
        self.db = db
 
    def create(self, user_id, vendor_id, status, total_price, discount=0.0,
               date_time=None):
        date_time = date_time or datetime.now()
        with self.db.cursor() as cur:
            cur.execute(
                """INSERT INTO orders
                   (user_id, vendor_id, date_time, status, discount, total_price)
                   VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                (user_id, vendor_id, date_time, status, discount, total_price),
            )
            return cur.fetchone()["id"]
 
    def get(self, order_id):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
            return cur.fetchone()
 
    def get_by_user(self, user_id):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM orders WHERE user_id = %s", (user_id,))
            return cur.fetchall()
 
    def get_with_vendor_name(self, order_id):
        """Example join, mirrors the get_order_details pattern from before."""
        with self.db.cursor() as cur:
            cur.execute(
                """SELECT o.*, v.name AS vendor_name
                   FROM orders o
                   JOIN vendors v ON o.vendor_id = v.id
                   WHERE o.id = %s""",
                (order_id,),
            )
            return cur.fetchone()
 
    def get_all(self):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM orders")
            return cur.fetchall()
 
    def update(self, order_id, **fields):
        if not fields:
            return False
        set_clause = ", ".join(f"{k} = %s" for k in fields)
        values = list(fields.values()) + [order_id]
        with self.db.cursor() as cur:
            cur.execute(f"UPDATE orders SET {set_clause} WHERE id = %s", values)
            return cur.rowcount > 0
 
    def cancel(self, order_id):
        """Soft delete: only cancels an order that is still pending."""
        with self.db.cursor() as cur:
            cur.execute(
                "UPDATE orders SET status = 'Cancelled' WHERE id = %s AND status = 'Pending'",
                (order_id,),
            )
            return cur.rowcount > 0
 
    def delete(self, order_id):
        """Hard delete, use with caution given order_items reference orders.id."""
        with self.db.cursor() as cur:
            cur.execute("DELETE FROM orders WHERE id = %s", (order_id,))
            return cur.rowcount > 0
 
 
# ---------------------------------------------------------------------------
# order_items
# ---------------------------------------------------------------------------
 
class OrderItemsCRUD:
    def __init__(self, db: Database):
        self.db = db
 
    def create(self, order_id, menu_item_id, quantity, item_price_at_order):
        total_price = quantity * Decimal(str(item_price))
        with self.db.cursor() as cur:
            cur.execute(
                """INSERT INTO order_items
                   (order_id, menu_item_id, quantity, item_price_at_order, item_total_price)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (order_id, menu_item_id, quantity, item_price_at_order, item_total_price),
            )
            return cur.fetchone()["id"]
 
    def get(self, order_item_id):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM order_items WHERE id = %s", (order_item_id,))
            return cur.fetchone()
 
    def get_by_order(self, order_id):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
            return cur.fetchall()
 
    def get_all(self):
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM order_items")
            return cur.fetchall()
 
    def update(self, order_item_id, **fields):
        if not fields:
            return False
        set_clause = ", ".join(f"{k} = %s" for k in fields)
        values = list(fields.values()) + [order_item_id]
        with self.db.cursor() as cur:
            cur.execute(f"UPDATE order_items SET {set_clause} WHERE id = %s", values)
            return cur.rowcount > 0
 
    def delete(self, order_item_id):
        with self.db.cursor() as cur:
            cur.execute("DELETE FROM order_items WHERE id = %s", (order_item_id,))
            return cur.rowcount > 0
#-------------------------------------------------------------------------

#-------------------------------------------------------------------------
