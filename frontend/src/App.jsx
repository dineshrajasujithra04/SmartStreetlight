import { useEffect, useRef, useState } from "react"

// Local backend for development and Render backend for deployment.
const API = import.meta.env.DEV
  ? "http://127.0.0.1:8000"
  : "https://smartstreetlight-backend.onrender.com"

function App() {
  const [streetlights, setStreetlights] = useState([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState("")
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [energySaved, setEnergySaved] = useState(0)
  const [loading, setLoading] = useState(true)

  const simulationRef = useRef(null)
  const lastTime = useRef(Date.now())
  const lightsRef = useRef([])

  // Keep the latest streetlight data available to the simulation.
  useEffect(() => {
    lightsRef.current = streetlights
  }, [streetlights])

  // ---------------- LOAD DATA ----------------
  const loadStreetlights = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true)
    }

    try {
      const response = await fetch(`${API}/streetlights`)

      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`)
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from backend.")
      }

      setStreetlights(data)
      setConnected(true)
      setError("")
    } catch (err) {
      console.error("Unable to load streetlights:", err)

      setConnected(false)

      setError(
        `Cannot connect to the backend at ${API}. ` +
          "Make sure your FastAPI server is running and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  // ---------------- INITIAL CONNECTION ----------------
  useEffect(() => {
    loadStreetlights(true)

    // Refresh dashboard data periodically.
    const refreshTimer = setInterval(() => {
      loadStreetlights()
    }, 10000)

    return () => {
      clearInterval(refreshTimer)

      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }
    }
  }, [])

  // ---------------- UPDATE LIGHT ----------------
  const updateLight = async (id, status, brightness) => {
    try {
      setError("")

      const response = await fetch(`${API}/streetlights/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          brightness,
        }),
      })

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`)
      }

      await loadStreetlights()
    } catch (err) {
      console.error("Unable to update streetlight:", err)
      setError("Unable to update streetlight. Check the backend API.")
    }
  }

  // ---------------- AUTO MODE ----------------
  const autoMode = async (id) => {
    try {
      setError("")

      const response = await fetch(`${API}/streetlights/${id}/auto`, {
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error(`Auto mode failed: ${response.status}`)
      }

      await loadStreetlights()
    } catch (err) {
      console.error("Auto mode error:", err)
      setError(
        "Auto mode is unavailable. Check whether the backend supports this endpoint."
      )
    }
  }

  // ---------------- SIMULATE ONE LIGHT ----------------
  const simulate = async (id) => {
    try {
      setError("")

      const response = await fetch(`${API}/streetlights/${id}/simulate`, {
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error(`Simulation failed: ${response.status}`)
      }

      await loadStreetlights()
    } catch (err) {
      console.error("Streetlight simulation error:", err)
      setError("Unable to simulate streetlight. Check the backend API.")
    }
  }

  // ---------------- AUTO SIMULATION ----------------
  const startSimulation = () => {
    if (simulationRef.current) {
      return
    }

    if (!connected) {
      setError("Connect to the backend before starting simulation.")
      return
    }

    setSimulationRunning(true)
    setError("")

    const runSimulation = async () => {
      try {
        const currentLights = lightsRef.current

        await Promise.all(
          currentLights.map(async (light) => {
            const response = await fetch(
              `${API}/streetlights/${light.id}/simulate`,
              {
                method: "PUT",
              }
            )

            if (!response.ok) {
              throw new Error(
                `Simulation failed for streetlight ${light.id}`
              )
            }
          })
        )

        await loadStreetlights()
      } catch (err) {
        console.error("Automatic simulation error:", err)
        setError("Automatic simulation failed. Check the backend.")
      }
    }

    // Run once immediately, then every five seconds.
    runSimulation()

    simulationRef.current = setInterval(runSimulation, 5000)
  }

  const stopSimulation = () => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current)
      simulationRef.current = null
    }

    setSimulationRunning(false)
  }

  // ---------------- ENERGY CALCULATION ----------------
  useEffect(() => {
    if (streetlights.length === 0) {
      lastTime.current = Date.now()
      return
    }

    const now = Date.now()
    const hours = (now - lastTime.current) / 3600000

    lastTime.current = now

    const baseline =
      streetlights.filter((light) => !light.fault).length * 45

    const current = streetlights.reduce(
      (sum, light) => sum + Number(light.power_usage || 0),
      0
    )

    const saved = Math.max(0, baseline - current)

    setEnergySaved((previous) => previous + (saved * hours) / 1000)
  }, [streetlights])

  // ---------------- DASHBOARD STATISTICS ----------------
  const total = streetlights.length

  const lightsOn = streetlights.filter(
    (light) => light.status === "ON"
  ).length

  const lightsOff = streetlights.filter(
    (light) => light.status === "OFF"
  ).length

  const faulty = streetlights.filter(
    (light) => Boolean(light.fault)
  ).length

  const power = streetlights.reduce(
    (sum, light) => sum + Number(light.power_usage || 0),
    0
  )

  const baseline =
    streetlights.filter((light) => !light.fault).length * 45

  const powerSaved = Math.max(0, baseline - power)

  // ---------------- UI ----------------
  return (
    <div className="app">
      <header>
        <h1>Smart Streetlight</h1>
        <p>Energy Conservation & Monitoring System</p>
      </header>

      <main>
        {/* BACKEND CONNECTION */}
        <section className="info">
          {connected ? (
            <div>
              <h2>🟢 Backend Connected</h2>
              <p>Connected to: {API}</p>

              <button onClick={() => loadStreetlights(true)}>
                REFRESH DATA
              </button>
            </div>
          ) : (
            <div>
              <h2>
                {loading
                  ? "Connecting to Backend..."
                  : "Backend Connection Error"}
              </h2>

              <p>{error || `Connecting to ${API}...`}</p>

              <button
                onClick={() => loadStreetlights(true)}
                disabled={loading}
              >
                {loading ? "CONNECTING..." : "RETRY CONNECTION"}
              </button>
            </div>
          )}
        </section>

        {/* ERROR MESSAGE */}
        {error && connected && (
          <section className="info">
            <p role="alert">{error}</p>
          </section>
        )}

        {/* SIMULATION CONTROLS */}
        <section className="info">
          <button
            onClick={startSimulation}
            disabled={simulationRunning || !connected}
          >
            START AUTO SIMULATION
          </button>

          <button
            onClick={stopSimulation}
            disabled={!simulationRunning}
          >
            STOP SIMULATION
          </button>

          <p>
            Simulation Status:{" "}
            <strong>
              {simulationRunning ? "RUNNING" : "STOPPED"}
            </strong>
          </p>
        </section>

        {/* DASHBOARD */}
        <h2>Dashboard</h2>

        {loading && !connected ? (
          <section className="info">
            <p>Loading streetlight data...</p>
          </section>
        ) : (
          <div className="cards">
            <div className="card">
              <h3>Total Streetlights</h3>
              <p>{total}</p>
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
              <p>{faulty}</p>
            </div>

            <div className="card">
              <h3>Power Usage</h3>
              <p>{power.toFixed(1)} W</p>
            </div>

            <div className="card">
              <h3>Energy Saved</h3>
              <p>{energySaved.toFixed(4)} kWh</p>
            </div>
          </div>
        )}

        {/* ENERGY SAVING SUMMARY */}
        <section className="info">
          <h2>Energy Saving Summary</h2>

          <div className="cards">
            <div className="card">
              <h3>Baseline Power</h3>
              <p>{baseline.toFixed(1)} W</p>
            </div>

            <div className="card">
              <h3>Current Power</h3>
              <p>{power.toFixed(1)} W</p>
            </div>

            <div className="card">
              <h3>Power Saved</h3>
              <p>{powerSaved.toFixed(1)} W</p>
            </div>
          </div>

          <p>
            Baseline assumes each non-faulty streetlight operates
            at 100% brightness using 45 W.
          </p>
        </section>

        {/* STREETLIGHT MONITORING */}
        <section className="info">
          <h2>Streetlight Monitoring</h2>

          {loading && streetlights.length === 0 ? (
            <p>Loading streetlights...</p>
          ) : streetlights.length === 0 ? (
            <p>
              {connected
                ? "No streetlights found in the database."
                : "Streetlight data is unavailable. Connect to the backend first."}
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Brightness</th>
                    <th>Power</th>
                    <th>Motion</th>
                    <th>Fault</th>
                    <th>Control</th>
                  </tr>
                </thead>

                <tbody>
                  {streetlights.map((light) => (
                    <tr key={light.id}>
                      <td>{light.id}</td>

                      <td>{light.location}</td>

                      <td>{light.status}</td>

                      <td>{light.brightness}%</td>

                      <td>
                        {Number(light.power_usage || 0).toFixed(1)} W
                      </td>

                      <td>
                        {light.motion_detected ? "YES" : "NO"}
                      </td>

                      <td>
                        {light.fault ? "FAULT" : "OK"}
                      </td>

                      <td>
                        <button
                          disabled={!connected}
                          onClick={() =>
                            updateLight(
                              light.id,
                              "ON",
                              Number(light.brightness) === 0
                                ? 100
                                : Number(light.brightness)
                            )
                          }
                        >
                          ON
                        </button>

                        <button
                          disabled={!connected}
                          onClick={() =>
                            updateLight(light.id, "OFF", 0)
                          }
                        >
                          OFF
                        </button>

                        <button
                          disabled={!connected}
                          onClick={() => autoMode(light.id)}
                        >
                          AUTO
                        </button>

                        <button
                          disabled={!connected}
                          onClick={() => simulate(light.id)}
                        >
                          SIMULATE
                        </button>

                        <br />

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Number(light.brightness || 0)}
                          disabled={!connected}
                          aria-label={`Brightness for streetlight ${light.id}`}
                          onChange={(event) =>
                            updateLight(
                              light.id,
                              light.status,
                              Number(event.target.value)
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

        {/* FOOTER */}
        <footer className="info">
          <p>
            Smart Streetlight Energy Conservation System
          </p>
          <p>Intelligent Monitoring | Energy Efficiency | Automation</p>
        </footer>
      </main>
    </div>
  )
}

export default App