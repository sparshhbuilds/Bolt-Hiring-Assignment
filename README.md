# FlashLogin: One-Click User Recognition and Checkout Platform

A high-performance, full-stack web application demonstrating friction-free user recognition, instant authentication via 6-digit passcode, and one-click checkout workflow inspired by modern checkout solutions.

---

## Executive Summary

FlashLogin eliminates checkout friction for returning customers by combining real-time email recognition with lightweight 6-digit passcode authentication. When a user enters their email address during checkout, the platform asynchronously verifies whether an account exists. If recognized, the user is presented with a non-intrusive modal to authenticate instantly, automatically pre-filling their stored personal and shipping information. If unrecognised or if the user chooses to skip, the system gracefully falls back to a standard guest checkout flow.

---

## Key Features

### 1. User Registration and Passcode Generation
- User onboarding requiring First Name, Last Name, and Email Address.
- Automatic generation of a secure, 6-digit numeric login code associated with the account.
- Database constraints ensuring unique email constraint and code length validation.

### 2. Real-Time Email Recognition Engine
- Asynchronous email recognition as the user types into the contact input field.
- Integrated RFC 5322 syntax validation to avoid redundant server requests for incomplete inputs.
- Debounced API invocations (350ms threshold) to minimize network overhead and server load.
- In-flight request cancellation via `AbortController` to eliminate race conditions and prevent stale network responses from overwriting active UI state.
- Instant state invalidation on keystroke, clearing prior recognition models when input text changes.

### 3. Frictionless One-Click Checkout
- Dual checkout modalities: Authenticated One-Click Checkout and Guest Checkout.
- Personalized recognition prompt welcoming returning users by first name.
- Interactive 6-digit passcode verification modal.
- Automatic form pre-population upon successful verification.
- Flexible guest dismissal allowing users to proceed as guests without losing typed address data.
- Automatic reset of guest dismissal state if the email field is subsequently edited.

### 4. Robust Database and Order Management
- Relational schema optimized for fast lookups.
- Case-insensitive B-Tree index on lowercased email addresses for sub-millisecond recognition queries.
- Persisted order processing linking completed transactions to registered user accounts or marking them as guest transactions.

---

## Architecture and Technology Stack

### Frontend Application
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8
- **Routing**: React Router DOM v7
- **Styling**: Vanilla CSS utilizing custom design tokens, modern layout algorithms (CSS Grid, Flexbox), and glassmorphism UI components.
- **Icons**: Lucide React
- **Deployment Target**: Vercel (configured with single-page application route rewrites)

### Backend Service
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database Driver**: `pg` (node-postgres) with connection pooling
- **Validation**: Zod schema validation
- **Middleware**: CORS with dynamic origin authorization, Express JSON parser, and global error handling middleware.
- **Deployment Target**: Render

### Database Layer
- **Engine**: PostgreSQL 15+ (Compatible with Supabase, Neon, and AWS RDS)
- **Features**: `pgcrypto` extension for UUID generation, case-insensitive indexing, foreign key constraints, and automatic `updated_at` trigger functions.

---

## System Architecture and Request Flow

```
+-----------------------------------------------------------------------+
|                            Client (Browser)                           |
|  +-----------------------+   +-------------------+  +--------------+  |
|  | Registration Page     |   |  Checkout Page    |  |  Modal UI    |  |
|  +-----------+-----------+   +---------+---------+  +-------+------+  |
+--------------|-------------------------|--------------------|---------+
               |                         |                    |
               | POST /api/auth/register | POST /recognize    | POST /verify-code
               v                         v                    v
+-----------------------------------------------------------------------+
|                         Express API Service                           |
|  +-----------------------------------------------------------------+  |
|  | Controllers & Input Validation (Zod)                            |  |
|  +--------------------------------+--------------------------------+  |
+-----------------------------------|-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                        PostgreSQL Database                            |
|  +-------------------------------+   +-----------------------------+  |
|  | users (Index: LOWER(email))   |   | orders (FK: user_id)        |  |
|  +-------------------------------+   +-----------------------------+  |
+-----------------------------------------------------------------------+
```

---

## API Reference Specification

### Authentication and User Endpoints

#### 1. Register User
- **HTTP Method**: `POST`
- **Path**: `/api/auth/register`
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "code": "849201",
    "user": {
      "id": "a3b8c9d0-1234-5678-9abc-def012345678",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
  ```

#### 2. Recognize Email
- **HTTP Method**: `POST`
- **Path**: `/api/auth/recognize`
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com"
  }
  ```
- **Response** (`200 OK` - Found):
  ```json
  {
    "recognized": true,
    "user": {
      "email": "john.doe@example.com",
      "firstName": "John"
    }
  }
  ```
- **Response** (`200 OK` - Not Found):
  ```json
  {
    "recognized": false
  }
  ```

#### 3. Verify Passcode
- **HTTP Method**: `POST`
- **Path**: `/api/auth/verify-code`
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "code": "849201"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Authentication successful.",
    "user": {
      "id": "a3b8c9d0-1234-5678-9abc-def012345678",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
  ```

---

### Order Endpoints

#### 1. Create Order
- **HTTP Method**: `POST`
- **Path**: `/api/orders`
- **Request Body**:
  ```json
  {
    "userId": "a3b8c9d0-1234-5678-9abc-def012345678",
    "email": "john.doe@example.com",
    "phone": "555-0199",
    "shippingName": "John Doe",
    "addressLine1": "123 Market Street",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "isGuest": false
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Order created successfully.",
    "order": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
      "email": "john.doe@example.com",
      "shippingName": "John Doe",
      "orderTotal": 89.00,
      "isGuest": false,
      "createdAt": "2026-09-24T14:30:00.000Z"
    }
  }
  ```

---

### Infrastructure Monitoring

#### 1. Service Health Check
- **HTTP Method**: `GET`
- **Path**: `/api/health`
- **Response** (`200 OK`):
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-09-24T14:30:00.000Z"
  }
  ```

---

## Database Schema Design

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    auth_code VARCHAR(6) NOT NULL,
    code_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_auth_code_length CHECK (length(auth_code) = 6),
    CONSTRAINT uq_users_email_lower UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    shipping_name VARCHAR(200) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    order_total NUMERIC(10, 2) NOT NULL DEFAULT 89.00,
    is_guest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
```

---

## Local Development Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- PostgreSQL database instance or Supabase account
- Git

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/boltapp-hiring.git
   cd boltapp-hiring
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` folder:
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/bolt_checkout
   PORT=5000
   CORS_ORIGIN=http://localhost:5173
   NODE_ENV=development
   ```

3. **Database Initialization**
   Execute the schema initialization file against your database:
   ```bash
   psql -U postgres -d bolt_checkout -f ../database/schema.sql
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

5. **Running Development Servers**
   - Start Backend: `cd backend && npm run dev`
   - Start Frontend: `cd frontend && npm run dev`
   - Access the application at `http://localhost:5173`

---

## Deployment Configuration

### Deploying Backend to Render
1. Create a new Web Service on Render pointing to your repository.
2. Set Root Directory to `backend`.
3. Set Build Command to `npm install && npm run build`.
4. Set Start Command to `npm start`.
5. Environment Variables required:
   - `DATABASE_URL`: Your PostgreSQL Connection String (If using Supabase on Render, use the Transaction/Session Pooler URL on port 6543 to ensure IPv4 compatibility).
   - `PORT`: `5000` (or allow Render default).
   - `CORS_ORIGIN`: Your frontend URL (e.g. `https://your-app.vercel.app`).

### Deploying Frontend to Vercel
1. Import project into Vercel and set Root Directory to `frontend`.
2. Framework Preset: `Vite`.
3. Environment Variables required:
   - `VITE_API_URL`: Your Render backend service URL (e.g. `https://your-backend.onrender.com`).
4. Single-Page Application rewrites are handled by the included `vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

---

## License

This project is licensed under the MIT License.
