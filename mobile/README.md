# MindGuard AI - Mobile Application (React Native & Expo)

Cross-platform mobile application for **AI-Based Mental Health Risk Prediction System**, allowing students and staff to perform self-assessments, view longitudinal trends, and dial 24/7 crisis helplines directly from their smartphones.

---

## 📱 Features

1. **Authentication:** Student registration and secure JWT login with persistent AsyncStorage session caching.
2. **Student Dashboard:** Real-time KPI summaries, latest screening results, and key routine indicators (sleep rhythm and academic pressure).
3. **Interactive Multi-Step Questionnaire:** 4-step mobile assessment wizard with choice chips and progress bar.
4. **Instant Machine Learning Screening Output:** Probability percentage gauge, Low/Moderate/High risk classification, and lifestyle factor attributions.
5. **Assessment History Log:** Filterable log of past assessments with date tags and detailed views.
6. **One-Tap Emergency Crisis Dialing:** Integrated direct phone links (`tel:988`, `tel:14416`, `tel:9152987821`) for immediate, confidential assistance.
7. **Configurable Backend Server:** In-app server URL switcher in Profile to easily connect to your local PC IP, Android Emulator (`10.0.2.2:8000`), or production server.

---

## 🚀 How to Run Mobile App

### 1. Prerequisites
- Node.js (v18+)
- Backend running at `http://localhost:8000` (or local IP)
- Expo Go app on your physical phone (free on Google Play Store and Apple App Store) OR Android Studio / Xcode Simulator

### 2. Install Mobile Dependencies
```bash
cd mobile
npm install
```

### 3. Start Expo Development Server
```bash
npm start
```

### 4. Running on Your Device:
- **Physical Phone (Android/iOS):** Scan the QR code displayed in your terminal using the **Expo Go** app.
- **Android Emulator:** Press `a` in the terminal.
- **iOS Simulator:** Press `i` in the terminal.
- **Web Browser:** Press `w` in the terminal to preview in mobile web mode.

### 5. Connecting to Backend from Physical Phone:
When testing on a physical phone connected to the same Wi-Fi:
1. Find your computer's local IP address (e.g., `ipconfig` on Windows -> look for IPv4, e.g. `192.168.1.15`).
2. In the mobile app, go to **Profile Tab**.
3. Under **Backend Server Connection**, enter `http://192.168.1.15:8000/api/v1` and tap **Update API Endpoint**.
