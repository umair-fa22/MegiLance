# 🛠️ MegiLance Component Overhaul & Redesign Audit

> **Generated from an in-depth, manual agentic review of the `MegiLance` workspace.** 
> **Date**: March 31, 2026

After a comprehensive manual review of the component architecture, layout structures, and dependency scripts, I have identified exactly why components like dropdowns and menus are completely "collapsing" or visually breaking. 

The issues cannot be fixed by simple CSS patches; they derive from **fundamental architectural flaws** (like non-Portal absolute positioning trapped inside `overflow: hidden` containers) and **missing mandatory files**. 

Below is the exact, un-skipped list of components that require **complete overhaul and recreation from scratch**:

---

## 1. The "Clipping & Collapse" Overlay Components
**Root Cause:** These interactive components use basic CSS `position: absolute` and `z-index`. When placed inside functional containers (`Cards`, `Tables`, `Modals`) that use `overflow: hidden` or `overflow: auto`, the menus physically collapse or are cut off. 

**Mandatory Action:** Must be completely rebuilt from scratch using React Portals (e.g., Radix UI primitives or Floating UI) so they break out of the DOM hierarchy and render at the `<body>` level without layout collapse.

*   ❌ **`Dropdown`** (`frontend/app/components/molecules/Dropdown`)
*   ❌ **`Select`** (`frontend/app/components/molecules/Select`)
*   ❌ **`ActionMenu`** (`frontend/app/components/molecules/ActionMenu`)
*   ❌ **`ProfileMenu`** (`frontend/app/components/molecules/ProfileMenu`)
*   ❌ **`DatePicker`** (`frontend/app/components/molecules/DatePicker`)
*   ❌ **`Tooltip`** (`frontend/app/components/atoms/Tooltip`)

---

## 2. "Ghost" Components (Missing CSS Modules)
**Root Cause:** Through programmatic checking during the manual review, I discovered several high-level wrapper and pricing components import the strict 3-file CSS module system (`.common`, `.light`, `.dark`), **but those files do not exist natively in the file system.** This structurally breaks their pages.

**Mandatory Action:** These components must be designed and restyled entirely from scratch.

*   ❌ **`AppLayout`** (`frontend/app/components/AppLayout/AppLayout.tsx`) - Missing all three standard CSS module files. This is destroying the primary portal shell.
*   ❌ **`PricingCard`** (`frontend/components/pricing/PricingCard/PricingCard.tsx`) - Completely missing all layout and theme CSS files.
*   ❌ **`BillingToggle`** (`frontend/components/pricing/BillingToggle/BillingToggle.tsx`) - Missing CSS file.
*   ❌ **`FaqItem`** (`frontend/components/pricing/FaqItem/FaqItem.tsx`) - Missing CSS file.

---

## 3. "Overflow Prison" Layout Organisms
**Root Cause:** These layout containers overuse aggressive CSS directives like `overflow: hidden`, `overflow-x: hidden`, or `overflow-y: auto`. Until the overlay components (Category 1) are rebuilt, these layout structures fundamentally break all UI inside them. 

**Mandatory Action:** Redesign the layouts to manage height/scrolls smoothly without blindly hiding overflows.
