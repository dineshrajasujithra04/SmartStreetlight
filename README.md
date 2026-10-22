# 💡 Smart Streetlight Energy Conservation System

An intelligent streetlight monitoring and energy conservation system built using React, FastAPI, and SQLite. The system monitors streetlight status, brightness, power consumption, motion detection, and faults through an interactive dashboard.

## 🚀 Project Overview

The Smart Streetlight Energy Conservation System is designed to improve energy efficiency through intelligent streetlight monitoring and simulation.

The dashboard provides real-time data retrieval from the backend, streetlight controls, automatic simulation, and energy-saving calculations.

## ✨ Features

* **Interactive Dashboard** – Displays total streetlights, lights ON/OFF, faulty lights, power usage, and energy saved.
* **Streetlight Monitoring** – Displays individual streetlight information, including location, status, brightness, and power consumption.
* **Brightness Control** – Adjusts streetlight brightness from 0% to 100%.
* **ON/OFF Control** – Allows individual streetlights to be switched ON or OFF.
* **Automatic Mode** – Provides an automatic operating mode when supported by the backend.
* **Simulation** – Simulates streetlight behaviour and updates the dashboard.
* **Motion Detection Monitoring** – Displays motion detection status for each streetlight.
* **Fault Monitoring** – Identifies streetlights marked as faulty.
* **Energy Conservation Analysis** – Calculates baseline power, current power usage, and estimated power savings.
* **Automatic Simulation** – Updates streetlight simulation at regular intervals.
* **Backend Connection Status** – Displays the connection status between the frontend and backend.

## 🛠️ Technologies Used

### Frontend

* React.js
* Vite
* JavaScript
* HTML5
* CSS3

### Backend

* Python
* FastAPI
* Uvicorn
* SQLAlchemy

### Database

* SQLite

### Tools

* Visual Studio Code
* Git
* GitHub
* Web Browser

## 📂 Project Structure

```text
SmartStreetlight/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
│
├── .gitignore
└── README.md
```

*Note: The exact files and folders may vary depending on your project configuration.*

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the project:

* Python
* Node.js and npm
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/dineshrajasujithra04/SmartStreetlight.git
```

Navigate to the project directory:

```bash
cd SmartStreetlight
```

### 2. Start the Backend

Open a terminal and navigate to the backend folder:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the environment on Windows:

```cmd
venv\Scripts\activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
python -m uvicorn main:app --reload
```

The backend will run at:

`http://127.0.0.1:8000`

Open the API documentation:

`http://127.0.0.1:8000/docs`

### 3. Start the Frontend

Open a second terminal and navigate to the frontend directory from the project root:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually:

`http://localhost:5173`

## 🔌 API Endpoints

The frontend communicates with the FastAPI backend through the following endpoints.

| Method | Endpoint                      | Purpose                                        |
| ------ | ----------------------------- | ---------------------------------------------- |
| GET    | `/`                           | Backend root endpoint, if configured           |
| GET    | `/streetlights`               | Retrieve streetlight records                   |
| POST   | `/streetlights`               | Create a streetlight record                    |
| PUT    | `/streetlights/{id}`          | Update a streetlight                           |
| PUT    | `/streetlights/{id}/auto`     | Automatic mode, if implemented                 |
| PUT    | `/streetlights/{id}/simulate` | Simulate streetlight behaviour, if implemented |

The availability of individual endpoints depends on the backend implementation.

## ⚡ Energy Conservation Logic

The dashboard uses a baseline power assumption of **45 watts per non-faulty streetlight operating at 100% brightness**.

* **Baseline Power:** Number of non-faulty streetlights × 45 W.
* **Current Power:** Sum of the power usage reported by all streetlights.
* **Power Saved:** Maximum of zero and the difference between baseline power and current power.
* **Energy Saved:** Estimated energy savings accumulated over time, expressed in kilowatt-hours (kWh).

These values are estimates based on the configured assumptions and reported backend data. They are not measurements from physical streetlight hardware.

## 🖥️ How It Works

1. The React frontend requests streetlight data from the FastAPI backend.
2. The backend retrieves streetlight records from the SQLite database.
3. The dashboard displays streetlight status, brightness, motion detection, faults, and power usage.
4. Users can control individual streetlights through the dashboard.
5. Simulation endpoints update streetlight behaviour when supported by the backend.
6. The application calculates estimated power savings based on the configured baseline.

## 🔮 Future Enhancements

* Integration with physical IoT streetlight hardware.
* Real-time motion sensors and ambient light sensors.
* Intelligent brightness adjustment based on surrounding conditions.
* Advanced energy consumption analytics.
* Historical reports and data visualisation.
* Notifications for faulty streetlights.
* Cloud database integration.
* Mobile-friendly monitoring and control.

## 👩‍💻 Author

**Sujithra Dineshraja**

GitHub: [dineshrajasujithra04](https://github.com/dineshrajasujithra04)

## 📄 License

This project is intended for educational and demonstration purposes. Add an appropriate open-source license if you intend to distribute it under specific reuse terms.
