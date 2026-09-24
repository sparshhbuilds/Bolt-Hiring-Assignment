# LLM Prompt Log (`prompts.md`)

This file records every prompt given to the AI assistant during the development and deployment of this Bolt-style User Recognition and Checkout web application.

---

### Prompt 1: Initial Specification & Architecture Planning
**Date**: September 23, 2026  
**User Prompt**:
```text
help me build this - . Build a web application with two flows
a. Registration Flow
i. Collect the user's email address, first name, and last name, and register them.
ii. On successful registration, generate a random 6-digit numeric code and display it to the user.
They will need this code to log in later.
b. User Recognition & Login Flow
i. The form is a checkout form that collects email address, phone number, and shipping address.
ii. As the user types, validate in real time whether a complete, well-formed email address has been
entered. Once it has, run a recognition check in the background while the user continues filling
out the rest of the form.
iii. If the email matches a registered user, show a modal prompting them for their numeric code.
Provide option for user to skip the login step and get back to the checkout form.
iv. Validate the submitted code against the one issued at registration. On a match, log the user in
and close the modal, revealing the checkout form. On a mismatch, show an error inside the
modal.
v. Once logged in, display the user's name at the top of the checkout form. The user can continue
filling it out.
vi. Submitting the form should simply record the form data in a database table – no real payment
processing needed.
2. Deploy the application to the public internet so the team can access it.
Expected Artifacts
1. A publicly hosted website the team can try out.
2. A GitHub repository containing the full source code, with the boltapp-hiring GitHub user granted
access. The database schema must be checked in as .sql files.
3. A prompts.md in the same repository listing every prompt you gave to an LLM while building the
application.
Additional Instructions
1. You have 2 days to complete this assignment.
2. The application must have distinct frontend, API, and database layers.
3. Recommended stack: TypeScript, React, Go, and Postgres – but feel free to use whatever you're
comfortable with.
4. Free-tier hosting services such as Vercel and Supabase are fine, how will we decide the flow, give examples of this web app working, and then craft a workflow.md explaining the complete building process of it
```


---

### Prompt 2: Backend First Strategy & API Specification
**Date**: September 24, 2026  
**User Prompt**:
```text
I have reviewed the plan, lets implement backend first, dont code everything in one go , we will build this file by file , tell me all the backend apis need to built and then we will start
```


---

### Prompt 3: Database Schema Implementation
**Date**: September 24, 2026  
**User Prompt**:
```text
Yes Implement the Database Schema as required in the mentioned artifact
```


---

### Prompt 4: Database Technology Verification
**Date**: September 24, 2026  
**User Prompt**:
```text
The Tech stack asked for postgres right ?
```

**Outcome**:
- Confirmed that the requirement specifies Postgres as the database layer.
- Verified that `database/schema.sql` is authored specifically in 100% native PostgreSQL (utilizing UUIDs, `pgcrypto`, `plpgsql` trigger functions, `TIMESTAMP WITH TIME ZONE`, and functional B-tree indexes), fully compatible with Supabase and standard PostgreSQL instances.

---

### Prompt 5: Backend Implementation
**Date**: September 24, 2026  
**User Prompt**:
```text
Yes start backend
```

**Outcome**:
- Created `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`.
- Implemented all backend source files: `db.ts` (Postgres pool), `auth.service.ts`, `order.service.ts`, `auth.controller.ts`, `order.controller.ts`, `auth.routes.ts`, `order.routes.ts`, `server.ts`.
- Verified TypeScript compiles with zero errors via `npx tsc --noEmit`.

---

### Prompt 6: Supabase Setup & Connection
**Date**: September 24, 2026  
**User Prompt**:
```text
WHat are the tradeoffs between Supabase and local Postgres? give me steps to set up both and Ill decide which one to choose depending on my use case
```

**Outcome**:
- Compared Supabase (cloud) vs local Postgres across setup time, public deployment compatibility, team access, and cost.
- Provided step-by-step setup instructions for both options.
- User chose Supabase; configured `backend/.env` with Supabase connection string.

---

### Prompt 7: Database Connection Debugging
**Date**: September 24, 2026  
**User Prompt**:
```text
i think the problem was of wifi, i have changed the connections check health endpoint again
```

**Outcome**:
- Fixed SSL configuration in `db.ts` to detect Supabase hostnames and always enable SSL (Supabase requires it regardless of `NODE_ENV`).
- Fixed URL-encoding of `@` in the database password (`%40`).
- Resolved `ENOTFOUND` DNS error (was a WiFi/network issue on the user's machine).
- Health check returned `{ "status": "healthy", "database": "connected" }`.

---

### Prompt 8: Full API Endpoint Testing
**Date**: September 24, 2026  
**User Prompt**:
```text
I have already ran both schema.sql and seed.sql in supabase, test all the endpoints
```

**Outcome**:
- Wrote and executed a comprehensive 10-test script covering all 6 endpoints.
- All tests passed: register (201), duplicate detection (409), recognize known (200, recognized: true), recognize unknown (200, recognized: false), wrong code (401), correct code (200), authenticated order (201), guest order (201), list orders (200).

---

### Prompt 9: Why Zod?
**Date**: September 24, 2026  
**User Prompt**:
```text
Before implementing frontend why are we using Zod?
```

**Outcome**:
- Explained the rationale for choosing Zod as the server-side request validation library (see response below).

---

### Prompt 10: Frontend Implementation & Workflow
**Date**: September 24, 2026  
**User Prompt**:
```text
Start Implementing frontend, how are we deciding the frontend workflow ?
```

**Outcome**:
- Initialized Vite + React + TypeScript project in `frontend/`.
- Installed `react-router-dom` and `lucide-react`.
- Built complete CSS design system (`index.css`) with Inter typography, smooth animations, modal overlays, and utility classes.
- Created `useEmailRecognition` custom hook with 350ms debounce + AbortController for non-blocking background email checks.
- Built `RecognitionModal` component with auto-focus, error handling, and skip functionality.
- Built `RegistrationPage` (Flow A) and `CheckoutPage` (Flow B) with full state management.
- Set up `App.tsx` with react-router-dom routing between `/register` and `/checkout`.

---

### Prompt 11: 6-Digit Code Collision Edge Case
**Date**: September 24, 2026  
**User Prompt**:
```text
I have an edge case in mind - what if more than 1 user get the same 6-digit code, it seems impossible but still the chances arent zero right ?
```

**Outcome**:
- Analyzed the collision probability and explained why duplicate codes are safe by design: verification is always `(email + code)` paired, never code alone.

---

### Prompt 12: Assignment Completion Checklist
**Date**: September 24, 2026  
**User Prompt**:
```text
So is everything built that was required in the assignment ?
```


**Outcome**:
- Performed a detailed audit of all assignment requirements against what has been built vs. what remains.

---

### Prompt 13: Manual Terminal Execution Issues
**Date**: September 24, 2026  
**User Prompt**:
```text
why am i unable to check the app using npm run dev in terminal myself
```


**Outcome**:
- Explained why `npm run dev` failed when executed manually from the user's terminal (root directory missing `package.json`, ports bound by background tasks, and PowerShell script execution policy restrictions).
- Provided clear instructions on how to navigate to `frontend` or `backend` folders and manage server tasks.


---

### Prompt 15: Navbar Title & Layout Update
**Date**: September 24, 2026  
**User Prompt**:
```text
I want this on left of Navbar - "FlashLogin" abd in Centre this - " OTP Based User Login Web App"
```

**Outcome**:
- Updated `App.tsx` navigation bar layout to place "FlashLogin" brand on the left, "OTP Based User Login Web App" centered, and navigation links ("Register", "Checkout") on the right.

---

### Prompt 16: Handling Stale Recognition & In-Flight Race Conditions on Email Edit
**Date**: September 24, 2026  
**User Prompt**:
```text
how are we ensuring that if user wrote one email once but corrected it in ame go , we dont get the same stale data recognition model again ?
```

**Outcome**:
- Clarified and reinforced the multi-layer safeguard against stale data and race conditions in `useEmailRecognition` and `CheckoutPage`:
  1. **Immediate Invalidation**: Reset `isRecognized` and `recognizedUser` synchronously as soon as the email input changes.
  2. **In-Flight Cancellation**: Use `AbortController` to cancel pending HTTP requests for previous emails.
  3. **Debouncing**: 350ms delay with `clearTimeout` to avoid spamming the backend during typing.
  4. **Dismissal Reset**: Reset `guestDismissed` when the email changes so new valid accounts can trigger recognition.


