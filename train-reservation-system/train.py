import mysql.connector

conn=mysql.connector.connect(
    host="localhost",
    user="root",
    password="user1234",
    database="train_reservation_system"
)

if conn.is_connected():
    print("Success")

mycursor=conn.cursor()


# 1. Admin Table
mycursor.execute("""
CREATE TABLE IF NOT EXISTS admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100)
)
""")

# 2. Passenger Table
mycursor.execute("""
CREATE TABLE IF NOT EXISTS passenger (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT CHECK(age >= 0),
    gender VARCHAR(10),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100) NOT NULL,
    phone BIGINT UNIQUE
)
""")

# 3. Train Table
mycursor.execute("""
CREATE TABLE IF NOT EXISTS train (
    train_id INT AUTO_INCREMENT PRIMARY KEY,
    train_name VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL,
    destination VARCHAR(50) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    total_seats INT NOT NULL CHECK(total_seats > 0),
    available_seats INT NOT NULL CHECK(available_seats >= 0),
    fare DECIMAL(10,2) NOT NULL
)
""")

# 4. Booking Table
mycursor.execute("""
CREATE TABLE IF NOT EXISTS booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    passenger_id INT,
    train_id INT,
    journey_date DATE NOT NULL,
    seats_booked INT NOT NULL CHECK(seats_booked > 0),
    booking_status VARCHAR(20) DEFAULT 'confirmed',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id) ON DELETE CASCADE,
    FOREIGN KEY (train_id) REFERENCES train(train_id) ON DELETE CASCADE
)
""")

# 5. Waiting List Table
mycursor.execute("""
CREATE TABLE IF NOT EXISTS waiting_list (
    wl_id INT AUTO_INCREMENT PRIMARY KEY,
    passenger_id INT,
    train_id INT,
    position INT NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting',
    FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id) ON DELETE CASCADE,
    FOREIGN KEY (train_id) REFERENCES train(train_id) ON DELETE CASCADE
)
""")

# 6. Train Status Table
mycursor.execute("""
CREATE TABLE IF NOT EXISTS train_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT,
    status VARCHAR(20) DEFAULT 'On Time',
    delay_minutes INT DEFAULT 0,
    current_station VARCHAR(100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (train_id) REFERENCES train(train_id) ON DELETE CASCADE
)
""")

# 7. Feedback Table
mycursor.execute("""
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    passenger_id INT,
    message TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id) ON DELETE CASCADE
)
""")

# 8. Quota Table
mycursor.execute("""
CREATE TABLE IF NOT EXISTS quota (
    quota_id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    seats_reserved INT DEFAULT 0 CHECK(seats_reserved >= 0)
)
""")

print("✅ All remaining tables created successfully (if not present).")

# ✅ Commit all changes
conn.commit()

print("✅ All 8 tables created successfully and changes committed to database.")

# Close connection
mycursor.close()
conn.close()
