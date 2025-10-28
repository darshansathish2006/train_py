import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="user1234",
    database="train_reservation_system"
)

cursor = conn.cursor()

# Insert admin user
admin_data = ('admin', 'admin123', 'System Administrator', 'admin@trainreservation.com')
query = "INSERT INTO admin (username, password, name, email) VALUES (%s, %s, %s, %s)"

try:
    cursor.execute(query, admin_data)
    conn.commit()
    print("✅ Admin user created successfully")
    print("Username: admin")
    print("Password: admin123")
except mysql.connector.IntegrityError:
    print("⚠️ Admin user already exists")
finally:
    cursor.close()
    conn.close()
