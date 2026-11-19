# BloodLink — Design System

The visual identity is a **trustworthy, government-grade health portal** —
calm, official, scannable under stress. Not a flashy consumer app.

Related: [PRD.md](./PRD.md) · [Architecture.md](./Architecture.md) · [Rules.md](./Rules.md) · [Phases.md](./Phases.md)

---

## 1. Design principles

1. **Blood is the only red.** Crimson is reserved for blood, urgency and primary CTAs — never as
   decoration. If everything is red, nothing is urgent.
2. **Official frame, calm content.** Dark maroon frames (utility bar, footer) signal an official
   channel; content areas stay white/slate-navy and airy.
3. **Never colour alone.** Every status carries an icon + text label (WCAG): tiles say
   ✓ Plenty / ⚠ Low / ✕ None; badges pair icons with words; countdowns add text like
   "Needed in 5h 12m" / "Overdue".
4. **Scannable under stress.** Flat surfaces, 6px radii, subtle shadows, generous spacing,
   tabular numerals for counts, CRITICAL-first ordering everywhere.
5. **Accessible by default.** AA contrast pairs, visible focus rings, semantic roles
   (`switch`, `dialog`, `alert`), full keyboard operability, responsive with a mobile bottom nav.

## 2. Colour tokens (all in `client/tailwind.config.ts`)

| Token | Hex | Usage |
| --- | --- | --- |
| `primary.DEFAULT` | `#C62828` | Primary buttons, active nav, blood-group numerals, urgency highlights, drop icons |
| `primary.dark` | `#8E0000` | Primary button hover |
| `primary.50 / 100` | `#FDECEA / #FAD4D1` | Tints: badge backgrounds, selected cards, info strips |
| `maroon.DEFAULT` | `#8E0000` | Top utility bar, footer |
| `maroon.900` | `#5C0000` | (reserve) deep maroon accents |
| `navy` | `#1F2A44` | Headings, links-in-chrome, stat values, hero text, dark callout section |
| `surface` | `#FFFFFF` | Cards, header, tables |
| `subtle` | `#F7F7F9` | Page background, inline notes, table header rows |
| `line` | `#E0E0E0` | All borders/dividers |
| `success` | `#2E7D32` | GREEN strips, eligible state, verified badge, DONATED |
| `warning` | `#F9A825` | AMBER strips, "Pending verification", rare flag accents |
| `danger` | `#C62828` | RED strips, CRITICAL/Overdue, destructive text |
| `info` | `#1565C0` | NORMAL urgency, links in content, rare-donor banner |
| `ink` | `#212121` | Body text |
| `muted` | `#616161` | Secondary text, labels, icons |

**Contrast pairs used (AA-passing):** ink/navy on white; white on maroon/crimson/success;
`#212121` on warning `#F9A825` (never white-on-yellow); `#8a6d00` text on `#FFF7E0` amber tint;
`info` on `#E8F1FC` tint; muted on white/subtle (≥ 4.5:1 for body sizes).

## 3. Typography

| Property | Value |
| --- | --- |
| Family | **Inter** via `next/font/google` (`--font-inter`), system sans fallbacks |
| Weights | 400 body · 500 medium/labels · **600 headings** (spec) · 700 tile labels/wordmark |
| Scale | Page title 20–24px/semibold · section h2 16–18px/semibold · card title 14–16px/semibold · body 14px · secondary 12px · micro-labels 11px uppercase tracking-widest (`text-2xs`) |
| Numbers | Counts use `tabular-nums` so tiles don't jitter while polling |
| Tile label | 30px bold for "A+", "O−" — the largest text on the dashboard after the h1 |

## 4. Layout & spacing

- Max content width **1152px** (`max-w-6xl`), 16px side padding; vertical rhythm 24px between
  sections, 16px inside cards.
- Page header pattern: h1 + one-line subtitle + optional right-side actions (`PageHeader`).
- Grids: dashboard tiles 2 cols (mobile) → 4 cols (sm+); feed cards 1 → 2 (lg); camps 1 → 2 → 3.
- Header stack: **utility bar (maroon, 28px)** → **header (white, 64px)** → content → **footer
  (maroon)** → **bottom nav (mobile only, fixed)**. Content gets extra bottom padding on mobile
  so the fixed nav never covers content.

## 5. Shape, elevation, motion

| Token | Value |
| --- | --- |
| Radius | 6px default (`rounded`), 10px `rounded-lg` for large cards/modals, pills for badges |
| Shadows | `shadow-card` = `0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.08)` · `shadow-pop` for modals |
| Motion | Minimal: spinner rotation, soft `ping` on the live indicator dot, hover colour shifts. No animations on data (it refreshes every 20s — stability reads as reliability) |

## 6. Component specifications

### Landing page (public home — government-portal layout)

Structured like a national health portal, in vertical order:

1. **Navy utility strip** — platform description on the left; on the right a working **text-size
   control (A- / A / A+)** that scales the root font (14/16/18px, persisted in localStorage) and
   the "Medical emergency? Call 108" chip.
2. **White header** — drop logo + wordmark only; right side: "Sign in" (secondary) +
   "Create account" (primary), or avatar/role + Logout when signed in.
3. **Maroon main-nav strip** (desktop ≥ lg) — full-width horizontal menu: Home · Live Dashboard ·
   Emergency Requests · Donation Camps (+ role links for signed-in users). Active item =
   darker maroon block. Mobile keeps the fixed bottom nav instead.
4. **Hero banner carousel** — flat crimson banner, large white slogan + subtext + white CTA,
   translucent drop-icon watermarks, auto-advances every 6 s with dots and prev/next controls.
5. **"What's new" ticker** — crimson label block + infinitely scrolling announcements built from
   live data (open requests, critical counts, upcoming camps, rare donors); pauses on hover;
   disabled under `prefers-reduced-motion`.
6. **Quick-links tiles** — 4 white cards (Looking for blood? / Want to donate? / Donation camps /
   For organisations) with icon circles and hover lift.
7. **Live blood availability** — left rail: "Check blood availability" search card (city +
   component → `/dashboard?city=…&component=…`) + rare-donor banner; right: the 8 tiles grid with
   "Updated Xs ago" and "Full dashboard →".
8. **Counters strip** — 4 stat boxes (Donors available / Units in stock / Open requests /
   Upcoming camps), big tabular numbers, short crimson underline.
9. **Urgent blood requirements** — top 4 request cards with pledge buttons.
10. **Upcoming camps strip**, **"Learn about blood donation"** (two info cards: "Who can
    donate?" checklist + "Good to know" facts; always notes that screening happens at the blood
    bank), and the navy privacy CTA band.


### Blood group tile (the signature component)
```
┌────────────────────────────┐
│ A+              (drop icon)│  label 30px bold navy; drop icon coloured by level
│ ────────────────────────── │
│ 👤 Donors            1     │  rows: icon + label (muted) | value (navy, tabular)
│ ▣  Units            29     │  open-requests row turns red+bold when > 0
│ 🏥 Open requests     1     │
│ ────────────────────────── │
│ ✅ PLENTY  (colored strip) │  full-width strip: bg = level colour, white icon+text
└────────────────────────────┘
```
Strip mapping: GREEN → `success` + ✓ "Plenty" · AMBER → `warning` + ⚠ "Low" · RED → `danger`
+ ✕ "None". The strip is `aria-label`ed (`Status: Plenty`).

### Badges (pill, icon + uppercase micro-text)
| Badge | Tone | Icon |
| --- | --- | --- |
| Critical | danger tint | alert-triangle |
| Urgent | warning tint | clock |
| Normal | info tint | info |
| Open | primary tint | clock |
| Fulfilled | success tint | check-circle |
| Closed | neutral | x-circle |
| Pledged / Donated / Declined | primary / success / neutral | clock / check / x |
| Verified / Pending verification | success / warning | shield-check / alert |

### Buttons
`primary` (crimson, white text) · `secondary` (white, navy text, line border) · `ghost` ·
`danger` (white/red outline; armed confirm flips to solid crimson) · `success` (mark donated /
fulfilled). Sizes sm 32px / md 36px / lg 42px. Loading state swaps label for an inline spinner.

### Forms
Labels 14px semibold navy, required marked `*` (crimson), errors 12px bold red with
`role="alert"`, hints 12px muted. Controls: white, `line` border, 6px radius, navy focus ring
(`ring-2 ring-navy/20`), disabled = subtle bg. Toggle = 48×28px switch (`role="switch"`),
green when on, label always visible beside it.

### Chrome
- **Utility bar**: maroon; left = platform description; right = "Medical emergency? Call 108"
  with a chip. 11px text.
- **Header**: drop logo + "BloodLink" wordmark + "EMERGENCY BLOOD COORDINATION" micro-tag;
  nav pills (active = primary tint bg + crimson text, `aria-current="page"`); auth area with
  avatar initials chip, name/role, Logout; "Sign in" button when logged out.
- **Footer**: maroon; 3 columns (brand, platform links, reference/emergency number); top-bordered
  disclaimer row: badge-style "Disclaimer" + the exact sentence *"BloodLink is a coordination
  platform. Donors must be screened by a hospital or blood bank."*
- **Bottom nav (mobile)**: 5 fixed items (Home, Dashboard, Requests, Camps, Profile), active =
  crimson; `backdrop-blur` surface.

### Other patterns
- **Modal**: overlay `bg-navy/40`, white panel max-w-lg (wide=2xl), header row with title +
  close, 75vh scrollable body, Esc + backdrop close, `role="dialog"`.
- **ConfirmButton**: destructive two-click pattern — first click arms ("Sure? Click again"),
  4s timeout disarms, second click executes. Used for all deletes.
- **EmptyState**: dashed-border card, large icon, title, hint, optional action link.
- **Live indicator**: 2px green dot with `animate-ping` + "Updated Xs ago" — the only "moving"
  element on data pages.
- **Icons**: single inline-SVG stroke set (`components/ui/icons.tsx`), 24px grid, `strokeWidth 2`,
  sized 14/16/20/28px via className; `aria-hidden` by default.

## 7. Content & microcopy rules

- Sentence case, plain English, no exclamation marks in system states.
- Countdown: "in 5h 12m" / "in 2d 4h" / **"Overdue"** (red, alert icon).
- Relative time: "just now" → "Xs ago" → "Xm ago" → "Xh ago" → "Xd ago".
- Privacy messaging is explicit wherever phones appear: "(visible to you as a logged-in responder
  on this open request)" / "Phone hidden — responder declined."
- Dates use `en-IN` locale (e.g. "19 Nov 2026"); times 24h for camps ("09:00–14:00").

## 8. Responsive breakpoints

| Width | Layout |
| --- | --- |
| < 640px | 1-col lists, 2-col tiles, bottom nav, compact header (avatar chip only) |
| 640–1023px | 2-col tiles/lists, desktop header without full nav (sm nav links hidden ≤ lg) |
| ≥ 1024px | Full desktop header nav, 4-col tiles, 2–3 col lists, no bottom nav |

Tables (stock, donor search) horizontally scroll inside their card (`overflow-x-auto`,
min-width set) instead of collapsing columns.

## 9. Design do / don't

✅ Icon + text for every status · ✅ crimson only for blood/urgency/CTA · ✅ white cards on
`#F7F7F9` · ✅ tabular numbers · ✅ en-IN dates · ✅ AA tints for warning/info backgrounds
❌ No gradients, glassmorphism or dark mode (not requested) · ❌ No emoji as UI icons
❌ No colour-only status · ❌ No red body text anywhere except true warnings/errors ·
❌ No decorative illustrations or photos
