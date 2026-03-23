# MegiLance Complete Workflow Verification Guide

**Last updated:** March 24, 2026
**Professor Requirement:** Complete all role workflows (Client + Freelancer) with validation, testing, and verification

---

## 📋 Quick Start: Verification Checklist

### ✅ Pre-requisites
- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Database (Turso) configured and accessible
- [ ] All required environment variables set in `.env`

### ✅ How to Run Tests

**Backend E2E Tests:**
```bash
cd backend
python -m pytest tests/test_e2e_complete_flows.py -v
```

**Frontend & API Together:**
```bash
# Terminal 1: Start backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Run E2E tests
cd backend
python -m pytest tests/test_e2e_complete_flows.py -v
```

---

## 🎯 CLIENT WORKFLOW VERIFICATION

### Phase 1: Authentication & Registration
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. Go to signup page
2. Register new client account with email
3. Verify email (check inbox)
4. Login with credentials
5. Select "Client" role during onboarding

**Validation Points:**
- [x] Email format validation
- [x] Password strength requirements
- [x] Email verification link works
- [x] Session persists after login

**API Endpoints to Test:**
- `POST /api/auth/register` - Client registration
- `POST /api/auth/login` - Client login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/refresh` - Token refresh

---

### Phase 2: Profile & Portfolio Management
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. Login as client
2. Go to Profile settings
3. Fill in all profile fields:
   - Full name
   - Company name
   - Phone number
   - Profile image/avatar
4. Submit and verify save
5. Edit and modify a field
6. View profile (public visibility)

**Validation Points:**
- [x] Required fields validation
- [x] Name length limits
- [x] Phone format validation
- [x] Image upload & size validation
- [x] Profile visibility toggle works

**API Endpoints to Test:**
- `GET /api/clients/{id}/profile` - Get profile
- `PUT /api/clients/{id}/profile` - Update profile
- `POST /api/clients/{id}/profile/avatar` - Upload avatar
- `PUT /api/clients/{id}/settings` - Update settings

---

### Phase 3: Project Creation & Posting
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. Click "Post New Project"
2. Fill project form:
   - Title (e.g., "Website Redesign")
   - Description
   - Category (select from dropdown)
   - Required skills (multi-select)
   - Budget type (fixed or hourly)
   - Budget amount
   - Deadline
   - Attachments
3. Submit project
4. Verify project appears in dashboard
5. Verify project is visible to freelancers

**Validation Points:**
- [x] Title required and length validated
- [x] Description min/max length validated
- [x] Budget must be positive number
- [x] Deadline must be future date
- [x] At least one skill selected
- [x] File upload size limits enforced
- [x] Proper error messages shown

**API Endpoints to Test:**
- `POST /api/clients/projects` - Create project
- `GET /api/clients/projects` - List my projects
- `PUT /api/clients/projects/{id}` - Update project
- `DELETE /api/clients/projects/{id}` - Delete project
- `POST /api/clients/projects/{id}/close` - Close project
- `POST /api/projects/{id}/attach` - Upload attachment

---

### Phase 4: Proposals & Freelancer Selection
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. Create a project and wait for proposals
2. Go to Project Details
3. View all received proposals
4. View freelancer profile from proposal
5. Filter proposals (pending, accepted, rejected)
6. Accept a proposal
7. Verify contract created
8. Send message to freelancer

**Validation Points:**
- [x] Proposals display correctly
- [x] Freelancer info accessible from proposal
- [x] Accept action creates contract
- [x] Rejection reasons can be provided
- [x] Messaging system works
- [x] Only client can accept/reject own proposals

**API Endpoints to Test:**
- `GET /api/projects/{id}/proposals` - List proposals
- `POST /api/proposals/{id}/accept` - Accept proposal
- `POST /api/proposals/{id}/reject` - Reject proposal
- `GET /api/contracts` - List contracts
- `POST /api/messages` - Send message

---

### Phase 5: Project Collaboration & Management
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. After hiring freelancer:
   - View active projects dashboard
   - Click on active project
   - View project files/requirements
   - Download project files
   - View freelancer deliverables
   - Message with freelancer
   - Track project progress

**Validation Points:**
- [x] Dashboard shows accurate project count
- [x] File management works
- [x] Real-time messaging functions
- [x] Project timeline tracked
- [x] Milestones can be set
- [x] Only hired freelancer visible in messages

**API Endpoints to Test:**
- `GET /api/clients/dashboard` - Dashboard metrics
- `GET /api/contracts/{id}/files` - Project files
- `POST /api/contracts/{id}/upload` - Upload deliverable
- `GET /api/contracts/{id}/messages` - Conversation history
- `POST /api/messages` - Send message

---

### Phase 6: Reviews & Ratings
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. Complete project with freelancer
2. View freelancer profile
3. Submit review and rating
4. Verify review appears on freelancer profile

**Validation Points:**
- [x] Rating scale (1-5) enforced
- [x] Review text length validated
- [x] Only clients can review freelancers
- [x] Reviews are immutable after submission

**API Endpoints to Test:**
- `POST /api/reviews` - Submit review
- `GET /api/freelancers/{id}/reviews` - View reviews

---

## 🎯 FREELANCER WORKFLOW VERIFICATION

### Phase 1: Authentication & Registration
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. Go to signup page
2. Register new freelancer account
3. Verify email
4. Login with credentials
5. Select "Freelancer" role during onboarding

**Validation Points:**
- [x] Email/password validation same as client
- [x] Freelancer role selection works
- [x] Session management

**API Endpoints to Test:**
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/email-verify` - Verify

---

### Phase 2: Portfolio & Profile Creation
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. Login as freelancer
2. Go to Profile page
3. Complete all profile fields:
   - Name
   - Professional title
   - Bio/About
   - Profile image
   - Hourly rate
   - Skills (add 3-5)
   - Experience level
4. Add portfolio items:
   - Add case study
   - Upload images
   - Add description
   - Add project link
5. Add certifications
6. View profile (public visibility)

**Validation Points:**
- [x] All required fields validated
- [x] Hourly rate positive number
- [x] Skills searchable (add minimum 1)
- [x] Portfolio images upload and display
- [x] Profile completeness % indicator
- [x] Public profile accessible

**API Endpoints to Test:**
- `GET /api/freelancers/{id}` - Get profile
- `PUT /api/freelancers/{id}` - Update profile
- `POST /api/freelancers/{id}/skills` - Add skill
- `DELETE /api/freelancers/{id}/skills/{skillId}` - Remove skill
- `POST /api/portfolios` - Create portfolio item
- `PUT /api/portfolios/{id}` - Update portfolio
- `DELETE /api/portfolios/{id}` - Delete portfolio

---

### Phase 3: Browse & Search Projects
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. Login as freelancer
2. Go to "Browse Projects" page
3. View available projects
4. Search by keyword
5. Filter by:
   - Category
   - Budget range
   - Deadline
   - Required skills
6. Click project to view details
7. View client profile/reviews
8. Bookmark/save projects
9. View saved projects

**Validation Points:**
- [x] Search functionality works
- [x] Filters work correctly
- [x] Project details display accurately
- [x] Client info accessible
- [x] Bookmark toggle works
- [x] Pagination works

**API Endpoints to Test:**
- `GET /api/projects` - List all projects
- `GET /api/projects?q=keyword` - Search projects
- `GET /api/projects/{id}` - Project details
- `POST /api/saved-projects` - Bookmark project
- `GET /api/saved-projects` - My bookmarks
- `DELETE /api/saved-projects/{id}` - Unbookmark

---

### Phase 4: Submit Proposals
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. View a project
2. Click "Submit Proposal"
3. Fill proposal form:
   - Cover letter
   - Bid amount (fixed or hourly)
   - Timeline commitment (e.g., "Can start in 2 days")
   - Portfolio links (optional)
   - Questions for client (optional)
4. Submit proposal
5. View proposals dashboard
6. View submitted proposal
7. Edit proposal (if client hasn't responded)
8. Withdraw proposal
9. Track proposal status

**Validation Points:**
- [x] Cover letter text length validated
- [x] Bid amount validated (positive)
- [x] Timeline required
- [x] Multiple proposals on same project allowed
- [x] Proposals can be edited before acceptance
- [x] Withdraw proposal removes it

**API Endpoints to Test:**
- `POST /api/proposals` - Create proposal
- `PUT /api/proposals/{id}` - Edit proposal
- `DELETE /api/proposals/{id}` - Withdraw proposal
- `GET /api/proposals` - My proposals
- `GET /api/proposals/{id}` - Proposal details

---

### Phase 5: Project Work & Deliverables
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. Get accepted on a project
2. View active projects dashboard
3. Click active project
4. Download project files/requirements
5. Work on project
6. Upload deliverables:
   - Upload files
   - Add description
   - Mark milestone complete
7. Message with client
8. View payment status
9. Request feedback/revision
10. Submit final deliverable

**Validation Points:**
- [x] Dashboard shows active projects
- [x] File download works
- [x] Upload file validation (size, type)
- [x] Messaging works in real-time
- [x] Milestone tracking accurate
- [x] Only hired freelancer can upload

**API Endpoints to Test:**
- `GET /api/freelancers/dashboard` - Dashboard
- `GET /api/contracts/{id}` - Active project
- `POST /api/contracts/{id}/upload` - Upload deliverable
- `GET /api/contracts/{id}/deliverables` - View deliverables
- `POST /api/messages` - Send message
- `GET /api/contracts/{id}/messages` - Message history

---

### Phase 6: Reviews & Ratings
**Status Track:** [ ] Pass / [ ] Fail / [ ] Partial

**Manual Test Steps:**
1. After project completion
2. View client review
3. Submit review for client
4. View own profile reviews

**Validation Points:**
- [x] Reviews display correctly
- [x] Rating system works
- [x] Only freelancers can review clients

**API Endpoints to Test:**
- `GET /api/freelancers/{id}/reviews` - My reviews
- `POST /api/reviews` - Submit review

---

## 🔒 SECURITY & AUTHORIZATION VERIFICATION

**Test Authorization Checks:**
- [ ] User A cannot see User B's projects
- [ ] Freelancer cannot create/edit client projects
- [ ] Client cannot create/edit freelancer portfolio
- [ ] Only project owner can delete project
- [ ] Only contract parties can message
- [ ] Proper 401/403 errors for unauthorized actions

**API Test:**
```bash
# Try to access another user's profile
curl -H "Authorization: Bearer TOKEN_USER_A" \
  http://localhost:8000/api/freelancers/USER_B_ID

# Should return 403 Forbidden or 401 Unauthorized
```

---

## ✅ DATA VALIDATION VERIFICATION

### Required Field Validation
- [ ] Email format validated
- [ ] Password complexity checked (min 8 chars, special char)
- [ ] Title/name fields required
- [ ] Budget must be positive number
- [ ] Dates validated (future dates for deadlines)
- [ ] File uploads have size limits
- [ ] Phone numbers formatted correctly

### Error Messages
- [ ] User-friendly error messages shown
- [ ] Validation errors clear and specific
- [ ] Success notifications appear
- [ ] Loading states show during requests
- [ ] Network errors handled gracefully

---

## 🧪 COMPREHENSIVE E2E TEST RESULTS

Run all tests:
```bash
cd backend
python -m pytest tests/test_e2e_complete_flows.py -v --tb=short
```

**Current Test Coverage:**
- ✅ Authentication flows (signup, login, email verify)
- ✅ Client journey (profile → project → proposals → hire)
- ✅ Freelancer journey (profile → browse → apply → work)
- ✅ Admin features
- ✅ Messaging system
- ✅ Reviews & ratings
- ✅ Security & authorization
- ✅ Input validation
- ✅ Error handling

---

## 📊 Verification Checklist Summary

### CLIENT WORKFLOW
- [ ] **Auth**: Registration, verification, login, profile setup
- [ ] **Profile**: Complete info, image, visibility settings
- [ ] **Projects**: Create, post, edit, delete, filter
- [ ] **Proposals**: View, filter, accept, reject, compare
- [ ] **Collaboration**: Messaging, file upload, track progress
- [ ] **Reviews**: Leave review, view freelancer ratings

### FREELANCER WORKFLOW
- [ ] **Auth**: Registration, verification, login, profile setup
- [ ] **Portfolio**: Complete profile, add skills, add portfolio items
- [ ] **Browse**: Search, filter, view project details
- [ ] **Proposals**: Submit, edit, withdraw, track status
- [ ] **Work**: Accept projects, upload deliverables, message
- [ ] **Reviews**: View/submit reviews, track ratings

### VALIDATION & TESTING
- [ ] All forms validate input correctly
- [ ] Error messages display properly
- [ ] Security checks pass (no data leakage)
- [ ] File uploads work with size limits
- [ ] Pagination works on list pages
- [ ] Mobile responsiveness verified
- [ ] E2E tests pass successfully

---

## 🚀 Next Steps

1. **Start Backend + Frontend**: Run both servers
2. **Run E2E Tests**: `pytest tests/test_e2e_complete_flows.py -v`
3. **Manual Testing**: Follow verification steps above
4. **Mark Complete**: Check off items in workflow-checklist.md
5. **Document Issues**: Report any failures with error details

---

## 📞 Support

For API documentation: http://localhost:8000/docs (Swagger UI)
