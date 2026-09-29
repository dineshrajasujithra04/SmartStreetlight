import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const API = "https://smartstreetlight-backend.onrender.com";

function App() {
  const [streetlights, setStreetlights] = useState([]);
  const [energySaved, setEnergySaved] = useState(0);
  const [powerHistory, setPowerHistory] = useState([]);
  const [energyHistory, setEnergyHistory] = useState([]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const simulationRef = useRef(null);
  const lastTime = useRef(Date.now());

  // Load streetlights
  const loadStreetlights = async () => {
    try {
      const res = await fetch(`${API}/streetlights`);
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setStreetlights(data);
    } catch (error) {
      console.error("Backend connection error:", error);
    }
  };

  useEffect(() => {
    loadStreetlights();
  }, []);

  // Dashboard calculations
  const totalLights = streetlights.length;

  const lightsOn = streetlights.filter(
    l => l.status === "ON"
  ).length;

  const lightsOff = streetlights.filter(
    l => l.status === "OFF"
  ).length;

  const faultyLights = streetlights.filter(
    l => l.fault === true
  ).length;

  const powerUsage = streetlights.reduce(
    (sum, l) => sum + Number(l.power_usage || 0),
    0
  );

  const baselinePower =
    streetlights.filter(l => !l.fault).length * 45;

  const powerSaved = Math.max(
    0,
    baselinePower - powerUsage
  );

  // Power history
  useEffect(() => {
    if (!streetlights.length) return;

    const time = new Date().toLocaleTimeString();

    setPowerHistory(prev => [
      ...prev,
      {
        time,
        power: Number(powerUsage.toFixed(1))
      }
    ].slice(-10));
  }, [streetlights]);

  // Energy calculation
  useEffect(() => {
    if (!streetlights.length) return;

    const now = Date.now();
    const hours = (now - lastTime.current) / 3600000;
    lastTime.current = now;

    const saved =
      (powerSaved * hours) / 1000;

    setEnergySaved(prev => prev + saved);

    setEnergyHistory(prev => {
      const previous =
        prev.length ? prev[prev.length - 1].energy : 0;

      return [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          energy: Number(
            (previous + saved).toFixed(6)
          )
        }
      ].slice(-10);
    });
  }, [streetlights]);

  // API action
  const action = async (id, endpoint, options = {}) => {
    try {
      await fetch(
        `${API}/streetlights/${id}${endpoint}`,
        options
      );
      await loadStreetlights();
    } catch (error) {
      console.error("Action error:", error);
    }
  };

  // Manual control
  const updateLight = (id, status, brightness) =>
    action(id, "", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status,
        brightness
      })
    });

  // Automatic simulation
  const startSimulation = () => {
    if (simulationRunning) return;

    setSimulationRunning(true);

    simulationRef.current = setInterval(async () => {
      await Promise.all(
        streetlights.map(light =>
          action(light.id, "/simulate", {
            method: "PUT"
          })
        )
      );

      loadStreetlights();
    }, 5000);
  };

  const stopSimulation = () => {
    clearInterval(simulationRef.current);
    simulationRef.current = null;
    setSimulationRunning(false);
  };

  useEffect(() => {
    return () => clearInterval(simulationRef.current);
  }, []);

  return (
    <div className="app">

      {/* HEADER */}
      <header>
        <h1>Smart Streetlight</h1>
        <p>Energy Conservation & Monitoring System</p>
      </header>

      <main>

        {/* SIMULATION */}
        <div className="simulation-control">
          <button onClick={startSimulation}>
            START AUTO SIMULATION
          </button>

          <button onClick={stopSimulation}>
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

        {/* DASHBOARD */}
        <section className="info">
          <h2>Dashboard</h2>

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

            <div className="card">
              <h3>Power Usage</h3>
              <p>{powerUsage.toFixed(1)} W</p>
            </div>

            <div className="card">
              <h3>Energy Saved</h3>
              <p>{energySaved.toFixed(4)} kWh</p>
            </div>
          </div>
        </section>

        {/* ENERGY SUMMARY */}
        <section className="info">
          <h2>Energy Saving Summary</h2>

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
          </div>

          <p>
            Baseline assumes each non-faulty
            streetlight operates at 100% brightness
            using 45 W.
          </p>
        </section>

        {/* POWER GRAPH */}
        <section className="info">
          <h2>Power Usage Monitoring</h2>

          {powerHistory.length === 0 ? (
            <p>
              Start the simulation to collect
              power usage data.
            </p>
          ) : (
            <div className="chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={powerHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="power"
                    name="Power Usage (W)"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* ENERGY GRAPH */}
        <section className="info">
          <h2>Energy Saved Monitoring</h2>

          {energyHistory.length === 0 ? (
            <p>
              Start the simulation to collect
              energy-saving data.
            </p>
          ) : (
            <div className="chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={energyHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Energy Saved (kWh)"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* STREETLIGHT MONITORING */}
        <section className="info">
          <h2>Streetlight Monitoring</h2>

          {streetlights.length === 0 ? (
            <p>Loading streetlights...</p>
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
                  {streetlights.map(light => (
                    <tr key={light.id}>
                      <td>{light.id}</td>

                      <td>{light.location}</td>

                      <td>{light.status}</td>

                      <td>{light.brightness}%</td>

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
                        <button
                          onClick={() =>
                            updateLight(
                              light.id,
                              "ON",
                              light.brightness || 100
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
                            action(
                              light.id,
                              "/auto",
                              { method: "PUT" }
                            )
                          }
                        >
                          AUTO
                        </button>

                        <button
                          onClick={() =>
                            action(
                              light.id,
                              "/simulate",
                              { method: "PUT" }
                            )
                          }
                        >
                          SIMULATE
                        </button>

                        {light.fault ? (
                          <button
                            onClick={() =>
                              action(
                                light.id,
                                "/repair",
                                { method: "PUT" }
                              )
                            }
                          >
                            REPAIR
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              action(
                                light.id,
                                "/fault",
                                { method: "PUT" }
                              )
                            }
                          >
                            SIMULATE FAULT
                          </button>
                        )}

                        <br />

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={light.brightness}
                          onChange={e =>
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
  );
}

export default App;