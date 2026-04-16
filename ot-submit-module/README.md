# OT Submit Module (Embeddable)

Self-contained OT submission tracker with full CRUD, timeline filtering, OT Champions leaderboard, send-to-manager, and Excel report download. Drop it into any React + FastAPI app.

## Structure

```
ot-submit-module/
├── backend/
│   ├── __init__.py
│   ├── ot_model.py          # SQLAlchemy OTSubmission model
│   └── ot_router.py         # FastAPI router (all endpoints)
├── frontend/
│   └── OTSubmitTracker.tsx   # Standalone React component (includes timeline filter)
└── README.md
```

## Features

- **Submit OT / NSA / ASA** — dropdown type selector, date, hours, auto-calculated end time
- **Edit & Delete** pending (non-delivered) submissions
- **OT Table** — Employee ID, Name, Login, Shift Type, Date, Start/End Time, Hours, Status, Actions
- **W/M/Q/Y Timeline Filter** — Week, Month, Quarter, Yearly filtering (built-in, no external dependency)
- **OT Champions** — Last month's leaderboard with profile pictures and medals (🥇🥈🥉)
- **Send to Manager** — marks entries as delivered, sends notification
- **Download Excel Report** — 3-sheet workbook (OT/NSA/ASA) with styled headers and totals
- **Summary Cards** — Total OT Hours, NSA Days, ASA Days
- **Manager Endpoints** — monthly-reports, mark-viewed, download-all-reports (ZIP)

## Frontend Usage

```tsx
import OTSubmitTracker from './OTSubmitTracker';

<OTSubmitTracker
  apiBaseUrl="http://localhost:8001"
  getAuthToken={() => sessionStorage.getItem('token') || ''}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiBaseUrl` | `string` | Yes | Backend API base URL |
| `getAuthToken` | `() => string` | Yes | Function returning auth JWT token |
| `profilePictureBaseUrl` | `string` | No | Base URL for profile pics (defaults to apiBaseUrl) |
| `apiPrefix` | `string` | No | API route prefix (defaults to `/api/ot`) |
| `getCurrentUser` | `() => {id}` | No | Returns current user object (defaults to sessionStorage) |

## Backend Usage

```python
from ot_submit_module.backend import create_ot_router

ot_router = create_ot_router(
    get_db=get_db,
    get_current_user=get_current_user,
    get_team_ids=get_team_ids_fn,       # fn(db, user) -> list[int]
    User=User,
    create_notification=notify_fn,       # optional
)
app.include_router(ot_router, prefix="/api/ot")
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/submit` | Submit OT/NSA/ASA entry |
| GET | `/my-submissions` | Get user's submissions (basic) |
| GET | `/my-submissions-full` | Get user's submissions (with user info) |
| PUT | `/update/{id}` | Update pending entry |
| DELETE | `/delete/{id}` | Delete pending entry |
| POST | `/send-to-manager/{user_id}/{month}` | Mark month as delivered |
| GET | `/download-report/{user_id}/{month}` | Download Excel report |
| GET | `/monthly-reports` | Manager: all team reports |
| POST | `/mark-viewed/{user_id}/{month}` | Manager: mark as viewed |
| GET | `/download-all-reports` | Manager: download all as ZIP |
| GET | `/ot-champions` | Last month's OT leaderboard |

## Dependencies

**Frontend:** React 18+, TypeScript, Tailwind CSS, axios, react-hot-toast
**Backend:** FastAPI, SQLAlchemy, openpyxl, pydantic
