# Portal Upgrade Patterns - Implementation Guide

**Last Updated**: March 24, 2026
**Status**: PRODUCTION READY

---

## 🎯 UPGRADE PATTERNS VALIDATED

This document outlines the reusable patterns for upgrading remaining 100+ portal pages based on 8 successful upgrades.

---

## PATTERN 1: BULK SELECTION (`✅ Applied to: Payments, Reviews, Projects`)

### When to Apply
- Any list/grid page with 10+ items
- Time-saving benefit > 5 seconds per action

### Implementation Template
```tsx
// State
const [selected, setSelected] = useState<Set<string>>(new Set());

// Handlers
const toggleSelect = (id: string) => {
  setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};

const selectAll = () => {
  selected.size === items.length
    ? setSelected(new Set())
    : setSelected(new Set(items.map(i => i.id)));
};

// UI
<label><input type="checkbox" checked={...} onChange={selectAll} /> Select all</label>
{selected.size > 0 && <BulkActionsBar actions={...} />}
{items.map(item => (
  <label key={item.id}>
    <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} />
    {/* item content */}
  </label>
))}
```

**Used In**: Payments, Reviews, Projects

---

## PATTERN 2: QUICK TEMPLATES (`✅ Applied to: PostJob, Hire, Reviews`)

### When to Apply
- Forms with common use cases
- Template saves > 2 minutes of entry time

### Implementation Template
```tsx
interface Template {
  label: string;
  text: string;
  [key: string]: any;
}

const TEMPLATES: Template[] = [
  { label: 'Template 1', text: '...' },
  { label: 'Template 2', text: '...' },
];

// UI
<div className={styles.templateSection}>
  {TEMPLATES.map((tmpl, i) => (
    <button
      key={i}
      onClick={() => setFormField(tmpl.text)}
      className={styles.templateBtn}
    >
      {tmpl.label}
    </button>
  ))}
</div>
```

**Used In**: PostJob (6 templates), Hire (4 templates), Reviews (4 reply templates)

---

## PATTERN 3: ADVANCED FILTERING (`✅ Applied to: Reviews, Analytics`)

### When to Apply
- Pages with 100+ items
- 3+ filter dimensions

### Implementation Template
```tsx
const [filters, setFilters] = useState({
  search: '',
  status: 'all',
  dateRange: { start: '', end: '' },
  category: 'all',
});

const filtered = useMemo(() => {
  return items
    .filter(i => i.name.includes(filters.search))
    .filter(i => filters.status === 'all' || i.status === filters.status)
    .filter(i => {
      if (!filters.dateRange.start) return true;
      const date = new Date(i.date);
      return date >= new Date(filters.dateRange.start) &&
             date <= new Date(filters.dateRange.end);
    });
}, [items, filters]);
```

**Used In**: Reviews (search, rating, sentiment, sort), Analytics (date, category)

---

## PATTERN 4: EXPORT FUNCTIONALITY (`✅ Applied to: Payments, Reviews`)

### When to Apply
- Data-heavy pages
- Users need to pull data for analysis

### Implementation Template
```tsx
const exportCSV = () => {
  const headers = ['Column1', 'Column2', 'Column3'];
  const rows = filteredData.map(d => [d.field1, d.field2, d.field3]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Used In**: Payments, Reviews, Projects, Analytics

---

## PATTERN 5: KPI WIDGETS (`✅ Applied to: Dashboard, Analytics`)

### When to Apply
- Landing pages, dashboards
- 3-6 key metrics to visualize

### Implementation Template
```tsx
interface KPI {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { direction: 'up' | 'down'; percent: number };
}

const kpis: KPI[] = [
  {
    title: 'Metric,
    value: $1,234,
    icon: <DollarSign />,
    trend: { direction: 'up', percent: 12 }
  },
];

// UI
<div className={styles.kpiGrid}>
  {kpis.map(kpi => (
    <DashboardWidget key={kpi.title} {...kpi} />
  ))}
</div>
```

**Used In**: ClientDashboard, ClientAnalytics, FreelancerDashboard

---

##  PATTERN 6: MODAL WITH FORMS (`✅ Applied to: Contracts, Reviews`)

### When to Apply
- Destructive actions (delete, refund, dispute)
- Multi-step operations

### Implementation Template
```tsx
const [modalOpen, setModalOpen] = useState(false);
const [formData, setFormData] = useState({ reason: '', description: '' });

const handleSubmit = async () => {
  if (!formData.reason.trim()) return;
  // API call
  setModalOpen(false);
};

// UI
<Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Action Title">
  <select value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}>
    <option value="">Select reason...</option>
    <option>Reason 1</option>
  </select>
  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
  <Button onClick={handleSubmit}>Submit</Button>
</Modal>
```

**Used In**: ContractDetail (dispute modal), Payments (refund modal)

---

## PAGES TO UPGRADE NEXT (PRIORITY ORDER)

### 🔴 HIGH IMPACT (Do First)
1. **freelancer/jobs/** - Job discovery (bulk save/apply)
2. **freelancer/profile/** - Portfolio showcase (filters, gallery)
3. **admin/dashboard/** - System metrics (KPI + charts)
4. **admin/users/** - User management (bulk actions, search)

### 🟠 MEDIUM IMPACT
5. **freelancer/earnings/** - Income tracking (already good)
6. **admin/payments/** - Transaction monitoring
7. **freelancer/settings/** - Preferences (already good)
8. **client/wallet/** - Fund management

### 🟡 LOWER IMPACT
- Single-page views (help, legal, etc.)
- Settings/preferences pages
- Static content areas

---

## QUICK IMPLEMENTATION CHECKLIST

For each page upgrade:

- [ ] Identify primary user actions
- [ ] Apply relevant patterns (bulk selection, templates, filtering)
- [ ] Add 3-6 KPI metrics if data-heavy
- [ ] Export functionality for data pages
- [ ] Search/filter capability if 20+ items
- [ ] Theme support (.light/.dark .module.css)
- [ ] Mobile responsive (test on 375px-425px widths)
- [ ] Dark mode verified
- [ ] Accessibility audit (ARIA labels, semantic HTML)
- [ ] No TypeScript errors (strict mode)
- [ ] No console logs in production builds
- [ ] Total lines < 1500 (split if needed)

---

## APPLICATION COMMANDS

### Apply Bulk Selection Pattern to a Page
```bash
# 1. Find pages with gridlist display
grep -r "\.map(" frontend/app/\(portal\)/**/*.tsx | grep -v "node_modules"

# 2. Add bulk selection to that page following Pattern 1
# 3. Commit with pattern name

git commit -m "feat: add bulk selection pattern to [page-name]"
```

### Apply Filtering Pattern
```bash
# Look for pages with 20+ items and multiple status/category fields
# Implement Pattern 3 filtering
# Add date range picker if date field exists
```

---

## AUTOMATION OPPORTUNITIES

These pages can share component logic:
- **Bulk actions**: Projects, Payments, Reviews, Contracts, Users, Freelancers
- **Filtering**: Reviews, Analytics, Contracts, MyJobs, JobDiscovery
- **Export**: Any data-heavy page
- **Pagination**: Standard across portals

Consider creating reusable HooksPatterns:
- `useBulkSelection()` - handle multi-select
- `useAdvancedFilters()` - manage complex filters
- `useDataExport()` - CSV/PDF generation
- `usePersistedFilters()` - save filter state

---

## DEPLOYMENT

✅ **PRODUCTION READY NOW**:
- ClientDashboard ✅
- Projects ✅
- PostJob ✅
- Hire ✅
- ContractDetail ✅
- Payments ✅ (with enhancements)
- Reviews ✅ (with enhancements)
- ClientAnalytics ✅ (with filtering)

🔄 **READY FOR PATTERN APPLICATION**:
- Admin Dashboard (needs KPIs)
- Admin Users (needs bulk actions + search)
- Freelancer Profiles (needs filters)
- Freelancer Jobs (needs bulk save)

---

**Next Step**: Apply these patterns to the 15-20 highest-impact remaining pages.
Review with product team before bulk rollout.

