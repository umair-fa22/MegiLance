# MegiLance Project Context & Technical Patterns

**Version**: 2.0 (March 24, 2026)
**Audience**: Claude Code, GitHub Copilot, Development Team

---

## 📚 Core Architecture Patterns

### Backend Architecture (FastAPI)
```
Request → CORS Middleware → Rate Limiting → Auth (JWT) → Route Handler
        ↓
    Pydantic Validation (Schema)
        ↓
    Service Layer (Business Logic)
        ↓
    SQLAlchemy ORM (Database Query)
        ↓
    Turso Database (SQL)
        ↓
    Response → JSON Serialization → HTTP Response
```

**Key Pattern**: Layered architecture with clear separation of concerns
- **Routes** (`app/api/routers/`): HTTP handlers, request/response
- **Services** (`app/services/`): Business logic, external integrations
- **Models** (`app/models/`): SQLAlchemy ORM definitions
- **Schemas** (`app/schemas/`): Pydantic validation for input/output

### Frontend Architecture (Next.js 16 + React 19)
```
Route Group (Layout)
    ├─ Page Component (Server)
    │   ├─ 'use client' Components (Client)
    │   │   ├─ Hooks (useState, useEffect, etc.)
    │   │   ├─ Context Consumers
    │   │   └─ Event Handlers
    │   └─ Server-only Functions
    └─ Child Routes
```

**Key Pattern**: App Router with route groups
- **Route groups**: `(auth)`, `(main)`, `(portal)` for organizational isolation
- **Server components**: Default; fetch data, no interactivity
- **Client components**: `'use client'`; interactivity, hooks, events
- **Shared components**: `app/components/` for reusable UI
- **Theme support**: CSS modules + next-themes for light/dark

---

## 🛠️ Technology Deep Dives

### Database: Turso (LibSQL)
- **Connection**: Remote only; Turso WebSocket protocol
- **Config**: `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` in `.env`
- **ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic (`backend/alembic/versions/`)
- **Query Pattern**:
  ```python
  # ✅ DO: Use async ORM with type hints
  async def get_projects(user_id: str) -> list[ProjectSchema]:
      result = await session.execute(
          select(Project).where(Project.client_id == user_id)
      )
      projects = result.scalars().all()
      return [ProjectSchema.model_validate(p) for p in projects]
  ```

### Authentication: JWT + Multi-Factor
- **Access Token**: 1 hour expiration
- **Refresh Token**: 7 days expiration
- **MFA Methods**: Email, SMS, TOTP, Security Questions, Biometric, Hardware Keys
- **JWT Claims**: `user_id`, `email`, `role`, `exp`, `iat`
- **Storage**: HTTP-only cookies (frontend) + Bearer header (API)

### Real-time: Socket.io
- **Connection**: WebSocket + fallback to polling
- **Events**: `message:send`, `message:receive`, `notification:*`, `project:*`
- **Namespace**: `/` for general, `/notifications`, `/messages`
- **Middleware**: JWT verification on connect

### File Upload
- **Max Size**: 100MB for documents, 50MB for images, 500MB for videos
- **Validation**: Client-side (type/size) + backend (re-verify)
- **Storage**: TBD (S3/DigitalOcean Spaces planned)
- **Processing**: Async background task for AI analysis (resume, portfolio)

### Payments
- **Gateway**: Stripe (primary), Crypto (secondary)
- **Smart Contracts**: Solidity escrow (production phase)
- **Webhook**: Stripe → `/api/webhooks/stripe` for event handling
- **Reconciliation**: Async task to verify transaction status

---

## 📋 Detailed Project Structure with Examples

### Backend File Organization

```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py          # Login, signup, refresh token
│   │   │   │   ├── users.py         # Profile CRUD
│   │   │   │   ├── projects.py      # Project management
│   │   │   │   ├── proposals.py     # Proposal handling
│   │   │   │   ├── messages.py      # Chat endpoints
│   │   │   │   ├── reviews.py       # Review system
│   │   │   │   ├── payments.py      # Payment processing
│   │   │   │   ├── search.py        # Search & filtering
│   │   │   │   ├── ai.py            # AI ranking/matching
│   │   │   │   ├── notifications.py # Push notifications
│   │   │   │   └── admin.py         # Admin operations
│   │   │   └── router.py            # Combined router
│   │   └── routers.py               # Main router
│   │
│   ├── core/
│   │   ├── config.py                # Settings from environment
│   │   ├── security.py              # JWT, password hashing
│   │   ├── rate_limit.py            # Rate limiting setup
│   │   └── dependencies.py          # FastAPI dependency injection
│   │
│   ├── db/
│   │   ├── session.py               # Database connection/session
│   │   ├── init_db.py               # Initialize database
│   │   └── base.py                  # Base model for SQLAlchemy
│   │
│   ├── models/
│   │   ├── user.py                  # User, Profile ORM
│   │   ├── project.py               # Project, Proposal ORM
│   │   ├── message.py               # Message ORM
│   │   ├── review.py                # Review ORM
│   │   ├── payment.py               # Transaction ORM
│   │   └── ai_score.py              # AI Ranking cache
│   │
│   ├── schemas/
│   │   ├── user.py                  # UserCreate, UserRead, ProfileUpdate
│   │   ├── project.py               # ProjectCreate, ProjectRead, ProjectUpdate
│   │   ├── proposal.py              # ProposalCreate, ProposalRead
│   │   ├── message.py               # MessageCreate, MessageRead
│   │   ├── review.py                # ReviewCreate, ReviewRead
│   │   └── payment.py               # PaymentCreate, PaymentRead
│   │
│   ├── services/
│   │   ├── user_service.py          # User operations
│   │   ├── project_service.py       # Project operations
│   │   ├── proposal_service.py      # Proposal operations
│   │   ├── message_service.py       # Chat operations
│   │   ├── payment_service.py       # Payment processing
│   │   ├── notification_service.py  # Notifications + Socket.io
│   │   ├── email_service.py         # Email sending (SMTP)
│   │   ├── storage_service.py       # File upload handling
│   │   └── ai/
│   │       ├── ranking_service.py   # Talent ranking model
│   │       ├── sentiment_analysis.py# Review sentiment check
│   │       ├── price_forecast.py    # Market price prediction
│   │       └── fraud_detection.py   # Fraud detection
│   │
│   ├── templates/
│   │   ├── email_welcome.html       # Email templates
│   │   ├── email_reset.html
│   │   └── email_notification.html
│   │
│   └── __init__.py
│
├── tests/
│   ├── conftest.py                  # Pytest fixtures
│   ├── test_e2e_complete_flows.py   # End-to-end workflows
│   ├── test_auth.py                 # Authentication tests
│   ├── test_projects.py             # Project operations
│   ├── test_proposals.py            # Proposal workflow
│   ├── test_messages.py             # Chat tests
│   ├── test_payments.py             # Payment tests
│   ├── test_ai.py                   # AI service tests
│   └── integration/                 # Integration tests
│       └── test_complete_flow.py    # Full workflow test
│
├── alembic/
│   ├── versions/
│   │   ├── 001_initial_schema.py    # Initial migration
│   │   ├── 002_add_ai_scores.py     # AI scoring table
│   │   └── ...
│   ├── env.py
│   └── alembic.ini
│
├── scripts/
│   ├── seed_db.py                   # Populate test data
│   ├── migrate_db.py                # Run migrations
│   ├── backup_db.py                 # Database backup
│   └── utils/
│       ├── email_validator.py
│       └── password_generator.py
│
├── main.py                          # Entry point
├── requirements.txt                 # Python dependencies
├── .env.example                     # Example environment
└── README.md
```

### Frontend File Organization

```
frontend/
├── app/
│   ├── (auth)/                      # Route group for authentication
│   │   ├── layout.tsx               # Shared auth layout
│   │   ├── login/
│   │   │   ├── page.tsx             # Login page
│   │   │   ├── Login.tsx            # Login form component
│   │   │   └── Login.module.css     # Styles (common/light/dark)
│   │   ├── signup/
│   │   │   ├── page.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── Signup.module.css
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── verify-email/
│   │   └── passwordless/
│   │
│   ├── (main)/                      # Route group for landing pages
│   │   ├── layout.tsx               # Shared marketing layout
│   │   ├── page.tsx                 # Home (landing)
│   │   ├── about/
│   │   ├── pricing/
│   │   ├── faq/
│   │   ├── blog/
│   │   ├── compare/
│   │   ├── ai-matching/
│   │   ├── careers/
│   │   ├── contact/
│   │   └── [slug]/                  # Dynamic marketing pages
│   │       └── page.tsx
│   │
│   ├── (portal)/                    # Route group for authenticated users
│   │   ├── layout.tsx               # Portal layout with sidebar
│   │   │
│   │   ├── dashboard/
│   │   │   ├── page.tsx             # Main dashboard
│   │   │   ├── Dashboard.tsx        # Component
│   │   │   ├── Dashboard.common.module.css
│   │   │   ├── Dashboard.light.module.css
│   │   │   ├── Dashboard.dark.module.css
│   │   │   └── components/
│   │   │       ├── AnalyticsCard/
│   │   │       ├── RecentProjects/
│   │   │       └── MetricsOverview/
│   │   │
│   │   ├── client/                  # Client portal
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Client dashboard
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx         # My projects
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx     # Project detail
│   │   │   │   │   └── edit/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── proposals/
│   │   │   ├── payments/
│   │   │   └── settings/
│   │   │
│   │   ├── freelancer/              # Freelancer portal
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Freelancer dashboard
│   │   │   ├── browse/              # Browse projects
│   │   │   ├── my-proposals/
│   │   │   ├── portfolio/
│   │   │   ├── earnings/
│   │   │   └── settings/
│   │   │
│   │   ├── admin/                   # Admin dashboard
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   ├── projects/
│   │   │   ├── payments/
│   │   │   ├── support/
│   │   │   ├── ai-monitoring/
│   │   │   └── settings/
│   │   │
│   │   ├── messages/
│   │   │   ├── page.tsx             # Chat interface
│   │   │   ├── [conversationId]/
│   │   │   └── Messages/
│   │   │       ├── ChatWindow.tsx
│   │   │       ├── MessageList.tsx
│   │   │       ├── MessageInput.tsx
│   │   │       └── Messages.module.css
│   │   │
│   │   ├── notifications/
│   │   ├── audit-logs/
│   │   ├── search/
│   │   ├── help/
│   │   └── settings/
│   │
│   ├── components/                  # Shared UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.common.module.css
│   │   │   ├── Button.light.module.css
│   │   │   ├── Button.dark.module.css
│   │   │   └── Button.test.tsx
│   │   ├── Card/
│   │   ├── Form/
│   │   ├── Modal/
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Dropdown/
│   │   ├── Tabs/
│   │   ├── Pagination/
│   │   ├── Loading/
│   │   ├── ErrorBoundary/
│   │   └── ...
│   │
│   ├── layouts/
│   │   ├── AdminLayout.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── PortalLayout.tsx
│   │   └── AuthLayout.tsx
│   │
│   ├── lib/
│   │   ├── utils.ts                 # cn() helper, common utilities
│   │   ├── api-client.ts            # Fetch wrapper with auth
│   │   ├── validators.ts            # Zod schemas
│   │   ├── formatters.ts            # Date, currency formatting
│   │   ├── hooks.ts                 # Custom React hooks
│   │   └── constants.ts             # Constants and enums
│   │
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── SocketProvider.tsx
│   │
│   ├── styles/                      # Global styles
│   │   ├── globals.css
│   │   ├── layout.css
│   │   └── theme.css
│   │
│   └── api/
│       └── socket.io/               # If using app router for Socket.io
│
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── tests/
│   ├── components/
│   │   └── Button.test.tsx
│   ├── hooks/
│   ├── lib/
│   └── pages/
│
├── jest.config.js
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.mjs
├── playwright.config.ts
├── package.json
└── README.md
```

---

## 🔄 Common Development Patterns

### Backend: Adding a New API Endpoint

**Step 1: Define Schema (Pydantic)**
```python
# backend/app/schemas/project.py
from pydantic import BaseModel, Field, validator

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    budget: float = Field(..., gt=0)
    deadline: datetime
    category: str

    @validator('budget')
    def validate_budget(cls, v):
        if v > 1000000:
            raise ValueError('Budget cannot exceed $1M')
        return v

class ProjectRead(BaseModel):
    id: str
    title: str
    description: str
    budget: float
    client_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
```

**Step 2: Define Model (SQLAlchemy ORM)**
```python
# backend/app/models/project.py
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(String(5000), nullable=False)
    budget = Column(Float, nullable=False)
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="open")  # open, in_progress, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    client = relationship("User", back_populates="projects")
```

**Step 3: Create Service Layer**
```python
# backend/app/services/project_service.py
from app.models import Project
from app.schemas.project import ProjectCreate, ProjectRead
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

class ProjectService:
    @staticmethod
    async def create_project(
        session: AsyncSession,
        user_id: str,
        project_data: ProjectCreate
    ) -> ProjectRead:
        """Create a new project."""
        project = Project(
            id=str(uuid.uuid4()),
            client_id=user_id,
            **project_data.dict()
        )
        session.add(project)
        await session.commit()
        await session.refresh(project)
        return ProjectRead.model_validate(project)

    @staticmethod
    async def get_user_projects(
        session: AsyncSession,
        user_id: str
    ) -> List[ProjectRead]:
        """Get all projects for a user."""
        result = await session.execute(
            select(Project).where(Project.client_id == user_id)
        )
        projects = result.scalars().all()
        return [ProjectRead.model_validate(p) for p in projects]
```

**Step 4: Define Route Handler**
```python
# backend/app/api/routers/projects.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from app.core.security import get_current_user
from app.db.session import get_session
from app.services.project_service import ProjectService
from app.schemas.project import ProjectCreate, ProjectRead
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create a new project."""
    try:
        return await ProjectService.create_project(session, user_id, project_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[ProjectRead])
async def list_user_projects(
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List projects for the current user."""
    return await ProjectService.get_user_projects(session, user_id)
```

**Step 5: Add Tests**
```python
# backend/tests/test_projects.py
pytest_plugins = ["backend.tests.conftest"]

@pytest.mark.asyncio
async def test_create_project(async_session, client):
    """Test project creation."""
    project_data = {
        "title": "Build a website",
        "description": "Create a e-commerce website",
        "budget": 5000,
        "deadline": "2026-06-01",
        "category": "web-development"
    }

    response = await client.post(
        "/api/v1/projects",
        json=project_data,
        headers={"Authorization": "Bearer valid_token"}
    )

    assert response.status_code == 201
    assert response.json()["title"] == "Build a website"
```

---

### Frontend: Adding a New Component

**Step 1: Create Component Structure**
```tsx
// frontend/app/components/ProjectCard/ProjectCard.tsx
'use client';

import { Project } from '@/lib/types';
import styles from './ProjectCard.common.module.css';
import lightStyles from './ProjectCard.light.module.css';
import darkStyles from './ProjectCard.dark.module.css';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface ProjectCardProps {
  project: Project;
  onClick?: (id: string) => void;
  variant?: 'minimal' | 'full';
}

export default function ProjectCard({
  project,
  onClick,
  variant = 'full'
}: ProjectCardProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <article
      className={cn(styles.card, themeStyles.container)}
      role="region"
      aria-label={`Project: ${project.title}`}
      onClick={() => onClick?.(project.id)}
    >
      <header className={cn(styles.header, themeStyles.header)}>
        <h3 className={cn(styles.title, themeStyles.title)}>
          {project.title}
        </h3>
        <span className={cn(styles.badge, themeStyles[`badge_${project.status}`])}>
          {project.status}
        </span>
      </header>

      {variant === 'full' && (
        <section className={cn(styles.content, themeStyles.content)}>
          <p className={styles.description}>{project.description}</p>
          <div className={styles.metadata}>
            <span>${project.budget.toLocaleString()}</span>
            <time>{new Date(project.deadline).toLocaleDateString()}</time>
          </div>
        </section>
      )}
    </article>
  );
}
```

**Step 2: Create Common Styles (Layout)**
```css
/* frontend/app/components/ProjectCard/ProjectCard.common.module.css */
.card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 1rem;
  cursor: pointer;
  transition: all 200ms ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
  white-space: nowrap;
  margin-left: 0.5rem;
}

.content {
  flex: 1;
}

.description {
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.metadata {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .card {
    padding: 0.75rem;
  }

  .title {
    font-size: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .badge {
    margin-left: 0;
  }
}
```

**Step 3: Create Theme Styles (Light)**
```css
/* frontend/app/components/ProjectCard/ProjectCard.light.module.css */
.container {
  background-color: #ffffff;
  color: #1f2937;
}

.header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.75rem;
}

.title {
  color: #111827;
}

.badge_open {
  background-color: #dbeafe;
  color: #0c4a6e;
}

.badge_in_progress {
  background-color: #fef3c7;
  color: #92400e;
}

.badge_completed {
  background-color: #dcfce7;
  color: #166534;
}

.content {
  color: #4b5563;
}
```

**Step 4: Create Theme Styles (Dark)**
```css
/* frontend/app/components/ProjectCard/ProjectCard.dark.module.css */
.container {
  background-color: #1f2937;
  color: #f3f4f6;
}

.header {
  border-bottom: 1px solid #374151;
  padding-bottom: 0.75rem;
}

.title {
  color: #f9fafb;
}

.badge_open {
  background-color: #0c4a6e;
  color: #dbeafe;
}

.badge_in_progress {
  background-color: #92400e;
  color: #fef3c7;
}

.badge_completed {
  background-color: #166534;
  color: #dcfce7;
}

.content {
  color: #d1d5db;
}
```

**Step 5: Add TypeScript Types**
```typescript
// frontend/app/lib/types.ts
export interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'open' | 'in_progress' | 'completed';
  createdAt: string;
  deadline: string;
  clientId: string;
  freelancerId?: string;
}
```

**Step 6: Add Tests**
```tsx
// frontend/tests/components/ProjectCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import ProjectCard from '@/app/components/ProjectCard/ProjectCard';

const mockProject = {
  id: '1',
  title: 'Build a website',
  description: 'Professional e-commerce site',
  budget: 5000,
  status: 'open' as const,
  createdAt: '2026-03-24',
  deadline: '2026-06-01',
  clientId: 'client-123'
};

describe('ProjectCard', () => {
  it('renders project information', () => {
    render(
      <ThemeProvider attribute="class">
        <ProjectCard project={mockProject} />
      </ThemeProvider>
    );

    expect(screen.getByText('Build a website')).toBeInTheDocument();
    expect(screen.getByText(/Professional e-commerce/)).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });

  it('is accessible', () => {
    const { container } = render(
      <ThemeProvider attribute="class">
        <ProjectCard project={mockProject} />
      </ThemeProvider>
    );

    const article = container.querySelector('article');
    expect(article).toHaveAttribute('role', 'region');
    expect(article).toHaveAttribute('aria-label');
  });
});
```

---

## 🔐 Security Implementation Details

### JWT Authentication Flow
```
1. User Login → POST /api/v1/auth/login
   ↓
2. Server validates credentials → Hashes password with bcrypt
   ↓
3. Server generates JWT →
   - Headers: { alg: HS256, typ: JWT }
   - Payload: { sub: user_id, email, role, exp: now+1h, iat: now }
   - Signature: HMAC-SHA256(base64url(header) + "." + base64url(payload), SECRET)
   ↓
4. Server returns tokens →
   - Access token (1h): { token, expires_in }
   - Refresh token (7d): HttpOnly cookie
   ↓
5. Frontend stores access token in memory (not localStorage)
   ↓
6. Frontend sends JWT with every request → Authorization: Bearer <token>
   ↓
7. Server validates JWT signature → Decodes payload → Checks expiration
   ↓
8. If expired → POST /api/v1/auth/refresh → Returns new access token
```

### Password Security
```python
# backend/app/core/security.py
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password with bcrypt (cost=12)."""
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """Verify plain password against bcrypt hash."""
    return pwd_context.verify(password, hashed)

# Usage:
hashed = hash_password("user_password_123")  # Store this
is_valid = verify_password("user_password_123", hashed)  # Verify on login
```

### Input Validation (Backend + Frontend)
```python
# Backend: Pydantic validates automatically
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr  # Validates email format
    password: str = Field(..., min_length=8, max_length=128)
    first_name: str = Field(..., min_length=1, max_length=50)

# Frontend: Zod validates before submit
import { z } from 'zod';

const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(50)
});

// Usage in form
const form = useForm({
  resolver: zodResolver(userCreateSchema),
  // ...
});
```

---

## 🚀 Performance Optimization Strategies

### Backend
1. **Database Indexing**: Index on foreign keys, frequently queried columns
2. **Query Optimization**: Use `select()` with specific columns, avoid N+1
3. **Caching**: Redis cache for user profiles, AI scores (24h TTL)
4. **Pagination**: Always paginate list endpoints (20-50 items/page default)
5. **Compression**: GZip middleware enabled in FastAPI
6. **Rate Limiting**: Prevent brute force attacks

### Frontend
1. **Code Splitting**: Dynamic imports for large components
2. **Image Optimization**: Next.js Image component with AVIF format
3. **CSS-in-JS**: CSS modules for scoped styling (no runtime overhead)
4. **Memoization**: UseMemo/useCallback for expensive computations
5. **Virtual Lists**: For long lists (100+ items)
6. **Lazy Loading**: Intersection Observer for below-fold content

---

**Last Updated**: March 24, 2026
**Revision**: 1.0
