#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

WebServer server(80);

void sendSensorData() {

  // Temporary test values.
  // Later these variables will come from the real sensors.

  float temperature = 28.5;
  float pressure = 1007.4;

  float accelX = 0.12;
  float accelY = -0.08;
  float accelZ = 9.78;

  float gyroX = 1.4;
  float gyroY = -0.6;
  float gyroZ = 0.3;

  float vibration = 1.15;

  String json = "{";

  json += "\"temperature\":" + String(temperature, 2) + ",";
  json += "\"pressure\":" + String(pressure, 2) + ",";

  json += "\"accelX\":" + String(accelX, 2) + ",";
  json += "\"accelY\":" + String(accelY, 2) + ",";
  json += "\"accelZ\":" + String(accelZ, 2) + ",";

  json += "\"gyroX\":" + String(gyroX, 2) + ",";
  json += "\"gyroY\":" + String(gyroY, 2) + ",";
  json += "\"gyroZ\":" + String(gyroZ, 2) + ",";

  json += "\"vibration\":" + String(vibration, 2);

  json += "}";

  // Allow the local webpage to request the data
  server.sendHeader("Access-Control-Allow-Origin", "*");

  server.send(
    200,
    "application/json",
    json
  );
}

void setup() {

  Serial.begin(115200);

  WiFi.begin(ssid, password);

  Serial.println();
  Serial.print("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);

    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi connected!");

  Serial.print("ESP32 IP address: ");
  Serial.println(WiFi.localIP());

  server.on("/data", HTTP_GET, sendSensorData);

  server.begin();

  Serial.println("Sensor server started.");
}

void loop() {

  server.handleClient();
}