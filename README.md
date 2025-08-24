# Client Application

This is the frontend client application for the Tellis Technology platform, built with modern React technologies and designed for employee management, attendance tracking, and administrative tasks.

## 🚀 Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router
- **State Management**: Zustand + TanStack Query
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Authentication**: Clerk
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Tabler Icons + Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner

## 📁 Project Structure

```
client/
├── src/
│   ├── assets/          # Static assets (images, fonts, etc.)
│   ├── components/      # Reusable UI components
│   │   ├── layout/      # Layout components
│   │   └── ui/          # Base UI components (shadcn/ui)
│   ├── config/          # Configuration files
│   ├── context/         # React context providers
│   ├── features/        # Feature-based modules
│   │   ├── attendance/  # Attendance tracking
│   │   ├── auth/        # Authentication
│   │   ├── dashboard/   # Dashboard components
│   │   ├── leave/       # Leave management
│   │   ├── meetings/    # Meeting management
│   │   ├── monitoring/  # Monitoring features
│   │   ├── recordings/  # Recording features
│   │   ├── settings/    # Settings management
│   │   ├── tasks/       # Task management
│   │   └── users/       # User management
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── routes/          # Route definitions (TanStack Router)
│   ├── services/        # API services
│   ├── stores/          # Zustand stores
│   ├── utils/           # Utility functions
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Public assets
├── dist/                # Build output
└── package.json         # Dependencies and scripts
```

## 🛠️ Development Setup

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **Build for production:**
   ```bash
   pnpm build
   ```

4. **Preview production build:**
   ```bash
   pnpm preview
   ```

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm knip` - Check for unused code

## 🏗️ Architecture Overview

### Application Structure

The application follows a feature-based architecture with the following key components:

1. **Routing**: Uses TanStack Router for type-safe routing with automatic code splitting
2. **State Management**: 
   - Zustand for global state (authentication, theme, etc.)
   - TanStack Query for server state management
3. **Authentication**: Clerk integration for user authentication and management
4. **UI Components**: Built with Radix UI primitives and shadcn/ui components
5. **Styling**: Tailwind CSS v4 with custom design system

### Key Features

- **Employee Dashboard**: Main interface for employees
- **Admin Dashboard**: Administrative interface
- **Attendance Tracking**: Punch-in/out functionality
- **Leave Management**: Request and manage leave
- **Meeting Management**: Schedule and join meetings
- **Task Management**: Create and track tasks
- **User Management**: Admin user management
- **Settings**: Application configuration
- **Monitoring**: System monitoring features

### State Management

- **Auth Store** (`stores/authStore.ts`): Manages authentication state
- **TanStack Query**: Handles API calls and caching
- **React Context**: Theme and font providers

### API Integration

- Uses Axios for HTTP requests
- Automatic error handling and retry logic
- Request/response interceptors for authentication
- Type-safe API calls with TypeScript

## 🎨 Styling

The application uses Tailwind CSS v4 with:
- Custom color palette
- Responsive design
- Dark/light theme support
- Custom animations and transitions
- Component-based styling with shadcn/ui

## 🔐 Authentication

Authentication is handled by Clerk with:
- Secure login/logout
- Session management
- Role-based access control
- Automatic token refresh
- Protected routes

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🚀 Deployment

The application is configured for deployment on:
- **Vercel**: Primary deployment platform
- **Netlify**: Alternative deployment option

### Environment Variables

Create a `.env` file in the client directory with:
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_API_URL=your_api_url
```

## 🧪 Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use conventional commits (configured with cz.yaml)
- Component naming: PascalCase
- File naming: kebab-case

### Component Structure

```typescript
// Example component structure
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ComponentProps {
  title: string
  onAction: () => void
}

export function ExampleComponent({ title, onAction }: ComponentProps) {
  const [state, setState] = useState('')
  
  return (
    <div className="p-4">
      <h2>{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </div>
  )
}
```

### API Calls

Use TanStack Query for API calls:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'

// Query
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.getUsers()
})

// Mutation
const mutation = useMutation({
  mutationFn: (data) => api.createUser(data),
  onSuccess: () => {
    // Handle success
  }
})
```

## 🤝 Contributing

1. Follow the established code style
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
