# Dance Suite Scrutineer

A comprehensive dance competition management system built with Next.js, Material UI, and MUI Toolpad.

## Features

- **Dashboard**: Analytics and insights for dance competitions
- **Competition Management**: Create, track, and manage dance competitions
- **Material UI Toolpad**: Modern, responsive UI with professional components
- **Data Visualization**: Charts and graphs using Recharts
- **DataGrid**: Advanced data tables for managing competition data

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Material UI**: Modern React UI framework
- **MUI Toolpad**: Application framework for building admin interfaces
- **MUI X Data Grid**: Advanced data grid components
- **Recharts**: Composable charting library
- **Emotion**: CSS-in-JS library

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── AppThemeProvider.tsx  # Material UI theme provider
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard with analytics
│   ├── competitions/
│   │   └── page.tsx              # Competition management
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── toolpad.yml                   # Toolpad configuration
└── README.md
```

## Pages

### Home (`/`)
- Overview of the dance competition system
- Key statistics cards
- Recent competitions table

### Dashboard (`/dashboard`)
- Competition analytics
- Charts showing trends and distributions
- Monthly competition data
- Dance style breakdowns

### Competitions (`/competitions`)
- Comprehensive competition management
- Advanced data grid with filtering and sorting
- CRUD operations for competitions
- Status tracking and participant management

## Development

The project uses:
- **App Router**: Modern Next.js routing
- **Client Components**: Interactive UI components marked with 'use client'
- **Server Components**: Server-side rendered pages where applicable
- **TypeScript**: Full type safety throughout the application

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Material UI Documentation](https://mui.com/)
- [MUI Toolpad Documentation](https://mui.com/toolpad/)
- [MUI X Data Grid Documentation](https://mui.com/x/react-data-grid/)
- [Recharts Documentation](https://recharts.org/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
