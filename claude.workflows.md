# Claude Development Workflows Guide

**Purpose**: Establish proven workflows for efficient, high-quality development
**Version**: 1.0 (March 24, 2026)

---

## 🔄 Standard Development Workflow

### Phase 1: Task Understanding (5-10 min)
1. Read task description carefully
2. Identify affected components (frontend/backend/database)
3. Check if similar features exist
4. Clarify ambiguous requirements
5. Define acceptance criteria

**Checklist**:
- [ ] Understand what needs to be built
- [ ] Know why it's needed (business context)
- [ ] Have identified related existing code
- [ ] Know acceptance criteria
- [ ] Identified potential blockers

### Phase 2: Design & Planning (10-20 min)
1. Sketch database schema changes (if any)
2. Outline API endpoints
3. Plan component hierarchy (frontend)
4. Identify reusable patterns
5. Note potential security concerns
6. Estimate complexity

**Decisions to Make**:
- [ ] Database changes needed?
- [ ] New API endpoints?
- [ ] New components or modify existing?
- [ ] Breaking changes?
- [ ] Test strategy?

### Phase 3: Implementation (30-60 min)
1. Start with lowest layer (database → backend → frontend)
2. Write code incrementally
3. Add tests as you go
4. Stop and ask if stuck >5 minutes
5. Verify type safety (TypeScript/Python)
6. Run linting/formatting

**The Order**:
```
Backend:
1. Pydantic schema (validation)
2. SQLAlchemy model (database)
3. Service layer (business logic)
4. Route handler (API endpoint)
5. Error handling + logging
6. Tests

Frontend:
1. Component structure (TypeScript)
2. Props interface
3. HTML/JSX markup
4. CSS modules (all variants)
5. Accessibility (ARIA)
6. Tests
```

### Phase 4: Testing (15-30 min)
1. Run unit tests
2. Run integration tests
3. Run build verification
4. Manual testing if complex
5. Check console for warnings
6. Verify test coverage

**Test Checklist**:
- [ ] Backend: `pytest tests/ -v`
- [ ] Frontend: `npm run test:unit`
- [ ] Build: `npm run build` (frontend), `python -m py_compile app/**/*.py`
- [ ] No TS/Python errors
- [ ] No console warnings
- [ ] Coverage targets met

### Phase 5: Documentation & Commit (5-10 min)
1. Update relevant README/docs
2. Add code comments if non-obvious
3. Stage changes: `git add [files]`
4. Create focused commit
5. Commit message format:
   ```
   feat: add feature name

   - Specific change 1
   - Specific change 2

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```

---

## 🛠️ Workflow: Adding New API Endpoint

### Step 1: Create Pydantic Schema
```python
# backend/app/schemas/

from pydantic import BaseModel, Field

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    # ... other fields

class ItemRead(ItemCreate):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True
```

### Step 2: Add SQLAlchemy Model
```python
# backend/app/models/

class Item(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    # ... other columns
```

### Step 3: Create Service Layer
```python
# backend/app/services/

class ItemService:
    @staticmethod
    async def create_item(session, user_id, data):
        item = Item(id=str(uuid.uuid4()), **data.dict())
        session.add(item)
        await session.commit()
        return ItemRead.model_validate(item)

    @staticmethod
    async def list_items(session, user_id):
        # Query with proper filtering
        pass
```

### Step 4: Add Route Handler
```python
# backend/app/api/routers/

@router.post("/items", response_model=ItemRead)
async def create_item(
    data: ItemCreate,
    user_id: str = Depends(get_current_user),
    session = Depends(get_session)
):
    return await ItemService.create_item(session, user_id, data)
```

### Step 5: Write Tests
```python
# backend/tests/test_items.py

@pytest.mark.asyncio
async def test_create_item(client, auth_header):
    response = await client.post(
        "/api/v1/items",
        json={"name": "Test"},
        headers=auth_header
    )
    assert response.status_code == 201
```

### Step 6: Commit
```bash
git add backend/app/schemas/item.py backend/app/models/item.py backend/app/services/item_service.py backend/app/api/routers/item.py backend/tests/test_item.py
git commit -m "feat: add item management endpoint"
```

---

## 🎨 Workflow: Adding New React Component

### Step 1: Create Component File
```tsx
// frontend/app/components/ItemCard/ItemCard.tsx

'use client';

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  return <article>...</article>;
}
```

### Step 2: Create CSS Modules
```css
/* .common.module.css - Layout only */
/* .light.module.css - Light theme */
/* .dark.module.css - Dark theme */
```

### Step 3: Add ARIA & Accessibility
```tsx
<article
  role="region"
  aria-label={`Item: ${item.name}`}
>
  <h3>{item.name}</h3>
</article>
```

### Step 4: Write Tests
```tsx
// frontend/tests/components/ItemCard.test.tsx

describe('ItemCard', () => {
  it('renders item name', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });
});
```

### Step 5: Commit
```bash
git add frontend/app/components/ItemCard/
git commit -m "feat: add ItemCard component"
```

---

## 🧪 Workflow: Testing & Bug Fixing

### For Bug Fixes:
1. **Create failing test** that reproduces bug
2. **Run test** to confirm it fails
3. **Fix the bug**
4. **Run test** to confirm it passes
5. **Run all tests** to ensure no regression
6. **Commit** with fix

```bash
# Create test with failing assertion
npm run test -- ItemCard.test.tsx  # See it fail

# Fix code
# ...

npm run test -- ItemCard.test.tsx  # See it pass
npm run test:all  # No regressions

git add frontend/app/components/ItemCard/ItemCard.tsx frontend/tests/components/ItemCard.test.tsx
git commit -m "fix: ItemCard rendering issue"
```

### For Test Coverage:
```bash
# Check coverage
npm run test -- --coverage

# Target:
# - Authentication: 90%
# - Payments: 90%
# - Project CRUD: 85%
# - Components: 70%+

# If coverage low:
# 1. Identify uncovered lines
# 2. Write tests for edge cases
# 3. Run coverage again
```

---

## 📊 Workflow: Performance Optimization

### Backend Optimization
```bash
# 1. Identify slow queries
# Add timing to logs: time.time() start/end

# 2. Analyze query
# Check for N+1 problems
# Use SQLAlchemy select() with proper joins

# 3. Add indexes if needed
# Review migration in alembic/versions/

# 4. Test performance
pytest tests/ -v -k "test_name"

# 5. Measure improvement
# Before: 500ms
# After: 50ms ✓
```

### Frontend Optimization
```bash
# 1. Check bundle size
npm run build
# Review .next/static files

# 2. Lazy load components
const HeavyComponent = dynamic(() => import('./Heavy'));

# 3. Memoize expensive computations
const memoized = useMemo(() => compute(), [deps]);

# 4. Run Lighthouse
npm run test:lighthouse

# 5. Target improvements
# FCP: < 2s
# LCP: < 2.5s
# CLS: < 0.1
```

---

## 🔐 Workflow: Security Improvements

### Code Security Review
```bash
# 1. Check for vulnerabilities
npm audit  # Frontend
pip check  # Backend

# 2. Review for OWASP Top 10
# - SQL Injection: Using ORM? ✓
# - XSS: Sanitizing input? Check DOMPurify
# - CSRF: Tokens on mutations?
# - Authentication: JWT working?
# - Sensitive data: Never logged?

# 3. Test edge cases
# - Empty input: Validated?
# - Null input: Handled?
# - Large input: Rate limited?
# - Invalid input: Error message safe?

# 4. Fix vulnerabilities
# Add validation, error handling, etc.

# 5. Test fixes
npm run test:all && pytest tests/ -v
```

---

## 🚀 Workflow: Deployment Preparation

### Pre-Deployment Checklist
```bash
# 1. Run all tests
npm run test:all
pytest tests/ -v

# 2. Build both projects
npm run build
python -m py_compile app/**/*.py

# 3. Check for errors
# - Console errors? ✗
# - Type errors? ✗
# - Linting issues? ✗

# 4. Run security audit
npm audit --audit-level=moderate
pip audit

# 5. Database migrations
# - Written correctly?
# - Tested locally?
# - Rollback plan?

# 6. Environment variables
# - All set in CI/CD?
# - Secrets encrypted?

# 7. Create deployment commit
git tag v1.2.3
git push origin v1.2.3
```

---

## 📋 Quick Reference: Common Commands

### Backend Commands
```bash
cd backend

# Start development
python -m uvicorn main:app --reload --port 8000

# Run tests
pytest tests/ -v
pytest tests/ -v --cov=app

# Format code
python -m black app/
python -m isort app/

# Database migrations
alembic upgrade head
alembic downgrade -1

# Build check
python -m py_compile app/**/*.py
```

### Frontend Commands
```bash
cd frontend

# Start development
npm run dev

# Run tests
npm run test:unit
npm run test:e2e
npm run test:all

# Build
npm run build

# Format & lint
npm run lint
npx prettier --write .

# Check types
npx tsc --noEmit
```

### Git Commands
```bash
# View changes
git status
git diff [file]

# Stage and commit
git add [files]
git commit -m "message"

# View recent commits
git log --oneline -10

# Create feature branch (if using)
git checkout -b feature/name
git push origin feature/name
```

---

## 🎯 Workflow: Code Review Self-Checklist

Before committing, verify:

**Type Safety**:
- [ ] TypeScript: `npx tsc --noEmit`
- [ ] Python: Type hints on all functions
- [ ] No `any` types (except where unavoidable)

**Testing**:
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Coverage adequate
- [ ] No console warnings

**Code Quality**:
- [ ] No dead code
- [ ] DRY principle followed
- [ ] Functions <30 lines
- [ ] Clear variable names
- [ ] Comments only for "why", not "what"

**Accessibility (Frontend)**:
- [ ] ARIA labels on interactive elements
- [ ] Semantic HTML
- [ ] Color contrast: WCAG AA minimum
- [ ] Keyboard navigation works

**Security**:
- [ ] Input validated (backend + frontend)
- [ ] No hardcoded secrets
- [ ] XSS prevention (DOMPurify)
- [ ] CSRF tokens on mutations
- [ ] Sensitive data not logged

**Performance**:
- [ ] No N+1 queries
- [ ] Appropriate caching
- [ ] No unnecessary re-renders
- [ ] Bundle size reasonable

**Documentation**:
- [ ] Docstrings on public functions
- [ ] README updated if needed
- [ ] Breaking changes documented

---

## 🔄 Workflow: Handling Merge Conflicts

```bash
# 1. Pull latest from main
git pull origin main

# 2. Identify conflicts
git status  # Shows conflicted files

# 3. Open conflicted file

# 4. Resolve manually
# <<<<< HEAD (your changes)
# code version 1
# =======
# code version 2
# >>>>> main

# 5. Choose correct version and remove markers
# 6. Test the resolution

# 7. Stage and commit
git add [resolved files]
git commit -m "resolve merge conflicts"

# 8. Push
git push origin [branch]
```

---

## 🚨 Workflow: Handling Production Issues

### If Bug in Production:
1. **Stop talking and start investigating**
   - Check log/error traceback
   - Identify affected users/feature
   - Estimate blast radius

2. **Create hotfix branch**
   ```bash
   git checkout -b hotfix/bug-name
   ```

3. **Write failing test**
   - Create test that reproduces issue
   - Verify test fails

4. **Fix the bug**
   - Minimal change only
   - Verify test passes

5. **Run all tests**
   - No new regressions

6. **Commit & deploy**
   ```bash
   git commit -m "fix: production issue"
   git push
   # Deploy immediately
   ```

7. **Post-mortem**
   - Why wasn't this caught?
   - Add test to prevent recurrence
   - Improve process

---

## ✅ Success Metrics

**Per Task**:
- ✅ Code compiles without errors
- ✅ All tests pass (backend + frontend)
- ✅ No console warnings
- ✅ TypeScript strict mode passes
- ✅ Coverage targets met
- ✅ Accessibility verified
- ✅ Security reviewed
- ✅ Git commit with clear message

**Over Sprint**:
- ✅ 0 regressions in production
- ✅ Test coverage maintained/improved
- ✅ No critical security issues
- ✅ Performance metrics stable/improved
- ✅ All PR reviews completed
- ✅ Documentation up-to-date

---

**Last Updated**: March 24, 2026
**Version**: 1.0
