from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import csv
import os
from datetime import datetime

CSV_FILE = "live_data.csv"


# Create CSV file automatically
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, "w", newline="") as file:
        writer = csv.writer(file)

        writer.writerow([
            "time",
            "temperature",
            "pressure",
            "vibration",
            "accel_x",
            "accel_y",
            "accel_z",
            "gyro_x",
            "gyro_y",
            "gyro_z"
        ])


class Receiver(BaseHTTPRequestHandler):

    def do_POST(self):

        # ESP32 will send data to /data
        if self.path != "/data":
            self.send_response(404)
            self.end_headers()
            return

        # Read incoming data
        content_length = int(
            self.headers.get("Content-Length", 0)
        )

        body = self.rfile.read(content_length)

        try:

            # Convert JSON to Python data
            data = json.loads(
                body.decode("utf-8")
            )

            time_now = datetime.now().strftime(
                "%H:%M:%S"
            )

            temperature = data.get(
                "temperature", 0
            )

            pressure = data.get(
                "pressure", 0
            )

            vibration = data.get(
                "vibration", 0
            )

            accel_x = data.get(
                "accel_x", 0
            )

            accel_y = data.get(
                "accel_y", 0
            )

            accel_z = data.get(
                "accel_z", 0
            )

            gyro_x = data.get(
                "gyro_x", 0
            )

            gyro_y = data.get(
                "gyro_y", 0
            )

            gyro_z = data.get(
                "gyro_z", 0
            )

            # Save data into CSV
            with open(
                CSV_FILE,
                "a",
                newline=""
            ) as file:

                writer = csv.writer(file)

                writer.writerow([
                    time_now,
                    temperature,
                    pressure,
                    vibration,
                    accel_x,
                    accel_y,
                    accel_z,
                    gyro_x,
                    gyro_y,
                    gyro_z
                ])

            print("\nReceived sensor data:")
            print(data)

            # Send response to ESP32
            self.send_response(200)

            self.send_header(
                "Content-Type",
                "application/json"
            )

            self.end_headers()

            self.wfile.write(
                b'{"status":"received"}'
            )

        except Exception as error:

            print("Error:", error)

            self.send_response(400)
            self.end_headers()


# Raspberry Pi will use port 5000
server = HTTPServer(
    ("0.0.0.0", 5000),
    Receiver
)

print("================================")
print("Anti-Drone Data Receiver")
print("Server running on port 5000")
print("Waiting for ESP32 data...")
print("================================")

server.serve_forever()