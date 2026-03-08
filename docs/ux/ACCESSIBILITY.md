# Accessibility Requirements

> WCAG 2.1 AA compliance requirements for MegiLance. All new features must meet P0 requirements before shipping.

---

## Keyboard Navigation (P0)

| Requirement | Standard | Notes |
|-------------|----------|-------|
| All interactive elements reachable via Tab | WCAG 2.1.1 | Logical tab order matching visual layout |
| Enter/Space activate buttons and links | WCAG 2.1.1 | All custom button components must handle both keys |
| Escape closes modals, dropdowns, tooltips | WCAG 2.1.1 | Focus must return to the trigger element |
| Arrow keys navigate within radio groups, tabs, menus | WCAG 2.1.1 | Use `role="tablist"`, `role="radiogroup"` patterns |
| Skip-to-content link on all pages | WCAG 2.4.1 | Hidden until focused, jumps to main content |
| No keyboard traps | WCAG 2.1.2 | Tab must always be able to leave any component |

---

## Screen Reader Support (P0)

| Requirement | Standard | Notes |
|-------------|----------|-------|
| All images have descriptive `alt` text | WCAG 1.1.1 | Decorative images use `alt=""` |
| Form inputs have associated `<label>` elements | WCAG 1.3.1 | Never rely on placeholder-only labels |
| Headings form a logical hierarchy (h1 → h2 → h3) | WCAG 1.3.1 | One `h1` per page |
| ARIA landmarks: `main`, `nav`, `banner`, `contentinfo` | WCAG 1.3.1 | Applied to layout wrapper components |
| Dynamic content changes announced via `aria-live` | WCAG 4.1.3 | Notifications, proposal status, form errors |
| Custom components have appropriate ARIA roles | WCAG 4.1.2 | Tabs, radio groups, modals, dropdowns |

---

## Visual Accessibility (P0)

| Requirement | Standard | Notes |
|-------------|----------|-------|
| Text contrast minimum 4.5:1 (normal text) | WCAG 1.4.3 | Verify in both light AND dark themes |
| Large text (18px+) contrast minimum 3:1 | WCAG 1.4.3 | Headers, hero text |
| Don't rely on color alone for meaning | WCAG 1.4.1 | Status badges must use icon + color (not just color) |
| Touch targets minimum 44x44px | WCAG 2.5.5 | All buttons, links, form controls on mobile |
| Focus indicators visible (2px+ outline) | WCAG 2.4.7 | `:focus-visible` on all interactive elements |

---

## Visual Accessibility (P1)

| Requirement | Standard | Notes |
|-------------|----------|-------|
| Text resizes to 200% without breaking layout | WCAG 1.4.4 | Test with browser zoom 200% |
| Content reflows at 320px viewport width | WCAG 1.4.10 | No horizontal scrolling required |
| Non-text contrast minimum 3:1 (icons, borders) | WCAG 1.4.11 | Form borders, icon buttons |
| No content depends solely on sensory characteristics | WCAG 1.3.3 | "Click the blue button" is not acceptable |

---

## Motion & Animation (P1)

| Requirement | Standard | Notes |
|-------------|----------|-------|
| Respect `prefers-reduced-motion` | WCAG 2.3.3 | Disable all decorative animations |
| No auto-playing animations longer than 5 seconds | WCAG 2.2.2 | Must have pause/stop control |
| No content flashes more than 3 times per second | WCAG 2.3.1 | Risk of seizures |

---

## Forms & Errors (P0)

| Requirement | Standard | Notes |
|-------------|----------|-------|
| Error messages identify the field and issue | WCAG 3.3.1 | "Email is required" not just "Required field" |
| Error messages are associated with fields via `aria-describedby` | WCAG 3.3.1 | Screen readers announce the error |
| Required fields marked with visible indicator | WCAG 3.3.2 | Asterisk + `aria-required="true"` |
| Form submission errors provide clear recovery path | WCAG 3.3.3 | Scroll to first error, focus the field |
| Autocomplete attributes on personal data fields | WCAG 1.3.5 | `autocomplete="email"`, `autocomplete="name"` etc. |

---

## Testing Checklist

Before shipping any page or component, verify:

- [ ] Tab through entire page — all interactive elements reachable in logical order
- [ ] Test with screen reader (NVDA or VoiceOver) — all content announced correctly
- [ ] Check color contrast with browser DevTools or axe extension
- [ ] Test at 200% zoom — no content cut off or overlapping
- [ ] Test on 375px viewport — no horizontal scrolling
- [ ] Test with `prefers-reduced-motion: reduce` — no decorative animations
- [ ] Verify all form errors are announced and associated with fields
- [ ] Check all images have appropriate `alt` text
