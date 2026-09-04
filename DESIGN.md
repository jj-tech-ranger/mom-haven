# MomHaven Design System

## Design Directions Evaluated

1. **Direction A: "Calm Clinical System" (Selected)**
   - **Canvas & Surfaces:** Crisp, high-contrast Slate palette (`#F8FAFC` slate-50 canvas, `#FFFFFF` solid white surfaces, `#E2E8F0` slate-200 dividers).
   - **Interactive Core:** Clinical primary interactive `#0F766E` (`teal-700`), hover `#115E59` (`teal-800`).
   - **Brand Identity:** Deep MomHaven Purple (`#33178A`) reserved for identity, logos, and high-level maternal authentication anchors.
   - **Form & Elevation:** Standard radius `6px` (`rounded-md`, up to `12–16px` for outer cards), `shadow-sm` elevation only. Zero blur, zero frosted glass, zero decorative gradients.
   - **Typography:** DM Sans (display/headings 600/700), Inter (body 400/500/600), DM Mono (clinical measures, dates, lab values, IDs).

2. **Direction B: "Warm Maternal Brand" (Secondary / Rejected for Routine Clinical Screens)**
   - Heavy lavender/orchid backgrounds (`#F7F3FC`, `#EEE7F8`), saturated purple headers, soft 24px pill cards.
   - *Verdict:* While empathetic, it blurs the line between clinical urgency and lifestyle content, reducing legibility on low-brightness mobile devices in Kenyan clinics.

3. **Direction C: "Monochrome Clinical Utility" (Rejected)**
   - Pure black/white grayscale with high-density data grids and minimal color coding.
   - *Verdict:* Too austere and impersonal for expectant mothers, reducing adherence and emotional engagement.

## Purpose & Selected System

MomHaven uses **Direction A: Calm Clinical System**. It delivers a calm, clinical interface that feels reassuring and warm without looking decorative or synthetic. Clinical meaning remains strictly distinct from brand expression.

## Semantic Color Tokens (Reconciled with theme.css)

- **Canvas:** `#F8FAFC` (`slate-50`)
- **Surface 1 (Primary):** `#FFFFFF` (solid cards, modals, sheets)
- **Surface 2 (Nested):** `#F1F5F9` (`slate-100` fills, chips, search inputs)
- **Surface 3 (Subtle/Active):** `#E2E8F0` (`slate-200` active item states, subtle dividers)
- **Primary Brand:** `#33178A` (MomHaven deep purple, used selectively for identity)
- **Primary Clinical Interactive:** `#0F766E` (`teal-700`), hover `#115E59` (`teal-800`), tint `#F0FDFA` (`teal-50`)
- **Primary Text:** `#0F172A` (`slate-900`)
- **Secondary Text:** `#475569` (`slate-600`)
- **Muted Text:** `#94A3B8` (`slate-400`)
- **Border / Hairline:** `#E2E8F0` (`slate-200`), strong `#CBD5E1` (`slate-300`)
- **Emergency / Danger:** `#B91C1C` (`red-700`) on `#FEF2F2` (`red-50`)
- **Warning / Caution:** `#B45309` (`amber-700`) on `#FFFBEB` (`amber-50`)
- **Normal / Suppressed:** `#15803D` (`green-700`) on `#F0FDF4` (`green-50`)
- **Clinical Info / Status:** `#0F766E` (`teal-700`) on `#F0FDFA` (`teal-50`)

Clinical status colors communicate clinical status only; they are not interchangeable with the MomHaven brand color.

## Typography

- **Headings & Display:** DM Sans, 600/700 (paired with 1.25+ scale step ratio)
- **Clinical Values, Measurements, Dates & Identifiers:** DM Mono (tabular, high legibility)
- **Body & Captions:** Inter, 400/500/600 (minimum body 14–16px, line-height 1.5–1.6)

## Surfaces and Layout Principles

- **Standard Radius:** `6px` / Tailwind `rounded-md` for buttons/controls; `12–16px` for outer cards; `9999px` pills for status badges only.
- **Elevation:** `shadow-sm` (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`) only.
- **Dividers:** `1px solid #E2E8F0` (`border-slate-200`).
- **No Glassmorphism:** Never use `backdrop-blur`, translucent card overlays (`bg-white/80`), or frosted glass. All navigation bars, headers, and sheets use solid opaque surfaces (`bg-white`).
- **Modal Overlays:** Solid dimming overlay `#0F172A` with 60% opacity (`bg-slate-900/60`), never blur filters.
- **Information Density:** Prefer structured, dense clinical tables, timelines, and lists over empty cards with oversized margins.
- **No Decorative Gradients:** Routine clinical surfaces, cards, and buttons use solid, high-contrast colors.
- **Explicit Actions:** Use clear clinical actions (`Record ANC Visit`, `View Reminders`, `Select Active Context`, `Save Screening`).

## Clinical Provenance

MOH Kenya handbook (MOH 216) material is our content and clinical-governance source. Clinical alerts, screening pathways, and triage protocols directly reflect the national handbook guidelines.
