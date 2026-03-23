# Claude Code Configuration - MegiLance 2.0

**Project**: Full-stack AI-Powered Freelancing Platform
**Documentation Date**: March 24, 2026
**Version**: 2.0 (Production Ready)

---

## 🎯 Quick Identity

**Claude's Role**: Full-stack development assistant focused on Next.js (frontend) and FastAPI (backend) with emphasis on type safety, performance, and AI integration.

**Stack**:
- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS + Radix UI
- **Backend**: FastAPI + Python 3.11+ + Turso (LibSQL) + SQLAlchemy 2.0
- **Database**: Turso (remote only, no local SQLite)
- **Auth**: JWT tokens + Multi-factor authentication (6 methods)
- **Real-time**: Socket.io for messaging & notifications
- **Testing**: Jest (frontend), Pytest (backend), Playwright (E2E)
- **Deployment**: DigitalOcean (backend), Vercel (frontend)

---

## 📁 Project Structure

```
MegiLance/
├── backend/                          # FastAPI application
│   ├── app/
│   │   ├── api/routers/              # Route handlers (auth, projects, profiles, etc.)
│   │   ├── core/                     # Config, security, rate limiting
│   │   ├── db/                       # Database session, initialization
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   ├── schemas/                  # Pydantic validation schemas
│   │   ├── services/                 # Business logic (payments, AI, rankings)
│   │   ├── templates/                # Email templates
│   │   └── __init__.py
│   ├── tests/
│   │   ├── test_e2e_complete_flows.py   # End-to-end workflow tests
│   │   ├── test_auth.py                  # Authentication tests
│   │   ├── test_projects.py              # Project operations
│   │   └── test_profiles.py              # Profile management
│   ├── alembic/                      # Database migrations
│   ├── scripts/                      # Utility scripts
│   ├── main.py                       # Entry point
│   └── requirements.txt              # Python dependencies
│
├── frontend/                         # Next.js application
│   ├── app/
│   │   ├── (auth)/                   # Auth route group (login, signup, etc.)
│   │   ├── (main)/                   # Landing pages (home, about, pricing, etc.)
│   │   ├── (portal)/                 # Protected portal (dashboard, messages, etc.)
│   │   │   ├── dashboard/
│   │   │   ├── client/               # Client portal
│   │   │   ├── freelancer/           # Freelancer portal
│   │   │   ├── admin/                # Admin dashboard
│   │   │   ├── messages/             # Chat interface
│   │   │   ├── projects/             # Projects management
│   │   │   └── ...
│   │   ├── components/               # Reusable UI components
│   │   ├── lib/                      # Utilities (API client, helpers)
│   │   └── api/                      # Route handlers (if needed)
│   ├── public/                       # Static assets
│   ├── tests/                        # Test files
│   ├── jest.config.js
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── architecture/                 # Architecture decisions
│   ├── api/                          # API documentation
│   ├── deployment/                   # Deployment guides
│   └── development/                  # Developer guides
│
└── .github/
    └── workflows/                    # CI/CD pipelines
```

---

## 🔑 Key Files & Entry Points

### Backend
| File | Purpose | Key Notes |
|------|---------|-----------|
| `backend/main.py` | FastAPI entry point | JSON logging, error handling, rate limiting |
| `backend/app/core/config.py` | Environment configuration | Turso DB settings, JWT secrets, CORS |
| `backend/app/db/session.py` | Database session management | Turso async connection pooling |
| `backend/app/models/` | SQLAlchemy ORM models | User, Project, Proposal, Review, etc. |
| `backend/app/api/routers/` | Route handlers | Organized by feature (auth, projects, etc.) |
| `backend/app/services/` | Business logic | Payments, AI, rankings, notifications |

### Frontend
| File | Purpose | Key Notes |
|------|---------|-----------|
| `frontend/next.config.js` | Next.js configuration | PWA, image optimization |
| `frontend/app/lib/utils.ts` | Helper functions | API client, validation, formatting |
| `frontend/app/components/` | Reusable components | Button, Card, Form, Modal, etc. |
| `frontend/app/(portal)/dashboard/` | Main user dashboard | Different for Client/Freelancer/Admin |
| `frontend/app/(main)/` | Landing pages | Public-facing marketing pages |

---

## 🚀 Development Workflow

### Starting Development
```bash
# Terminal 1: Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Testing (optional)
cd backend
pytest tests/ -v  # or: npm run test:e2e
```

### API Base URLs
- **Backend API**: `http://localhost:8000`
- **Frontend**: `http://localhost:3000`
- **API Docs**: `http://localhost:8000/docs` (Swagger)

### Environment Variables
Backend requires:
- `TURSO_DATABASE_URL` - Turso database URL
- `TURSO_AUTH_TOKEN` - Turso authentication token
- `JWT_SECRET_KEY` - JWT signing key (min 32 chars)
- `JWT_ALGORITHM` - "HS256" or "RS256"
- `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email config

Frontend (`.env.local`):
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SOCKET_URL` - WebSocket URL for real-time features

---

## 💭 Code Style & Conventions

### Backend (FastAPI/Python)
```python
# ✅ DO: Type hints, docstrings, async where appropriate
async def get_user_projects(user_id: str) -> list[ProjectSchema]:
    """Retrieve all projects for a user."""
    projects = await db.query(Project).filter(Project.user_id == user_id).all()
    return [ProjectSchema.model_validate(p) for p in projects]

# ❌ DON'T: Missing types, unclear variable names, synchronous I/O
def get_projects(id):
    return query("SELECT * FROM projects WHERE user_id = ?", (id,))
```

**Rules**:
- Always use async/await for I/O operations
- Type hints required for function arguments and returns
- Pydantic schemas for API request/response contracts
- One router file per feature domain (auth, projects, profiles, etc.)
- Services layer for complex business logic
- Error handling with FastAPI HTTPException
- Rate limiting via `slowapi` limiter decorator
- Comprehensive docstrings for public functions

### Frontend (Next.js/React/TypeScript)
```tsx
// ✅ DO: Typed components, proper exports, accessibility
interface ProjectCardProps {
  project: Project;
  onSelect?: (id: string) => void;
}

export default function ProjectCard({ project, onSelect }: ProjectCardProps) {
  return (
    <article className={styles.card} role="region" aria-label={project.title}>
      <h3>{project.title}</h3>
      {/* ... */}
    </article>
  );
}

// ❌ DON'T: Untyped props, default exports in index files
export default function Card(props) {
  return <div>{props.title}</div>;
}
```

**Rules**:
- Always use TypeScript (strict mode)
- Named exports for components (use default only for routes)
- CSS modules per component: `.common.module.css`, `.light.module.css`, `.dark.module.css`
- Use `cn()` utility to merge Tailwind + theme classes
- Server components by default (mark client components with `'use client'`)
- Prop interfaces named `ComponentNameProps`
- Accessibility: ARIA labels, semantic HTML, color contrast
- No inline styles; use Tailwind or CSS modules
- Framer Motion for animations, not CSS transitions

---

## 🔒 Security Best Practices

### Backend
- **JWT**: Expires in 1 hour (access), 7 days (refresh)
- **Password**: Hashed with bcrypt (cost=12), never logged
- **CORS**: Restricted to known origins
- **Rate Limiting**: 100 req/min per IP with slowapi
- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection**: Use SQLAlchemy ORM (parameterized queries)
- **HTTPS**: Required in production; use `SECURE_HSTS_SECONDS`
- **Secrets**: Never commit `.env` files; use environment variables

### Frontend
- **CSRF**: Use HTTP-only cookies for JWT tokens
- **XSS**: Sanitize user input with DOMPurify
- **Content Security Policy**: Configure in `next.config.js`
- **Dependency Scanning**: Keep packages updated (`npm audit fix`)
- **API calls**: Always validate responses with Zod schemas
- **File uploads**: Client-side validation (type/size); backend verifies again
- **Error handling**: Never expose internal error details to users

---

## 🧪 Testing Strategy

### Backend Tests
```python
# Location: backend/tests/test_*.py
# Run: pytest tests/ -v
# Coverage: pytest --cov=app tests/

# Unit tests for services
# Integration tests with test database (Turso)
# E2E tests for complete workflows
```

### Frontend Tests
```bash
# Unit/Component tests
npm run test:unit

# E2E tests with Playwright
npm run test:e2e

# Accessibility audit
npm run test:a11y

# Lighthouse performance
npm run test:lighthouse
```

**Coverage Goals**: ≥80% for critical paths (auth, payments, file upload)

---

## 🤖 AI Features & Integrations

### AI Services (Backend)
1. **Talent Ranking**: ML model scores freelancers based on reviews, projects, skills
2. **Sentiment Analysis**: Flag malicious reviews automatically
3. **Price Forecasting**: Estimate market-rate pricing for project types
4. **Fraud Detection**: Behavioral analysis to identify suspicious accounts
5. **Smart Matching**: Recommend freelancers to clients using embeddings

**Location**: `backend/app/services/ai/`

### Integration Points
- Endpoints: All AI scoring/analysis exposed via REST API
- Async: All AI operations run in background tasks (Celery or FastAPI BackgroundTasks)
- Caching: Results cached 24 hours to reduce compute

---

## 📊 Database Schema

### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User accounts | id, email, password_hash, role (client/freelancer/admin) |
| `profiles` | Extended user data | user_id, bio, avatar, skills, certifications |
| `projects` | Project listings | id, title, description, budget, status, client_id |
| `proposals` | Freelancer applications | id, project_id, freelancer_id, bid_amount, status |
| `contacts` | Messages/chats | id, sender_id, receiver_id, content, created_at |
| `reviews` | Project feedback | id, project_id, reviewer_id, rating, comment |
| `payments` | Transaction records | id, project_id, amount, status, gateway (stripe/crypto) |

**Migrations**: Via Alembic (`backend/alembic/versions/`)

---

## 📝 Common Tasks

### Add a New API Endpoint
1. Create schema in `backend/app/schemas/`
2. Add database model in `backend/app/models/`
3. Implement service logic in `backend/app/services/`
4. Add route handler in `backend/app/api/routers/`
5. Add tests in `backend/tests/`
6. Document in docstring

### Add a Frontend Component
1. Create component file: `frontend/app/components/ComponentName/ComponentName.tsx`
2. Create styles:
   - `ComponentName.common.module.css` (layout)
   - `ComponentName.light.module.css` (light colors)
   - `ComponentName.dark.module.css` (dark colors)
3. Export from component index or directly in route
4. Add TypeScript interface for props
5. Add accessibility: ARIA labels, semantic HTML
6. Add Jest tests in `frontend/tests/`

### Debug Backend Issues
```bash
# Check logs (JSON format)
curl http://localhost:8000/health

# View API documentation
open http://localhost:8000/docs

# Check database connection
python -c "from app.db.session import get_engine; print(get_engine().url)"

# Run tests with verbose output
pytest tests/ -vv -s --tb=short
```

### Debug Frontend Issues
```bash
# Check console errors in browser DevTools
# Enable debug logging: localStorage.setItem('debug', 'megilance:*')
# Check network tab in DevTools for API calls
# Use React DevTools browser extension
npm run dev -- --debug
```

---

## ✅ Checklist Before Deployment

- [ ] All tests pass: `npm run test:all && pytest tests/ -v`
- [ ] Build succeeds: `npm run build` (frontend), `python -m py_compile app/**/*.py` (backend)
- [ ] No console errors or warnings in DevTools
- [ ] Environment variables set in CI/CD
- [ ] Database migrations applied
- [ ] API health check passes: `curl http://localhost:8000/health`
- [ ] Frontend loads at `http://localhost:3000`
- [ ] All critical user workflows tested (see WORKFLOW_VERIFICATION_GUIDE.md)
- [ ] Security audit passed (OWASP, dependency scanning)
- [ ] Lighthouse score ≥80 for Performance, Accessibility, Best Practices

---

## 🔗 Important Links

- **GitHub**: https://github.com/ghulam-mujtaba5/MegiLance
- **Docs**: `/docs/architecture/`, `/docs/api/`
- **Turso Console**: https://app.turso.io
- **DigitalOcean App Platform**: https://cloud.digitalocean.com/apps
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 📞 Communication Preferences

- **Code Review**: Inline comments with context
- **Explanation Depth**: Full analysis only when asked; otherwise be concise
- **Error Handling**: Proactive identification with fix suggestions
- **Documentation**: Update existing docs vs. creating new ones when possible
- **Git**: Single new commit per task (not amendments) with Co-Authored-By footer

---

## 🎓 Agent Capabilities

Claude can autonomously:
- ✅ Read and analyze existing code
- ✅ Write new features following project conventions
- ✅ Create tests with full coverage
- ✅ Fix bugs and refactor code
- ✅ Optimize database queries
- ✅ Generate API documentation
- ✅ Audit security and accessibility
- ✅ Run local tests and scripts
- ✅ Create Git commits with proper messages
- ✅ Suggest architectural improvements

Claude should ask before:
- ❓ Pushing to production branches
- ❓ Modifying CI/CD pipelines
- ❓ Creating breaking changes
- ❓ Removing existing features
- ❓ Changing database schemas (especially production)

---

## 🚨 Emergency Contacts

**For blocking issues**:
1. Check existing docs in `/docs/`
2. Review `PLATFORM_ISSUES.md` for known problems
3. Run workflow verification: `python verify-workflows.py`
4. Check git status: `git status` and recent commits
5. Ask for clarification if unsure

---

**Last Updated**: March 24, 2026
**Maintained By**: AI Development Team
