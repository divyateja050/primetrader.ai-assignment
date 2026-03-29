import sqlite3

# Connected to sql_app.db because that matches our database.py configuration
conn = sqlite3.connect('sql_app.db')
cursor = conn.cursor()

try:
    cursor.execute("SELECT id, name, email, role FROM users")
    users = cursor.fetchall()
    print("\n--- Users in Database ---")
    for u in users:
        print(f"ID: {u[0]} | Name: {u[1]:<15} | Email: {u[2]:<20} | Role: {u[3]}")
    print("-------------------------\n")
except sqlite3.OperationalError as e:
    print("Database Error:", e)
finally:
    conn.close()
