# AirBox Remote Control

A modern, responsive web interface for controlling ESP32-based relay systems with advanced automation features. Built with React, TypeScript, and Vite.

> 💡 **Live Demo** - Try it at: [https://rubtatex.github.io/airbox-remote-control](https://rubtatex.github.io/airbox-remote-control)

## ✨ Features

### Relay Control
- **4-Relay Management** - Individual control of each relay
- **Smart Device Types** - Configure relays as pumps or valves
- **Valve Logic** - Support for Normally Open (NO) and Normally Closed (NC) valves
- **Real-time State** - Live relay status updates every 2 seconds
- **Custom Names** - Personalize relay labels
- **Enable/Disable** - Show or hide relays from the dashboard

### Advanced Automation
- **Multi-Step Programs** - Create complex automation sequences
- **Relay Actions** - Control any relay (ON/OFF) with automatic NC/NO logic
- **Wait Functions** - Add delays with fixed or random durations
- **Loop Support** - Create repeating sequences with configurable iterations
- **Drag-and-Drop Editor** - Reorder steps intuitively
- **Loop Management** - Edit loop iterations and internal steps easily
- **Program Import/Export** - Save and share programs via JSON files
- **GitHub Import** - Load programs directly from GitHub URLs
- **Visual Program Editor** - Intuitive step-by-step program creation
- **Modal Configuration** - Configure relay, wait, and loop settings via pop-up forms
- **Live Execution** - Real-time program status with countdown timers
- **Single Program Execution** - Only one program runs at a time

### Safety & Control
- **Emergency Stop** - Instantly stop all programs and set all relays to OFF
- **Always-visible E-Stop** - Red emergency button in the header
- **Immediate Feedback** - UI reflects emergency stop instantly
- **Session Safety** - Programs automatically cancel on page refresh

### User Interface
- **Bilingual** - Full French and English support
- **Responsive Design** - Optimized for mobile and desktop
- **Dark Theme** - Modern dark UI with subtle animations
- **Action History** - Track all relay operations with timestamps
- **WiFi Management** - Configure ESP32 WiFi settings
- **Easy Onboarding** - Simple initial setup wizard

### Technical Features
- **Local Storage** - All settings saved in browser
- **API Integration** - RESTful communication with ESP32
- **Type Safety** - Full TypeScript implementation
- **Real-time Updates** - WebSocket-ready architecture
- **Offline First** - Program editing works offline

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **ESP32** with AirBox firmware
- **Modern Browser** (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/rubtatex/airbox-remote-control.git
   cd airbox-remote-control
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## 📦 Project Structure

```
airbox-remote-control/
├── src/
│   ├── App.tsx                      # Main application
│   ├── App.css                      # Global styles
│   ├── i18n.tsx                     # Translation system
│   ├── pages/
│   │   ├── Onboarding.tsx           # Initial ESP32 setup
│   │   ├── Dashboard.tsx            # Main control interface
│   │   ├── Schedule.tsx             # Program editor
│   │   ├── ActionHistory.tsx        # Action logs
│   │   └── Settings.tsx             # Configuration
│   ├── components/
│   │   ├── RelayCard.tsx            # Relay control card
│   │   ├── ProgramCard.tsx          # Program status card
│   │   ├── WiFiStatus.tsx           # WiFi indicator
│   │   └── LanguageSwitcher.tsx     # Language selector
│   ├── services/
│   │   └── api.ts                   # ESP32 API client
│   └── styles/                      # Component styles
├── public/                          # Static assets
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript config
└── package.json                     # Dependencies
```

## 🎮 Usage Guide

### Initial Setup

1. **Launch the app** - Access via browser
2. **Enter ESP32 IP** - Use `192.168.4.1` for AP mode or your network IP
3. **Connect** - App will verify connection
4. **Start controlling** - Dashboard loads automatically

### Dashboard

#### Relay Cards
- **Click to toggle** - Turn relays ON/OFF
- **Color coding**:
  - 🟢 Green - Active/Open
  - ⚫ Gray - Inactive
  - 🔴 Red - Closed (NO valves)
- **Status display**:
  - Pumps: "ACTIVE" / "INACTIVE"
  - Valves: "OPEN" / "CLOSED" (automatic NC/NO logic)

#### Program Cards
- **Click to start** - Launch program execution
- **Running state** shows:
  - ⏱️ Time remaining until next action
  - 🎯 Next action description
- **Disabled state** - Grayed out when another program runs

#### Emergency Stop
- **Red button** in top toolbar
- **Always visible** - Use anytime to reset system
- **Instant action** - Stops programs + sets all relays OFF

### Program Creation

1. **Go to Schedule page** via bottom navigation
2. **Click "Add Program"** - Choose import method:
   - **Import from JSON file** - Upload existing program
   - **Import from GitHub** - Paste GitHub raw file URL
   - **Create manually** - Build step-by-step
3. **Quick Add Buttons** - In the Program Steps section:
   - **+ Relay Control** - Opens modal to configure a relay action (select relay and action)
   - **+ Wait** - Opens modal to configure a wait duration (fixed or random)
   - **+ Create a loop** - Opens modal to select steps and set iterations
4. **Manage Steps**:
   - **Drag handles** - Reorder steps by dragging
   - **Edit loops** - Click the edit icon to modify loop iterations and internal steps
   - **Delete steps** - Click trash icon to remove
5. **Save program** - Automatically stored
6. **Enable program** - Toggle to show on dashboard

#### Step Configuration Modals

**Relay Control Modal**
- Select which relay (Pump 1, 2, 3, 4...)
- Choose action (Activate/Deactivate or Open/Close based on relay type)
- Save or cancel

**Wait Modal**
- Choose duration type: Fixed or Random
- **Fixed**: Enter duration in seconds
- **Random**: Enter minimum and maximum duration in seconds
- Save or cancel

**Create Loop Modal**
- View all existing program steps
- Select which steps to include in the loop using checkboxes
- Configure number of iterations (1-100)
- Save or cancel

#### Loop Editing

Once a loop is created:
1. **Click edit icon** on the loop step
2. **Loop editor modal opens** with:
   - Iterations setting (modifiable)
   - List of steps inside the loop
   - **+ Relay Control** - Add relay step to loop
   - **+ Wait** - Add wait step to loop
   - **+ Loop** - Add nested loop to loop
   - Drag handles to reorder steps inside loop
   - Extract button (↗) to remove step from loop
   - Delete button (🗑) to remove step from loop
3. **Save changes** to update the loop

#### Program JSON Format

```json
{
  "id": "unique-id",
  "name": "My Program",
  "enabled": true,
  "steps": [
    {
      "id": "step-1",
      "type": "relay",
      "relay": 0,
      "action": "ON"
    },
    {
      "id": "step-2",
      "type": "wait",
      "durationType": "fixed",
      "duration": 30
    },
    {
      "id": "step-3",
      "type": "wait",
      "durationType": "random",
      "durationMin": 10,
      "durationMax": 20
    }
  ]
}
```

### Settings Configuration

#### Relay Configuration
- **Name** - Custom label (e.g., "Water Pump", "Valve 1")
- **Type** - Pump or Valve
- **Valve Mode** - NO (Normally Open) or NC (Normally Closed)
- **Enabled** - Show/hide from dashboard

#### WiFi Management
- **Current Status** - SSID, IP, signal strength
- **Configure Network** - Set new SSID/password
- **Reset to AP Mode** - Return to factory WiFi settings

#### System
- **Reset Configuration** - Clear all app settings
- **Language** - Switch between French/English

### Action History

- **View all actions** - Chronological list with timestamps
- **Filter by relay** - See specific relay activity
- **Clear history** - Remove old entries

## 🌐 Deployment

### GitHub Pages (Automated)

1. **Fork/Clone repository** to your GitHub account
   
2. **Update `package.json`**
   ```json
   {
     "homepage": "https://yourusername.github.io/airbox-remote-control"
   }
   ```

3. **Enable GitHub Pages**
   - Repository Settings → Pages
   - Source: **GitHub Actions**

4. **Push to main** - Automatic deployment via workflow

### Manual Deployment

```bash
npm run build
npm run deploy
```

### Self-Hosting

Build and serve the `dist/` folder with any static file server:

```bash
npm run build
# Copy dist/ to your server
```

## 🔌 ESP32 API Endpoints

The application uses these REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/state` | Get all relay states |
| POST | `/relay/set` | Set single relay state |
| GET | `/relay/multi` | Control multiple relays |
| GET | `/wifi/status` | Get WiFi status |
| POST | `/wifi/config` | Configure WiFi settings |
| POST | `/wifi/reset` | Reset to AP mode |

### Expected API Responses

**GET /state**
```json
{
  "in1": 0,
  "in2": 1,
  "in3": 0,
  "in4": 1
}
```

**POST /relay/set**
```json
{
  "relay": 0,
  "state": 1
}
```

**GET /wifi/status**
```json
{
  "connected": 1,
  "ssid": "MyNetwork",
  "ip": "192.168.1.100",
  "rssi": -45
}
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run preview   # Preview production build
npm run deploy    # Deploy to GitHub Pages
```

### Tech Stack

- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool
- **Axios** - HTTP client
- **Lucide React** - Icons
- **CSS Variables** - Theming

## 🎨 Customization

### Color Scheme

Edit `src/App.css`:

```css
:root {
  --primary: #4db8ff;          /* Primary blue */
  --primary-dark: #2d8bb8;     /* Dark blue */
  --success: #4caf50;          /* Green */
  --danger: #ff6b6b;           /* Red */
  --warning: #ff9800;          /* Orange */
  --background: #0f0f0f;       /* Dark background */
  --surface: #1a1a1a;          /* Card background */
  --surface-light: #2d2d2d;    /* Lighter surface */
  --border: #333;              /* Border color */
  --text: #e0e0e0;             /* Text color */
  --text-secondary: #999;      /* Muted text */
}
```

### Adding Translations

Edit `src/i18n.tsx` - add new keys to both `fr` and `en` objects.

## 🐛 Troubleshooting

### Connection Issues

**"Unable to connect to ESP32"**
- ✅ Verify ESP32 is powered on
- ✅ Check IP address is correct
- ✅ Ensure HTTP port 80 is accessible
- ✅ Try accessing `http://<ip>/state` directly

**"CORS Error"**
- ESP32 must send proper CORS headers
- Test endpoint in browser first

### Program Issues

**Programs not appearing on dashboard**
- ✅ Check program is enabled in Schedule page
- ✅ Verify program has at least one step
- ✅ Refresh localStorage if needed

**Emergency stop not working**
- ✅ Check network connectivity
- ✅ Verify `/relay/set` endpoint responds
- ✅ Try manual relay control first

### Storage Issues

**Settings not persisting**
- ✅ Check browser allows localStorage
- ✅ Clear cache and try again
- ✅ Check browser console for errors

## 📱 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Security Notes

- All communication is local (no cloud)
- ESP32 should be on trusted network
- Consider HTTPS for production use
- No authentication implemented (add if needed)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open issues or pull requests.

---

**AirBox Control** - Professional ESP32 relay automation 🚀⚡
