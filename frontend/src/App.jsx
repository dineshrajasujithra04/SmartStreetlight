import { useEffect, useState, useRef } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

function App() {
  const [streetlights, setStreetlights] = useState([])

  // ---------------------------------------------------------
  // ENERGY SAVED
  // ---------------------------------------------------------

  const [energySaved, setEnergySaved] = useState(0)

  // ---------------------------------------------------------
  // POWER USAGE HISTORY
  // ---------------------------------------------------------

  const [powerHistory, setPowerHistory] = useState([])

  // ---------------------------------------------------------
  // ENERGY SAVED HISTORY
  // ---------------------------------------------------------

  const [energyHistory, setEnergyHistory] = useState([])

  // ---------------------------------------------------------
  // AUTOMATIC SIMULATION
  // ---------------------------------------------------------

  const [simulationRunning, setSimulationRunning] = useState(false)

  const simulationRef = useRef(null)

  // ---------------------------------------------------------
  // TIME TRACKING
  // ---------------------------------------------------------

  const lastUpdateTimeRef = useRef(Date.now())

  // ---------------------------------------------------------
  // LOAD STREETLIGHT DATA
  // ---------------------------------------------------------

  const loadStreetlights = () => {
    fetch("http://127.0.0.1:8000/streetlights")
      .then((response) => response.json())
      .then((data) => {
        setStreetlights(data)
      })
      .catch((error) => {
        console.error(
          "Error connecting to backend:",
          error
        )
      })
  }

  // ---------------------------------------------------------
  // LOAD DATA WHEN PAGE OPENS
  // ---------------------------------------------------------

  useEffect(() => {
    loadStreetlights()
  }, [])

  // ---------------------------------------------------------
  // RECORD POWER USAGE FOR GRAPH
  // ---------------------------------------------------------

  useEffect(() => {
    if (streetlights.length === 0) {
      return
    }

    const currentPower = streetlights.reduce(
      (total, light) =>
        total + light.power_usage,
      0
    )

    const currentTime = new Date()

    const timeLabel =
      currentTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })

    setPowerHistory((previous) => {
      const newData = [
        ...previous,
        {
          time: timeLabel,
          power: Number(
            currentPower.toFixed(1)
          )
        }
      ]

      // Keep latest 10 readings
      return newData.slice(-10)
    })
  }, [streetlights])

  // ---------------------------------------------------------
  // MANUAL ON / OFF / BRIGHTNESS CONTROL
  // ---------------------------------------------------------

  const updateStreetlight = (
    id,
    status,
    brightness
  ) => {
    fetch(
      `http://127.0.0.1:8000/streetlights/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: status,
          brightness: brightness
        })
      }
    )
      .then((response) => response.json())
      .then(() => {
        loadStreetlights()
      })
      .catch((error) => {
        console.error(
          "Error updating streetlight:",
          error
        )
      })
  }

  // ---------------------------------------------------------
  // AUTOMATIC ENERGY-SAVING MODE
  // ---------------------------------------------------------

  const automaticMode = (id) => {
    fetch(
      `http://127.0.0.1:8000/streetlights/${id}/auto`,
      {
        method: "PUT"
      }
    )
      .then((response) => response.json())
      .then(() => {
        loadStreetlights()
      })
      .catch((error) => {
        console.error(
          "Error applying automatic mode:",
          error
        )
      })
  }

  // ---------------------------------------------------------
  // SIMULATE TRAFFIC AND MOTION
  // ---------------------------------------------------------

  const simulateTraffic = (id) => {
    fetch(
      `http://127.0.0.1:8000/streetlights/${id}/simulate`,
      {
        method: "PUT"
      }
    )
      .then((response) => response.json())
      .then(() => {
        loadStreetlights()
      })
      .catch((error) => {
        console.error(
          "Error simulating traffic:",
          error
        )
      })
  }

  // ---------------------------------------------------------
  // SIMULATE FAULT
  // ---------------------------------------------------------

  const simulateFault = (id) => {
    fetch(
      `http://127.0.0.1:8000/streetlights/${id}/fault`,
      {
        method: "PUT"
      }
    )
      .then((response) => response.json())
      .then(() => {
        loadStreetlights()
      })
      .catch((error) => {
        console.error(
          "Error simulating fault:",
          error
        )
      })
  }

  // ---------------------------------------------------------
  // REPAIR STREETLIGHT
  // ---------------------------------------------------------

  const repairStreetlight = (id) => {
    fetch(
      `http://127.0.0.1:8000/streetlights/${id}/repair`,
      {
        method: "PUT"
      }
    )
      .then((response) => response.json())
      .then(() => {
        loadStreetlights()
      })
      .catch((error) => {
        console.error(
          "Error repairing streetlight:",
          error
        )
      })
  }

  // ---------------------------------------------------------
  // START AUTOMATIC SIMULATION
  // ---------------------------------------------------------

  const startSimulation = () => {
    if (simulationRunning) {
      return
    }

    setSimulationRunning(true)

    simulationRef.current =
      setInterval(() => {
        streetlights.forEach((light) => {
          fetch(
            `http://127.0.0.1:8000/streetlights/${light.id}/simulate`,
            {
              method: "PUT"
            }
          )
            .then((response) =>
              response.json()
            )
            .catch((error) => {
              console.error(
                "Simulation error:",
                error
              )
            })
        })

        setTimeout(() => {
          loadStreetlights()
        }, 500)

      }, 5000)
  }

  // ---------------------------------------------------------
  // STOP AUTOMATIC SIMULATION
  // ---------------------------------------------------------

  const stopSimulation = () => {
    if (simulationRef.current) {
      clearInterval(
        simulationRef.current
      )

      simulationRef.current = null
    }

    setSimulationRunning(false)
  }

  // ---------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------

  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        clearInterval(
          simulationRef.current
        )
      }
    }
  }, [])

  // ---------------------------------------------------------
  // ENERGY SAVED CALCULATION
  // ---------------------------------------------------------

  useEffect(() => {
    if (streetlights.length === 0) {
      return
    }

    const currentTime = Date.now()

    const elapsedTime =
      (currentTime -
        lastUpdateTimeRef.current) /
      3600000

    lastUpdateTimeRef.current =
      currentTime

    // Every non-faulty streetlight
    // uses 45 W at 100% brightness.

    const baselinePower =
      streetlights.filter(
        (light) => !light.fault
      ).length * 45

    // Actual current power

    const actualPower =
      streetlights.reduce(
        (total, light) =>
          total + light.power_usage,
        0
      )

    // Power saved

    const powerSavedNow =
      Math.max(
        0,
        baselinePower - actualPower
      )

    // Convert Watt-hours to kWh

    const energySavedNow =
      (powerSavedNow *
        elapsedTime) /
      1000

    // Update total energy saved

    setEnergySaved((previous) => {
      const newEnergy =
        previous + energySavedNow

      return newEnergy
    })

    // Record energy history

    setEnergyHistory((previous) => {
      const lastEnergy =
        previous.length > 0
          ? previous[
              previous.length - 1
            ].energy
          : 0

      const newEnergy =
        lastEnergy +
        energySavedNow

      const currentDate =
        new Date()

      const timeLabel =
        currentDate.toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }
        )

      const newData = [
        ...previous,
        {
          time: timeLabel,
          energy: Number(
            newEnergy.toFixed(6)
          )
        }
      ]

      // Keep latest 10 readings

      return newData.slice(-10)
    })

  }, [streetlights])

  // ---------------------------------------------------------
  // DASHBOARD CALCULATIONS
  // ---------------------------------------------------------

  const totalLights =
    streetlights.length

  const lightsOn =
    streetlights.filter(
      (light) =>
        light.status === "ON"
    ).length

  const lightsOff =
    streetlights.filter(
      (light) =>
        light.status === "OFF"
    ).length

  const faultyLights =
    streetlights.filter(
      (light) =>
        light.fault === true
    ).length

  // Current power usage

  const powerUsage =
    streetlights.reduce(
      (total, light) =>
        total + light.power_usage,
      0
    )

  // Baseline power

  const baselinePower =
    streetlights.filter(
      (light) =>
        !light.fault
    ).length * 45

  // Current power saved

  const powerSaved =
    Math.max(
      0,
      baselinePower -
        powerUsage
    )

  // ---------------------------------------------------------
  // FRONTEND
  // ---------------------------------------------------------

  return (
    <div className="app">

      {/* HEADER */}

      <header>
        <h1>
          Smart Streetlight
        </h1>

        <p>
          Energy Conservation &
          Monitoring System
        </p>
      </header>

      <main>

        {/* -------------------------------------------------
            SIMULATION CONTROLS
        ------------------------------------------------- */}

        <div className="simulation-control">

          <button
            onClick={
              startSimulation
            }
          >
            START AUTO SIMULATION
          </button>

          <button
            onClick={
              stopSimulation
            }
          >
            STOP SIMULATION
          </button>

          <p>
            Simulation Status:{" "}

            <strong>
              {simulationRunning
                ? "RUNNING"
                : "STOPPED"}
            </strong>
          </p>

        </div>

        {/* -------------------------------------------------
            DASHBOARD
        ------------------------------------------------- */}

        <h2>
          Dashboard
        </h2>

        <div className="cards">

          {/* TOTAL */}

          <div className="card">
            <h3>
              Total Streetlights
            </h3>

            <p>
              {totalLights}
            </p>
          </div>

          {/* ON */}

          <div className="card">
            <h3>
              Lights ON
            </h3>

            <p>
              {lightsOn}
            </p>
          </div>

          {/* OFF */}

          <div className="card">
            <h3>
              Lights OFF
            </h3>

            <p>
              {lightsOff}
            </p>
          </div>

          {/* FAULTY */}

          <div className="card">
            <h3>
              Faulty Lights
            </h3>

            <p>
              {faultyLights}
            </p>
          </div>

          {/* POWER */}

          <div className="card">
            <h3>
              Power Usage
            </h3>

            <p>
              {powerUsage.toFixed(1)}
              {" "}W
            </p>
          </div>

          {/* ENERGY */}

          <div className="card">
            <h3>
              Energy Saved
            </h3>

            <p>
              {energySaved.toFixed(4)}
              {" "}kWh
            </p>
          </div>

        </div>

        {/* -------------------------------------------------
            ENERGY SAVING SUMMARY
        ------------------------------------------------- */}

        <section className="info">

          <h2>
            Energy Saving Summary
          </h2>

          <div className="cards">

            <div className="card">

              <h3>
                Baseline Power
              </h3>

              <p>
                {baselinePower.toFixed(1)}
                {" "}W
              </p>

            </div>

            <div className="card">

              <h3>
                Current Power
              </h3>

              <p>
                {powerUsage.toFixed(1)}
                {" "}W
              </p>

            </div>

            <div className="card">

              <h3>
                Power Saved
              </h3>

              <p>
                {powerSaved.toFixed(1)}
                {" "}W
              </p>

            </div>

          </div>

          <p>
            Baseline assumes each
            non-faulty streetlight
            operates at 100% brightness
            using 45 W.
          </p>

        </section>

        {/* -------------------------------------------------
    ANALYTICS DASHBOARD
------------------------------------------------- */}

<section className="info">

  <h2>Streetlight Analytics</h2>

  <div className="cards">

    <div className="card">
      <h3>Total Streetlights</h3>
      <p>{totalLights}</p>
    </div>

    <div className="card">
      <h3>Lights ON</h3>
      <p>{lightsOn}</p>
    </div>

    <div className="card">
      <h3>Lights OFF</h3>
      <p>{lightsOff}</p>
    </div>

    <div className="card">
      <h3>Faulty Lights</h3>
      <p>{faultyLights}</p>
    </div>

  </div>

  <div className="cards">

    <div className="card">
      <h3>Baseline Power</h3>
      <p>{baselinePower.toFixed(1)} W</p>
    </div>

    <div className="card">
      <h3>Current Power</h3>
      <p>{powerUsage.toFixed(1)} W</p>
    </div>

    <div className="card">
      <h3>Power Saved</h3>
      <p>{powerSaved.toFixed(1)} W</p>
    </div>

    <div className="card">
      <h3>Energy Saved</h3>
      <p>{energySaved.toFixed(4)} kWh</p>
    </div>

  </div>

  <p>
    This analytics section provides a summary of
    streetlight status, power consumption and
    energy conservation.
  </p>

</section>
 {/* -------------------------------------------------
    REPORTS
------------------------------------------------- */}

<section className="info">

  <h2>Streetlight Reports</h2>

  <div className="cards">

    <div className="card">
      <h3>Total Streetlights</h3>
      <p>{totalLights}</p>
    </div>

    <div className="card">
      <h3>Lights ON</h3>
      <p>{lightsOn}</p>
    </div>

    <div className="card">
      <h3>Lights OFF</h3>
      <p>{lightsOff}</p>
    </div>

    <div className="card">
      <h3>Faulty Lights</h3>
      <p>{faultyLights}</p>
    </div>

  </div>

  <div className="cards">

    <div className="card">
      <h3>Total Power Usage</h3>
      <p>{powerUsage.toFixed(1)} W</p>
    </div>

    <div className="card">
      <h3>Baseline Power</h3>
      <p>{baselinePower.toFixed(1)} W</p>
    </div>

    <div className="card">
      <h3>Power Saved</h3>
      <p>{powerSaved.toFixed(1)} W</p>
    </div>

    <div className="card">
      <h3>Energy Saved</h3>
      <p>{energySaved.toFixed(4)} kWh</p>
    </div>

  </div>

  <p>
    This report provides a summary of streetlight
    operation, power consumption and energy savings.
  </p>

</section>
{/* -------------------------------------------------
            POWER USAGE GRAPH
        ------------------------------------------------- */}

        <section className="info">

          <h2>
            Power Usage Monitoring
          </h2>

          <p>
            This graph shows how total
            streetlight power usage
            changes during simulation.
          </p>

          {powerHistory.length === 0 ? (

            <p>
              Start the simulation to
              collect power data.
            </p>

          ) : (

            <div
              style={{
                width: "100%",
                height: 350
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={powerHistory}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                  />

                  <YAxis
                    label={{
                      value:
                        "Power (W)",
                      angle: -90,
                      position:
                        "insideLeft"
                    }}
                  />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="power"
                    name="Power Usage"
                    strokeWidth={3}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        </section>

        {/* -------------------------------------------------
            ENERGY SAVED GRAPH
        ------------------------------------------------- */}

        <section className="info">

          <h2>
            Energy Saved Monitoring
          </h2>

          <p>
            This graph shows the
            accumulated energy saved
            during streetlight operation.
          </p>

          {energyHistory.length === 0 ? (

            <p>
              Start the simulation to
              collect energy-saving data.
            </p>

          ) : (

            <div
              style={{
                width: "100%",
                height: 350
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={energyHistory}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                  />

                  <YAxis
                    label={{
                      value:
                        "Energy (kWh)",
                      angle: -90,
                      position:
                        "insideLeft"
                    }}
                  />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Energy Saved"
                    strokeWidth={3}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        </section>

        {/* -------------------------------------------------
            STREETLIGHT MONITORING
        ------------------------------------------------- */}

        <section className="info">

          <h2>
            Streetlight Monitoring
          </h2>

          {streetlights.length === 0 ? (

            <p>
              No streetlights found.
            </p>

          ) : (

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Brightness
                    </th>

                    <th>
                      Power
                    </th>

                    <th>
                      Motion
                    </th>

                    <th>
                      Fault
                    </th>

                    <th>
                      Control
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {streetlights.map(
                    (light) => (

                    <tr
                      key={light.id}
                    >

                      <td>
                        {light.id}
                      </td>

                      <td>
                        {light.location}
                      </td>

                      <td>
                        {light.status}
                      </td>

                      <td>
                        {light.brightness}%
                      </td>

                      <td>
                        {light.power_usage} W
                      </td>

                      <td>
                        {light.motion_detected
                          ? "YES"
                          : "NO"}
                      </td>

                      <td>
                        {light.fault
                          ? "FAULT"
                          : "OK"}
                      </td>

                      <td>

                        {/* ON */}

                        <button
                          onClick={() =>
                            updateStreetlight(
                              light.id,
                              "ON",
                              light.brightness === 0
                                ? 100
                                : light.brightness
                            )
                          }
                        >
                          ON
                        </button>

                        {/* OFF */}

                        <button
                          onClick={() =>
                            updateStreetlight(
                              light.id,
                              "OFF",
                              0
                            )
                          }
                        >
                          OFF
                        </button>

                        {/* AUTO */}

                        <button
                          onClick={() =>
                            automaticMode(
                              light.id
                            )
                          }
                        >
                          AUTO
                        </button>

                        {/* SIMULATE */}

                        <button
                          onClick={() =>
                            simulateTraffic(
                              light.id
                            )
                          }
                        >
                          SIMULATE
                        </button>

                        {/* FAULT / REPAIR */}

                        {light.fault ? (

                          <button
                            onClick={() =>
                              repairStreetlight(
                                light.id
                              )
                            }
                          >
                            REPAIR
                          </button>

                        ) : (

                          <button
                            onClick={() =>
                              simulateFault(
                                light.id
                              )
                            }
                          >
                            SIMULATE FAULT
                          </button>

                        )}

                        <br />

                        {/* BRIGHTNESS */}

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={
                            light.brightness
                          }
                          onChange={(
                            event
                          ) =>
                            updateStreetlight(
                              light.id,
                              light.status,
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                        />

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  )
}

export default App