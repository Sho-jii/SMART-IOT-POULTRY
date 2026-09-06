# 🐔 Smart IoT Poultry Farming System (SIPFS) Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-RTDB-FFA611?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![ESP32](https://img.shields.io/badge/Microcontroller-ESP32%20%7C%20ESP32--CAM-red?style=flat-square&logo=espressif)](https://www.espressif.com/)

> 🎓 **Academic Prototype Notice**  
> This project was conceptualized, architected, and developed as a **student prototype** for the 2nd Year collegiate course **Integrative Programming 1**. It demonstrates a working Proof-of-Concept (PoC) for IoT-driven poultry automation, telemetry synchronization, and tele-operation.

An agro-industrial Internet of Things (IoT) monitoring and automation prototype dashboard built for modern broiler poultry farming. SIPFS integrates hardware telemetry from ESP32 microcontrollers, live video streaming from an ESP32-CAM, precision stage-calibrated feed dispensing, water reservoir regulation, and Firebase Realtime Database synchronization into a responsive web application.

---

## 🌟 Key Features

### 1. 📊 Real-Time Environmental & Telemetry Monitoring
- **Climate Conditions**: Sub-second synchronization of ambient coop temperature (°C) and relative humidity (%).
- **Hopper & Reservoir Capacities**: Ultrasonic and capacitive level tracking for the feed hopper, main water tank, and drinker water lines.
- **Microcontroller Telemetry Heartbeat**: Live connection status, firmware sync indicators, and operational metrics.

### 2. 📹 Live Video Stream & Camera Proxy
- **ESP32-CAM Stream Viewer**: Low-latency video surveillance of the coop interior.
- **HTTPS Reverse Proxy**: Integrated `/api/camera-proxy` endpoint to eliminate mixed-content SSL blocks when deployed in secure production environments.
- **Configurable Settings**: In-app camera IP and port configuration with manual stream refresh.

### 3. 🌽 Precision Stage-Based Feeding Management
- **Growth Stage Calculations**: Automatic daily consumption recommendations based on flock size and age groups:
  - *Chicks (0–8 weeks)*: 50g / bird / day
  - *Growers (8–20 weeks)*: 100g / bird / day
  - *Adults (20+ weeks)*: 150g / bird / day
- **Servo Motor Calibration**: Precise dispensing duration calculation (0.02s per gram / 50g per second).
- **24-Hour Interactive Schedule**: Multi-slot scheduled feeding automation with manual single-click dispensing overrides.
- **Historical Consumption Analytics**: Interactive daily, weekly, and monthly feed usage charts.

### 4. 💧 Hydration & Water Reservoir Automation
- **Automated Refilling**: Scheduled water pump cycles based on drinker line capacity and reservoir levels.
- **Hydration Index Tracking**: Real-time intake estimation per bird with low-hydration warning alarms.
- **Historical Water Analytics**: Usage trends across customizable time intervals (day, week, month).

### 5. ⚡ Manual Relay Tele-Operation & Actuator Controls
- **Direct Hardware Overrides**: Toggle exhaust fans, heating elements, and water pump relays with active-low ESP32 mapping.
- **Automation Interlock**: Auto/Manual mode switching to safeguard automated scheduling during manual maintenance.

### 6. 🚨 Proactive Alert Engine & Event Logging
- **Threshold Detection**: Instant alerts for extreme temperatures, critical feed depletion, low water reserves, and hydration deficits.
- **Filterable Event Table**: Real-time event log with severity filtering (Critical, Warning, Info) and resolution timestamps.

### 7. 🎨 Modern, Restrained Design System
- **Clean Aesthetic**: Modern flat surfaces (`--surface`, `--surface-muted`), hairline borders, and agricultural green accent (`#277844`).
- **Responsive Navigation**: Desktop sidebar and mobile drawer navigation.
- **Adaptive Day/Night Theme Engine**: Automatic time-of-day theme switching with manual toggle and anti-FOUC pre-render script.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   Broiler Coop Edge    │
                                  ├────────────────────────┤
                                  │ • DHT11 Sensor         │
                                  │ • Ultrasonic Sensor    │
                                  │ • Water Level Sensors  │
                                  │ • Relays & Servo Motor │
                                  └───────────┬────────────┘
                                              │ (WiFi / HTTP)
                                              ▼
┌────────────────────────┐         ┌────────────────────────┐
│  ESP32-CAM Live Video  │         │    ESP32 Dual-Core     │
│   Coop Surveillance    │         │      Main Node         │
└───────────┬────────────┘         └───────────┬────────────┘
            │                                  │
            │ (MJPEG Stream)                   │ (Realtime Sync)
            ▼                                  ▼
┌───────────────────────────────────────────────────────────┐
│              Firebase Realtime Database (RTDB)             │
│   • /sensors    • /controls    • /deviceStates            │
│   • /alerts     • /events      • /feedingSchedule         │
└───────────────────────────┬───────────────────────────────┘
                            │ (WebSocket Listeners)
                            ▼
┌───────────────────────────────────────────────────────────┐
│            SIPFS Next.js 15 Web Application               │
│                                                           │
│  [Overview]        [Feeding]          [Water & Hydration] │
│  • Climate Gauges  • Stage Formulas   • Reservoir Monitor │
│  • Camera Viewer   • 24h Schedule     • Auto Pump Cycle   │
│  • Alerts Table    • Analytics Chart  • Usage Logs        │
│                                                           │
│  [Manual Controls] [Auth / Gate]      [About & Specs]     │
│  • Relay Switches  • Session Guard    • System Arch       │
└───────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
smart-poultry-dashboard/
├── .env.example              # Environment variables template
├── FILE_STRUCTURE.md         # Detailed architectural breakdown
├── package.json              # Project dependencies & scripts
├── tailwind.config.ts        # Tailwind CSS design system tokens
│
├── app/                      # Next.js 15 Thin Route Handlers
│   ├── globals.css           # Flat design CSS variables & reset
│   ├── layout.tsx            # Root layout & providers
│   ├── page.tsx              # / -> Overview Dashboard
│   ├── feeding-analytics/    # /feeding-analytics -> Feed Analytics
│   ├── feeding-schedule/     # /feeding-schedule -> Feed Scheduler
│   ├── water-analytics/      # /water-analytics -> Water Analytics
│   ├── water-schedule/       # /water-schedule -> Water Scheduler
│   ├── manual-controls/      # /manual-controls -> Hardware Relays
│   ├── login/                # /login -> Operator Authentication
│   ├── about/                # /about -> Technical Specs & Team
│   └── api/                  # API Routes (camera proxy & placeholder)
│
├── config/                   # Centralized Configuration
│   ├── alert-thresholds.ts   # System temperature, food, and water limits
│   └── nav-items.ts          # Navigation sidebar configuration
│
├── features/                 # Domain Modules
│   ├── auth/                 # Authentication hooks & components
│   ├── dashboard/            # Overview telemetry, charts, and camera
│   ├── feeding/              # Dispenser controls, schedule & analytics
│   ├── manual-controls/      # Relay switches & automation overrides
│   └── water/                # Hydration tracking, pump schedule & logs
│
├── services/                 # External Services Layer
│   ├── firebase/             # RTDB client, helpers, and debug loggers
│   └── microcontroller/      # Actuator dispatch & hardware protocol
│
├── components/
│   ├── common/               # Shared widgets (Clock, Nav, ThemeToggle)
│   └── ui/                   # shadcn UI primitives
│
├── contexts/                 # React Context Providers (Auth, Theme)
├── hooks/                    # Reusable utility hooks
├── lib/                      # Pure computation & math formulas
└── types/                    # Shared TypeScript interfaces
```

For complete details on each individual file, see [FILE_STRUCTURE.md](./FILE_STRUCTURE.md).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.18.0` or higher (Node.js 20+ recommended)
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **Firebase Project**: A Firebase Realtime Database instance

### 1. Clone the Repository
```bash
git clone https://github.com/Sho-jii/SMART-IOT-POULTRY.git
cd SMART-IOT-POULTRY
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file by copying the template:
```bash
cp .env.example .env.local
```

Open `.env.local` and populate your Firebase and Operator credentials:
```env
# Firebase Realtime Database Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your_api_key
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Operator Portal Credentials
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Required | Example |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key | Yes | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Firebase Realtime Database endpoint | Yes | `https://my-app.firebaseio.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project identifier | Yes | `my-smart-poultry` |
| `NEXT_PUBLIC_ADMIN_USERNAME` | Login username for operator portal | Yes | `admin` |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Login password for operator portal | Yes | `admin123` |

---

## 📡 Firebase RTDB Data Schema

```json
{
  "sensors": {
    "temperature": 28.5,
    "humidity": 65.2,
    "foodLevel": 78,
    "waterLevel": 85,
    "drinkerWaterLevel": 90,
    "timestamp": 1718000000
  },
  "controls": {
    "fan": 1,
    "heater": 0,
    "waterPump": 0,
    "feedDispenser": 0
  },
  "deviceStates": {
    "automationMode": true,
    "lastSync": 1718000000
  },
  "feedingSchedule": {
    "slots": [
      { "hour": 6, "minute": 0, "enabled": true, "grams": 250 },
      { "hour": 14, "minute": 0, "enabled": true, "grams": 250 },
      { "hour": 18, "minute": 0, "enabled": true, "grams": 250 }
    ],
    "flockCount": 50,
    "ageGroup": "grower"
  },
  "waterSchedule": {
    "slots": [
      { "hour": 8, "minute": 0, "enabled": true, "durationSeconds": 30 },
      { "hour": 16, "minute": 0, "enabled": true, "durationSeconds": 30 }
    ]
  },
  "alerts": {
    "current": {
      "type": "temp_high",
      "message": "Temperature exceeded 32°C",
      "timestamp": 1718000000,
      "severity": "critical"
    }
  }
}
```

---

## 👥 Engineering & Research Team

| Member | Role | Key Contributions |
| :--- | :--- | :--- |
| **Jarib Sioco** | Lead Software & Web Engineer | Web frontend architecture, Next.js 15 UI, Firebase RTDB sync, camera proxy integration |
| **Ralf Carlo Legaspi** | Hardware & IoT Systems Engineer | ESP32 firmware, sensor telemetry, relay driver circuits, ESP32-CAM video streaming |
| **Grace Melody Manalo** | System Analyst & Research Documentation | Poultry health metrics, broiler growth formulas, system testing & evaluation methodologies |
| **Monica Bacay** | Product Analyst & Quality Assurance | Functional specifications, usability testing, operational safety analysis |

---

## 📄 Academic Project Context & License

This project was developed strictly for academic, educational, and research purposes as a course requirement for **Integrative Programming 1 (2nd Year)**. It is an experimental **prototype / proof-of-concept** and is not intended for commercial production deployment without further hardware industrialization and security hardening.
