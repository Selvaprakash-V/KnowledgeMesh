# Universal UI & Functionality Defect Playbook & Master QA Encyclopedia
> **The Complete Quality Engineering & Defect Prevention Reference for Developers & QA Teams**  
> *An exhaustive, project-agnostic compendium of all 50+ common UI/UX flaws, functional edge-case omissions, and state synchronization bugs that developers make during modern software development.*

---

## 1. Document Purpose & Operational Framework

### 1.1 Purpose
This encyclopedia is an industry-standard, project-agnostic quality guide designed to eliminate the most frequent UI, UX, and functional defects introduced during web and mobile software development.

It bridges the gap between **Development (Engineering)** and **Quality Assurance (QA)** by providing:
* **Pre-Commit / Pre-PR Developer Checklist**: Clear indicators of common edge-case omissions so developers can self-test and catch bugs before pushing code.
* **Master Manual & Exploratory QA Test Catalog**: Step-by-step test scenarios with explicit **Expected vs. Actual** behavioral diffs.
* **Standardized Defect Taxonomy**: 15 distinct categories covering the full spectrum of frontend, state, layout, device, and full-stack functional interactions.

### 1.2 The 7-Stage Quality Lifecycle

```text
1. DEVELOPMENT ──► Developer builds feature and references this Master Defect Catalog.
2. SELF-CHECK  ──► Developer validates against "Developer Self-Check & Prevention Checklist".
3. HANDOVER    ──► Staging build deployed; QA executes systematic exploratory test passes.
4. DEFECT LOG  ──► QA logs reproducible anomalies using the Standard Template (Appendix A).
5. REMEDIATION ──► Developer reviews Expected vs. Actual behavior and fixes the root cause.
6. REGRESSION  ──► QA re-runs test steps, verifies adjacent modules, and signs off.
7. RELEASE     ──► Zero P0/P1 blockers; deployment gate approved.
```

### 1.3 Master Category Index

| Category Code | Domain | Scope |
| :--- | :--- | :--- |
| `BUG-AUTH-####` | Authentication, Sessions & Security UI | Login, password masking, token expiry, credential autofill, multi-tab sync |
| `BUG-NAV-####` | Navigation, Routing & History | Metric card routes, breadcrumbs, deep links, multi-role redirects, BFCache |
| `BUG-FORM-####` | Forms, Inputs & Data Entry | Required indicators, character limits, regex validation, whitespace, keyboard submit |
| `BUG-DATA-####` | Data Sync, State Logic & Math | Badge count sync, quota limits, discount calculations, floating-point math |
| `BUG-RESP-####` | Responsive UI & Layout Breakpoints | Layout collapse, button contrast, text clipping, overflow, dark/light theme |
| `BUG-RBAC-####` | Roles & Permissions UI | Inactive button stubs, unauthorized action controls, disabled vs hidden states |
| `BUG-FILT-####` | Search, Filtering & Pagination | Filter persistence, multi-select dropdowns, pagination state drops, debounce |
| `BUG-ASYNC-####` | Async States & Race Conditions | Double-click submits, debounce misses, skeleton loaders, silent API errors |
| `BUG-MODAL-####` | Modals, Drawers & Popovers | Backdrop dismiss, z-index clipping, unconfirmed unsaved data loss, focus trapping |
| `BUG-EXP-####` | Export, Printing & File Generation | Distorted PDF exports, print media CSS breaks, CSV column omissions |
| `BUG-FILE-####` | File Uploads & Media Handling | Drag-and-drop boundary escapes, file size limits, MIME type verification |
| `BUG-GRID-####` | Data Grids, Tables & Bulk Actions | Sticky headers, 3-state sorting, pagination select-all vs page-select |
| `BUG-NOTIF-####` | Notifications, Toasts & Alerts | Toast stacking, auto-dismiss timing, premature success notifications |
| `BUG-I18N-####` | Localization, Timezones & Formats | UTC offset date shifts, hardcoded currency symbols, RTL layout breaks |
| `BUG-DEVICE-####` | Mobile Viewports & Browser Quirks | Virtual keyboard overlap, iOS Safari 100vh toolbar clipping, orientation changes |

---

## 2. Configurable Target Application Matrix

| Field | Configuration / Value |
| :--- | :--- |
| **Target Application** | *[Configurable: Insert Web App / Admin Portal / Mobile Client]* |
| **Environment / Base URL** | `https://staging.app.domain.com` / `http://localhost:3000` |
| **Admin Portal URL** | `https://admin.staging.domain.com` |
| **Source Code Repository** | `https://github.com/organization/project-name` |
| **Admin Test Account** | `admin@domain.local` |
| **Standard User Account** | `user1@domain.local` |
| **Supported Browsers** | Chrome, Safari, Firefox, Edge, Mobile Safari (iOS), Mobile Chrome (Android) |
| **Target Viewports** | Desktop (1920x1080, 1366x768), Split-Screen (960px), Tablet (768px), Mobile (390x844) |

---

## 3. Master Defect Status Dashboard

*Status Legend:* `OPEN` = Awaiting Fix · `IN_DEV` = Developer Working · `RE_TEST` = Ready for QA · `VERIFIED` = QA Verified Fixed

| ID | Universal Defect Summary | Domain | Severity | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BUG-AUTH-0001` | Password selection highlight invisible due to identical text/background contrast | Auth & Sessions | High | P1 | VERIFIED |
| `BUG-AUTH-0002` | Loose email/credential validation accepting invalid short or malformed strings | Auth & Sessions | High | P1 | VERIFIED |
| `BUG-AUTH-0003` | Browser credential autofill injecting saved passwords into unrelated inputs | Auth & Sessions | Medium | P2 | VERIFIED |
| `BUG-AUTH-0004` | Session timeout / 401 response failing to redirect user or clear stale UI state | Auth & Sessions | High | P1 | VERIFIED |
| `BUG-AUTH-0005` | Password visibility toggle button exposing plaintext without DOM masking | Auth & Sessions | Medium | P2 | VERIFIED |
| `BUG-AUTH-0006` | Logging out in one browser tab leaves adjacent tabs active until broken action | Auth & Sessions | High | P1 | VERIFIED |
| `BUG-NAV-0001` | Dashboard overview summary cards linking to incorrect or hardcoded routes | Navigation | High | P1 | VERIFIED |
| `BUG-NAV-0002` | Duplicate active state highlighting incorrect sidebar/header navigation items | Navigation | Medium | P2 | VERIFIED |
| `BUG-NAV-0003` | Secondary nested sub-pages lacking back buttons or mobile navigation bars | Navigation | Medium | P2 | VERIFIED |
| `BUG-NAV-0004` | Browser back/forward button breaking dynamic view state or modal history | Navigation | Medium | P2 | OPEN |
| `BUG-NAV-0005` | Deep links to authenticated sub-routes failing to preserve target after login | Navigation | Medium | P2 | VERIFIED |
| `BUG-FORM-0001` | Mandatory fields lacking red asterisk indicators causing unexpected submission blocks | Forms & Inputs | High | P1 | VERIFIED |
| `BUG-FORM-0002` | Fixed-width input containers causing text truncation on long strings or names | Forms & Inputs | Medium | P2 | VERIFIED |
| `BUG-FORM-0003` | Numeric and currency inputs accepting negative values or invalid symbols (`e`, `-`) | Forms & Inputs | High | P1 | OPEN |
| `BUG-FORM-0004` | Promotional / referral code input accepted without verification or total recalculation | Forms & Inputs | High | P1 | OPEN |
| `BUG-FORM-0005` | Unsanitized leading/trailing whitespace corrupting search or failing validation | Forms & Inputs | Low | P3 | VERIFIED |
| `BUG-FORM-0006` | Pressing keyboard `Enter` inside form input fails to trigger form submission | Forms & Inputs | Medium | P2 | VERIFIED |
| `BUG-FORM-0007` | Character counter displaying negative numbers when pasting text over limit | Forms & Inputs | Low | P3 | OPEN |
| `BUG-DATA-0001` | Dashboard summary counter badge mismatching total rows in underlying table view | Data & State | Medium | P2 | VERIFIED |
| `BUG-DATA-0002` | Quantity increment control allowing items to exceed live inventory/quota limits | Data & State | High | P1 | OPEN |
| `BUG-DATA-0003` | Floating-point rounding errors displaying unformatted decimal totals in invoices | Data & State | Medium | P2 | OPEN |
| `BUG-DATA-0004` | Stale cached data displaying after successful Create/Update/Delete actions | Data & State | High | P1 | VERIFIED |
| `BUG-RESP-0001` | Responsive breakpoint collapse causing navigation controls to jump or overlap | Responsive UI | Medium | P3 | VERIFIED |
| `BUG-RESP-0002` | Action button background color colliding with parent card theme background | Responsive UI | Medium | P2 | VERIFIED |
| `BUG-RESP-0003` | Unbroken long strings, URLs, or table cells causing horizontal container overflow | Responsive UI | Medium | P2 | VERIFIED |
| `BUG-RESP-0004` | Sticky headers or floating footers obscuring inputs and primary submit buttons | Responsive UI | High | P1 | VERIFIED |
| `BUG-RESP-0005` | Dark mode toggle leaving un-themed inline elements with dark-on-dark text | Responsive UI | Medium | P2 | VERIFIED |
| `BUG-RBAC-0001` | Dead action buttons rendered with unattached click handlers or empty stubs | Roles & RBAC | High | P1 | VERIFIED |
| `BUG-RBAC-0002` | Unauthorized action controls visible to restricted roles, causing raw 403 errors | Roles & RBAC | High | P2 | VERIFIED |
| `BUG-RBAC-0003` | Disabled/read-only input fields visually resembling active editable inputs | Roles & RBAC | Low | P3 | VERIFIED |
| `BUG-FILT-0001` | Dropdown filters passing unmapped parameter IDs, returning empty results | Search & Filter| High | P1 | VERIFIED |
| `BUG-FILT-0002` | Refresh / clear filter button executing full page reload without clearing query params | Search & Filter| Low | P3 | OPEN |
| `BUG-FILT-0003` | Pagination navigation losing active search filter and sort criteria on page switch | Search & Filter| High | P1 | OPEN |
| `BUG-FILT-0004` | Search input lacking debounce, firing rapid API requests causing race conditions | Search & Filter| Medium | P2 | OPEN |
| `BUG-FILT-0005` | Filtered empty state lacking clear action, leaving user stuck on zero results | Search & Filter| Low | P3 | VERIFIED |
| `BUG-ASYNC-0001` | Rapid double-clicking on submit buttons generating duplicate transactions | Async & Timing | Critical | P0 | VERIFIED |
| `BUG-ASYNC-0002` | API submission failures displaying generic "Something went wrong" with no field cues | Async & Timing | Medium | P2 | VERIFIED |
| `BUG-ASYNC-0003` | Missing loading spinners / skeletons causing content layout shifts and dead clicks | Async & Timing | Medium | P2 | VERIFIED |
| `BUG-ASYNC-0004` | Silent background API failures leaving UI in an infinite loading state | Async & Timing | High | P1 | VERIFIED |
| `BUG-MODAL-0001` | Clicking outside modal dismisses active form without unsaved-changes confirmation | Modals & Popovers| Medium | P2 | OPEN |
| `BUG-MODAL-0002` | Nested dropdowns / datepickers clipped by parent modal `overflow: hidden` rules | Modals & Popovers| Medium | P2 | OPEN |
| `BUG-MODAL-0003` | Keyboard `Tab` navigation escaping open modal and interacting with background | Modals & Popovers| Medium | P2 | OPEN |
| `BUG-EXP-0001` | Document export / share action producing distorted dimensions vs print layout | Export & Print | High | P2 | OPEN |
| `BUG-EXP-0002` | CSV/Excel export omitting actively filtered columns or exporting raw Unix timestamps | Export & Print | Medium | P2 | OPEN |
| `BUG-FILE-0001` | Dragging file outside dropzone opens file directly in browser, losing page state | File Uploads | Medium | P2 | VERIFIED |
| `BUG-FILE-0002` | Uploading files exceeding size limit accepted in UI before failing late on server | File Uploads | Medium | P2 | VERIFIED |
| `BUG-FILE-0003` | Image upload lacking client-side preview, displaying broken image placeholders | File Uploads | Low | P3 | OPEN |
| `BUG-GRID-0001` | "Select All" table checkbox selecting only visible page rows instead of total dataset | Data Grids | High | P1 | OPEN |
| `BUG-GRID-0002` | Multi-column table sorting stuck in permanent sort state with no 3-state reset | Data Grids | Low | P3 | OPEN |
| `BUG-GRID-0003` | Sticky table header misaligning column widths during horizontal scrolling | Data Grids | Medium | P2 | OPEN |
| `BUG-NOTIF-0001`| Rapid consecutive error notifications stacking and obscuring primary action buttons | Notifications | Low | P3 | VERIFIED |
| `BUG-NOTIF-0002`| Auto-dismissing error toasts after 2 seconds before user can read error text | Notifications | Medium | P2 | VERIFIED |
| `BUG-I18N-0001` | Datepicker displaying previous day's date due to UTC timezone offset conversion | i18n & Timezones| High | P1 | OPEN |
| `BUG-I18N-0002` | Hardcoded currency symbols ignoring localized user settings or currency codes | i18n & Timezones| Medium | P2 | OPEN |
| `BUG-DEVICE-0001`| Mobile virtual keyboard popping up and pushing fixed submit button off-screen | Mobile & Devices| High | P1 | VERIFIED |
| `BUG-DEVICE-0002`| iOS Safari bottom navigation bar overlapping fixed footer buttons (100vh bug) | Mobile & Devices| High | P1 | VERIFIED |

---

## 4. Master Defect Catalog (Detailed QA & Developer Specifications)

---

### `BUG-AUTH-0001`
#### Password Selection Highlight Invisible Due to Identical Text/Background Contrast
* **Domain:** Authentication, Sessions & Security UI
* **Severity:** High | **Priority:** P1
* **1. Description:** Highlighting password text using mouse drag or `Ctrl+A` / `Cmd+A` creates an invisible selection box because the highlight color matches the input background.
* **2. Developer Oversight:** Global CSS resets applied `::selection` rules with transparent or white background colors without ensuring contrast inside input boxes.
* **3. Steps to Reproduce:**
  1. Navigate to any login or password change field.
  2. Type 8 characters into the Password field.
  3. Press `Ctrl + A` (Windows) or `Cmd + A` (Mac) to select all text.
  4. Inspect the visual selection highlight.
* **4. Expected vs. Actual:**
  * **Expected:** Selected characters display a prominent, high-contrast selection highlight (standard blue `#1976d2`).
  * **Actual:** Selection box is white/transparent; characters appear unselected.
* **5. Developer Self-Check:** Verify `::selection` pseudo-element contrast across light and dark theme inputs.

---

### `BUG-AUTH-0002`
#### Loose Email/Credential Validation Accepting Invalid Short or Malformed Strings
* **Domain:** Authentication, Sessions & Security UI
* **Severity:** High | **Priority:** P1
* **1. Description:** Typing a 2-letter string (e.g., `gm` or `user@`) passes form validation, sends an API request, and triggers a success notification or navigates forward.
* **2. Developer Oversight:** Client validation only checked character length (`length > 0`) rather than standard RFC-compliant regex pattern rules.
* **3. Steps to Reproduce:**
  1. Open the Account Recovery or Login page.
  2. Enter two letters: `gm` in the Email field.
  3. Click Submit / Recover.
* **4. Expected vs. Actual:**
  * **Expected:** Form submission blocked with inline message: *"Please enter a valid email address (e.g. name@company.com)"*.
  * **Actual:** Form submits successfully and moves to the OTP verification screen.
* **5. Developer Self-Check:** Use standard schema validators (Zod/Yup) with strict domain pattern checks.

---

### `BUG-AUTH-0003`
#### Browser Credential Autofill Injecting Saved Passwords into Unrelated Inputs
* **Domain:** Authentication, Sessions & Security UI
* **Severity:** Medium | **Priority:** P2
* **1. Description:** On internal administrative forms, the browser automatically pastes the user's saved login email into the first field and password into the second field.
* **2. Developer Oversight:** Form inputs lacked semantic `name`, `id`, and explicit `autocomplete="off"` or `autocomplete="new-password"` attributes.
* **3. Steps to Reproduce:**
  1. Save login credentials in the browser password manager.
  2. Open any administrative settings form with two text inputs.
  3. Observe if saved credentials automatically populate.
* **4. Expected vs. Actual:**
  * **Expected:** Fields display existing record values or remain blank for new records.
  * **Actual:** Browser pastes account email and masked password dots into unrelated fields.
* **5. Developer Self-Check:** Assign distinct semantic names and `autocomplete="off"` to all non-auth inputs.

---

### `BUG-AUTH-0004`
#### Session Timeout / 401 Response Failing to Redirect User or Clear Stale UI State
* **Domain:** Authentication, Sessions & Security UI
* **Severity:** High | **Priority:** P1
* **1. Description:** When a token expires or API returns `401 Unauthorized`, the app fails to redirect the user to login, leaving buttons spinning or throwing unhandled errors.
* **2. Developer Oversight:** Global HTTP response interceptor lacked a centralized `401` handler to clear local storage and trigger a login redirect.
* **3. Steps to Reproduce:**
  1. Log in and open a protected dashboard.
  2. Delete the auth token/cookie from browser storage.
  3. Click any action button (Save, Refresh).
* **4. Expected vs. Actual:**
  * **Expected:** Immediate redirect to `/login` with toast: *"Session expired. Please log in again."*, preserving the target URL in `?redirect=`.
  * **Actual:** Page stays frozen; buttons spin infinitely or log uncaught console errors.
* **5. Developer Self-Check:** Verify global API interceptor redirects on all `401` responses and purges local auth state.

---

### `BUG-AUTH-0005`
#### Password Visibility Toggle Button Exposing Plaintext Without DOM Masking
* **Domain:** Authentication, Sessions & Security UI
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Clicking the "eye" icon reveals the password, but switching tabs, clicking outside, or submitting fails to re-mask the input, leaving sensitive credentials visible on-screen.
* **2. Developer Oversight:** Toggle state was stored in a non-resetting boolean variable without auto-masking on form submission or blur.
* **3. Steps to Reproduce:**
  1. Type a password and click the eye icon to unmask text.
  2. Click Submit.
* **4. Expected vs. Actual:**
  * **Expected:** Password automatically re-masks to `<input type="password">` upon submission or screen lock.
  * **Actual:** Password remains exposed in plain text indefinitely.
* **5. Developer Self-Check:** Reset password visibility state to hidden on blur and submit events.

---

### `BUG-AUTH-0006`
#### Logging Out in One Browser Tab Leaves Adjacent Tabs Active Until Broken Action
* **Domain:** Authentication, Sessions & Security UI
* **Severity:** High | **Priority:** P1
* **1. Description:** When a user logs out in Tab 1, Tab 2 remains on the authenticated dashboard. Clicking an action in Tab 2 produces unpredictable crashes.
* **2. Developer Oversight:** Application omitted `storage` event listeners to synchronize authentication state across multiple browser tabs.
* **3. Steps to Reproduce:**
  1. Open the application dashboard in two separate browser tabs.
  2. In Tab 1, click **Logout**.
  3. Switch to Tab 2 and attempt to perform an action.
* **4. Expected vs. Actual:**
  * **Expected:** Tab 2 detects logout via BroadcastChannel / Storage listener and instantly redirects to `/login`.
  * **Actual:** Tab 2 allows user interaction until a background API call fails with broken state.
* **5. Developer Self-Check:** Use `window.addEventListener('storage', ...)` to sync auth state across open tabs.

---

### `BUG-NAV-0001`
#### Dashboard Overview Summary Cards Linking to Incorrect or Hardcoded Routes
* **Domain:** Navigation, Routing & History
* **Severity:** High | **Priority:** P1
* **1. Description:** Clicking on a summary metric card on the dashboard (e.g., "Open Tasks") redirects to an unrelated page (e.g., Team Directory) instead of the filtered list view.
* **2. Developer Oversight:** Copy-paste error: developer cloned a card component, updated the title, but forgot to update the target route.
* **3. Steps to Reproduce:**
  1. Go to Dashboard Home.
  2. Locate the "Open Tasks (12)" card.
  3. Click on the card.
* **4. Expected vs. Actual:**
  * **Expected:** Navigates to `/tasks?status=open` showing filtered unresolved tasks.
  * **Actual:** Navigates to `/team/members`, displaying employee profiles.
* **5. Developer Self-Check:** Click every dashboard card during local development to verify destination routes.

---

### `BUG-NAV-0002`
#### Duplicate Active State Highlighting Incorrect Sidebar/Header Navigation Items
* **Domain:** Navigation, Routing & History
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Two navigation items share the same icon or route key. Navigating to Page A highlights Page B in the sidebar.
* **2. Developer Oversight:** Navigation matcher used broad prefix matching or shared duplicate parent keys across routes.
* **3. Steps to Reproduce:**
  1. Click on **Payment Ledger** in the sidebar.
  2. Observe sidebar active highlights.
  3. Click on **Audit Logs**.
* **4. Expected vs. Actual:**
  * **Expected:** Distinct icons; only the clicked page receives the active highlight.
  * **Actual:** Both share identical icons; clicking Ledger activates the Audit Logs highlight.
* **5. Developer Self-Check:** Use exact path matching (`pathname === item.path`) for active navigation states.

---

### `BUG-NAV-0003`
#### Secondary Nested Sub-Pages Lacking Back Buttons or Mobile Navigation Bars
* **Domain:** Navigation, Routing & History
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Navigating into secondary screens on mobile viewports causes the bottom navigation bar to vanish with no top header "Back" button provided.
* **2. Developer Oversight:** Sub-pages were registered outside the main navigation layout stack without a fallback header back button.
* **3. Steps to Reproduce:**
  1. Open the app on mobile viewport (390px).
  2. Tap an item to enter a sub-details screen.
  3. Check bottom of screen and top header.
* **4. Expected vs. Actual:**
  * **Expected:** Bottom tabs remain visible, OR a sticky `< Back` chevron button is rendered in the header.
  * **Actual:** Bottom tabs disappear, and no back button exists; user is trapped on the screen.
* **5. Developer Self-Check:** Ensure all nested sub-routes provide dynamic back navigation.

---

### `BUG-NAV-0004`
#### Browser Back/Forward Button Breaking Dynamic View State or Modal History
* **Domain:** Navigation, Routing & History
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Switching tabs on a page and pressing the browser Back button navigates completely away from the page instead of returning to the previous tab.
* **2. Developer Oversight:** Internal tab switching was stored purely in memory state without syncing to URL search query parameters (`?tab=settings`).
* **3. Steps to Reproduce:**
  1. Open a record with multiple tabs.
  2. Switch from Tab 1 to Tab 2.
  3. Press browser native Back button (`Alt + Left`).
* **4. Expected vs. Actual:**
  * **Expected:** Returns to Tab 1 without unmounting the parent page.
  * **Actual:** Navigates entirely away from the record to the previous external URL.
* **5. Developer Self-Check:** Sync active tab and sub-view states with URL search parameters.

---

### `BUG-NAV-0005`
#### Deep Links to Authenticated Sub-Routes Failing to Preserve Target After Login
* **Domain:** Navigation, Routing & History
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Opening a shared deep link (e.g., `/orders/12345`) while logged out redirects to `/login`. After logging in, the app dumps the user on `/dashboard` instead of the linked order.
* **2. Developer Oversight:** Auth router failed to capture `location.pathname` in a `?redirect=` query param during unauthenticated intercept.
* **3. Steps to Reproduce:**
  1. Log out of the application.
  2. Paste a direct link: `/reports/monthly-summary`.
  3. Log in with valid credentials.
* **4. Expected vs. Actual:**
  * **Expected:** After login, user is immediately redirected to `/reports/monthly-summary`.
  * **Actual:** User is redirected to generic `/home`, losing their destination.
* **5. Developer Self-Check:** Preserve redirect URLs in auth interceptors: `navigate(`/login?redirect=${encodeURIComponent(path)}`)`.

---

### `BUG-FORM-0001`
#### Mandatory Fields Lacking Red Asterisk Indicators Causing Unexpected Submission Blocks
* **Domain:** Forms, Inputs & Data Entry
* **Severity:** High | **Priority:** P1
* **1. Description:** Required inputs have no red asterisk (`*`) or `(required)` label. Submitting the form fails with a vague error toast without highlighting missing fields.
* **2. Developer Oversight:** Validation schema enforced `required: true`, but the visual indicator prop was omitted from the `<label>` component.
* **3. Steps to Reproduce:**
  1. Open any creation form.
  2. Fill only the first 2 fields and leave others blank.
  3. Click Submit.
* **4. Expected vs. Actual:**
  * **Expected:** All required field labels display a red asterisk (`*`); submitting empty highlights missing inputs in red with inline error text.
  * **Actual:** Required and optional labels look identical; submission fails with a vague toast *"Please fill all required fields"*.
* **5. Developer Self-Check:** Use a standard `FormLabel` component that renders `*` when `required={true}`.

---

### `BUG-FORM-0002`
#### Fixed-Width Input Containers Causing Text Truncation on Long Strings or Names
* **Domain:** Forms, Inputs & Data Entry
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Input boxes for fields like State, City, or Title have hardcoded narrow widths (`width: 80px`), causing standard names to be clipped horizontally.
* **2. Developer Oversight:** Used fixed-pixel widths (`w-20`) assuming short abbreviations, without testing full location names.
* **3. Steps to Reproduce:**
  1. Locate the State or City input box.
  2. Type `"Maharashtra"` or `"San Francisco"`.
* **4. Expected vs. Actual:**
  * **Expected:** Input container expands responsively (min-width 180px or 100% of grid column).
  * **Actual:** Text is cramped and clipped to `"Maharas..."`, hiding characters.
* **5. Developer Self-Check:** Avoid fixed pixel widths on text inputs; use fluid CSS grid/flexbox layouts.

---

### `BUG-FORM-0003`
#### Numeric and Currency Inputs Accepting Negative Values or Invalid Symbols (`e`, `-`)
* **Domain:** Forms, Inputs & Data Entry
* **Severity:** High | **Priority:** P1
* **1. Description:** Inputs intended for prices or quantities permit typing negative numbers (`-50`), exponential symbols (`1e4`), or multiple decimals (`5.2.1`).
* **2. Developer Oversight:** Relied on raw `<input type="number">` without blocking key events for `-`, `+`, `e` or enforcing `min="0"`.
* **3. Steps to Reproduce:**
  1. Open any form with a Price or Quantity input.
  2. Type `-100` or `12e4`.
  3. Click Submit.
* **4. Expected vs. Actual:**
  * **Expected:** Input rejects non-numeric characters (`-`, `e`, `+`) and enforces `min="0"`.
  * **Actual:** Accepts invalid negative/malformed values, corrupting totals.
* **5. Developer Self-Check:** Block invalid keys on numeric inputs and validate with schema constraints.

---

### `BUG-FORM-0004`
#### Promotional / Referral Code Input Accepted Without Verification or Total Recalculation
* **Domain:** Forms, Inputs & Data Entry
* **Severity:** High | **Priority:** P1
* **1. Description:** Entering a promo/referral code during checkout allows proceeding to payment without validating the code or updating the invoice total.
* **2. Developer Oversight:** Lacked an "Apply" validation trigger, and checkout submission failed to connect coupon verification to invoice calculation.
* **3. Steps to Reproduce:**
  1. Navigate to checkout.
  2. Type a referral code in the promo input.
  3. Click Proceed to Payment.
* **4. Expected vs. Actual:**
  * **Expected:** System validates code, displays green badge *"20% Discount Applied"*, and recalculates total before payment.
  * **Actual:** No validation occurs; invoice remains at full price.
* **5. Developer Self-Check:** Provide an explicit "Apply" button and recalculate invoice totals before charging.

---

### `BUG-FORM-0005`
#### Unsanitized Leading/Trailing Whitespace Corrupting Search or Failing Validation
* **Domain:** Forms, Inputs & Data Entry
* **Severity:** Low | **Priority:** P3
* **1. Description:** Pasting strings with leading or trailing spaces (e.g., `" admin@domain.com "`) causes strict email validation to fail or breaks search queries.
* **2. Developer Oversight:** Form handlers failed to call `.trim()` on text input values prior to validation and API dispatch.
* **3. Steps to Reproduce:**
  1. Copy text with trailing spaces: `"user@domain.com "`.
  2. Paste into the login/search input and submit.
* **4. Expected vs. Actual:**
  * **Expected:** Input automatically trims leading/trailing whitespace and succeeds.
  * **Actual:** Validation fails with *"Invalid email format"* or search returns 0 results.
* **5. Developer Self-Check:** Always sanitize text inputs using `.trim()` in validation schemas.

---

### `BUG-FORM-0006`
#### Pressing Keyboard `Enter` Inside Form Input Fails to Trigger Form Submission
* **Domain:** Forms, Inputs & Data Entry
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Pressing the `Enter` key while focused inside an input box does nothing instead of submitting the form.
* **2. Developer Oversight:** Form inputs were placed inside generic `<div>` containers instead of semantic `<form onSubmit={...}>` elements.
* **3. Steps to Reproduce:**
  1. Type username and password into a login form.
  2. Press `Enter` on the keyboard without clicking the mouse.
* **4. Expected vs. Actual:**
  * **Expected:** Form submits automatically on `Enter` keypress.
  * **Actual:** Nothing happens; user is forced to manually click the submit button.
* **5. Developer Self-Check:** Always wrap inputs in semantic `<form>` tags with an explicit `type="submit"` button.

---

### `BUG-FORM-0007`
#### Character Counter Displaying Negative Numbers When Pasting Text Over Limit
* **Domain:** Forms, Inputs & Data Entry
* **Severity:** Low | **Priority:** P3
* **1. Description:** Pasting text exceeding the maximum limit into a textarea causes the character counter to display negative values (e.g., `-24 / 200 characters remaining`).
* **2. Developer Oversight:** Lacked `maxLength` attribute on the textarea, and the character counter subtracted length without clamping at zero.
* **3. Steps to Reproduce:**
  1. Locate a textarea with a 200-character limit.
  2. Paste a 300-character paragraph.
* **4. Expected vs. Actual:**
  * **Expected:** Input truncates at 200 characters or highlights excess text with counter clamped at `200/200` and disables submit.
  * **Actual:** Input accepts all text and counter displays negative values (`-100 characters remaining`).
* **5. Developer Self-Check:** Set `maxLength` and prevent submission when character limit is exceeded.

---

### `BUG-DATA-0001`
#### Dashboard Summary Counter Badge Mismatching Total Rows in Underlying Table View
* **Domain:** Data Sync, State Logic & Math
* **Severity:** Medium | **Priority:** P2
* **1. Description:** A dashboard summary badge shows a count of `8` (e.g., *Pending Reviews: 8*), but clicking into the view renders a table listing 9 active records.
* **2. Developer Oversight:** Discrepancy between dashboard summary query (cached or extra filter applied) and the detailed table query.
* **3. Steps to Reproduce:**
  1. Note count badge on summary tile (`8`).
  2. Click tile to open detailed table view.
  3. Count physical table rows (`9`).
* **4. Expected vs. Actual:**
  * **Expected:** Summary badge count matches total records displayed in table (both showing 9).
  * **Actual:** Badge indicates 8 while table lists 9 rows.
* **5. Developer Self-Check:** Ensure summary count queries and table queries use identical database filter criteria.

---

### `BUG-DATA-0002`
#### Quantity Increment Control Allowing Items to Exceed Live Inventory/Quota Limits
* **Domain:** Data Sync, State Logic & Math
* **Severity:** High | **Priority:** P1
* **1. Description:** The `+` quantity increment button remains active even after cart quantity equals available stock (e.g., stock is 2, user increments to 6), failing late at checkout.
* **2. Developer Oversight:** Frontend state handler incremented quantity without checking `cartQty < availableStock`.
* **3. Steps to Reproduce:**
  1. Find an item with low stock (`Available: 2`).
  2. Click the `+` button 5 times.
  3. Click Complete Order.
* **4. Expected vs. Actual:**
  * **Expected:** The `+` button becomes disabled (`disabled={qty >= stock}`) when cart quantity reaches available stock (2).
  * **Actual:** Quantity increments indefinitely; checkout fails late with *"Insufficient stock"*.
* **5. Developer Self-Check:** Disable increment triggers when `currentQty >= maxAvailableStock`.

---

### `BUG-DATA-0003`
#### Floating-Point Rounding Errors Displaying Unformatted Decimal Totals in Invoices
* **Domain:** Data Sync, State Logic & Math
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Invoices display raw floating-point calculation strings like `$19.999999999998` instead of properly rounded currency strings (`$20.00`).
* **2. Developer Oversight:** JavaScript floating-point calculations were rendered directly without formatting through `Intl.NumberFormat` or `toFixed(2)`.
* **3. Steps to Reproduce:**
  1. Add items with fractional tax/discount rates.
  2. Open the invoice summary breakdown.
* **4. Expected vs. Actual:**
  * **Expected:** All monetary values format with exact 2-decimal currency formatting (`$20.00`).
  * **Actual:** Raw floating-point string `$19.999999999998` is displayed.
* **5. Developer Self-Check:** Pass all monetary outputs through standard currency formatting utilities.

---

### `BUG-DATA-0004`
#### Stale Cached Data Displaying After Successful Create/Update/Delete Actions
* **Domain:** Data Sync, State Logic & Math
* **Severity:** High | **Priority:** P1
* **1. Description:** After adding, editing, or deleting a record, the table list continues to show stale data until the user manually hard-refreshes the browser.
* **2. Developer Oversight:** Client cache query keys (React Query / SWR / RTK) were not invalidated after mutation success.
* **3. Steps to Reproduce:**
  1. Delete an item from a list.
  2. Observe the table view immediately after modal closes.
* **4. Expected vs. Actual:**
  * **Expected:** Deleted item vanishes instantly via optimistic update or automatic cache refetch.
  * **Actual:** Deleted item remains in the list until full browser reload.
* **5. Developer Self-Check:** Always trigger cache invalidation (`queryClient.invalidateQueries(...)`) upon mutation success.

---

### `BUG-RESP-0001`
#### Responsive Breakpoint Collapse Causing Navigation Controls to Jump or Overlap
* **Domain:** Responsive UI & Layout Breakpoints
* **Severity:** Medium | **Priority:** P3
* **1. Description:** Resizing the browser to split-screen (~960px width) causes the hamburger menu icon to jump to the top-right corner next to the user profile avatar.
* **2. Developer Oversight:** CSS Flexbox container used `justify-content: space-between` with improper responsive ordering on `@media (max-width: 1024px)`.
* **3. Steps to Reproduce:**
  1. Open the app on desktop (1920x1080).
  2. Resize browser to split-screen (~960px).
  3. Observe the position of the hamburger menu icon.
* **4. Expected vs. Actual:**
  * **Expected:** Hamburger menu icon remains anchored on the far-left beside the logo.
  * **Actual:** Hamburger menu icon jumps to the top-right corner.
* **5. Developer Self-Check:** Group left-aligned navigation elements inside a dedicated sub-flex container.

---

### `BUG-RESP-0002`
#### Action Button Background Color Colliding with Parent Card Theme Background
* **Domain:** Responsive UI & Layout Breakpoints
* **Severity:** Medium | **Priority:** P2
* **1. Description:** An action button uses a background color (`#4f46e5`) identical to the container card's header background (`#4f46e5`), rendering the button border invisible.
* **2. Developer Oversight:** Hardcoded inline CSS colors used instead of semantic design system token classes.
* **3. Steps to Reproduce:**
  1. Open a card container with a colored header.
  2. Locate the action button inside that header.
  3. Observe contrast and border visibility.
* **4. Expected vs. Actual:**
  * **Expected:** Button has a high-contrast background that clearly differentiates it from the container card.
  * **Actual:** Button background blends into the container; only floating text is visible.
* **5. Developer Self-Check:** Use design system semantic tokens (`bg-surface`, `bg-primary`) and run contrast tests.

---

### `BUG-RESP-0003`
#### Unbroken Long Strings, URLs, or Table Cells Causing Horizontal Container Overflow
* **Domain:** Responsive UI & Layout Breakpoints
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Entering a long continuous string without spaces (e.g., a long URL) overflows outside its container card, forcing an unintended page-wide horizontal scrollbar.
* **2. Developer Oversight:** Missing CSS word-break properties (`overflow-wrap: break-word` / `word-break: break-all`) on text containers.
* **3. Steps to Reproduce:**
  1. Create a record with a 60-character unbroken string: `https://example.com/very/long/unbroken/path/parameter/string/without/spaces`.
  2. View record on mobile and desktop viewports.
* **4. Expected vs. Actual:**
  * **Expected:** Long text wraps smoothly within the container width or truncates cleanly with an ellipsis (`...`).
  * **Actual:** Text overflows beyond card borders, breaking page alignment.
* **5. Developer Self-Check:** Add `overflow-wrap: break-word` or `truncate` classes to all dynamic text containers.

---

### `BUG-RESP-0004`
#### Sticky Headers or Floating Footers Obscuring Inputs and Primary Submit Buttons
* **Domain:** Responsive UI & Layout Breakpoints
* **Severity:** High | **Priority:** P1
* **1. Description:** On smaller desktop or laptop screens (1366x768), fixed bottom action bars cover the last 2 form inputs, making them un-clickable.
* **2. Developer Oversight:** Fixed positioning elements lacked corresponding padding-bottom (`pb-24`) on the parent scrollable container.
* **3. Steps to Reproduce:**
  1. Open a long form on a laptop screen (1366x768).
  2. Scroll to the very bottom of the page.
* **4. Expected vs. Actual:**
  * **Expected:** Form content scrolls completely clear of the floating footer with visible bottom margin.
  * **Actual:** Bottom 2 inputs are hidden underneath the sticky footer bar.
* **5. Developer Self-Check:** Add generous bottom padding to scrollable containers with fixed footers.

---

### `BUG-RESP-0005`
#### Dark Mode Toggle Leaving Un-Themed Inline Elements with Dark-on-Dark Text
* **Domain:** Responsive UI & Layout Breakpoints
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Switching the application to Dark Mode turns the page background dark gray, but certain hardcoded text elements remain black (`#000000`), becoming unreadable.
* **2. Developer Oversight:** Hardcoded `#000` text colors were used in custom components instead of dark-mode reactive classes (`text-gray-900 dark:text-gray-100`).
* **3. Steps to Reproduce:**
  1. Open the application and toggle Dark Theme in settings.
  2. Inspect table sub-headers, badges, and helper texts.
* **4. Expected vs. Actual:**
  * **Expected:** All text dynamically shifts to high-contrast light colors (`#ffffff` / `#e5e7eb`).
  * **Actual:** Hardcoded black text blends into dark background, becoming unreadable.
* **5. Developer Self-Check:** Audit all components for hardcoded hex colors when implementing theme modes.

---

### `BUG-RBAC-0001`
#### Dead Action Buttons Rendered with Unattached Click Handlers or Empty Stubs
* **Domain:** Roles & Permissions UI
* **Severity:** High | **Priority:** P1
* **1. Description:** Clicking an action button (e.g., *"Roles & Permissions"*) produces zero result. No drawer opens, no modal displays, and no network call fires.
* **2. Developer Oversight:** Button was created with an empty click handler stub (`onClick={() => {}}`) during UI drafting and never connected to the modal hook.
* **3. Steps to Reproduce:**
  1. Log in as Administrator.
  2. Click on the action button in the management table.
* **4. Expected vs. Actual:**
  * **Expected:** Action opens the corresponding modal or management drawer.
  * **Actual:** Button is completely inert; zero visual or network response.
* **5. Developer Self-Check:** Audit all UI action buttons before PR review to ensure active event bindings.

---

### `BUG-RBAC-0002`
#### Unauthorized Action Controls Visible to Restricted Roles, Causing Raw 403 Errors
* **Domain:** Roles & Permissions UI
* **Severity:** High | **Priority:** P2
* **1. Description:** Standard users see active "Edit" and "Delete" buttons. Clicking them allows editing fields, but clicking Save crashes with an unhandled `403 Forbidden` toast.
* **2. Developer Oversight:** Permission checks were enforced only on the backend API and not reflected in conditional frontend UI rendering.
* **3. Steps to Reproduce:**
  1. Log in as a standard non-admin user.
  2. Navigate to another user's profile and click **Edit**.
  3. Modify a field and click **Save**.
* **4. Expected vs. Actual:**
  * **Expected:** Edit buttons are hidden or disabled with a tooltip *"Admin permission required"*.
  * **Actual:** Edit form is accessible; saving throws an unhandled `403 Forbidden` error.
* **5. Developer Self-Check:** Wrap restricted controls in permission guards: `{hasPermission('EDIT') && <EditButton />}`.

---

### `BUG-RBAC-0003`
#### Disabled/Read-Only Input Fields Visually Resembling Active Editable Inputs
* **Domain:** Roles & Permissions UI
* **Severity:** Low | **Priority:** P3
* **1. Description:** Read-only or disabled form fields use the identical white background and border as editable inputs, misleading users to click and type.
* **2. Developer Oversight:** Omitted disabled styling (`bg-gray-100 cursor-not-allowed text-gray-500`) on disabled inputs.
* **3. Steps to Reproduce:**
  1. Open a profile form with locked fields (e.g., System User ID).
  2. Click into the locked field.
* **4. Expected vs. Actual:**
  * **Expected:** Disabled field has a distinct shaded gray background and `not-allowed` cursor.
  * **Actual:** Looks identical to active editable fields, creating user confusion.
* **5. Developer Self-Check:** Apply distinct visual styles (`opacity-60 bg-muted`) to all disabled controls.

---

### `BUG-FILT-0001`
#### Dropdown Filters Passing Unmapped Parameter IDs, Returning Empty Results
* **Domain:** Search, Filtering & Pagination
* **Severity:** High | **Priority:** P1
* **1. Description:** In a filter bar, selecting Option A works, but selecting Options B, C, or D returns an empty table with 0 rows despite records existing in the database.
* **2. Developer Oversight:** Dropdown option values passed malformed or unmapped query parameters (`?category=undefined` or hardcoded `1` for all non-first options).
* **3. Steps to Reproduce:**
  1. Open a data report with a Category dropdown filter.
  2. Select Option 2 or Option 3.
  3. Observe table rows and Network tab request URL.
* **4. Expected vs. Actual:**
  * **Expected:** Table loads and displays records matching the selected category.
  * **Actual:** Table displays empty state *"No records found"*; Network tab reveals `?category=undefined`.
* **5. Developer Self-Check:** Verify dropdown options bind to valid unique IDs (`<option value={item.id}>`).

---

### `BUG-FILT-0002`
#### Refresh / Clear Filter Button Executing Full Page Reload Without Clearing Query Params
* **Domain:** Search, Filtering & Pagination
* **Severity:** Low | **Priority:** P3
* **1. Description:** Clicking "Clear Filters" executes a full page reload (`window.location.reload()`), retaining active URL query parameters (`?status=active`), failing to reset filters.
* **2. Developer Oversight:** Attached `window.location.reload()` instead of programmatically resetting state variables and clearing URL search parameters.
* **3. Steps to Reproduce:**
  1. Apply multiple filters.
  2. Click Reset / Clear Filters.
  3. Observe URL and filter inputs after page reloads.
* **4. Expected vs. Actual:**
  * **Expected:** Dropdowns reset to default ("All"), URL query parameters clear, and data refreshes smoothly.
  * **Actual:** Full page reloads, but previous filter selections remain locked.
* **5. Developer Self-Check:** Reset filter state programmatically: `setFilters(DEFAULT_STATE); setSearchParams({});`.

---

### `BUG-FILT-0003`
#### Pagination Navigation Losing Active Search Filter and Sort Criteria on Page Switch
* **Domain:** Search, Filtering & Pagination
* **Severity:** High | **Priority:** P1
* **1. Description:** Searching for `"Admin"` displays 25 results across 3 pages. Clicking **Page 2** in the pagination bar wipes the search keyword and displays Page 2 of the entire unfiltered database.
* **2. Developer Oversight:** Pagination click handler dispatched a fetch with `{ page: 2 }` without spreading the existing filter/search state parameters.
* **3. Steps to Reproduce:**
  1. Filter a data table by keyword `"Admin"`.
  2. Click **Page 2** in pagination.
* **4. Expected vs. Actual:**
  * **Expected:** Page 2 displays the next 10 matching `"Admin"` records; search bar retains `"Admin"`.
  * **Actual:** Search keyword is wiped; table displays Page 2 of the entire unfiltered database.
* **5. Developer Self-Check:** Preserve active filter state when requesting pagination pages: `fetchData({ ...currentFilters, page: 2 })`.

---

### `BUG-FILT-0004`
#### Search Input Lacking Debounce, Firing Rapid API Requests Causing Race Conditions
* **Domain:** Search, Filtering & Pagination
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Typing quickly into a search input dispatches an API request on every keystroke. Slower earlier responses overwrite newer fast responses, displaying wrong results.
* **2. Developer Oversight:** Search input handler omitted a debounce timer (300ms–500ms) before dispatching API calls.
* **3. Steps to Reproduce:**
  1. Quickly type `"Laptop"` into a live search input.
  2. Inspect the Network tab.
* **4. Expected vs. Actual:**
  * **Expected:** Exactly one API request fires 300ms after the user stops typing.
  * **Actual:** 6 separate API requests fire consecutively; out-of-order responses corrupt search results.
* **5. Developer Self-Check:** Wrap all live search inputs in a `useDebounce` hook.

---

### `BUG-FILT-0005`
#### Filtered Empty State Lacking Clear Action, Leaving User Stuck on Zero Results
* **Domain:** Search, Filtering & Pagination
* **Severity:** Low | **Priority:** P3
* **1. Description:** When a search returns 0 results, the table displays a generic blank area without explaining why or providing a quick button to clear filters.
* **2. Developer Oversight:** Omitted an empty state illustration with a "Clear all filters" call-to-action button.
* **3. Steps to Reproduce:**
  1. Search for a non-existent keyword (e.g., `xyz12345`).
* **4. Expected vs. Actual:**
  * **Expected:** Displays an empty state graphic: *"No records match your search"* with a clickable *"Clear Filters"* button.
  * **Actual:** Displays a broken empty grid with no guidance on how to reset.
* **5. Developer Self-Check:** Always render an informative empty state component with a quick-reset button.

---

### `BUG-ASYNC-0001`
#### Rapid Double-Clicking on Submit Buttons Generating Duplicate Transactions
* **Domain:** Async States & Race Conditions
* **Severity:** Critical | **Priority:** P0
* **1. Description:** Rapidly double-clicking "Complete Order" or "Create Record" fires two simultaneous API calls, creating duplicate records and double-charging balances.
* **2. Developer Oversight:** Button lacked immediate disabling upon first click (`disabled={isSubmitting}` missing), and API lacked idempotency validation.
* **3. Steps to Reproduce:**
  1. Fill out a checkout form.
  2. Rapidly double-click the **Complete Order** button.
  3. Check the Orders table.
* **4. Expected vs. Actual:**
  * **Expected:** First click immediately disables button and displays loading spinner; exactly one record is created.
  * **Actual:** Two duplicate orders are created with consecutive IDs and identical timestamps.
* **5. Developer Self-Check:** Always disable submit buttons immediately upon click: `<button disabled={isSubmitting}>`.

---

### `BUG-ASYNC-0002`
#### API Submission Failures Displaying Generic "Something Went Wrong" with No Field Cues
* **Domain:** Async States & Race Conditions
* **Severity:** Medium | **Priority:** P2
* **1. Description:** When form submission fails due to a specific backend validation error (e.g., duplicate phone number), UI shows a generic red toast without highlighting the field.
* **2. Developer Oversight:** Frontend `catch` block caught API error response but failed to parse the structured `errors` dictionary.
* **3. Steps to Reproduce:**
  1. Enter a phone number already registered to another account.
  2. Click Submit.
* **4. Expected vs. Actual:**
  * **Expected:** The specific Phone Number field outlines in red with helper text: *"This phone number is already registered"*.
  * **Actual:** A vague *"Something went wrong"* toast appears; no field is highlighted.
* **5. Developer Self-Check:** Map backend validation error keys directly to form field error states.

---

### `BUG-ASYNC-0003`
#### Missing Loading Spinners / Skeletons Causing Content Layout Shifts and Dead Clicks
* **Domain:** Async States & Race Conditions
* **Severity:** Medium | **Priority:** P2
* **1. Description:** When a page or modal loads data, the UI remains blank with zero visual cues for 1–2 seconds. Users assume the click failed and click repeatedly.
* **2. Developer Oversight:** Omitted loading skeleton states or spinner placeholders during async fetch lifecycles.
* **3. Steps to Reproduce:**
  1. Throttle network connection to "Slow 3G" in DevTools.
  2. Click to open a data-heavy view.
* **4. Expected vs. Actual:**
  * **Expected:** Instant render of animated skeleton placeholders or a centered loading spinner.
  * **Actual:** Container remains blank and frozen until data abruptly snaps in, causing layout shift.
* **5. Developer Self-Check:** Always render skeleton placeholders while `isLoading === true`.

---

### `BUG-ASYNC-0004`
#### Silent Background API Failures Leaving UI in an Infinite Loading State
* **Domain:** Async States & Race Conditions
* **Severity:** High | **Priority:** P1
* **1. Description:** If an API endpoint times out or returns a 500 error, the button loading spinner keeps spinning forever with no error alert.
* **2. Developer Oversight:** Failed to set `setIsLoading(false)` inside a `finally` block or omitted error state handling in async dispatchers.
* **3. Steps to Reproduce:**
  1. Disconnect internet or block an API endpoint in DevTools.
  2. Click Submit on any form.
* **4. Expected vs. Actual:**
  * **Expected:** Spinner stops and an explicit error notification is displayed: *"Network error. Please try again."*.
  * **Actual:** Spinner spins infinitely; the form remains locked forever.
* **5. Developer Self-Check:** Always clear loading states inside `try ... catch ... finally` blocks.

---

### `BUG-MODAL-0001`
#### Clicking Outside Modal Dismisses Active Form Without Unsaved-Changes Confirmation
* **Domain:** Modals, Drawers & Popovers
* **Severity:** Medium | **Priority:** P2
* **1. Description:** While filling out a multi-field modal, accidentally clicking on the shaded backdrop instantly closes the dialog and erases all entered data without warning.
* **2. Developer Oversight:** Modal component had `closeOnBackdropClick={true}` enabled by default without checking if form inputs were modified (`isDirty`).
* **3. Steps to Reproduce:**
  1. Open a creation modal and fill out 5 fields.
  2. Click once on the dark backdrop outside the modal card.
  3. Reopen the modal.
* **4. Expected vs. Actual:**
  * **Expected:** Backdrop click is ignored while form is dirty, OR prompts a confirmation: *"You have unsaved changes. Discard?"*.
  * **Actual:** Modal immediately vanishes; reopening shows all entered data was lost.
* **5. Developer Self-Check:** Disable backdrop clicking on data-entry modals: `closeOnOverlayClick={false}`.

---

### `BUG-MODAL-0002`
#### Nested Dropdowns / Datepickers Clipped by Parent Modal `overflow: hidden` Rules
* **Domain:** Modals, Drawers & Popovers
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Opening a dropdown or datepicker near the bottom of a modal causes the dropdown list to be clipped and hidden behind the modal's rounded border.
* **2. Developer Oversight:** Modal container had `overflow: hidden` applied without using a React Portal to render dropdown menus in the root body.
* **3. Steps to Reproduce:**
  1. Open a modal containing a dropdown near the bottom.
  2. Click to expand the dropdown options.
* **4. Expected vs. Actual:**
  * **Expected:** Dropdown menu floats on top of all modal borders (rendered via Portal).
  * **Actual:** Dropdown is cut off by the modal bottom edge with a forced internal scrollbar.
* **5. Developer Self-Check:** Render floating dropdowns and popovers using Portals attached to `document.body`.

---

### `BUG-MODAL-0003`
#### Keyboard `Tab` Navigation Escaping Open Modal and Interacting with Background
* **Domain:** Modals, Drawers & Popovers
* **Severity:** Medium | **Priority:** P2
* **1. Description:** When a modal is open, pressing the `Tab` key repeatedly moves keyboard focus behind the modal to background header links and buttons.
* **2. Developer Oversight:** Modal lacked a Focus Trap wrapper to constrain keyboard tab cycling within the active dialog.
* **3. Steps to Reproduce:**
  1. Open any modal dialog.
  2. Press `Tab` repeatedly on the keyboard.
* **4. Expected vs. Actual:**
  * **Expected:** Keyboard focus cycles exclusively through inputs and buttons inside the modal.
  * **Actual:** Focus jumps to background page elements behind the darkened overlay.
* **5. Developer Self-Check:** Implement a standard FocusTrap on all modal and drawer dialogs.

---

### `BUG-EXP-0001`
#### Document Export / Share Action Producing Distorted Dimensions vs Print Layout
* **Domain:** Export, Printing & File Generation
* **Severity:** High | **Priority:** P2
* **1. Description:** Clicking "Print" prints a clean receipt, but clicking "Share PDF" generates a file where text is squished into the corner with stretched fonts.
* **2. Developer Oversight:** "Print" used native `@media print` CSS, while "Share PDF" used client-side canvas export with incorrect viewport DPI scaling.
* **3. Steps to Reproduce:**
  1. Open an invoice preview.
  2. Click **Share / Export PDF**.
  3. Open downloaded PDF in a viewer.
* **4. Expected vs. Actual:**
  * **Expected:** Shared PDF maintains standard portrait/landscape proportions with crisp typography and aligned columns.
  * **Actual:** Content is distorted, squished horizontally, and cropped on right margins.
* **5. Developer Self-Check:** Use high-DPI scaling (`scale: 2`) and validate exports across multiple PDF viewers.

---

### `BUG-EXP-0002`
#### CSV/Excel Export Omitting Actively Filtered Columns or Exporting Raw Unix Timestamps
* **Domain:** Export, Printing & File Generation
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Exporting a filtered table to CSV ignores active table filters (exporting all 10,000 database rows) and formats dates as raw Unix timestamps (`1727784000`).
* **2. Developer Oversight:** CSV export generator triggered a raw backend table dump without passing active UI filter parameters and date formatters.
* **3. Steps to Reproduce:**
  1. Filter table by date range and status.
  2. Click **Export to CSV**.
  3. Open CSV file in Excel.
* **4. Expected vs. Actual:**
  * **Expected:** CSV contains only the filtered rows with human-readable dates (`2026-09-24`).
  * **Actual:** CSV contains all unfiltered database records with raw timestamps.
* **5. Developer Self-Check:** Ensure export endpoints receive identical filter query parameters as table views.

---

### `BUG-FILE-0001`
#### Dragging File Outside Dropzone Opens File Directly in Browser, Losing Page State
* **Domain:** File Uploads & Media Handling
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Dragging a file and accidentally dropping it slightly outside the designated dropzone border causes the browser to open the image/PDF directly, navigating away and destroying form state.
* **2. Developer Oversight:** Failed to call `e.preventDefault()` on window-level `dragover` and `drop` event listeners.
* **3. Steps to Reproduce:**
  1. Fill out half of a record form with a file upload zone.
  2. Drag an image file from desktop and drop it 10px outside the dropzone box.
* **4. Expected vs. Actual:**
  * **Expected:** Browser blocks native file opening; dropzone highlights and captures file safely.
  * **Actual:** Browser navigates entirely away to `file:///C:/image.png`, wiping all form progress.
* **5. Developer Self-Check:** Add global `e.preventDefault()` handlers for `dragover` and `drop` on window.

---

### `BUG-FILE-0002`
#### Uploading Files Exceeding Size Limit Accepted in UI Before Failing Late on Server
* **Domain:** File Uploads & Media Handling
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Selecting a 50MB file on an input with a 5MB limit shows a 100% upload progress bar before suddenly throwing an unhandled `413 Payload Too Large` error.
* **2. Developer Oversight:** Client-side file selection handler failed to check `file.size <= MAX_BYTES` before initiating the upload request.
* **3. Steps to Reproduce:**
  1. Find a file exceeding the upload size limit (e.g., 25MB file for a 5MB limit).
  2. Select the file in the upload dialog.
* **4. Expected vs. Actual:**
  * **Expected:** Immediate inline error before upload starts: *"File size (25MB) exceeds maximum allowed limit of 5MB"*.
  * **Actual:** File uploads completely and crashes late with an unhandled server error.
* **5. Developer Self-Check:** Validate `file.size` and `file.type` immediately inside the `onChange` handler.

---

### `BUG-FILE-0003`
#### Image Upload Lacking Client-Side Preview, Displaying Broken Image Placeholders
* **Domain:** File Uploads & Media Handling
* **Severity:** Low | **Priority:** P3
* **1. Description:** After selecting an avatar image to upload, the preview box displays a broken image icon until the user saves the form and reloads.
* **2. Developer Oversight:** Omitted `URL.createObjectURL(file)` to generate an instant temporary local image preview.
* **3. Steps to Reproduce:**
  1. Click **Upload Profile Picture**.
  2. Select a local JPG file.
* **4. Expected vs. Actual:**
  * **Expected:** Selected image displays immediately in the avatar preview circle.
  * **Actual:** Displays a broken image icon or blank box until submitted.
* **5. Developer Self-Check:** Use `URL.createObjectURL(file)` for instant client-side image preview thumbnails.

---

### `BUG-GRID-0001`
#### "Select All" Table Checkbox Selecting Only Visible Page Rows Instead of Total Dataset
* **Domain:** Data Grids, Tables & Bulk Actions
* **Severity:** High | **Priority:** P1
* **1. Description:** In a table with 500 records across 10 pages, clicking the master header checkbox displays *"500 items selected"*, but clicking "Bulk Delete" only deletes the 50 items on Page 1.
* **2. Developer Oversight:** UI state confused page-level row selection (`selectedRowIds`) with global query selection (`selectAllMatching`).
* **3. Steps to Reproduce:**
  1. Open a table with 100+ records across multiple pages.
  2. Check the master "Select All" checkbox in the table header.
  3. Click **Bulk Export** or **Bulk Delete**.
* **4. Expected vs. Actual:**
  * **Expected:** UI provides a clear distinction: *"50 items on this page selected. Select all 500 items across all pages?"*.
  * **Actual:** UI implies all 500 are selected, but action applies only to the visible 50 rows.
* **5. Developer Self-Check:** Provide explicit two-tier selection banners for paginated data tables.

---

### `BUG-GRID-0002`
#### Multi-Column Table Sorting Stuck in Permanent Sort State with No 3-State Reset
* **Domain:** Data Grids, Tables & Bulk Actions
* **Severity:** Low | **Priority:** P3
* **1. Description:** Clicking a table column header sorts Ascending (`▲`), clicking again sorts Descending (`▼`), but clicking a third time toggles back to Ascending, making it impossible to remove the sort.
* **2. Developer Oversight:** Sorting handler implemented 2-state toggle instead of standard 3-state cycle (`None -> Asc -> Desc -> None`).
* **3. Steps to Reproduce:**
  1. Click the "Date" column header in any data table.
  2. Click it a second time.
  3. Click it a third time.
* **4. Expected vs. Actual:**
  * **Expected:** 3-state cycle: Ascending -> Descending -> Natural/Default sort.
  * **Actual:** Stuck cycling endlessly between Ascending and Descending.
* **5. Developer Self-Check:** Implement a 3-state sorting cycle for table column headers.

---

### `BUG-GRID-0003`
#### Sticky Table Header Misaligning Column Widths During Horizontal Scrolling
* **Domain:** Data Grids, Tables & Bulk Actions
* **Severity:** Medium | **Priority:** P2
* **1. Description:** In wide data tables with fixed headers, scrolling horizontally causes table body columns to shift out of alignment with their header titles.
* **2. Developer Oversight:** Header table and body table were rendered as separate `<table>` elements with decoupled column width percentages.
* **3. Steps to Reproduce:**
  1. Open a 12-column wide data table on a smaller viewport.
  2. Scroll horizontally to the right.
* **4. Expected vs. Actual:**
  * **Expected:** Header titles remain locked perfectly in alignment with their data columns.
  * **Actual:** Column headers shift 50px–100px out of sync with cell data.
* **5. Developer Self-Check:** Use a single `<table>` element with CSS `position: sticky; top: 0` on `<th>` elements.

---

### `BUG-NOTIF-0001`
#### Rapid Consecutive Error Notifications Stacking and Obscuring Primary Action Buttons
* **Domain:** Notifications, Toasts & Alerts
* **Severity:** Low | **Priority:** P3
* **1. Description:** Rapid validation errors generate 5 separate toast notifications that stack vertically, covering primary submit and navigation buttons.
* **2. Developer Oversight:** Toast provider lacked a maximum limit (`limit: 3`) and omitted toast grouping/deduplication.
* **3. Steps to Reproduce:**
  1. Trigger 4 validation errors in quick succession.
  2. Observe the bottom-right or top-right screen corner.
* **4. Expected vs. Actual:**
  * **Expected:** Toasts cap at maximum 3 visible alerts, with older toasts dismissing smoothly.
  * **Actual:** 5+ toasts stack across the screen, blocking underlying buttons.
* **5. Developer Self-Check:** Configure toast manager with `maxToasts: 3` and toast deduplication.

---

### `BUG-NOTIF-0002`
#### Auto-Dismissing Error Toasts After 2 Seconds Before User Can Read Error Text
* **Domain:** Notifications, Toasts & Alerts
* **Severity:** Medium | **Priority:** P2
* **1. Description:** A critical multi-line error toast appears and automatically vanishes after 2 seconds, leaving the user confused with insufficient time to read the error.
* **2. Developer Oversight:** Applied a uniform 2000ms auto-dismiss timer across both simple success messages and complex error alerts.
* **3. Steps to Reproduce:**
  1. Trigger a backend error containing a 2-sentence explanation.
  2. Time how long the notification remains on screen.
* **4. Expected vs. Actual:**
  * **Expected:** Success toasts auto-dismiss in 3–4s; error toasts remain for 6–8s or require manual close.
  * **Actual:** Error toast flashes for 2 seconds and disappears prematurely.
* **5. Developer Self-Check:** Set longer auto-dismiss timeouts (6000ms+) or disable auto-dismiss on error toasts.

---

### `BUG-I18N-0001`
#### Datepicker Displaying Previous Day's Date Due to UTC Timezone Offset Conversion
* **Domain:** Localization, Timezones & Formats
* **Severity:** High | **Priority:** P1
* **1. Description:** A user in timezone UTC+5:30 selects `2026-10-01` in a datepicker. After saving and reloading, the UI displays `2026-09-30`.
* **2. Developer Oversight:** Date was converted using `new Date().toISOString()` which shifted midnight local time backwards into the previous day in UTC.
* **3. Steps to Reproduce:**
  1. Set system timezone to any positive UTC offset (e.g., UTC+5:30 or UTC+8).
  2. Select `October 1, 2026` in a Date of Birth or Event Date input.
  3. Save and reload the record.
* **4. Expected vs. Actual:**
  * **Expected:** Date displays consistently as `October 1, 2026`.
  * **Actual:** Date shifts backward and displays `September 30, 2026`.
* **5. Developer Self-Check:** Store pure calendar dates as string `YYYY-MM-DD` without UTC midnight conversions.

---

### `BUG-I18N-0002`
#### Hardcoded Currency Symbols Ignoring Localized User Settings or Currency Codes
* **Domain:** Localization, Timezones & Formats
* **Severity:** Medium | **Priority:** P2
* **1. Description:** Prices display hardcoded dollar signs (`$100.00`) even when the user organization is configured for Euros (`€`) or Indian Rupees (`₹`).
* **2. Developer Oversight:** Hardcoded `$` string literals in JSX (`${item.price}`) instead of utilizing localized currency formatters.
* **3. Steps to Reproduce:**
  1. Switch application currency setting to EUR (`€`) or INR (`₹`).
  2. Navigate to product catalog or invoice summary.
* **4. Expected vs. Actual:**
  * **Expected:** Prices format with user currency symbol (e.g., `€100.00` or `₹100.00`).
  * **Actual:** Hardcoded `$` symbol displays for all currency values.
* **5. Developer Self-Check:** Use dynamic currency formatters based on active tenant/user settings.

---

### `BUG-DEVICE-0001`
#### Mobile Virtual Keyboard Popping Up and Pushing Fixed Submit Button Off-Screen
* **Domain:** Mobile Viewports & Browser Quirks
* **Severity:** High | **Priority:** P1
* **1. Description:** Tapping an input field on a mobile device opens the virtual keyboard, which pushes the fixed bottom "Submit" button completely off-screen or covers it.
* **2. Developer Oversight:** Fixed bottom elements used `position: fixed; bottom: 0` without accounting for viewport height resizing on mobile keyboard trigger.
* **3. Steps to Reproduce:**
  1. Open a mobile checkout form on an iPhone or Android device.
  2. Tap into the bottom-most input field.
* **4. Expected vs. Actual:**
  * **Expected:** Input scrolls smoothly above the keyboard, and submit button remains accessible.
  * **Actual:** Submit button is hidden behind the virtual keyboard; user cannot submit without closing keyboard.
* **5. Developer Self-Check:** Use `interactive-widget=resizes-content` viewport meta tag and test on physical mobile devices.

---

### `BUG-DEVICE-0002`
#### iOS Safari Bottom Navigation Bar Overlapping Fixed Footer Buttons (100vh Bug)
* **Domain:** Mobile Viewports & Browser Quirks
* **Severity:** High | **Priority:** P1
* **1. Description:** On mobile Safari, full-height containers styled with `height: 100vh` have their bottom action buttons covered by Safari's translucent bottom URL toolbar.
* **2. Developer Oversight:** Used legacy `100vh` instead of modern dynamic viewport units (`100dvh` / `100svh`).
* **3. Steps to Reproduce:**
  1. Open the web app on an iPhone in Safari.
  2. Observe bottom action buttons.
* **4. Expected vs. Actual:**
  * **Expected:** Bottom action buttons sit comfortably above Safari's bottom toolbar with safe-area padding.
  * **Actual:** Half of the button is obscured by Safari's navigation bar.
* **5. Developer Self-Check:** Replace `100vh` with `100dvh` and include `padding-bottom: env(safe-area-inset-bottom)`.

---

## Appendix A: Standard QA Defect Logging Template

```markdown
### `BUG-[CATEGORY]-[NNNN]`
#### [Defect Summary: Concise 1-Line Description]
* **Domain:** [Auth | Navigation | Forms | Data | Responsive | RBAC | Filters | Async | Modals | Export | Files | Grids | Notifications | i18n | Device]
* **Severity:** [Critical | High | Medium | Low] | **Priority:** [P0 | P1 | P2 | P3]
* **Impacted Area:** `[Insert URL / Screen / Component Name]`

#### 1. Defect Description
[Detailed explanation of what is visually or functionally broken, who is affected, and under what conditions.]

#### 2. What Went Wrong (Developer Oversight)
[Technical summary of root cause — e.g., missing validation, unhandled breakpoint, state desynchronization, copy-paste route.]

#### 3. Steps to Reproduce
1. Navigate to `[URL / Screen]`
2. Perform action `[Click / Input / Resize]`
3. Perform second action `[Submit / Select]`
4. Observe the result on `[Component / Viewport]`

#### 4. Expected vs. Actual Behavior
* **Expected Behavior:** [What the user should experience according to specifications]
* **Actual Behavior:** [What currently happens erroneously]

#### 5. Developer Self-Check & Prevention Checklist
* [ ] [Specific verification step to prevent this bug from recurring]
* [ ] [Specific edge-case test scenario]
```

---

## Appendix B: Defect Severity & Priority Matrix

| Severity Level | Impact Definition | Priority | Target SLA |
| :--- | :--- | :--- | :--- |
| **Critical** | System crash, data loss, duplicate billing/transactions, total block of core authentication or revenue checkout flows. | **P0** | Immediate Fix (< 4 Hours) |
| **High** | Major functional breakdown, incorrect navigation routes, unhandled 403/500 errors, missing mandatory indicators, inventory bypass, timezone shifts. | **P1** | Current Sprint (< 24 Hours) |
| **Medium** | Visual text clipping, badge counter mismatch, distorted PDF exports, missing back buttons on sub-pages, unconfirmed modal dismiss, stale cache. | **P2** | Next Scheduled Build |
| **Low** | Minor cosmetic styling quirks, refresh button reload behavior, minor spacing or color alignment discrepancies. | **P3** | Polish & Backlog Cycle |

---

*Master Universal UI & Functionality Quality Playbook — Standard Reference for Engineering & QA Teams.*
