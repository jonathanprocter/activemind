# ACT Workbook Application

## Overview

This is a comprehensive web application implementing an Acceptance and Commitment Therapy (ACT) workbook. The application provides an interactive, guided journey through the six core principles of ACT: Acceptance, Cognitive Defusion, Being Present, Self as Context, Values Clarification, and Committed Action. Users progress through chapters containing various exercises, assessments, and reflections to develop psychological flexibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with protected routes based on authentication status
- **State Management**: React Query (@tanstack/react-query) for server state management and data fetching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Component Structure**: Modular component design with specialized exercise components (GroundingExercise, ValuesDartboard, AssessmentQuestion, ReflectionExercise)

### Backend Architecture
- **Server Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM with PostgreSQL as the database
- **Authentication**: Replit Auth integration with OpenID Connect (OIDC) for secure user authentication
- **Session Management**: Express sessions with PostgreSQL session storage using connect-pg-simple
- **API Design**: RESTful API endpoints with consistent error handling and logging middleware

### Database Schema Design
- **Users Table**: Stores user profile information (email, name, profile image)
- **Chapters Table**: Defines the 7 ACT chapters with ordering and lock status
- **Progress Tracking**: Workbook progress table linking users to specific chapter sections with completion status
- **Auto-save System**: Stores user input and responses for seamless experience recovery
- **Assessment Storage**: Dedicated table for storing assessment responses and scores
- **Session Storage**: PostgreSQL-backed session storage for authentication persistence

### Authentication and Authorization
- **Provider**: Replit Auth with OIDC integration
- **Session Strategy**: Server-side sessions with secure HTTP-only cookies
- **Route Protection**: Middleware-based authentication checks for API endpoints
- **User Management**: Automatic user creation and profile synchronization

### Data Flow Architecture
- **Progress Tracking**: Real-time progress updates with optimistic UI updates
- **Auto-save**: Automatic content saving with debouncing to prevent data loss
- **State Synchronization**: React Query manages client-server state synchronization with background updates
- **Exercise Flow**: Chapter-based progression with section-level granular tracking

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection via Neon's serverless driver
- **drizzle-orm & drizzle-kit**: Database ORM and migration toolkit
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing

### UI and Styling
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for styling
- **lucide-react**: Icon library for consistent iconography
- **class-variance-authority**: Utility for creating variant-based component APIs

### Authentication and Session Management
- **openid-client**: OpenID Connect client for Replit Auth integration
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development and Build Tools
- **vite**: Fast development server and build tool
- **typescript**: Type safety and enhanced developer experience
- **@replit/vite-plugin-***: Replit-specific development enhancements

### Form Handling and Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Schema validation with TypeScript integration
- **drizzle-zod**: Automatic schema validation from database models

The application architecture emphasizes user experience with features like auto-save, progress tracking, offline-capable forms, and responsive design. The modular component structure allows for easy extension and maintenance of the various ACT exercises and assessments.