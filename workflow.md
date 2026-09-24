# Bolt-Style User Recognition & Seamless Checkout: Complete Workflow & Architecture Guide

## 1. Executive Summary & Objective

This document outlines the end-to-end design, flow decisions, user scenarios, and full implementation workflow for building a **Bolt-style One-Click User Recognition and Checkout Application**.

The application delivers an ultra-smooth e-commerce checkout experience featuring two core capabilities:
1. **Flow A (Registration Flow)**: Captures user credentials (`email`, `first_name`, `last_name`), generates a unique 6-digit numeric login code, securely persists the record to PostgreSQL, and presents the code clearly to the user.
2. **Flow B (User Recognition & Login Checkout Flow)**: An e-commerce checkout form (`email`, `phone`, `shipping_address`). As the user types their email address, real-time background recognition checks if an account exists. If recognized, a non-intrusive modal prompts the user for their 6-digit code. The user can either authenticate seamlessly (revealing their logged-in identity on the form) or skip the modal to checkout as a guest. Submitting the form records the checkout data into PostgreSQL without real payment processing.

---

## 2. Deciding the Flow: UX State Machine & Engineering Decisions

### 2.1 UX State Machine
To deliver a frictionless experience without annoying false positives or blocking the user, the flow is modeled as a state machine:

```
[ User Lands on Checkout ]
           │
           ▼
[ Types in Email Input ] ───(Format check: valid RFC 5322 regex?)
           │
     NO ───┴─── YES
     │           │
     ▼           ▼
[Continue]  [ Trigger Background API Call (with 350ms debounce) ]
                 │ (User is actively typing phone / address in parallel)
                 │
           ┌─────┴────────────────┐
           ▼                      ▼
    [ Not Recognized ]     [ Recognized User Found ]
           │                      │
           ▼                      ▼
  (Silently continue        [ Display Modal Prompt ]
    checkout as guest)            │
                            ┌─────┴────────────────┐
                            ▼                      ▼
                  [ User Enters 6-digit Code ]  [ Clicks "Skip & Continue as Guest" ]
                            │                      │
                      ┌─────┴────────┐             ▼
                   MATCH          MISMATCH   [ Close Modal ]
                      │              │             │
                      ▼              ▼             ▼
              [ Log User In ]  [ Inline Error ] [ Guest Mode Active ]
              [ Close Modal ]  (Shake, retry)      │
              [ Show Name ]                        │
                      │                            │
                      └──────────────┬─────────────┘
                                     ▼
                            [ Complete Checkout ]
                                     │
                                     ▼
                        [ Persist Order to Database ]
                                     │
                                     ▼
                        [ Order Receipt & Confirmation ]
```

### 2.2 Key Engineering & UX Decisions

1. **Non-blocking Asynchronous Recognition**:
   - The user must never be prevented from typing into subsequent inputs (Phone number, Street Address) while the background recognition runs.
   - We utilize a **350ms debounce** to ensure we don't trigger the API on every partial keystroke.
   - We utilize an **`AbortController`** to cancel previous flight requests if the user modifies their email before an earlier response returns.

2. **Seamless Modal Interaction & Keyboard Focus**:
   - When the user is recognized, the modal opens with smooth entrance transitions.
   - The 6-digit code input receives immediate focus.
   - Support for pressing `Enter` to verify, or `Esc` / clicking outside / clicking "Skip" to dismiss.

3. **Guest Fallback / Skip Mode**:
   - Respecting user intent is paramount: if the user doesn't remember their code or wants a quick one-time purchase, clicking *"Skip & Continue as Guest"* dismisses the modal immediately and saves the state as `guestDismissed = true` for this session so they aren't repeatedly interrupted.

4. **Cryptographic 6-Digit Code Generation**:
   - Codes are generated using cryptographically strong random number generation (`crypto.randomInt(100000, 999999)`), formatted as a 6-digit string with zero-padding guaranteed.

5. **Layer Separation**:
   - **Frontend**: Single-Page App (SPA) built with React and TypeScript, managing local UI state, debounced validation, and modal overlays.
   - **API Layer**: RESTful Node.js + Express + TypeScript service exposing clean routes (`/api/auth/*`, `/api/orders/*`), input validation, and business logic.
   - **Database Layer**: PostgreSQL storing normalized schemas with unique indexes for fast lookups.

---

## 3. Concrete Examples of the Web App Working

### Example 1: New User Registration & Code Delivery
* **Step 1**: Jane arrives at `/register`.
* **Step 2**: Jane inputs:
  - First Name: `Jane`
  - Last Name: `Doe`
  - Email: `jane.doe@example.com`
* **Step 3**: Jane clicks **"Create Bolt Account"**.
* **Step 4**: The server saves Jane's profile, creates a secure random code (e.g., `739201`), and returns `{ success: true, user: { ... }, code: "739201" }`.
* **Step 5**: The UI displays a card:
  > **Account Created Successfully!**  
  > Your 6-Digit Login Code is: **`739 201`**  
  > *Keep this code handy! You will use it to log in automatically during checkout.*  
  > [ Copy Code ] [ Go to Checkout Demo → ]

---

### Example 2: Recognized User Checkout & Instant Login
* **Step 1**: Jane navigates to `/checkout` to purchase the "Bolt Smart Home Hub ($89.00)".
* **Step 2**: Jane starts typing `jane.doe@example.com` into the Email input.
* **Step 3**: As soon as `jane.doe@example.com` is completed, the background recognition triggers silently. Jane immediately tabs to the Phone input and enters `(555) 234-5678`.
* **Step 4**: In the background, the server responds: `{ recognized: true, firstName: "Jane", email: "jane.doe@example.com" }`.
* **Step 5**: An animated modal appears over the form:
  > **Welcome back, Jane!**  
  > We recognized your email `jane.doe@example.com`. Enter your 6-digit login code to quickly complete your order.  
  > `[ _ _ _ _ _ _ ]`  
  > [ Verify & Sign In ] &nbsp;&nbsp;&nbsp;&nbsp; [ Skip & Continue as Guest ]
* **Step 6**: Jane types `739201` and presses Enter.
* **Step 7**: Code is verified against the database. The modal dismisses with a checkmark animation.
* **Step 8**: The top of the checkout form updates to:
  > **✓ Logged in as Jane Doe** (`jane.doe@example.com`)
* **Step 9**: Jane enters her address (`742 Evergreen Terrace, Springfield, OR 97477`) and clicks **"Place Order"**.
* **Step 10**: The order is stored with `user_id = <Jane's UUID>` and `is_guest = false`. The screen displays a receipt with Order ID `ORD-2026-XXXX`.

---

### Example 3: Recognized User Choosing Guest Checkout (Skip)
* **Step 1**: Jane enters `jane.doe@example.com`.
* **Step 2**: The recognition modal appears.
* **Step 3**: Jane forgot her code or is in a rush. She clicks **"Skip & Continue as Guest"**.
* **Step 4**: The modal closes immediately. No blocking occurs.
* **Step 5**: Jane completes the phone and shipping address fields and clicks **"Place Order"**.
* **Step 6**: The order is stored with `user_id = NULL` and `is_guest = true`.

---

### Example 4: Invalid Code Handling
* **Step 1**: In the recognition modal, the user enters `111111` instead of `739201`.
* **Step 2**: API responds with `401 Unauthorized`: `{ success: false, message: "Invalid 6-digit code. Please verify and try again." }`.
* **Step 3**: The modal shakes slightly, displays a red banner: *"Invalid 6-digit code. Please try again or skip."*, while keeping the input active so the user can easily re-type.

---

### Example 5: Unregistered User (First-Time Buyer)
* **Step 1**: Mark navigates to `/checkout`.
* **Step 2**: Mark enters `mark.smith@gmail.com`.
* **Step 3**: Background recognition runs, server responds `{ recognized: false }`.
* **Step 4**: No modal pops up; Mark experiences zero interruption.
* **Step 5**: Mark fills out phone and address, submits the form, and an order is created as a guest order.

---

## 4. Technical Architecture

```
┌────────────────────────────────────────────────────────┐
│                   FRONTEND (React + TS)                │
│  - Vite + React 19 + TypeScript                        │
│  - Real-time Email Recognition Hook (debounced + abort)│
│  - Glassmorphic Modal & Responsive UI                  │
│  - State Management: Form State, Auth State, Cart      │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST (JSON)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   API LAYER (Node/Express + TS)        │
│  - Express 5 / Node.js                                 │
│  - Layered Architecture: Routes -> Controllers -> Svc  │
│  - Input Validation & Sanitization                     │
│  - Crypto 6-digit Code Generation                      │
└──────────────────────────┬─────────────────────────────┘
                           │ SQL Queries (pg pool)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                │
│  - Supabase / Neon / Hosted Postgres                   │
│  - Schema: users table, orders table                   │
│  - Indexes: LOWER(email), user_id                      │
└────────────────────────────────────────────────────────┘
```

---

## 5. Complete Step-by-Step Building Process

### Step 1: Database Setup & Schema Creation
1. Define the PostgreSQL schema in `database/schema.sql`:
   - `users` table: `id`, `email`, `first_name`, `last_name`, `auth_code`, `created_at`.
   - `orders` table: `id`, `user_id`, `email`, `phone`, `shipping_name`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `order_total`, `is_guest`, `created_at`.
2. Check in `database/schema.sql` and `database/seed.sql` for automated reproduction.

### Step 2: Backend API Implementation (Node.js + Express + TypeScript)
1. Initialize backend with `express`, `cors`, `pg`, `dotenv`, `zod` for request validation.
2. Implement endpoints:
   - `POST /api/auth/register`: Validates email format, checks for duplicates, generates random 6-digit code, saves to database, returns user profile + code.
   - `POST /api/auth/recognize`: Looks up lowercase email in `users` table. Returns `{ recognized: true, user: { email, firstName } }` or `{ recognized: false }`.
   - `POST /api/auth/verify-code`: Validates code against user's stored `auth_code`. Returns authenticated session payload.
   - `POST /api/orders`: Saves order details (email, phone, shipping address, user_id if authenticated or null if guest) to `orders` table.
   - `GET /api/orders`: Retrieves recent orders for testing and audit.

### Step 3: Frontend Implementation (React + TypeScript + Vite)
1. Initialize Vite React TypeScript project.
2. Build custom styling design tokens (clean Bolt-inspired typography, vibrant accents, dark/light theme accents, smooth modal transitions).
3. Implement components:
   - `RegistrationPage`: Clean form collecting email, first name, last name. Displays 6-digit code prominently upon completion with a "Copy Code" action.
   - `CheckoutPage`: Standard e-commerce layout featuring cart order summary alongside the checkout form (Email, Phone, Shipping Address).
   - `useEmailRecognition` Hook: Manages real-time RFC 5322 regex validation, debounce timer, abort controller, and trigger flags.
   - `RecognitionModal`: Accessible modal with 6-digit code input, auto-focus, submit action, error state, and "Skip" button.
   - `ConfirmationPage`: Displays order confirmation, saved order ID, and user/guest status.

### Step 4: Local Testing & Verification
1. Run Postgres container or connect to Supabase/Neon connection string.
2. Start backend server: `npm run dev` on port 5000.
3. Start frontend dev server: `npm run dev` on port 5173.
4. Execute automated curl tests for all API endpoints.
5. Perform manual end-to-end browser verification of all 5 scenarios.

### Step 5: Public Cloud Deployment
1. **Database**: Provision free PostgreSQL on **Supabase** or **Neon**. Execute `schema.sql` via SQL editor.
2. **Backend API**: Deploy to **Render** or **Railway** or as Vercel Serverless Functions with `DATABASE_URL` environment variable.
3. **Frontend**: Deploy to **Vercel** with `VITE_API_URL` environment variable pointing to the deployed backend.

### Step 6: Git Repository & Collaborator Access
1. Initialize Git repository: `git init`.
2. Create `.gitignore` ignoring `node_modules`, `.env`, `dist`.
3. Add all files, commit: `git commit -m "feat: complete Bolt recognition checkout application"`.
4. Create remote GitHub repository and push.
5. Go to GitHub repo settings -> Collaborators -> Grant access to GitHub user **`boltapp-hiring`**.

### Step 7: LLM Prompts Documentation (`prompts.md`)
1. Create `prompts.md` in the root repository.
2. Document every prompt, instruction, and requirement provided to the LLM during design, implementation, and deployment.
