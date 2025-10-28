from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import mysql.connector
import csv
import os
from urllib.parse import parse_qs

# Database connection function
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="user1234",
        database="train_reservation_system"
    )

# Load station data from CSV
def load_stations_from_csv():
    stations = []
    csv_path = 'full_station_dataset_with_routes-1.csv'

    if not os.path.exists(csv_path):
        print(f"Warning: CSV file {csv_path} not found. Station search will be limited.")
        return stations

    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            station_set = set()  # To avoid duplicates

            for row in reader:
                # Add source station
                station_key = (row['name'].strip(), row['code'].strip())
                if station_key not in station_set:
                    stations.append({
                        'name': row['name'].strip(),
                        'code': row['code'].strip(),
                        'state': row.get('state_name', '').strip()
                    })
                    station_set.add(station_key)

                # Add destination station
                dest_key = (row['to_station'].strip(), row['to_code'].strip())
                if dest_key not in station_set:
                    stations.append({
                        'name': row['to_station'].strip(),
                        'code': row['to_code'].strip(),
                        'state': row.get('state_name', '').strip()
                    })
                    station_set.add(dest_key)

    except Exception as e:
        print(f"Error loading stations from CSV: {e}")

    return stations

# Load train routes from CSV
def load_train_routes_from_csv():
    routes = []
    csv_path = 'full_station_dataset_with_routes-1.csv'

    if not os.path.exists(csv_path):
        print(f"Warning: CSV file {csv_path} not found. Train search will be limited.")
        return routes

    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)

            for idx, row in enumerate(reader, start=1001):
                # Generate train number based on route
                train_number = f"T{idx}"

                routes.append({
                    'train_number': train_number,
                    'train_name': f"{row['name']} - {row['to_station']} Express",
                    'source_station': row['name'].strip(),
                    'source_code': row['code'].strip(),
                    'destination_station': row['to_station'].strip(),
                    'destination_code': row['to_code'].strip(),
                    'departure_time': row['departure_time'].strip(),
                    'arrival_time': row['arrival_time'].strip()
                })

    except Exception as e:
        print(f"Error loading train routes from CSV: {e}")

    return routes

# Load data at startup
STATIONS_DATA = load_stations_from_csv()
TRAIN_ROUTES_DATA = load_train_routes_from_csv()

print(f"Loaded {len(STATIONS_DATA)} stations from CSV")
print(f"Loaded {len(TRAIN_ROUTES_DATA)} train routes from CSV")

class TrainReservationHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        if self.path == '/':
            self._set_headers()
            response = {
                "message": "Train Reservation System API Server",
                "status": "running",
                "endpoints": {
                    "POST /register": "Register new passenger",
                    "POST /login": "Passenger login", 
                    "POST /admin-login": "Admin login",
                    "POST /search-trains": "Search trains from CSV data",
                    "POST /search-stations": "Search stations from CSV data"
                }
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))

        if self.path == "/register":
            self.handle_register(data)
        elif self.path == "/login":
            self.handle_login(data)
        elif self.path == "/admin-login":
            self.handle_admin_login(data)
        elif self.path == "/search-stations":
            self.handle_station_search(data)
        elif self.path == "/search-trains":
            self.handle_train_search(data)
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode())

    def handle_register(self, data):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            query = """
            INSERT INTO passenger (name, email, password, age, gender, phone)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            values = (
                data.get('name'),
                data.get('email'),
                data.get('password'),
                data.get('age', 0),
                data.get('gender', ''),
                data.get('phone', None)
            )

            cursor.execute(query, values)
            conn.commit()

            self._set_headers()
            response = {
                "success": True,
                "message": "Registration successful"
            }
            self.wfile.write(json.dumps(response).encode())

        except mysql.connector.Error as err:
            self._set_headers(400)
            response = {
                "success": False,
                "message": f"Registration failed: {str(err)}"
            }
            self.wfile.write(json.dumps(response).encode())
        finally:
            cursor.close()
            conn.close()

    def handle_login(self, data):
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            query = "SELECT * FROM passenger WHERE email = %s AND password = %s"
            cursor.execute(query, (data.get('email'), data.get('password')))
            user = cursor.fetchone()

            if user:
                self._set_headers()
                response = {
                    "success": True,
                    "user": {
                        "id": user.get('passenger_id'),
                        "name": user.get('name'),
                        "email": user.get('email')
                    }
                }
            else:
                self._set_headers(401)
                response = {
                    "success": False,
                    "message": "Invalid email or password"
                }

            self.wfile.write(json.dumps(response).encode())

        except mysql.connector.Error as err:
            self._set_headers(500)
            response = {
                "success": False,
                "message": f"Login failed: {str(err)}"
            }
            self.wfile.write(json.dumps(response).encode())
        finally:
            cursor.close()
            conn.close()

    def handle_admin_login(self, data):
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            query = "SELECT * FROM admin WHERE email = %s AND password = %s"
            cursor.execute(query, (data.get('email'), data.get('password')))
            admin = cursor.fetchone()

            if admin:
                self._set_headers()
                response = {
                    "success": True,
                    "user": {
                        "id": admin.get('admin_id'),
                        "name": admin.get('name'),
                        "email": admin.get('email')
                    }
                }
            else:
                self._set_headers(401)
                response = {
                    "success": False,
                    "message": "Invalid admin credentials"
                }

            self.wfile.write(json.dumps(response).encode())

        except mysql.connector.Error as err:
            self._set_headers(500)
            response = {
                "success": False,
                "message": f"Admin login failed: {str(err)}"
            }
            self.wfile.write(json.dumps(response).encode())
        finally:
            cursor.close()
            conn.close()

    def handle_station_search(self, data):
        """Search for railway stations from CSV data"""
        try:
            query = data.get('query', '').lower().strip()

            if not query or len(query) < 1:
                self._set_headers(400)
                response = {
                    "success": False,
                    "message": "Query parameter is required"
                }
                self.wfile.write(json.dumps(response).encode())
                return

            # Search stations from loaded CSV data
            matching_stations = []

            for station in STATIONS_DATA:
                station_name = station['name'].lower()
                station_code = station['code'].lower()

                # Match by name or code
                if (query in station_name or 
                    query in station_code or 
                    station_name.startswith(query) or 
                    station_code.startswith(query)):

                    matching_stations.append({
                        'name': station['name'],
                        'code': station['code']
                    })

            # Sort by relevance (exact matches first, then starts with, then contains)
            def sort_key(station):
                name_lower = station['name'].lower()
                code_lower = station['code'].lower()

                if name_lower == query or code_lower == query:
                    return 0  # Exact match
                elif name_lower.startswith(query) or code_lower.startswith(query):
                    return 1  # Starts with
                else:
                    return 2  # Contains

            matching_stations.sort(key=sort_key)

            # Limit results to top 10
            matching_stations = matching_stations[:10]

            self._set_headers()
            response = {
                "success": True,
                "stations": matching_stations
            }
            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self._set_headers(500)
            response = {
                "success": False,
                "stations": [],
                "message": f"Error: {str(e)}"
            }
            self.wfile.write(json.dumps(response).encode())

    def handle_train_search(self, data):
        """Search for trains from CSV data"""
        try:
            source = data.get('source', '').strip()
            destination = data.get('destination', '').strip()
            date = data.get('date', '').strip()

            if not source or not destination or not date:
                self._set_headers(400)
                response = {
                    "success": False,
                    "message": "Source, destination, and date are required"
                }
                self.wfile.write(json.dumps(response).encode())
                return

            # Search trains from loaded CSV data
            matching_trains = []

            for route in TRAIN_ROUTES_DATA:
                # Match by station codes
                if (route['source_code'].upper() == source.upper() and 
                    route['destination_code'].upper() == destination.upper()):

                    # Generate fare based on distance (dummy calculation)
                    base_fare = 300 + (len(route['train_name']) * 10)

                    matching_trains.append({
                        'train_id': route['train_number'],
                        'name': route['train_name'],
                        'source': route['source_station'],
                        'destination': route['destination_station'],
                        'departure_time': route['departure_time'],
                        'arrival_time': route['arrival_time'],
                        'available_seats': 120,
                        'fare_sleeper': base_fare,
                        'fare_ac': base_fare + 350,
                        'fare_first_class': base_fare + 700
                    })

            if matching_trains:
                self._set_headers()
                response = {
                    "success": True,
                    "trains": matching_trains
                }
            else:
                self._set_headers()
                response = {
                    "success": False,
                    "trains": [],
                    "message": "No trains found for this route"
                }

            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self._set_headers(500)
            response = {
                "success": False,
                "trains": [],
                "message": f"Error: {str(e)}"
            }
            self.wfile.write(json.dumps(response).encode())

def run(server_class=HTTPServer, handler_class=TrainReservationHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'✅ Train Reservation API Server Started')
    print(f'🌐 Server running at http://localhost:{port}/')
    print(f'📡 Listening for requests...')
    print(f'📊 Using CSV data: {len(STATIONS_DATA)} stations, {len(TRAIN_ROUTES_DATA)} routes')
    httpd.serve_forever()

if __name__ == '__main__':
    run()
