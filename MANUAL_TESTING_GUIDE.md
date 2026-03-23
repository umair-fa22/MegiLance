# MegiLance Manual Testing Guide - Browser-Based Workflows

> **Read this while testing in your browser**
> Use this to manually verify each workflow step-by-step

---

## 📌 PREREQUISITES

Make sure both services are running:
- ✅ Backend: http://localhost:8000/docs
- ✅ Frontend: http://localhost:3000

---

## 👤 CLIENT WORKFLOW - MANUAL BROWSER TEST

### Phase 1: Sign Up & Authentication (5 minutes)

**Test 1.1: Register as Client**

1. Go to: http://localhost:3000
2. Click "Sign Up" (or go to signup page)
3. Select "I'm a Client" role
4. Fill registration form:
   - Email: `client_demo@example.com`
   - Password: `SecurePass123!` (8+ chars, special char)
   - Confirm Password: `SecurePass123!`
5. Click "Sign Up"

**Expected Results:**
- ✅ Form validates (password strength indicator)
- ✅ No duplicate email error (if first time)
- ✅ Redirected to email verification page
- ✅ Success message appears

**Test 1.2: Verify Email**

> In a real scenario, check your email inbox. For demo, look for verification link on page.

1. Check for verification link on screen or in email
2. Click verification link
3. Should see: "Email verified successfully!"

**Expected Results:**
- ✅ Redirected to login page
- ✅ Account is now active

**Test 1.3: Login**

1. Enter email: `client_demo@example.com`
2. Enter password: `SecurePass123!`
3. Click "Login"

**Expected Results:**
- ✅ No "invalid credentials" error
- ✅ Redirected to dashboard
- ✅ Session persists (reload page, still logged in)

---

### Phase 2: Complete Client Profile (5 minutes)

**Test 2.1: Navigate to Profile Settings**

1. Click your avatar/profile icon (top right)
2. Select "Settings" or "Profile"
3. You should see profile form

**Test 2.2: Fill Profile Information**

Fill in these fields:
- **Full Name:** `John Developer`
- **Company Name:** `Tech Innovations Inc`
- **Phone:** `+1-555-123-4567`
- **Country:** `United States`
- **Bio:** `Tech entrepreneur interested in outsourcing web projects`

**Test 2.3: Upload Profile Image**

1. Click "Upload Avatar" or profile image area
2. Select an image from your computer (JPG, PNG)
3. Should see preview
4. Click "Save" or confirm

**Test 2.4: Save Profile**

1. Scroll down and click "Save Changes"

**Expected Results:**
- ✅ No required field errors
- ✅ Success notification: "Profile updated"
- ✅ Profile data persists after page reload
- ✅ Image displays correctly

**Test 2.5: Check Security & Privacy**

1. Look for "Profile Visibility" setting
2. Toggle between "Public" (visible to freelancers) and "Private"
3. Save changes

**Expected Results:**
- ✅ Setting toggles without error
- ✅ Change persists

---

### Phase 3: Create & Post a Project (10 minutes)

**Test 3.1: Start Project Creation**

1. Click "Post a Project" button (usually in dashboard or main menu)
2. Or navigate to: http://localhost:3000/client/post-job

**Test 3.2: Fill Project Details**

**Section 1: Basic Info**
- **Project Title:** `Website Redesign for E-Commerce Platform`
- **Category:** Select "Web Development"
- **Description:**
  ```
  We need a complete redesign of our e-commerce website.
  Modern UI/UX, mobile-responsive, integration with payment gateway.
  Timeline: 30 days
  Budget: $5000-$7000
  ```

**Section 2: Skills & Requirements**
- Click "Add Skill" and select/type:
  - `React`
  - `Next.js`
  - `Tailwind CSS`
  - `MongoDB`
- Should allow 3+ skills

**Section 3: Budget & Timeline**
- **Budget Type:** Select "Fixed Price"
- **Budget Amount:** `5000` (appears as $5,000)
- **Deadline:** Select a date 30 days from today

**Expected Validations:**
- ✅ Title cannot be empty
- ✅ Title maxes out at reasonable length (~200 chars)
- ✅ Budget must be positive number (no negative)
- ✅ Deadline must be in future
- ✅ Min 1 skill required

**Test 3.3: Upload Project Attachment**

1. Look for "Attachments" or "Upload Files" section
2. Drag & drop or click to select files
3. Try uploading: design mock-up, requirements document, etc.

**Expected Validations:**
- ✅ File size limit enforced (usually 10MB)
- ✅ Supported file types only (PDF, DOC, images, ZIP)
- ✅ Can upload multiple files
- ✅ Files display in list with download option

**Test 3.4: Submit Project**

1. Review all fields one more time
2. Click "Post Project" or "Submit"

**Expected Results:**
- ✅ No validation errors appear
- ✅ Project appears in dashboard
- ✅ Redirected to project details page
- ✅ Project marked as "Open" or "Active"
- ✅ Success notification

**Test 3.5: Verify Project Published**

1. Go to Client Dashboard
2. Should see project in "Active Projects"
3. Should see proposal count as "0"

---

### Phase 4: Receive & Manage Proposals (10 minutes)

> **Note:** This requires a freelancer to submit proposals. Either:
> - Create a second browser session as freelancer, OR
> - Use the interactive test: `python test-workflows-interactive.py`

**Test 4.1: View Proposals**

After freelancer(s) submit proposals:

1. Go to Client Dashboard
2. Click on your project
3. Go to "Proposals" tab

**Expected Display:**
- ✅ List shows all proposals
- ✅ Each proposal shows:
  - Freelancer name/image
  - Bid amount
  - Timeline
  - Cover letter preview
  - "View Profile" link

**Test 4.2: Filter Proposals**

Look for filter/sort options:

1. **Filter by Status:** All, Pending, Accepted, Rejected
2. **Sort by:** Bid (low-high), Rating, Recent

**Expected Results:**
- ✅ Filters work immediately (no full page reload if using AJAX)
- ✅ Proposal count updates

**Test 4.3: View Full Proposal Details**

1. Click on a proposal
2. Should see full details:
   - Cover letter
   - Bid amount
   - Timeline
   - Freelancer profile
   - Portfolio links

**Test 4.4: Accept a Proposal**

1. Click "Accept Proposal" or similar button
2. You may see confirmation dialog
3. Click "Confirm"

**Expected Results:**
- ✅ No error
- ✅ Contract created (notification)
- ✅ Proposal status changes to "Accepted"
- ✅ Freelancer notification sent
- ✅ Can now message freelancer

**Test 4.5: Reject a Proposal**

1. For another proposal, click "Reject" or "Decline"
2. Optional: Add reason/message
3. Confirm

**Expected Results:**
- ✅ Proposal marked as "Rejected"
- ✅ Freelancer sees rejection (in proposal history)

---

### Phase 5: Project Collaboration (10 minutes)

**Test 5.1: View Active Project**

After accepting proposal:

1. Go to Dashboard → "Active Projects"
2. Click on the project

**Expected Display:**
- ✅ Project details
- ✅ Hired freelancer info
- ✅ Current status
- ✅ Tabs: Overview, Messages, Files, Progress, Deliverables

**Test 5.2: Test Messaging**

1. Go to "Messages" tab
2. Type message: "Hi! Thanks for accepting. Let me know if you have any questions."
3. Click "Send"

**Expected Results:**
- ✅ Message appears in chat
- ✅ Timestamp shows
- ✅ Message persists after page reload

**Test 5.3: Upload Project Files**

1. Go to "Files" tab (or "Requirements")
2. Click "Upload Files"
3. Select files for freelancer to work with
4. Add description: "Here are the design mockups and requirements"

**Expected Results:**
- ✅ Files appear in list
- ✅ Freelancer can see files
- ✅ Files are downloadable

**Test 5.4: Monitor Progress**

1. Look for "Progress" or "Timeline" section
2. Should show:
   - Project start date
   - Expected deadline
   - Days remaining
   - Milestones (if any)

**Expected Results:**
- ✅ All dates calculated correctly
- ✅ Days remaining updates

---

### Phase 6: Review and Rate (5 minutes)

**Test 6.1: Submit Review After Completion**

After freelancer completes work:

1. Go to completed project
2. Look for "Leave Review" button
3. Fill review form:
   - **Rating:** Select 1-5 stars
   - **Review Text:** "Excellent work! Delivered on time with high quality."
   - **Flag Issue:** Only check if needed

**Expected Results:**
- ✅ Stars highlight when hovering
- ✅ Text field has min/max length
- ✅ Review submits without error

**Test 6.2: View Freelancer's Rating**

1. Click freelancer profile from project
2. Should see your review posted
3. Overall rating updated

**Expected Results:**
- ✅ Review visible on profile
- ✅ Star rating displays correctly

---

## 👨💼 FREELANCER WORKFLOW - MANUAL BROWSER TEST

### Phase 1: Sign Up & Authentication (5 minutes)

**Test 1.1: Register as Freelancer**

1. Go to: http://localhost:3000
2. Click "Sign Up"
3. Select "I'm a Freelancer" role
4. Fill form:
   - Email: `freelancer_demo@example.com`
   - Password: `SecurePass123!`
   - Confirm: `SecurePass123!`
5. Click "Sign Up"

**Expected Results:**
- ✅ Form validates
- ✅ Redirected to email verification

**Test 1.2: Verify Email & Login**

1. Verify email (same as client workflow)
2. Login with your email

**Expected Results:**
- ✅ Logged in successfully
- ✅ Freelancer dashboard shown

---

### Phase 2: Build Portfolio & Profile (10 minutes)

**Test 2.1: Complete Basic Profile**

1. Click Profile or Settings
2. Fill in:
   - **Full Name:** `Jane Smith`
   - **Professional Title:** `Full Stack Web Developer`
   - **Bio:** `5+ years experience in React, Node.js, and cloud deployment`
   - **Hourly Rate:** `75` (shows as $75/hour)
   - **Location:** `New York, USA`

**Test 2.2: Add Skills**

1. Look for "Skills" section
2. Click "Add Skill"
3. Add multiple skills:
   - `React`
   - `Next.js`
   - `Node.js`
   - `MongoDB`
   - `Tailwind CSS`
   - `AWS`

**Expected Results:**
- ✅ Skills searchable/autocomplete
- ✅ Can add 5+ skills
- ✅ Can remove skills
- ✅ Skills display with badges

**Test 2.3: Upload Profile Image**

1. Click avatar area
2. Upload image
3. Crop if needed
4. Save

**Expected Results:**
- ✅ Image displays correctly

**Test 2.4: Add Portfolio Items**

1. Go to "Portfolio" section
2. Click "Add Portfolio Item"
3. Fill in:
   - **Title:** `E-commerce Website Redesign`
   - **Description:** `Complete redesign of e-commerce platform with React and Node.js backend`
   - **Project Link:** `https://example.com/portfolio/ecommerce`
   - **Images:** Upload 2-3 screenshots

**Expected Results:**
- ✅ Portfolio item saved
- ✅ Can add multiple items
- ✅ Images display

**Test 2.5: Add Experience/Certifications**

1. Look for "Experience" section
2. Add work history example
3. Add certification (e.g., "AWS Certified Developer")

**Expected Results:**
- ✅ All items saved

**Test 2.6: View Public Profile**

1. Click "View Public Profile"
2. Should see all your info publicly

**Expected Results:**
- ✅ Profile looks professional
- ✅ All data displays correctly

---

### Phase 3: Browse Projects (5 minutes)

**Test 3.1: Navigate to Project Listings**

1. Go to Dashboard or "Browse Projects"
2. Should see list of all available projects

**Test 3.2: Test Search & Filtering**

1. **Search by keyword:** Type in search box (e.g., "website", "react")
   - ✅ Results filter immediately

2. **Filter by Category:** Select "Web Development"
   - ✅ Only web dev projects shown

3. **Filter by Budget:**
   - Min: `3000`
   - Max: `10000`
   - ✅ Projects outside range hidden

4. **Filter by Deadline:**
   - `Within 7 days` / `Next 30 days`
   - ✅ Filters by date

5. **Filter by Skills:**
   - Select "React", "Next.js"
   - ✅ Only projects requiring these skills shown

**Expected Results:**
- ✅ All filters work
- ✅ Combinations work (e.g., budget + category)
- ✅ Pagination works

**Test 3.3: View Project Details**

1. Click on a project
2. See full details:
   - Title, description
   - Budget & deadline
   - Required skills
   - Client profile/rating
   - Attachments

**Expected Results:**
- ✅ All info displays clearly
- ✅ Can view client profile
- ✅ Can download attachments

---

### Phase 4: Submit Proposals (5 minutes)

**Test 4.1: Submit Proposal**

1. Click "Submit Proposal" or "Bid Now"
2. Fill form:
   - **Cover Letter:** (500+ words recommended)
     ```
     I'm very interested in this project. I have 5+ years of experience
     with React and Next.js. I've successfully delivered 20+ similar projects.
     I understand your requirements and can deliver high-quality code.
     I'm available to start immediately.
     ```
   - **Bid Amount:** `4500`
   - **Timeline:** `14 days`
   - **Portfolio Links:** (optional) `https://github.com/portfolio`

**Expected Results:**
- ✅ Form validates
- ✅ Cover letter has min length
- ✅ Bid must be positive number
- ✅ Can't bid 0 or negative

**Test 4.2: Submit**

1. Click "Submit Proposal"

**Expected Results:**
- ✅ Success notification
- ✅ Proposal appears in "My Proposals"
- ✅ Status: "Pending"

**Test 4.3: View Own Proposals**

1. Go to Dashboard → "My Proposals"
2. Should see all proposals submitted

**Expected Results:**
- ✅ List shows status (Pending, Accepted, Rejected)
- ✅ Can see bid, timeline, project name
- ✅ Can filter/sort

**Test 4.4: Edit Proposal (Before Acceptance)**

1. Find pending proposal
2. Click "Edit"
3. Change cover letter or bid
4. Click "Update"

**Expected Results:**
- ✅ Changes saved
- ✅ Cannot edit after client accepts

**Test 4.5: Withdraw Proposal**

1. Find a proposal
2. Click "Withdraw" or "Cancel"
3. Confirm action

**Expected Results:**
- ✅ Proposal marked as "Withdrawn"
- ✅ Can't re-submit same proposal

---

### Phase 5: Project Work & Deliverables (10 minutes)

**Test 5.1: View Active Projects**

1. Go to Dashboard → "Active Projects"
2. Only accepted projects shown

**Test 5.2: Download Project Files**

1. Click on active project
2. Go to "Files" or "Requirements" tab
3. Download files provided by client

**Expected Results:**
- ✅ Files download successfully
- ✅ File names preserved

**Test 5.3: Send Messages**

1. Go to "Messages" tab
2. Send: "Hi! I've received all files and understand the requirements. Starting work now."
3. Send

**Expected Results:**
- ✅ Message appears in chat
- ✅ Persists after reload

**Test 5.4: Upload Deliverables**

1. Go to "Deliverables" tab
2. Click "Upload Deliverable"
3. Select files (code, screenshots, etc.)
4. Add description: "Version 1 - Homepage and product pages complete"

**Expected Results:**
- ✅ Files upload
- ✅ Description saved
- ✅ Client can see uploat

**Test 5.5: Mark Milestone/Phase Complete**

1. If applicable, look for "Mark Phase Complete"
2. Click it
3. Add notes

**Expected Results:**
- ✅ Status updates
- ✅ Client notified

---

### Phase 6: Reviews (5 minutes)

**Test 6.1: View Client Review**

1. After project completion, go to project
2. "Client Review" section should show
3. See rating and feedback

**Test 6.2: Submit Review of Client**

1. Click "Leave Review"
2. Fill:
   - **Rating:** 5 stars
   - **Review:** "Great client! Clear requirements, responsive communication."
3. Submit

**Expected Results:**
- ✅ Review posted
- ✅ Appears on freelancer profile

---

## 🔐 SECURITY TESTS - VERIFY AUTHORIZATION

**Test: User Isolation**

1. Login as Client#1
2. Note their project ID
3. Open new private browser window
4. Login as Freelancer#1
5. Try to access: `http://localhost:3000/client/projects/{CLIENT1_PROJECT_ID}`

**Expected:**
- ❌ Access denied / redirected to dashboard
- ✅ Error message: "Unauthorized"

**Test: Cannot Edit Other's Project**

1. Login as Client#1, create project
2. Login as Client#2 (incognito)
3. Try to navigate to Client#1's project edit page

**Expected:**
- ❌ Cannot open edit form
- ✅ See "Access Denied"

---

## ✅ VALIDATION TESTS

**Email Format Test**

Sign up with:
- ✅ `valid@example.com` - Should work
- ❌ `invalidemail` - Should show error
- ❌ `test@` - Should show error
- ❌ `@example.com` - Should show error

**Budget Validation**

Create project with:
- ✅ `5000` - Should work
- ❌ `-1000` - Should error: "Must be positive"
- ❌ `0` - Should error: "Minimum $1"
- ❌ `abc` - Should error: "Must be number"

**Text Length**

Project title:
- ✅ "Website Redesign" - Works
- ❌ "" (empty) - Error: "Required"
- ❌ Very long 500+ chars - Error: "Max 200 characters"

---

## 📊 CHECKLIST FOR PROFESSOR DEMO

Print this and check off as you test:

```
CLIENT WORKFLOW
[ ] Register & verify email
[ ] Login
[ ] Complete profile with image
[ ] Post project (multiple skills, attachment)
[ ] View proposals dashboard
[ ] Accept proposal (creates contract)
[ ] Message with freelancer
[ ] Download deliverables
[ ] Leave review

FREELANCER WORKFLOW
[ ] Register & verify email
[ ] Login
[ ] Complete profile with portfolio items
[ ] Add multiple skills
[ ] Upload profile image
[ ] Search projects (multiple filters work)
[ ] Submit proposal
[ ] Access active project
[ ] Download project files
[ ] Upload deliverables
[ ] Message with client
[ ] Leave review

VALIDATION
[ ] Form errors clear & helpful
[ ] Budget validation works
[ ] Date validation works
[ ] File size validation works
[ ] Email format validation works

SECURITY
[ ] Cannot see other user's projects
[ ] Cannot edit others' projects
[ ] Only owner can delete project
[ ] Proper 403 errors for unauthorized access

RESPONSIVE
[ ] All pages work on mobile (375px)
[ ] All pages work on tablet (768px)
[ ] All pages work on desktop (1920px)
```

---

## 📱 Browser Testing Tips

Press `F12` to open Developer Tools:

1. **Console Tab:** Check for JavaScript errors
   - Should be NO red errors
   - Warnings OK

2. **Network Tab:** Check API calls
   - Click an action
   - See network requests
   - Check response status (200 = OK)

3. **Mobile View:** Test responsive design
   - Ctrl+Shift+M (or Cmd+Shift+M on Mac)
   - Test at 375px width (iPhone)
   - Test at 768px width (iPad)

---

## 🐛 Common Issues & Solutions

**"Cannot connect to backend"**
- Backend not running
- Start: `cd backend && python -m uvicorn main:app --reload --port 8000`

**"CORS error"**
- Check backend `.env`: `BACKEND_CORS_ORIGINS` includes `http://localhost:3000`

**"Email not verified"**
- Development mode: Click verification link on page
- Production: Check email inbox

**"Page blank or infinite loading"**
- Check browser console (F12) for errors
- Check Network tab for failed requests

**"Can't login"**
- Verify email first
- Check email/password spelling
- Clear browser cache (Ctrl+Shift+Del)

---

> Save this guide and follow it step-by-step for comprehensive testing!
