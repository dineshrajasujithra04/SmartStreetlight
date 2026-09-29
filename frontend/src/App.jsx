import { useEffect, useRef, useState } from "react"

const API = "https://smartstreetlight-backend.onrender.com"

function App() {
  const [streetlights, setStreetlights] = useState([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState("")
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [energySaved, setEnergySaved] = useState(0)
  const simulationRef = useRef(null)
  const lastTime = useRef(Date.now())

  // ---------------- LOAD DATA ----------------
  const loadStreetlights = async () => {
    try {
      const response = await fetch(`${API}/streetlights`)

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const data = await response.json()

      setStreetlights(Array.isArray(data) ? data : [])
      setConnected(true)
      setError("")
    } catch (err) {
      console.error(err)
      setConnected(false)
      setError("Backend is not connected. Please check the Render backend.")
    }
  }

  useEffect(() => {
    loadStreetlights()
  }, [])

  // ---------------- UPDATE LIGHT ----------------
  const updateLight = async (id, status, brightness) => {
    try {
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
        throw new Error("Update failed")
      }

      await loadStreetlights()
    } catch (err) {
      console.error(err)
      setError("Unable to update streetlight.")
    }
  }

  // ---------------- AUTO MODE ----------------
  const autoMode = async (id) => {
    try {
      const response = await fetch(`${API}/streetlights/${id}/auto`, {
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error("Auto mode failed")
      }

      await loadStreetlights()
    } catch (err) {
      console.error(err)
      setError("Auto mode is not available.")
    }
  }

  // ---------------- SIMULATE ----------------
  const simulate = async (id) => {
    try {
      const response = await fetch(`${API}/streetlights/${id}/simulate`, {
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error("Simulation failed")
      }

      await loadStreetlights()
    } catch (err) {
      console.error(err)
      setError("Simulation failed.")
    }
  }

  // ---------------- AUTO SIMULATION ----------------
  const startSimulation = () => {
    if (simulationRunning) return

    setSimulationRunning(true)

    simulationRef.current = setInterval(async () => {
      try {
        const currentLights = [...streetlights]

        await Promise.all(
          currentLights.map((light) =>
            fetch(`${API}/streetlights/${light.id}/simulate`, {
              method: "PUT",
            })
          )
        )

        await loadStreetlights()
      } catch (err) {
        console.error(err)
      }
    }, 5000)
  }

  const stopSimulation = () => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current)
      simulationRef.current = null
    }

    setSimulationRunning(false)
  }

  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }
    }
  }, [])

  // ---------------- ENERGY CALCULATION ----------------
  useEffect(() => {
    if (streetlights.length === 0) return

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

    setEnergySaved((old) => old + (saved * hours) / 1000)
  }, [streetlights])

  // ---------------- DASHBOARD ----------------
  const total = streetlights.length

  const lightsOn = streetlights.filter(
    (light) => light.status === "ON"
  ).length

  const lightsOff = streetlights.filter(
    (light) => light.status === "OFF"
  ).length

  const faulty = streetlights.filter(
    (light) => light.fault === true
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

        {/* CONNECTION */}
        <section className="info">
          {connected ? (
            <p>
              🟢 <strong>Backend Connected</strong>
            </p>
          ) : (
            <>
              <h2>Backend Connection Error</h2>
              <p>{error}</p>

              <button onClick={loadStreetlights}>
                RETRY CONNECTION
              </button>
            </>
          )}
        </section>

        {/* SIMULATION */}
        <section className="info">
          <button onClick={startSimulation}>
            START AUTO SIMULATION
          </button>

          <button onClick={stopSimulation}>
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

        {/* ENERGY */}
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
            Baseline assumes each non-faulty streetlight
            operates at 100% brightness using 45 W.
          </p>

        </section>

        {/* STREETLIGHTS */}
        <section className="info">

          <h2>Streetlight Monitoring</h2>

          {streetlights.length === 0 ? (
            <p>No streetlights found.</p>
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
                        {light.power_usage} W
                      </td>

                      <td>
                        {light.motion_detected ? "YES" : "NO"}
                      </td>

                      <td>
                        {light.fault ? "FAULT" : "OK"}
                      </td>

                      <td>

                        <button
                          onClick={() =>
                            updateLight(
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

                        <button
                          onClick={() =>
                            updateLight(
                              light.id,
                              "OFF",
                              0
                            )
                          }
                        >
                          OFF
                        </button>

                        <button
                          onClick={() =>
                            autoMode(light.id)
                          }
                        >
                          AUTO
                        </button>

                        <button
                          onClick={() =>
                            simulate(light.id)
                          }
                        >
                          SIMULATE
                        </button>

                        <br />

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={light.brightness}
                          onChange={(e) =>
                            updateLight(
                              light.id,
                              light.status,
                              Number(e.target.value)
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