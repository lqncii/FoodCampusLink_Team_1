import sqlite3
from datetime import datetime
from contextlib import contextmanager


class DataBase:
    def __init__(self, db_path="campus_foodlink.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON")
        self._create_tables()

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

    def _create_tables(self):
        with self.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS Role (
                    ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    Title TEXT NOT NULL,
                    Description TEXT
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS User (
                    ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    FirstName TEXT NOT NULL,
                    LastName TEXT NOT NULL,
                    DateOfBirth TEXT,
                    PhoneNumber TEXT,
                    Email TEXT UNIQUE NOT NULL,
                    Password TEXT NOT NULL,
                    RoleID INTEGER,
                    FOREIGN KEY (RoleID) REFERENCES Role(ID)
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS Vendor (
                    ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    Name TEXT NOT NULL,
                    Phone TEXT,
                    Email TEXT,
                    Address TEXT,
                    City TEXT,
                    State TEXT,
                    Zip TEXT
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS Menu (
                    ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    VendorID INTEGER NOT NULL,
                    ItemName TEXT NOT NULL,
                    ItemPrice REAL NOT NULL,
                    ItemDescription TEXT,
                    FOREIGN KEY (VendorID) REFERENCES Vendor(ID)
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS Orders (
                    ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    UserID INTEGER NOT NULL,
                    VendorID INTEGER NOT NULL,
                    DateTime TEXT NOT NULL,
                    Status TEXT NOT NULL,
                    Discount REAL DEFAULT 0,
                    TotalPrice REAL NOT NULL,
                    FOREIGN KEY (UserID) REFERENCES User(ID),
                    FOREIGN KEY (VendorID) REFERENCES Vendor(ID)
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS OrderItems (
                    ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    OrderID INTEGER NOT NULL,
                    MenuItemID INTEGER NOT NULL,
                    Quantity INTEGER NOT NULL,
                    ItemPriceAtOrder REAL NOT NULL,
                    ItemTotalPrice REAL NOT NULL,
                    FOREIGN KEY (OrderID) REFERENCES Orders(ID),
                    FOREIGN KEY (MenuItemID) REFERENCES Menu(ID)
                )
            """)

    def close(self):
        self.conn.close()


def _row_to_dict(row):
    return dict(row) if row else None
    
    def create_user(self, role_id, last_name, first_name, date_of_birth, phone_number, email, password):
        sql = """
            INSERT INTO users (role_id, last_name, first_name, date_of_birth, phone_number, email, password)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING user_id;
        """
        cursor = self.conn.cursor()
        cursor.execute(sql, (role_id, last_name, first_name, date_of_birth, phone_number, email, password))
        self.conn.commit()
        return cursor.lastrowid

    def create_menu_item(self, vendor_id, item_name, item_description, item_price):
        sql = """
            INSERT INTO menus (vendor_id, item_name, item_description, item_price)
            VALUES (?, ?, ?, ?);
        """
        cursor = self.conn.cursor()
        cursor.execute(sql, (vendor_id, item_name, item_description, item_price))
        self.conn.commit()

    def create_order(self, user_id, vendor_id, total_price, discount=0.0):
        sql = """
            INSERT INTO orders (user_id, vendor_id, status, total_price, discount)
            VALUES (?, ?, 'pending', ?, ?);
        """
        cursor = self.conn.cursor()
        cursor.execute(sql, (user_id, vendor_id, total_price, discount))
        self.conn.commit()
        return cursor.lastrowid

    # ====================== READ ======================
    def get_menu_items_by_vendor(self, vendor_id):
        sql = "SELECT * FROM menus WHERE vendor_id = ?;"
        cursor = self.conn.cursor()
        cursor.execute(sql, (vendor_id,))
        return [dict(row) for row in cursor.fetchall()]

    def get_order_details(self, order_id):
        sql = """
            SELECT o.*, v.name as vendor_name 
            FROM orders o 
            JOIN vendors v ON o.vendor_id = v.vendor_id 
            WHERE o.order_id = ?;
        """
        cursor = self.conn.cursor()
        cursor.execute(sql, (order_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    # ====================== UPDATE ======================
    def update_order_status(self, order_id, new_status):
        sql = "UPDATE orders SET status = ? WHERE order_id = ?;"
        cursor = self.conn.cursor()
        cursor.execute(sql, (new_status, order_id))
        self.conn.commit()

    # ====================== DELETE (Soft) ======================
    def cancel_order(self, order_id):
        sql = "UPDATE orders SET status = 'cancelled' WHERE order_id = ? AND status = 'pending';"
        cursor = self.conn.cursor()
        cursor.execute(sql, (order_id,))
        self.conn.commit()


# ====================== TEST / DEMO ======================
if __name__ == "__main__":
    crud = CampusFoodLinkCRUD()

    print("CampusFoodLink CRUD Plan - Ready to use!")
    # Example:
    # user_id = crud.create_user(1, "Smith", "Anna", "2002-05-15", "5551234567", "anna@example.com", "pass123")
    # print("Created user ID:", user_id)

    crud.close()
