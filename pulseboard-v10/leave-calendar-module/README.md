# Leave Calendar Module (Embeddable)

A self-contained leave calendar module with full CRUD, team leave visibility, and announce/cancel workflows. Drop it into any React + FastAPI app.

## Structure

```
leave-calendar-module/
├── frontend/
│   └── LeaveCalendar.tsx      # Standalone React component
├── backend/
│   ├── leave_model.py         # SQLAlchemy model
│   └── leave_router.py        # FastAPI router with all endpoints
└── README.md
```

## Frontend Setup

### Prerequisites
- React 18+, TypeScript, Tailwind CSS, axios, react-hot-toast

### Usage

```tsx
import LeaveCalendar from './LeaveCalendar';

// In your app:
<LeaveCalendar
  apiBaseUrl="http://localhost:8001"   // Your backend URL
  getAuthToken={() => sessionStorage.getItem('token') || ''}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiBaseUrl` | `string` | Yes | Backend API base URL |
| `getAuthToken` | `() => string` | Yes | Function returning the auth JWT token |
| `profilePictureBaseUrl` | `string` | No | Base URL for profile pictures (defaults to `apiBaseUrl`) |

## Backend Setup

### 1. Add the model

```python
# In your models/__init__.py or wherever you register models:
from leave_calendar_module.leave_model import UpcomingLeave
```

### 2. Mount the router

```python
from leave_calendar_module.leave_router import create_leave_router

# You must provide these dependencies:
leave_router = create_leave_router(
    get_db=get_db,              # Your DB session dependency
    get_current_user=get_current_user,  # Your auth dependency
    get_team_ids=get_team_ids_fn,       # fn(db, user) -> list[int]
    create_notification=notify_fn,       # Optional: fn(db, user_id, title, message, type)
    User=User,                           # Your User model class
)

app.include_router(leave_router, prefix="/api/leave-calendar")
```

### 3. Run migrations
The module uses a single `upcoming_leaves` table. Run your migration tool (Alembic, etc.) to create it.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/my-leaves` | Get current user's leaves |
| POST | `/my-leaves` | Create a leave |
| PUT | `/my-leaves/{id}` | Update a leave |
| DELETE | `/my-leaves/{id}` | Delete a leave |
| POST | `/my-leaves/{id}/announce` | Announce leave to team |
| POST | `/my-leaves/{id}/cancel` | Cancel announced leave |
| GET | `/team-leaves` | Get team's announced leaves |
