# iTitans POS App

A React Native (Expo) POS (Point of Sale) application with offline-first architecture using PowerSync for data synchronization and Supabase as the backend.

## Features

### POS System
- **Multi POS Lines**: Support for multiple concurrent POS terminals
- **Clock In/Out**: Employee time tracking with PIN authentication
- **Thermal Printing**: Receipt printing via Ethernet/USB/Bluetooth
- **Print Queue**: Prevents app freezing with sequential print job processing
- **Role-Based Access**: Admin, Manager, Cashier, Supervisor roles

### Offline-First Architecture
- **Offline-First**: Works without internet, syncs when connected
- **Real-time Sync**: Changes sync instantly across devices
- **Sync Streams**: Dynamic data subscription based on filters
- **Self-Hosted PowerSync**: Docker-based local deployment

## Tech Stack

- React Native (Expo) with Expo Router
- TypeScript
- NativeWind (Tailwind CSS)
- PowerSync (self-hosted)
- Supabase (PostgreSQL + Auth)
- react-native-thermal-receipt-printer

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Supabase account with IPv4 enabled
- Android device/emulator or iOS Simulator

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# App configuration
cp env.example .env.local
# Edit .env.local with your Supabase credentials
```

Required environment variables:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_POWERSYNC_URL=http://localhost:8080
```

### 3. Start PowerSync Service (Optional - for sync features)

```bash
cd powersync
cp .env.example .env
# Edit .env with your Supabase database credentials
docker compose up -d
```

### 4. Run the App

```bash
# Development build (required for native modules like thermal printer)
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
│   ├── catalog/                  # Product catalog screens
│   ├── inventory/                # Stock management screens
│   ├── sale/                     # Sales related screens
│   └── order/                    # Order flow screens
├── components/                   # Reusable UI components
│   ├── Sidebar.tsx               # Main navigation sidebar
│   ├── POSSidebar.tsx            # POS-specific sidebar
│   ├── Header.tsx                # Page header component
│   └── ...
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx           # Authentication state
│   └── ClockContext.tsx          # Clock in/out state
├── utils/
│   ├── PrintQueue.ts             # Print queue management
│   └── powersync/                # PowerSync integration
│       ├── PowerSyncProvider.tsx
│       ├── SupabaseConnector.ts
│       ├── useSyncStream.ts
│       └── schema.ts
└── powersync/                    # Self-hosted PowerSync config
    ├── docker-compose.yaml
    ├── config.yaml
    ├── sync_rules.yaml
    └── .env.example
```

## PowerSync Configuration

### Environment Variables (powersync/.env)

```bash
PS_SUPABASE_DB_HOST=db.xxxxx.supabase.co
PS_SUPABASE_DB_PORT=5432
PS_SUPABASE_DB_NAME=postgres
PS_SUPABASE_DB_USER=postgres
PS_SUPABASE_DB_PASSWORD=your-password
PS_SUPABASE_JWKS={"keys":[...]}  # From Supabase JWKS endpoint
```

### Getting JWKS

```bash
curl https://YOUR_PROJECT.supabase.co/auth/v1/.well-known/jwks.json
```

### Sync Rules (powersync/sync_rules.yaml)

```yaml
bucket_definitions:
  global:
    data:
      - SELECT * FROM todos
```

## Supabase Setup

1. Create tables for your POS data

2. Create PowerSync publication:
```sql
CREATE PUBLICATION powersync FOR ALL TABLES;
```

3. Enable Row Level Security as needed

4. Enable Anonymous Auth in Supabase Dashboard

5. Enable IPv4 Add-on (required for self-hosted PowerSync)

## Thermal Printer Setup

The app supports thermal receipt printing via:
- **Ethernet**: Configure IP and port (default: 192.168.1.100:9100)
- **USB**: Android only, auto-detects connected printers
- **Bluetooth**: Scans and connects to BLE printers

Printer configuration in `app/pos-line.tsx`:
```typescript
const PRINTER_IP = "192.168.1.100";
const PRINTER_PORT = 9100;
```

## Test Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| manager | manager123 | Manager |
| cashier | cashier123 | Cashier |
| supervisor | super123 | Supervisor |

## Useful Commands

```bash
# Start development
npx expo start --dev-client

# Build for Android
npx expo run:android

# Build APK
cd android && ./gradlew assembleRelease

# Start PowerSync
cd powersync && docker compose up -d

# View PowerSync logs
docker compose logs -f powersync

# Install on device via ADB
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### PowerSync can't connect to Supabase
- Ensure IPv4 is enabled in Supabase (Settings → Add-ons)
- Check database password in `.env`

### JWT authentication errors
- Refresh JWKS from Supabase endpoint
- Ensure anonymous auth is enabled

### Thermal printer not working
- Requires development build (not Expo Go)
- Check printer IP/port configuration
- Ensure printer is on same network

### Print jobs freezing
- Print queue system handles this automatically
- Check `utils/PrintQueue.ts` for configuration

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [PowerSync documentation](https://docs.powersync.com/)
- [Supabase documentation](https://supabase.com/docs)
- [NativeWind documentation](https://www.nativewind.dev/)

## License

MIT
