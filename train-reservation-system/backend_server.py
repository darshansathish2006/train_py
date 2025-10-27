from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import mysql.connector
import http.client
from urllib.parse import parse_qs

# Database connection function
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Darshan@06",
        database="train_reservation_system"
    )

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
                    "POST /search-trains": "Search trains via RapidAPI",
                    "POST /search-stations": "Search stations via RapidAPI"
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
        """Search for railway stations using RapidAPI"""
        try:
            query = data.get('query', '')
            
            if not query or len(query) < 1:
                self._set_headers(400)
                response = {
                    "success": False,
                    "message": "Query parameter is required"
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Call RapidAPI
            conn = http.client.HTTPSConnection("irctc1.p.rapidapi.com")
            
            headers = {
                'x-rapidapi-key': "5e1663f3bamsh036ec31f3e234e1p12741bjsn4e661d18fc2f",
                'x-rapidapi-host': "irctc1.p.rapidapi.com"
            }
            
            conn.request("GET", f"/api/v1/searchStation?query={query}", headers=headers)
            
            res = conn.getresponse()
            api_data = res.read()
            api_response = json.loads(api_data.decode("utf-8"))

            print("🔍 RapidAPI Station Search Response:", api_response)

            
            # Parse the response
            if api_response.get('status'):
                stations = []
                for station in api_response.get('data', []):
                    stations.append({
                        'name': station.get('name', ''),
                        'code': station.get('code', '')
                    })
                
                self._set_headers()
                response = {
                    "success": True,
                    "stations": stations
                }
            else:
                self._set_headers()
                response = {
                    "success": False,
                    "stations": [],
                    "message": "No stations found"
                }
            
            self.wfile.write(json.dumps(response).encode())
            conn.close()
            
        except Exception as e:
            self._set_headers(500)
            response = {
                "success": False,
                "stations": [],
                "message": f"Error: {str(e)}"
            }
            self.wfile.write(json.dumps(response).encode())
    
    def handle_train_search(self, data):
        """Search for trains using RapidAPI"""
        try:
            source = data.get('source', '')
            destination = data.get('destination', '')
            date = data.get('date', '')
            
            if not source or not destination or not date:
                self._set_headers(400)
                response = {
                    "success": False,
                    "message": "Source, destination, and date are required"
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Call RapidAPI
            conn = http.client.HTTPSConnection("irctc1.p.rapidapi.com")
            
            headers = {
                'x-rapidapi-key': "5e1663f3bamsh036ec31f3e234e1p12741bjsn4e661d18fc2f",
                'x-rapidapi-host': "irctc1.p.rapidapi.com"
            }
            
            endpoint = f"/api/v3/trainBetweenStations?fromStationCode={source}&toStationCode={destination}&dateOfJourney={date}"
            conn.request("GET", endpoint, headers=headers)
            
            res = conn.getresponse()
            api_data = res.read()
            api_response = json.loads(api_data.decode("utf-8"))
            
            # Parse the response
            if api_response.get('status'):
                trains = []
                for train in api_response.get('data', []):
                    trains.append({
                        'train_id': train.get('train_number', ''),
                        'name': train.get('train_name', ''),
                        'source': train.get('from_sta', ''),
                        'destination': train.get('to_sta', ''),
                        'departure_time': train.get('from_time', ''),
                        'arrival_time': train.get('to_time', ''),
                        'available_seats': 150,  # Dummy data as requested
                        'fare_sleeper': 450,
                        'fare_ac': 850,
                        'fare_first_class': 1200
                    })
                
                self._set_headers()
                response = {
                    "success": True,
                    "trains": trains
                }
            else:
                self._set_headers()
                response = {
                    "success": False,
                    "trains": [],
                    "message": "No trains found"
                }
            
            self.wfile.write(json.dumps(response).encode())
            conn.close()
            
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
    httpd.serve_forever()

if __name__ == '__main__':
    run()
