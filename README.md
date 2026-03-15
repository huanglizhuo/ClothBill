# ClothBill

A mobile-first trip expense splitting app. Track shared expenses during group travel, manage multiple currencies, and calculate optimal settlements.

## Features

- **Trip Management** — Create trips with members and password protection
- **Multi-Currency Support** — 100+ world currencies; configure which currencies each trip uses
- **Expense Tracking** — Record expenses with payer, split type (equal / exact / percentage), category, and date
- **Smart Settlement** — Auto-calculate balances and generate optimal transfer plans with exchange rate conversion
- **Settings Page** — Manage members (add / edit / delete) and trip currencies; change settlement currency
- **Share Results** — Share settlement plans via system share sheet or clipboard
- **Lock / Unlock** — Password-based edit mode across all tabs to prevent accidental changes

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- Supabase (PostgreSQL + RPC)
- React Router

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key in .env

# Run Supabase migrations
# Apply supabase/migrations/001_init.sql and 002_settings.sql to your Supabase project

# Start dev server
npm run dev
```

## License

[MIT](./LICENSE)
