# iTitans POS App

A React Native (Expo) POS (Point of Sale) application with offline-first architecture using PowerSync for real-time data synchronization with KHUB backend.

## Features

### POS System
- **Multi POS Lines**: Support for multiple concurrent POS terminals
- **Clock In/Out**: Employee time tracking with PIN authentication
- **Thermal Printing**: Receipt printing via Ethernet/USB/Bluetooth
- **Print Queue**: Prevents app freezing with sequential print job processing
- **Role-Based Access**: Admin, Manager, Cashier, Supervisor roles

### Offline-First Architecture
- **Offline-First**: Works without internet, syncs when connected
- **Real-time Sync**: Changes sync instantly across devices via PostgreSQL WAL
- **Two-way Sync**: Local changes automatically sync to backend
- **Self-Hosted PowerSync**: Docker-based local deployment

## Tech Stack

- React Native (Expo) with Expo Router
- TypeScript
- NativeWind (Tailwind CSS)
- PowerSync (self-hosted)
- KHUB Backend (Flask + PostgreSQL)

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Android device/emulator or iOS Simulator

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp env.example .env.local
```

Edit `.env.local`:
```bash
EXPO_PUBLIC_KHUB_API_URL=http://YOUR_IP:5002
EXPO_PUBLIC_POWERSYNC_URL=http://YOUR_IP:8080
```

### 3. Start PowerSync Service

```bash
cd powersync
cp env.example .env
# Edit .env with your KHUB database credentials
docker-compose up -d
```

### 4. Run the App

```bash
# Development build (required for native modules)
npx expo run:android
npx expo run:ios

# Or start dev server
npx expo start --dev-client
```

## Project Structure

```
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Dashboard / Home
│   ├── login.tsx                 # Login screen
│   ├── pos-line.tsx              # POS sales interface
│   ├── test-sync.tsx             # PowerSync test page
│   ├── catalog/                  # Product catalog screens
│   ├── inventory/                # Stock management screens
│   ├── sale/                     # Sales related screens
│   └── order/                    # Order flow screens
├── components/                   # Reusable UI components
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx           # Authentication state
│   ├── ClockContext.tsx          # Clock in/out state
│   └── OrderContext.tsx          # Order state management
├── utils/
│   ├── api/                      # KHUB API utilities
│   ├── PrintQueue.ts             # Print queue management
│   └── powersync/                # PowerSync integration
│       ├── PowerSyncProvider.tsx
│       ├── KhubConnector.ts
│       ├── useSyncStream.ts
│       └── schema.ts
└── powersync/                    # Self-hosted PowerSync config
    ├── docker-compose.yaml
    ├── config.yaml
    ├── sync_rules.yaml
    └── .env
```

## PowerSync Configuration

### Environment Variables (powersync/.env)

```bash
# KHUB PostgreSQL Database
PS_KHUB_DB_HOST=host.docker.internal  # or your host IP
PS_KHUB_DB_PORT=5434
PS_KHUB_DB_NAME=your_database_name
PS_KHUB_DB_USER=your_username
PS_KHUB_DB_PASSWORD=your_password

# JWT Secret (base64 encoded, must match KHUB's JWT_SECRET_KEY)
# Generate: echo -n "YOUR_JWT_SECRET" | base64
PS_JWT_SECRET_BASE64=your_base64_encoded_jwt_secret
```

### Sync Rules (powersync/sync_rules.yaml)

Defines which tables to sync:
```yaml
streams:
  products:
    auto_subscribe: true
    query: "SELECT id, name, sku, ... FROM products"
  
  customers:
    auto_subscribe: true
    query: "SELECT id, name, email, ... FROM customers"
  
  tenant_users:
    auto_subscribe: true
    query: "SELECT id, first_name, last_name, ... FROM tenant_users"

config:
  edition: 2
```

## Useful Commands

```bash
# Start PowerSync
cd powersync && docker-compose up -d

# View PowerSync logs
cd powersync && docker-compose logs -f powersync

# Run app on Android
npx expo run:android

# Start Metro for Android Dev Client with localhost + adb reverse
npm run start:android-local

# Build APK
cd android && ./gradlew assembleRelease
```

## Troubleshooting

### PowerSync JWT errors
- Ensure KHUB backend has JWT audience configured for PowerSync
- Re-login in app to get new token after config changes

### PowerSync can't connect to PostgreSQL
- Check `PS_KHUB_DB_HOST` - use `host.docker.internal` on Mac/Windows
- Ensure PostgreSQL has logical replication enabled
- Check firewall allows the database port

### Sync not working
- Check PowerSync logs: `docker-compose logs -f powersync`
- Verify tables are in `sync_rules.yaml`
- Ensure schema matches between PowerSync and app

### Android emulator stuck on Metro loading
- Run `npm run start:android-local` to force localhost mode with adb reverse
- This avoids stale LAN IPs (for example `192.168.x.x`) cached by Dev Client

### Data not persisting after restart
- Use `docker-compose down` (NOT `docker-compose down -v`)
- `-v` flag deletes volumes including database data

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 React Native App                     │
│   ┌─────────────┐    ┌─────────────────────────┐   │
│   │ PowerSync   │    │ KHUB API Client         │   │
│   │ (SQLite)    │    │ (REST calls)            │   │
│   └──────┬──────┘    └───────────┬─────────────┘   │
└──────────┼───────────────────────┼─────────────────┘
           │ WebSocket             │ HTTP
           ▼                       ▼
┌──────────────────┐    ┌─────────────────────────┐
│ PowerSync Server │    │ KHUB Backend (Flask)    │
│ (Docker)         │    │                         │
└────────┬─────────┘    └───────────┬─────────────┘
         │ WAL Stream               │
         ▼                          ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
│         (Logical Replication enabled)               │
└─────────────────────────────────────────────────────┘
```

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [PowerSync documentation](https://docs.powersync.com/)
- [NativeWind documentation](https://www.nativewind.dev/)

## License

MIT
