# Project File Structure: Smart IoT Poultry Dashboard

This document provides a comprehensive overview of the refactored, feature-based project file structure, detailing the roles and purposes of each directory and file within the codebase (excluding build artifacts and dependencies such as `node_modules`, `.next`, and `.git`).

---

## 🌳 Directory Tree

```
poultry-dashboard/
├── .gitignore
├── AGENT.md
├── components.json
├── FILE_STRUCTURE.md
├── next-env.d.ts
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
│
├── app/                                  # Thin route entry points ONLY
│   ├── globals.css                       # Modern flat design tokens & variables
│   ├── layout.tsx                        # Global app layout & providers
│   ├── loading.tsx                       # Global page fallback loader
│   ├── page.tsx                          # / -> <DashboardPage />
│   ├── about/
│   │   ├── loading.tsx
│   │   └── page.tsx                      # /about -> System architecture & Team
│   ├── api/
│   │   ├── camera-control/
│   │   │   └── route.ts                  # ESP32-CAM control route
│   │   ├── camera-proxy/
│   │   │   └── route.ts                  # Reverse proxy for camera stream
│   │   └── placeholder/
│   │       └── [width]/
│   │           └── [height]/
│   │               └── route.ts          # Placeholder image generator
│   ├── feeding-analytics/
│   │   ├── loading.tsx
│   │   └── page.tsx                      # /feeding-analytics -> <FeedingAnalyticsPage />
│   ├── feeding-schedule/
│   │   └── page.tsx                      # /feeding-schedule -> <FeedingSchedulePage />
│   ├── login/
│   │   └── page.tsx                      # /login -> <LoginPage />
│   ├── manual-controls/
│   │   ├── loading.tsx
│   │   └── page.tsx                      # /manual-controls -> <ManualControlsPage />
│   ├── water-analytics/
│   │   ├── loading.tsx
│   │   └── page.tsx                      # /water-analytics -> <WaterAnalyticsPage />
│   └── water-schedule/
│       └── page.tsx                      # /water-schedule -> <WaterSchedulePage />
│
├── config/                               # Centralized configuration & thresholds
│   ├── alert-thresholds.ts               # Temperature, food, water, and hydration thresholds
│   └── nav-items.ts                      # Navigation menu data & route mappings
│
├── types/                                # Cross-feature global TypeScript definitions
│   └── index.ts
│
├── services/                             # External integrations & backend services
│   ├── firebase/
│   │   ├── client.ts                     # Firebase app & RTDB client initialization
│   │   ├── helpers.ts                    # Test data generators & historical population
│   │   └── debug.ts                      # Firebase diagnostic logger
│   └── microcontroller/
│       └── integration.ts                # Actuator dispatch & telemetry logging
│
├── features/                             # Domain logic grouped by feature
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── camera-feed-card.tsx      # Live stream viewer & IP settings
│   │   │   ├── dashboard-page.tsx        # Composed top-level overview page
│   │   │   ├── farm-status-card.tsx      # Connection & telemetry status summary
│   │   │   ├── historical-chart.tsx      # Dual-axis temperature & humidity line chart
│   │   │   ├── recent-alerts-table.tsx   # Row-based event log and alert history table
│   │   │   └── sensor-card.tsx           # Flat metric card with status pills & progress
│   │   ├── hooks/
│   │   │   ├── use-alerts.ts             # Active alerts & filtered event log hook
│   │   │   ├── use-automation-state.ts   # Automation mode toggle & listener hook
│   │   │   └── use-sensor-data.ts        # Real-time sensor telemetry hook
│   │   └── types.ts                      # Dashboard domain types
│   │
│   ├── feeding/
│   │   ├── components/
│   │   │   ├── feeding-analytics-charts.tsx # Daily/weekly/monthly feed consumption bar chart
│   │   │   ├── feeding-analytics-page.tsx   # Composed feeding analytics page
│   │   │   ├── feeding-control.tsx          # Actuator dispenser, age groups, flock sizing
│   │   │   ├── feeding-schedule-form.tsx    # 24h interactive feeding schedule grid
│   │   │   └── feeding-schedule-page.tsx    # Composed feeding schedule page
│   │   ├── hooks/
│   │   │   └── use-feeding-schedule.ts   # Schedule & settings RTDB hook
│   │   └── types.ts                      # Feeding domain types
│   │
│   ├── water/
│   │   ├── components/
│   │   │   ├── hydration-monitor.tsx     # Broiler intake per bird & hydration index
│   │   │   ├── water-analytics-page.tsx  # Composed water analytics page
│   │   │   ├── water-schedule-form.tsx   # 24h filling schedule, pump calibration & manual fill
│   │   │   ├── water-schedule-page.tsx   # Composed water schedule page
│   │   │   └── water-usage-analytics.tsx # Daily/weekly/monthly water usage bar chart
│   │   ├── hooks/
│   │   │   └── use-water-schedule.ts     # Water schedule & pump settings hook
│   │   └── types.ts                      # Water domain types
│   │
│   ├── manual-controls/
│   │   ├── components/
│   │   │   ├── manual-controls-page.tsx  # Composed manual controls page
│   │   │   └── manual-controls-panel.tsx # Fan, heater, water pump direct relay switches
│   │   ├── hooks/
│   │   │   └── use-manual-controls.ts    # Relay state & automation override hook
│   │   └── types.ts                      # Relay actuator types
│   │
│   └── auth/
│       ├── components/
│       │   ├── login-form.tsx            # Flat login form with password reveal
│       │   └── login-page.tsx            # Composed authentication view
│       └── hooks/
│           └── use-login.ts              # Login state & validation hook
│
├── components/
│   ├── common/                           # Cross-feature shared UI modules
│   │   ├── clock-display.tsx             # Realtime synchronized clock widget
│   │   ├── loading-animation.tsx         # Clean spinner overlay
│   │   ├── logout-button.tsx             # Auth logout trigger button
│   │   ├── navigation-menu.tsx           # Flat desktop sidebar & mobile navigation
│   │   └── theme-toggle.tsx              # Dark/light mode theme toggle
│   └── ui/                               # shadcn UI accessible primitives
│
├── contexts/
│   ├── auth-context.tsx                  # User authentication provider & state
│   └── theme-context.tsx                 # Dark/light mode theme context
│
├── hooks/
│   ├── use-mobile.tsx                    # Responsive breakpoint hook
│   └── use-toast.ts                      # Toast notification hook
│
├── lib/
│   ├── feeding-sched.ts                  # Scheduled feeding algorithms
│   ├── feeding-utils.ts                  # Grams-to-servo calibration helpers
│   ├── utils.ts                          # clsx / twMerge utility helper
│   └── water-utils.ts                    # Hydration requirement conversion formulas
│
└── public/
```
