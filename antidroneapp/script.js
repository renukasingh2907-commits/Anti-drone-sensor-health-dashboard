/* =========================================================
   ANTI-DRONE SENSOR HEALTH DASHBOARD
   COMPLETE script.js
========================================================= */


/* =========================================================
   BASIC HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

let charts = {};
let simulationTimer = null;


/* =========================================================
   CHART HELPERS
========================================================= */

function dataset(label, data) {
    return {
        label: label,
        data: data,
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 2
    };
}


function createChart(canvasId, labels, datasets, chartType = "line") {

    const canvas = $(canvasId);

    if (!canvas) {
        console.error("Canvas not found:", canvasId);
        return;
    }

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(canvas, {
        type: chartType,

        data: {
            labels: labels,
            datasets: datasets
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            animation: {
                duration: 300
            },

            plugins: {
                legend: {
                    display: true
                }
            },

            scales: {
                x: {
                    display: true
                },

                y: {
                    display: true,
                    beginAtZero: false
                }
            }
        }
    });
}


/* =========================================================
   MAIN DASHBOARD VARIABLES
========================================================= */

let currentTemperature = 25;
let currentAltitude = 0;

let currentRawError = 0;
let currentCompError = 0;
let currentReduction = 0;

let currentWindError = 0;
let currentDriftError = 0;
let currentPointingError = 0;
let currentPointingComp = 0;


/* =========================================================
   ENVIRONMENTAL MODEL
   DEMONSTRATION MODEL
========================================================= */

function calculateEnvironmentalValues() {

    const temperature = Number($("tempSlider").value);
    const altitude = Number($("altSlider").value);

    currentTemperature = temperature;
    currentAltitude = altitude;

    $("tempValue").textContent = temperature;
    $("altValue").textContent = altitude;


    /*
       Demonstration drift model.

       25°C is treated as nominal temperature.
       Drift rises as temperature moves away from nominal
       and as altitude increases.
    */

    const temperatureDifference =
        Math.abs(temperature - 25);

    const temperatureEffect =
        temperatureDifference * 0.12;

    const altitudeEffect =
        altitude / 2500;

    const drift =
        2 +
        temperatureEffect +
        altitudeEffect;


    /*
       Compensation removes a percentage of
       the simulated raw drift.
    */

    const compensatedDrift =
        drift * 0.35;

    const reduction =
        drift > 0
            ? ((drift - compensatedDrift) / drift) * 100
            : 0;


    currentRawError = drift;
    currentCompError = compensatedDrift;
    currentReduction = reduction;


    /* Update threshold */

    const threshold =
        5 +
        altitude / 5000 +
        temperatureDifference / 20;

    $("driftThreshold").textContent =
        threshold.toFixed(1) + "%";


    /* Environmental status */

    if (
        temperature < -10 ||
        temperature > 55 ||
        altitude > 8000
    ) {

        $("envStatus").textContent =
            "CRITICAL";

        $("envStatus").className =
            "status-critical";

    }

    else if (
        temperature < 5 ||
        temperature > 40 ||
        altitude > 5000
    ) {

        $("envStatus").textContent =
            "WARNING";

        $("envStatus").className =
            "status-warn";

    }

    else {

        $("envStatus").textContent =
            "NORMAL";

        $("envStatus").className =
            "status-ok";
    }


    $("compStatus").textContent =
        "ACTIVE";

    $("compStatus").className =
        "status-ok";


    updateEnvironmentalChart(
        temperature,
        altitude,
        drift,
        compensatedDrift
    );


    updateCompensationChart(
        drift,
        compensatedDrift,
        reduction
    );


    updatePointingAccuracy(
        temperature,
        altitude,
        drift,
        compensatedDrift
    );
}


/* =========================================================
   ENVIRONMENT CHART
========================================================= */

function updateEnvironmentalChart(
    temperature,
    altitude,
    drift,
    compensatedDrift
) {

    createChart(

        "environmentChart",

        [
            "Temperature Effect",
            "Altitude Effect",
            "Raw Drift",
            "Compensated Drift"
        ],

        [
            dataset(
                "Environmental Effect",
                [
                    Math.abs(temperature - 25) * 0.12,
                    altitude / 2500,
                    drift,
                    compensatedDrift
                ]
            )
        ]
    );
}


/* =========================================================
   BEFORE / AFTER COMPENSATION
========================================================= */

function updateCompensationChart(
    rawError,
    compensatedError,
    reduction
) {

    $("rawError").textContent =
        rawError.toFixed(2) + "%";

    $("compError").textContent =
        compensatedError.toFixed(2) + "%";

    $("errorReduction").textContent =
        reduction.toFixed(1) + "%";


    const labels = [];

    const rawData = [];

    const compensatedData = [];


    for (let i = 0; i < 20; i++) {

        labels.push(i + 1);

        const variation =
            Math.sin(i / 2) * 0.3;

        rawData.push(
            rawError + variation
        );

        compensatedData.push(
            compensatedError +
            variation * 0.35
        );
    }


    createChart(

        "compChart",

        labels,

        [
            dataset(
                "Raw Sensor Error",
                rawData
            ),

            dataset(
                "Compensated Error",
                compensatedData
            )
        ]
    );
}


/* =========================================================
   POINTING ACCURACY
========================================================= */

function updatePointingAccuracy(
    temperature,
    altitude,
    drift,
    compensatedDrift
) {

    const windError =
        0.15 +
        altitude / 20000;

    const driftError =
        drift * 0.08;

    const totalError =
        Math.sqrt(
            windError * windError +
            driftError * driftError
        );

    const compensated =
        Math.sqrt(
            windError * windError +
            (compensatedDrift * 0.08) ** 2
        );


    currentWindError = windError;
    currentDriftError = driftError;
    currentPointingError = totalError;
    currentPointingComp = compensated;


    $("pointingError").textContent =
        totalError.toFixed(3) + "°";

    $("windError").textContent =
        windError.toFixed(3) + "°";

    $("driftError").textContent =
        driftError.toFixed(3) + "°";

    $("pointingComp").textContent =
        compensated.toFixed(3) + "°";


    createChart(

        "pointingChart",

        [
            "Wind",
            "Drift",
            "Total",
            "After Compensation"
        ],

        [
            dataset(
                "Pointing Error (degrees)",
                [
                    windError,
                    driftError,
                    totalError,
                    compensated
                ]
            )
        ]
    );
}


/* =========================================================
   TEMPERATURE SLIDER
========================================================= */

$("tempSlider").addEventListener(
    "input",
    calculateEnvironmentalValues
);


/* =========================================================
   ALTITUDE SLIDER
========================================================= */

$("altSlider").addEventListener(
    "input",
    calculateEnvironmentalValues
);


/* =========================================================
   START / STOP SIMULATION
========================================================= */

$("demoBtn").addEventListener(
    "click",

    function () {

        if (simulationTimer) {

            clearInterval(
                simulationTimer
            );

            simulationTimer = null;

            $("demoBtn").textContent =
                "Start Simulation";

            return;
        }


        $("demoBtn").textContent =
            "Stop Simulation";


        simulationTimer =
            setInterval(
                function () {

                    const tempSlider =
                        $("tempSlider");

                    const altSlider =
                        $("altSlider");


                    let newTemperature =
                        Number(tempSlider.value) +
                        (Math.random() * 4 - 2);


                    let newAltitude =
                        Number(altSlider.value) +
                        (Math.random() * 400 - 200);


                    newTemperature =
                        Math.max(
                            -20,
                            Math.min(
                                70,
                                newTemperature
                            )
                        );


                    newAltitude =
                        Math.max(
                            0,
                            Math.min(
                                10000,
                                newAltitude
                            )
                        );


                    tempSlider.value =
                        Math.round(
                            newTemperature
                        );


                    altSlider.value =
                        Math.round(
                            newAltitude / 100
                        ) * 100;


                    calculateEnvironmentalValues();

                },

                1000
            );
    }
);


/* =========================================================
   DEMO SENSOR DATA
========================================================= */

function generateDemoSensorData() {

    const labels = [];

    const accelX = [];
    const accelY = [];
    const accelZ = [];

    const gyroX = [];
    const gyroY = [];
    const gyroZ = [];

    const temperature = [];
    const pressure = [];
    const vibration = [];


    for (let i = 0; i < 40; i++) {

        labels.push(i + 1);


        /* MPU6050 ACCELERATION */

        accelX.push(
            0.2 * Math.sin(i / 3) +
            Math.random() * 0.05
        );

        accelY.push(
            0.15 * Math.cos(i / 4) +
            Math.random() * 0.05
        );

        accelZ.push(
            9.81 +
            Math.random() * 0.08
        );


        /* MPU6050 GYROSCOPE */

        gyroX.push(
            Math.sin(i / 5) * 3 +
            Math.random()
        );

        gyroY.push(
            Math.cos(i / 5) * 2 +
            Math.random()
        );

        gyroZ.push(
            Math.sin(i / 7) * 1.5 +
            Math.random() * 0.5
        );


        /* BME280 */

        temperature.push(
            25 +
            Math.sin(i / 8) * 2 +
            Math.random() * 0.3
        );


        pressure.push(
            1013 +
            Math.sin(i / 10) * 4 +
            Math.random()
        );


        /* INMP441 */

        vibration.push(
            1 +
            Math.sin(i / 2) * 0.15 +
            Math.random() * 0.08
        );
    }


    displaySensorCharts(
        labels,
        accelX,
        accelY,
        accelZ,
        gyroX,
        gyroY,
        gyroZ,
        temperature,
        pressure,
        vibration
    );


    const lastVibration =
        vibration[vibration.length - 1];

    const lastTemperature =
        temperature[temperature.length - 1];


    updateHealthTable(
        lastVibration,
        lastTemperature,
        false
    );
}


/* =========================================================
   DISPLAY SENSOR CHARTS
========================================================= */

function displaySensorCharts(
    labels,
    accelX,
    accelY,
    accelZ,
    gyroX,
    gyroY,
    gyroZ,
    temperature,
    pressure,
    vibration
) {

    createChart(

        "accelChart",

        labels,

        [
            dataset(
                "Acceleration X",
                accelX
            ),

            dataset(
                "Acceleration Y",
                accelY
            ),

            dataset(
                "Acceleration Z",
                accelZ
            )
        ]
    );


    createChart(

        "gyroChart",

        labels,

        [
            dataset(
                "Gyroscope X",
                gyroX
            ),

            dataset(
                "Gyroscope Y",
                gyroY
            ),

            dataset(
                "Gyroscope Z",
                gyroZ
            )
        ]
    );


    createChart(

        "tempChart",

        labels,

        [
            dataset(
                "Temperature °C",
                temperature
            )
        ]
    );


    createChart(

        "pressureChart",

        labels,

        [
            dataset(
                "Pressure hPa",
                pressure
            )
        ]
    );


    createChart(

        "vibrationChart",

        labels,

        [
            dataset(
                "INMP441 Vibration",
                vibration
            )
        ]
    );
}


/* =========================================================
   LOAD DEMO BUTTON
========================================================= */

$("loadDemo").addEventListener(
    "click",
    generateDemoSensorData
);


/* =========================================================
   HEALTH TABLE
========================================================= */

function updateHealthTable(
    vibration,
    temperature,
    realData = false
) {

    const threshold =
        Number(
            $("vibThreshold").value
        );


    /*
       Demonstration baseline.
       Replace after physical calibration.
    */

    const baseline = 1.0;


    const deviation =
        Math.abs(
            (
                (vibration - baseline)
                /
                baseline
            )
            * 100
        );


    let vibrationStatus =
        "NORMAL";

    let vibrationClass =
        "status-ok";


    if (
        deviation >=
        threshold * 2
    ) {

        vibrationStatus =
            "CRITICAL";

        vibrationClass =
            "status-critical";

    }

    else if (
        deviation >=
        threshold
    ) {

        vibrationStatus =
            "WARNING";

        vibrationClass =
            "status-warn";
    }


    let tempStatus =
        "NORMAL";

    let tempClass =
        "status-ok";


    /*
       Demonstration warning thresholds only.
       These are not hardware failure temperatures.
    */

    if (temperature >= 60) {

        tempStatus =
            "HIGH TEMPERATURE";

        tempClass =
            "status-critical";

    }

    else if (temperature >= 45) {

        tempStatus =
            "WARNING";

        tempClass =
            "status-warn";
    }


    $("healthBody").innerHTML = `

        <tr>

            <td>
                INMP441 / Motor Vibration
            </td>

            <td>
                ${Number(vibration).toFixed(2)}
            </td>

            <td>
                ${baseline.toFixed(2)}
            </td>

            <td>
                ${deviation.toFixed(1)}%
            </td>

            <td class="${vibrationClass}">
                ${vibrationStatus}
            </td>

        </tr>


        <tr>

            <td>
                MPU6050
            </td>

            <td>
                ${realData ? "REAL DATA" : "DEMO DATA"}
            </td>

            <td>
                Nominal
            </td>

            <td>
                --
            </td>

            <td class="status-ok">
                ${realData ? "LIVE" : "SIMULATED"}
            </td>

        </tr>


        <tr>

            <td>
                BME280 Temperature
            </td>

            <td>
                ${Number(temperature).toFixed(2)} °C
            </td>

            <td>
                25 °C
            </td>

            <td>
                ${Math.abs(
                    temperature - 25
                ).toFixed(2)} °C
            </td>

            <td class="${tempClass}">
                ${tempStatus}
            </td>

        </tr>
    `;
}


/* =========================================================
   THRESHOLD CHANGE
========================================================= */

$("vibThreshold").addEventListener(
    "input",
    function () {

        /*
           Recalculate demo data when threshold changes.
           Real ESP32 data will update automatically.
        */

        if (!esp32Connected) {
            generateDemoSensorData();
        }
    }
);


/* =========================================================
   CSV FILE SUPPORT
========================================================= */

$("csvFile").addEventListener(
    "change",

    function (event) {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            function (e) {

                try {

                    parseCSV(
                        e.target.result
                    );

                }

                catch (error) {

                    console.error(error);

                    alert(
                        "Could not read CSV file. Check the CSV column format."
                    );
                }
            };


        reader.readAsText(file);
    }
);


/* =========================================================
   CSV PARSER

   Expected header names:

   accelX,accelY,accelZ,
   gyroX,gyroY,gyroZ,
   temperature,pressure,vibration
========================================================= */

function parseCSV(text) {

    const rows =
        text
            .trim()
            .split(/\r?\n/);


    if (rows.length < 2) {

        alert(
            "CSV file does not contain sensor data."
        );

        return;
    }


    const headers =
        rows[0]
            .split(",")
            .map(
                item =>
                    item.trim()
            );


    const required = [
        "accelX",
        "accelY",
        "accelZ",
        "gyroX",
        "gyroY",
        "gyroZ",
        "temperature",
        "pressure",
        "vibration"
    ];


    const missing =
        required.filter(
            item =>
                !headers.includes(item)
        );


    if (missing.length > 0) {

        alert(
            "Missing CSV columns: "
            + missing.join(", ")
        );

        return;
    }


    const labels = [];

    const accelX = [];
    const accelY = [];
    const accelZ = [];

    const gyroX = [];
    const gyroY = [];
    const gyroZ = [];

    const temperature = [];
    const pressure = [];
    const vibration = [];


    const index =
        Object.fromEntries(
            headers.map(
                (name, i) =>
                    [name, i]
            )
        );


    for (
        let rowNumber = 1;
        rowNumber < rows.length;
        rowNumber++
    ) {

        const columns =
            rows[rowNumber]
                .split(",")
                .map(
                    item =>
                        item.trim()
                );


        if (
            columns.length <
            headers.length
        ) {
            continue;
        }


        labels.push(
            rowNumber
        );


        accelX.push(
            Number(
                columns[index.accelX]
            )
        );

        accelY.push(
            Number(
                columns[index.accelY]
            )
        );

        accelZ.push(
            Number(
                columns[index.accelZ]
            )
        );


        gyroX.push(
            Number(
                columns[index.gyroX]
            )
        );

        gyroY.push(
            Number(
                columns[index.gyroY]
            )
        );

        gyroZ.push(
            Number(
                columns[index.gyroZ]
            )
        );


        temperature.push(
            Number(
                columns[index.temperature]
            )
        );

        pressure.push(
            Number(
                columns[index.pressure]
            )
        );

        vibration.push(
            Number(
                columns[index.vibration]
            )
        );
    }


    displaySensorCharts(
        labels,
        accelX,
        accelY,
        accelZ,
        gyroX,
        gyroY,
        gyroZ,
        temperature,
        pressure,
        vibration
    );


    if (
        vibration.length > 0 &&
        temperature.length > 0
    ) {

        updateHealthTable(
            vibration[
                vibration.length - 1
            ],

            temperature[
                temperature.length - 1
            ],

            false
        );
    }
}


/* =========================================================
   EXPORT JSON
========================================================= */

$("exportJSON").addEventListener(
    "click",

    function () {

        const exportData = {

            generatedAt:
                new Date().toISOString(),

            environmentalCondition: {

                temperatureC:
                    currentTemperature,

                altitudeM:
                    currentAltitude,

                rawDriftPercent:
                    Number(
                        currentRawError.toFixed(3)
                    ),

                compensatedDriftPercent:
                    Number(
                        currentCompError.toFixed(3)
                    ),

                errorReductionPercent:
                    Number(
                        currentReduction.toFixed(2)
                    )
            },


            pointingAccuracy: {

                totalErrorDegrees:
                    Number(
                        currentPointingError.toFixed(4)
                    ),

                windErrorDegrees:
                    Number(
                        currentWindError.toFixed(4)
                    ),

                driftErrorDegrees:
                    Number(
                        currentDriftError.toFixed(4)
                    ),

                compensatedErrorDegrees:
                    Number(
                        currentPointingComp.toFixed(4)
                    )
            },


            esp32: {

                connected:
                    esp32Connected,

                ip:
                    ESP32_IP || null
            }
        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        exportData,
                        null,
                        2
                    )
                ],

                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href = url;

        link.download =
            "anti-drone-dashboard.json";


        link.click();


        URL.revokeObjectURL(
            url
        );
    }
);


/* =========================================================
   EXPORT PDF
========================================================= */

$("exportPDF").addEventListener(
    "click",

    function () {

        /*
           Uses browser print dialog.
           Select "Save as PDF".
        */

        window.print();
    }
);


/* =========================================================
   WIFI / ESP32 CONNECTION
========================================================= */

let ESP32_IP = "";

let esp32Connected = false;

let esp32Timer = null;


/* =========================================================
   LIVE SENSOR STORAGE
========================================================= */

const MAX_LIVE_POINTS = 40;

let liveLabels = [];

let liveAccelX = [];
let liveAccelY = [];
let liveAccelZ = [];

let liveGyroX = [];
let liveGyroY = [];
let liveGyroZ = [];

let liveTemperature = [];
let livePressure = [];

let liveVibration = [];


/* =========================================================
   OPEN WIFI POPUP
========================================================= */

function openWifiPanel() {

    $("wifiPanel").style.display =
        "flex";
}


/* =========================================================
   CLOSE WIFI POPUP
========================================================= */

function closeWifiPanel() {

    $("wifiPanel").style.display =
        "none";
}


/* =========================================================
   CONNECT TO ESP32
========================================================= */

async function connectESP32() {

    const ip =
        $("esp32IP")
            .value
            .trim();


    const status =
        $("wifiStatus");


    if (!ip) {

        status.textContent =
            "ENTER ESP32 IP";

        status.style.color =
            "#b42318";

        return;
    }


    status.textContent =
        "CONNECTING...";

    status.style.color =
        "#9a6700";


    try {

        const response =
            await fetch(
                `http://${ip}/data`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "ESP32 returned HTTP "
                + response.status
            );
        }


        const data =
            await response.json();


        if (!validateESP32Data(data)) {

            throw new Error(
                "ESP32 JSON format is incorrect."
            );
        }


        ESP32_IP = ip;

        esp32Connected = true;


        status.textContent =
            "CONNECTED";

        status.style.color =
            "#187a3d";


        /*
           Stop environmental auto simulation
           when real hardware is connected.
        */

        if (simulationTimer) {

            clearInterval(
                simulationTimer
            );

            simulationTimer = null;

            $("demoBtn").textContent =
                "Start Simulation";
        }


        updateLiveDashboard(
            data
        );


        startESP32LiveData();


        console.log(
            "ESP32 connected:",
            data
        );

    }

    catch (error) {

        esp32Connected = false;


        status.textContent =
            "CONNECTION FAILED";

        status.style.color =
            "#b42318";


        console.error(
            "ESP32 connection error:",
            error
        );
    }
}


/* =========================================================
   VALIDATE ESP32 JSON
========================================================= */

function validateESP32Data(data) {

    const requiredFields = [

        "temperature",
        "pressure",

        "accelX",
        "accelY",
        "accelZ",

        "gyroX",
        "gyroY",
        "gyroZ",

        "vibration"
    ];


    return requiredFields.every(
        field =>
            data[field] !== undefined &&
            Number.isFinite(
                Number(
                    data[field]
                )
            )
    );
}


/* =========================================================
   START LIVE DATA
========================================================= */

function startESP32LiveData() {

    if (esp32Timer) {

        clearInterval(
            esp32Timer
        );
    }


    esp32Timer =
        setInterval(
            getESP32Data,
            1000
        );
}


/* =========================================================
   GET LIVE ESP32 DATA
========================================================= */

async function getESP32Data() {

    if (!ESP32_IP) {
        return;
    }


    try {

        const response =
            await fetch(
                `http://${ESP32_IP}/data`,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "ESP32 unavailable"
            );
        }


        const data =
            await response.json();


        if (!validateESP32Data(data)) {

            throw new Error(
                "Invalid sensor JSON"
            );
        }


        esp32Connected = true;


        $("wifiStatus").textContent =
            "CONNECTED";

        $("wifiStatus").style.color =
            "#187a3d";


        updateLiveDashboard(
            data
        );

    }

    catch (error) {

        esp32Connected = false;


        $("wifiStatus").textContent =
            "CONNECTION LOST";

        $("wifiStatus").style.color =
            "#b42318";


        console.error(
            "ESP32 data error:",
            error
        );
    }
}


/* =========================================================
   LIMIT LIVE DATA
========================================================= */

function trimLiveData() {

    const arrays = [

        liveLabels,

        liveAccelX,
        liveAccelY,
        liveAccelZ,

        liveGyroX,
        liveGyroY,
        liveGyroZ,

        liveTemperature,
        livePressure,

        liveVibration
    ];


    arrays.forEach(
        function (array) {

            while (
                array.length >
                MAX_LIVE_POINTS
            ) {

                array.shift();
            }
        }
    );
}


/* =========================================================
   UPDATE DASHBOARD WITH ESP32 DATA
========================================================= */

function updateLiveDashboard(data) {

    const temperature =
        Number(
            data.temperature
        );

    const pressure =
        Number(
            data.pressure
        );


    const accelX =
        Number(
            data.accelX
        );

    const accelY =
        Number(
            data.accelY
        );

    const accelZ =
        Number(
            data.accelZ
        );


    const gyroX =
        Number(
            data.gyroX
        );

    const gyroY =
        Number(
            data.gyroY
        );

    const gyroZ =
        Number(
            data.gyroZ
        );


    const vibration =
        Number(
            data.vibration
        );


    liveLabels.push(
        new Date()
            .toLocaleTimeString()
    );


    liveTemperature.push(
        temperature
    );

    livePressure.push(
        pressure
    );


    liveAccelX.push(
        accelX
    );

    liveAccelY.push(
        accelY
    );

    liveAccelZ.push(
        accelZ
    );


    liveGyroX.push(
        gyroX
    );

    liveGyroY.push(
        gyroY
    );

    liveGyroZ.push(
        gyroZ
    );


    liveVibration.push(
        vibration
    );


    trimLiveData();


    displaySensorCharts(

        liveLabels,

        liveAccelX,
        liveAccelY,
        liveAccelZ,

        liveGyroX,
        liveGyroY,
        liveGyroZ,

        liveTemperature,
        livePressure,

        liveVibration
    );


    updateHealthTable(
        vibration,
        temperature,
        true
    );


    /*
       Use real BME280 temperature in
       environmental overlay.
    */

    $("tempSlider").value =
        Math.max(
            -20,
            Math.min(
                70,
                temperature
            )
        );


    calculateEnvironmentalValues();
}


/* =========================================================
   CLOSE WIFI POPUP WHEN CLICKING BACKGROUND
========================================================= */

$("wifiPanel").addEventListener(
    "click",

    function (event) {

        if (
            event.target ===
            $("wifiPanel")
        ) {

            closeWifiPanel();
        }
    }
);


/* =========================================================
   ESC KEY CLOSES WIFI POPUP
========================================================= */

document.addEventListener(
    "keydown",

    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeWifiPanel();
        }
    }
);


/* =========================================================
   INITIALIZE PAGE
========================================================= */

function initializeDashboard() {

    /*
       Draw environmental,
       compensation and pointing charts.
    */

    calculateEnvironmentalValues();


    /*
       Generate initial demo sensor graphs.
       This prevents blank canvas areas when
       ESP32 is not connected yet.
    */

    generateDemoSensorData();


    console.log(
        "Anti-Drone Dashboard initialized."
    );
}


initializeDashboard();