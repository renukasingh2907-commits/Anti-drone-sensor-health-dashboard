/* =====================================================
   ANTI-DRONE SENSOR HEALTH DASHBOARD
   Enhanced Version
===================================================== */


const $ = (id) => document.getElementById(id);


/* =====================================================
   CHART STORAGE
===================================================== */

let charts = {};

let simulationTimer = null;



/* =====================================================
   HELPER FUNCTIONS
===================================================== */

function createLabels(number = 30) {

    return Array.from(
        { length: number },
        (_, index) => index + 1
    );

}


function average(array) {

    return array.reduce(
        (total, value) => total + value,
        0
    ) / array.length;

}


function dataset(label, data) {

    return {

        label: label,

        data: data,

        tension: 0.25,

        pointRadius: 0

    };

}



/* =====================================================
   CREATE / UPDATE CHART
===================================================== */

function createChart(
    chartID,
    labels,
    datasets
) {

    if (charts[chartID]) {

        charts[chartID].destroy();

    }


    charts[chartID] = new Chart(

        $(chartID),

        {

            type: "line",

            data: {

                labels: labels,

                datasets: datasets

            },


            options: {

                responsive: true,

                animation: false,

                interaction: {

                    intersect: false,

                    mode: "index"

                },

                plugins: {

                    legend: {

                        display: true

                    }

                }

            }

        }

    );

}



/* =====================================================
   FEATURE 1
   ENVIRONMENTAL CONDITION
===================================================== */

function updateEnvironment() {


    /* Get slider values */

    const temperature =
        Number(
            $("tempSlider").value
        );


    const altitude =
        Number(
            $("altSlider").value
        );


    /* Display values */

    $("tempValue").textContent =
        temperature;


    $("altValue").textContent =
        altitude;



    /* -------------------------------------------------
       ENVIRONMENTAL STRESS MODEL

       This is a demonstration model.

       Higher temperature difference
       + higher altitude
       = higher simulated drift.
    ------------------------------------------------- */

    const temperatureStress =
        Math.abs(
            temperature - 25
        ) / 10;


    const altitudeStress =
        altitude / 2500;


    const environmentalStress =
        Math.max(
            0,
            temperatureStress
        )
        +
        altitudeStress;



    /* -------------------------------------------------
       DRIFT THRESHOLD
    ------------------------------------------------- */

    const driftThreshold =
        Math.max(
            2,
            5 -
            environmentalStress * 0.5
        );


    $("driftThreshold").textContent =
        driftThreshold.toFixed(1)
        + "%";



    /* -------------------------------------------------
       ENVIRONMENT STATUS
    ------------------------------------------------- */

    let environmentStatus;


    if (environmentalStress > 5) {

        environmentStatus =
            "HIGH";

    }

    else if (environmentalStress > 2) {

        environmentStatus =
            "ELEVATED";

    }

    else {

        environmentStatus =
            "NORMAL";

    }


    $("envStatus").textContent =
        environmentStatus;



    /* -------------------------------------------------
       COMPENSATION STATUS
    ------------------------------------------------- */

    if (environmentalStress > 2) {

        $("compStatus").textContent =
            "ACTIVE";

    }

    else {

        $("compStatus").textContent =
            "READY";

    }



    /* -------------------------------------------------
       GRAPH DATA
    ------------------------------------------------- */

    const labels =
        createLabels(30);


    const baseline = [];

    const environmentalDrift = [];

    const compensated = [];


    for (
        let i = 0;
        i < labels.length;
        i++
    ) {

        const normalSignal =
            Math.sin(i / 3) * 1.2;


        const drift =
            environmentalStress
            *
            i
            /
            labels.length;


        baseline.push(
            normalSignal
        );


        environmentalDrift.push(
            normalSignal + drift
        );


        compensated.push(
            normalSignal + drift * 0.25
        );

    }



    createChart(

        "environmentChart",

        labels,

        [

            dataset(
                "Baseline",
                baseline
            ),

            dataset(
                "Environmental Drift",
                environmentalDrift
            ),

            dataset(
                "Compensated",
                compensated
            )

        ]

    );



    return environmentalStress;

}



/* =====================================================
   FEATURE 2
   BEFORE / AFTER COMPENSATION
===================================================== */

function updateCompensation(
    environmentalStress
) {


    const labels =
        createLabels(30);


    const rawSignal = [];

    const compensatedSignal = [];


    for (
        let i = 0;
        i < labels.length;
        i++
    ) {


        /* Ideal signal */

        const idealSignal =
            Math.sin(i / 3)
            * 10;



        /* Environmental error */

        const environmentalError =
            environmentalStress
            *
            i
            /
            labels.length
            *
            3;



        /* Raw signal */

        const raw =
            idealSignal
            +
            environmentalError
            +
            (
                Math.random() - 0.5
            )
            * 2;



        /* Compensation removes most error */

        const corrected =
            idealSignal
            +
            environmentalError
            * 0.25
            +
            (
                Math.random() - 0.5
            )
            * 0.7;


        rawSignal.push(raw);

        compensatedSignal.push(
            corrected
        );

    }



    /* -------------------------------------------------
       ERROR CALCULATION
    ------------------------------------------------- */

    const rawError =
        average(

            rawSignal.map(

                (value, index) =>

                    Math.abs(

                        value
                        -
                        Math.sin(
                            index / 3
                        ) * 10

                    )

            )

        );


    const compensatedError =
        average(

            compensatedSignal.map(

                (value, index) =>

                    Math.abs(

                        value
                        -
                        Math.sin(
                            index / 3
                        ) * 10

                    )

            )

        );



    $("rawError").textContent =
        rawError.toFixed(2);


    $("compError").textContent =
        compensatedError.toFixed(2);



    const reduction =
        (
            1
            -
            compensatedError
            /
            rawError
        )
        * 100;


    $("errorReduction").textContent =
        reduction.toFixed(1)
        + "%";



    /* -------------------------------------------------
       GRAPH
    ------------------------------------------------- */

    createChart(

        "compChart",

        labels,

        [

            dataset(
                "Raw Sensor Signal",
                rawSignal
            ),

            dataset(
                "Compensated Signal",
                compensatedSignal
            )

        ]

    );

}



/* =====================================================
   FEATURE 3
   ANOMALY / THRESHOLD FLAGGING
===================================================== */

function updateHealth() {


    const threshold =
        Number(
            $("vibThreshold").value
        );


    /* Baseline vibration */

    const baseline =
        1.0;



    /* Simulated vibration */

    const reading =

        baseline

        +

        Math.abs(
            Math.sin(
                Date.now() / 1000
            )
        )
        * 0.4

        +

        Math.random()
        * 0.12;



    /* Calculate deviation */

    const deviation =

        (
            reading
            -
            baseline
        )
        /
        baseline
        *
        100;



    /* Determine health */

    let status;


    if (
        deviation
        >=
        threshold * 2
    ) {

        status = "CRITICAL";

    }

    else if (
        deviation
        >=
        threshold
    ) {

        status = "WARNING";

    }

    else {

        status = "NORMAL";

    }



    let statusClass;


    if (status === "NORMAL") {

        statusClass =
            "status-ok";

    }

    else if (status === "WARNING") {

        statusClass =
            "status-warn";

    }

    else {

        statusClass =
            "status-critical";

    }



    let message =
        status;


    if (status !== "NORMAL") {

        message +=
            " — vibration exceeds baseline by "
            +
            deviation.toFixed(1)
            +
            "%";

    }



    /* -------------------------------------------------
       HEALTH TABLE
    ------------------------------------------------- */

    $("healthBody").innerHTML = `

        <tr>

            <td>
                INMP441 / Motor Vibration
            </td>

            <td>
                ${reading.toFixed(2)}
            </td>

            <td>
                ${baseline.toFixed(2)}
            </td>

            <td>
                ${deviation.toFixed(1)}%
            </td>

            <td class="${statusClass}">
                ${message}
            </td>

        </tr>


        <tr>

            <td>
                MPU6050
            </td>

            <td>
                Live / Simulated
            </td>

            <td>
                Configured
            </td>

            <td>
                --
            </td>

            <td class="status-ok">
                NORMAL
            </td>

        </tr>


        <tr>

            <td>
                BME280
            </td>

            <td>
                ${$("tempSlider").value} °C
            </td>

            <td>
                Environmental Monitoring
            </td>

            <td>
                --
            </td>

            <td class="status-ok">
                MONITORING
            </td>

        </tr>

    `;

}



/* =====================================================
   FEATURE 4
   ERROR BUDGET / POINTING ACCURACY
===================================================== */

function updatePointingAccuracy(
    environmentalStress
) {


    /* -------------------------------------------------
       Simulated contributors

       These are demonstration values.

       Replace them later with values from
       your actual error-budget calculations.
    ------------------------------------------------- */


    const windError =

        1
        +
        environmentalStress
        * 0.15;



    const driftError =

        environmentalStress
        * 0.8;



    /* Combine error contributors */

    const totalError =

        Math.sqrt(

            windError
            *
            windError

            +

            driftError
            *
            driftError

        );



    /* Simulated compensation */

    const compensatedError =

        totalError
        *
        0.38;



    /* Display */

    $("pointingError").textContent =

        totalError.toFixed(2)
        +
        " µrad";


    $("windError").textContent =

        windError.toFixed(2)
        +
        " µrad";


    $("driftError").textContent =

        driftError.toFixed(2)
        +
        " µrad";


    $("pointingComp").textContent =

        compensatedError.toFixed(2)
        +
        " µrad";



    /* -------------------------------------------------
       GRAPH
    ------------------------------------------------- */

    const labels =
        createLabels(30);


    const rawPointing = [];

    const compensatedPointing = [];


    labels.forEach(

        (_, index) => {


            rawPointing.push(

                totalError
                +
                Math.sin(
                    index / 2
                )
                * 0.25

            );


            compensatedPointing.push(

                compensatedError
                +
                Math.sin(
                    index / 2
                )
                * 0.10

            );

        }

    );



    createChart(

        "pointingChart",

        labels,

        [

            dataset(
                "Raw Pointing Error",
                rawPointing
            ),

            dataset(
                "Compensated Error",
                compensatedPointing
            )

        ]

    );

}



/* =====================================================
   EXISTING SENSOR GRAPHS
===================================================== */

function updateSensorCharts() {


    const labels =
        createLabels(40);



    /* -------------------------------------------------
       MPU6050 ACCELERATION
    ------------------------------------------------- */

    const accelX =
        labels.map(

            i =>
                Math.sin(i / 4)
                * 1.2

        );


    const accelY =
        labels.map(

            i =>
                Math.cos(i / 5)

        );


    const accelZ =
        labels.map(

            i =>
                1
                +
                Math.sin(i / 6)
                * 0.15

        );


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



    /* -------------------------------------------------
       MPU6050 GYROSCOPE
    ------------------------------------------------- */

    const gyroX =
        labels.map(

            i =>
                Math.sin(i / 4)
                * 8

        );


    const gyroY =
        labels.map(

            i =>
                Math.cos(i / 5)
                * 6

        );


    const gyroZ =
        labels.map(

            i =>
                Math.sin(i / 7)
                * 5

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



    /* -------------------------------------------------
       BME280 TEMPERATURE
    ------------------------------------------------- */

    const temperature =
        Number(
            $("tempSlider").value
        );


    const temperatureData =
        labels.map(

            i =>
                temperature
                +
                Math.sin(i / 5)

        );


    createChart(

        "tempChart",

        labels,

        [

            dataset(
                "Temperature °C",
                temperatureData
            )

        ]

    );



    /* -------------------------------------------------
       BME280 PRESSURE
    ------------------------------------------------- */

    const altitude =
        Number(
            $("altSlider").value
        );


    const pressureData =
        labels.map(

            i =>

                1013

                -

                altitude
                * 0.1

                +

                Math.sin(i / 4)
                * 2

        );


    createChart(

        "pressureChart",

        labels,

        [

            dataset(
                "Pressure hPa",
                pressureData
            )

        ]

    );



    /* -------------------------------------------------
       INMP441 VIBRATION
    ------------------------------------------------- */

    const vibrationData =
        labels.map(

            i =>

                1
                +
                Math.abs(
                    Math.sin(i / 3)
                )
                * 0.4

        );


    createChart(

        "vibrationChart",

        labels,

        [

            dataset(
                "INMP441 Vibration",
                vibrationData
            )

        ]

    );

}



/* =====================================================
   UPDATE EVERYTHING
===================================================== */

function updateDashboard() {


    const environmentalStress =
        updateEnvironment();


    updateCompensation(
        environmentalStress
    );


    updateHealth();


    updatePointingAccuracy(
        environmentalStress
    );


    updateSensorCharts();

}



/* =====================================================
   TEMPERATURE SLIDER
===================================================== */

$("tempSlider")
    .addEventListener(
        "input",
        updateDashboard
    );



/* =====================================================
   ALTITUDE SLIDER
===================================================== */

$("altSlider")
    .addEventListener(
        "input",
        updateDashboard
    );



/* =====================================================
   VIBRATION THRESHOLD
===================================================== */

$("vibThreshold")
    .addEventListener(
        "input",
        updateHealth
    );



/* =====================================================
   START / STOP SIMULATION
===================================================== */

$("demoBtn")
    .addEventListener(

        "click",

        function () {


            if (simulationTimer) {


                clearInterval(
                    simulationTimer
                );


                simulationTimer =
                    null;


                $("demoBtn")
                    .textContent =
                    "Start Simulation";

            }


            else {


                simulationTimer =

                    setInterval(

                        function () {

                            updateDashboard();

                        },

                        1000

                    );


                $("demoBtn")
                    .textContent =
                    "Stop Simulation";

            }

        }

    );



/* =====================================================
   DEMO BUTTON
===================================================== */

$("loadDemo")
    .addEventListener(

        "click",

        function () {

            updateDashboard();

        }

    );



/* =====================================================
   CSV FILE
===================================================== */

$("csvFile")
    .addEventListener(

        "change",

        function () {


            if (!this.files.length) {

                return;

            }


            alert(

                "CSV selected. " +

                "The current dashboard demonstrates " +

                "the enhanced features using simulated data. " +

                "Live ESP32 integration can be connected next."

            );

        }

    );



/* =====================================================
   INITIAL LOAD
===================================================== */

updateDashboard();