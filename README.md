# 🚀 ProjectFlow

A modern, full-stack project management application — like Jira or Trello — built with **Laravel 11**, **React**, **TypeScript**, **MySQL**, and **Redis**. Features a real-time kanban board, role-based access control, threaded comments, and live updates via WebSockets.

---

## ✨ Features

- **🔐 Authentication** — Token-based auth using Laravel Sanctum
- **👥 Role-Based Access** — Three roles (Admin, Manager, Developer) with distinct permissions
- **📊 Dashboard** — Project overview with stats, search, and filtering
- **📋 Kanban Board** — Drag-and-drop tasks across four columns (To Do → In Progress → In Review → Done)
- **⚡ Real-Time Updates** — Live board synchronization across users via WebSockets (Laravel Reverb)
- **🔄 Status State Machine** — Enforced task workflow rules (no skipping steps)
- **💬 Threaded Comments** — Nested replies with a 15-minute edit window
- **🚀 Performance** — Redis caching, optimistic UI updates, debounced search
- **📝 Activity Logging** — Full audit trail of who did what and when
- **✅ Fully Tested** — 36 backend tests + 18 frontend tests (54 total)

---

## 🛠️ Tech Stack

| Layer              | Technology                                                   |
| ------------------ | ------------------------------------------------------------ |
| **Frontend**       | React 18, TypeScript, Vite, Tailwind CSS                     |
| **Drag & Drop**    | dnd-kit                                                      |
| **Backend**        | PHP 8.3, Laravel 11                                          |
| **Authentication** | Laravel Sanctum                                              |
| **Database**       | MySQL 8                                                      |
| **Cache**          | Redis                                                        |
| **Real-Time**      | Laravel Reverb + Laravel Echo                                |
| **Testing**        | PHPUnit (backend), Vitest + React Testing Library (frontend) |

---

## 📋 Prerequisites

Make sure you have these installed:

- **PHP** 8.3 or higher
- **Composer** 2.x
- **Node.js** 20 or higher
- **MySQL** 8.0
- **Redis** (optional — can fall back to file cache)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jugal2000/projectflow.git
cd projectflow
```

### 2. Backend Setup (Laravel)

```bash
cd backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

Edit `backend/.env` and configure your database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=projectflow
DB_USERNAME=root
DB_PASSWORD=your_password
```

Then run migrations and seed sample data:

```bash
# Create the database tables and add sample data
php artisan migrate:fresh --seed
```

### 3. Frontend Setup (React)

```bash
cd ../frontend

# Install Node dependencies
npm install

# Copy environment file
cp .env.example .env
```

The `frontend/.env` should contain:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_REVERB_APP_KEY=my-app-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

---

## ▶️ Running the Application

You need **three terminals** running simultaneously:

### Terminal 1 — Laravel API

```bash
cd backend
php artisan serve
```

API runs at `http://localhost:8000`

### Terminal 2 — Reverb WebSocket Server

```bash
cd backend
php artisan reverb:start
```

WebSocket server runs on port `8080`

### Terminal 3 — React Frontend

```bash
cd frontend
npm run dev
```

App runs at `http://localhost:5173`

Open **http://localhost:5173** in your browser. 🎉

---

## 🔑 Demo Credentials

Sample accounts are seeded automatically. All use the password: **`password`**

| Role          | Email                     | Permissions                        |
| ------------- | ------------------------- | ---------------------------------- |
| **Admin**     | `admin@projectflow.dev`   | Full access to everything          |
| **Manager**   | `manager@projectflow.dev` | Create/edit projects, manage tasks |
| **Developer** | `dev@projectflow.dev`     | Update assigned tasks only         |

---

## 🧪 Running Tests

### Backend Tests (PHPUnit)

```bash
cd backend
php artisan test
```

Expected: **36 tests passing**

### Frontend Tests (Vitest)

```bash
cd frontend
npm run test:run
```

Expected: **18 tests passing**

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint         | Description                 |
| ------ | ---------------- | --------------------------- |
| POST   | `/auth/register` | Create a new account        |
| POST   | `/auth/login`    | Sign in and receive a token |
| POST   | `/auth/logout`   | Sign out (revokes token)    |
| GET    | `/auth/me`       | Get current user profile    |

### Projects

| Method | Endpoint                 | Description                      |
| ------ | ------------------------ | -------------------------------- |
| GET    | `/projects`              | List all projects (filterable)   |
| POST   | `/projects`              | Create a project (admin/manager) |
| GET    | `/projects/{slug}`       | View one project                 |
| PUT    | `/projects/{slug}`       | Update a project                 |
| DELETE | `/projects/{slug}`       | Delete a project (admin only)    |
| GET    | `/projects/{slug}/stats` | Cached project statistics        |

### Tasks

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| GET    | `/projects/{slug}/tasks` | List tasks in a project |
| POST   | `/projects/{slug}/tasks` | Create a task           |
| PUT    | `/tasks/{id}`            | Update a task           |
| PATCH  | `/tasks/{id}/status`     | Change task status      |
| PATCH  | `/tasks/{id}/assign`     | Assign task to a user   |
| POST   | `/tasks/reorder`         | Bulk reorder tasks      |
| DELETE | `/tasks/{id}`            | Delete a task           |

### Comments

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| GET    | `/tasks/{id}/comments` | Get threaded comments          |
| POST   | `/tasks/{id}/comments` | Post a comment or reply        |
| PUT    | `/comments/{id}`       | Edit a comment (15-min window) |
| DELETE | `/comments/{id}`       | Delete a comment               |

---

## 🏗️ Architecture Highlights

### Task Status State Machine

Tasks follow strict transition rules and cannot skip steps.

## 🐳 Quick Start with Docker (Recommended)

The easiest way to run the entire application:

```bash
# Clone the repository
git clone https://github.com/jugal2000/projectflow.git
cd projectflow

# Build and start all services
docker-compose up --build

# Wait for all containers to start (~1-2 minutes on first run)
```

Then open **http://localhost:5173** and login with:

- **Email:** `admin@projectflow.dev`
- **Password:** `password`

That's it! Docker automatically sets up Laravel, React, MySQL, Redis, and the Reverb WebSocket server.

### Docker Commands

```bash
docker-compose up          # Start all services
docker-compose down        # Stop all services
docker-compose up --build  # Rebuild after code changes
docker ps                  # See running containers
```
