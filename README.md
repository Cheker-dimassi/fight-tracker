# 🥊 Fight Tracker — Ultimate UFC Data & Analytics App

A full-stack React SPA & Express application built for tracking UFC fighters, events, fight statistics, matchup predictions, and analytics.

---

## 🌟 Key Features

- **Fighter Roster & Profiles**: Browse thousands of UFC fighters with dynamic CSV-derived records, biometrics (height, reach, stance), and skill breakdowns.
- **Matchup Predictor**: Predict fight outcomes between any two fighters using statistical skill weighting, recent performance, and finish method probabilities.
- **Real-Time Analytics Dashboard**: Built with Recharts — dynamic finish method distributions, weight class activity, fights per year trends, and win leaderboards.
- **Event Tracker**: Browse upcoming and historical UFC events with detailed bout cards.
- **Admin Control Room**: Manage custom fighters, override records/biometrics, and monitor roster health.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router 6 (SPA), TypeScript, TailwindCSS v3, Recharts, Lucide Icons
- **Backend**: Express API, Vite Integration (Dev & SSR Build)
- **Data Engine**: Dynamic CSV Parser (`ufc_fight_history.csv` & `ufc_fighter_stats.csv`)

---

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/Cheker-dimassi/fight-tracker.git
cd fight-tracker

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) to view the app in the browser.

### Type Checking & Testing

```bash
npm run typecheck
npm run test
```

### Production Build

```bash
npm run build
npm run start
```
