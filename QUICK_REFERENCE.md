# 🚀 MegiLance Workflow Verification - QUICK REFERENCE

## START HERE - One Command Verification

```bash
cd e:\MegiLance
python verify-workflows.py
```

This will check everything and run all E2E tests automatically.

---

## 📋 MANUAL STARTUP (If you want to test manually)

### Terminal 1 - Backend API
```bash
cd e:\MegiLance\backend
python -m uvicorn main:app --reload --port 8000
```
✅ Visit: http://localhost:8000/docs (Swagger API docs)

### Terminal 2 - Frontend
```bash
cd e:\MegiLance\frontend
npm run dev
```
✅ Visit: http://localhost:3000

### Terminal 3 - Run Tests
```bash
cd e:\MegiLance\backend
python -m pytest tests/test_e2e_complete_flows.py -v
```

---

## 🎯 WHAT TO TEST

### CLIENT (Sign up as Client)
- [ ] Register email → Verify email → Login
- [ ] Complete profile (name, company, phone, image)
- [ ] Post project (title, description, budget, deadline, files)
- [ ] View proposals from freelancers
- [ ] Accept freelancer proposal
- [ ] Message with freelancer
- [ ] Upload project files
- [ ] Rate freelancer after completion

### FREELANCER (Sign up as Freelancer)
- [ ] Register email → Verify email → Login
- [ ] Complete portfolio (skills 3+, bio, portfolio items)
- [ ] Search and filter projects
- [ ] Submit proposal (cover letter, bid amount)
- [ ] View active projects
- [ ] Download project files
- [ ] Upload deliverables
- [ ] Message with client
- [ ] Rate client after completion

---

## ✅ VALIDATION CHECKLIST

### Forms Should Validate
```
Email:    ✅ Format check (must be @domain.com)
Password: ✅ Min 8 chars, special char required
Title:    ✅ Required, max 200 chars
Budget:   ✅ Positive number only
Deadline: ✅ Must be future date
Files:    ✅ Size limit enforced
```

### Authorization (Security Check)
```
✅ Client CAN'T see other client's projects
✅ Freelancer CAN'T edit client projects
✅ Only owner CAN delete project
✅ Only contract parties CAN message
✅ Only freelancer CAN upload to own project
```

### Error Messages Should Be Clear
```
❌ "Invalid input" ← BAD (unclear)
✅ "Email format invalid (example@domain.com)" ← GOOD
```

---

## 📊 TEST RESULTS

After running tests, you'll see:

```
✅ passed: XX
❌ failed: XX (if any)

WORKFLOWS TESTED:
✅ Authentication
✅ Client Profile
✅ Project Creation
✅ Proposals
✅ Messaging
✅ Freelancer Portfolio
✅ Project Work
✅ Reviews
✅ Security
✅ Validation
```

---

## 🔗 IMPORTANT ENDPOINTS TO CHECK

**Authentication:**
- `POST /api/auth/register` - Sign up
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - My profile

**Projects (Client):**
- `POST /api/clients/projects` - Create project
- `GET /api/clients/projects` - My projects
- `PUT /api/clients/projects/{id}` - Edit project
- `DELETE /api/clients/projects/{id}` - Delete

**Proposals:**
- `POST /api/proposals` - Submit proposal
- `GET /api/proposals` - My proposals
- `POST /api/proposals/{id}/accept` - Accept

**Messaging:**
- `POST /api/messages` - Send message
- `GET /api/contracts/{id}/messages` - Chat history

**Reviews:**
- `POST /api/reviews` - Submit review

---

## 🆘 TROUBLESHOOTING

### Backend won't connect
```bash
# Make sure backend is running
curl http://localhost:8000/api/health/ready

# If not, start it:
cd backend && python -m uvicorn main:app --reload --port 8000
```

### Tests fail with database error
```bash
# Check environment variables in backend/.env
# TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set
```

### Frontend can't connect to backend
```bash
# Check CORS settings in backend/.env
# BACKEND_CORS_ORIGINS should include http://localhost:3000
```

---

## 📖 DETAILED GUIDES

- **WORKFLOW_VERIFICATION_GUIDE.md** - Step-by-step for each workflow
- **workflow-checklist.md** - Detailed checklist by feature
- **README.md** - Project overview

---

## ✨ SUCCESS CRITERIA

Your professor needs to see:

✅ **ALL workflows working** (Client + Freelancer)
✅ **Data validation** on all forms
✅ **Error messages** clear and helpful
✅ **Security** working (no data leaks)
✅ **Tests passing** (E2E tests succeed)
✅ **Real usage** - actual end-to-end flow from signup to project completion

---

**Ready?** Run: `python verify-workflows.py`
