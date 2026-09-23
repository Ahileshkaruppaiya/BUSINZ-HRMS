# VRM Enterprise HRM - Design System Specification

This document establishes the design principles, color palette, typography hierarchy, geometry, layout dimensions, and standardized table interaction rules for the VRM Enterprise HRM application.

---

## 1. Color Palette & Brand Identity
The app follows a modern industrial/SaaS palette inspired by Linear and Notion clean aesthetics with dark teal accents:

| Token | Variable Name | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `--color-primary-blue` | `#0E7490` | Deep Teal / Cyan 700. Main buttons, active sidebar links, table checkboxes |
| **Primary Hover** | `--color-primary-hover` | `#0891B2` | Cyan 600. Button hovers & interactive highlights |
| **Primary Light** | `--color-primary-light` | `#CFFAFE` / `#ECFEFF` | Table row selection background & soft badges |
| **Solar Accent** | `--color-solar-orange` | `#F39C12` | Solar / secondary accent, action highlights |
| **App Background** | `--color-bg` | `#F7F9FC` | Clean off-white neutral slate background |
| **Card / Surface** | `--color-card` | `#FFFFFF` | Pure white content cards & containers |
| **Border** | `--color-border` | `#E7ECF3` | Subtle border separators |
| **Text Primary** | `--color-text-primary` | `#1E293B` | Slate 800 for high-contrast, crisp typography |
| **Text Secondary** | `--color-text-secondary` | `#64748B` | Slate 500 for descriptions, timestamps, subtitles |

### Status Indicators
- **Success / Completed**: Green (`#22C55E` / `#DCFCE7`)
- **Warning**: Amber (`#F59E0B` / `#FEF3C7`)
- **Danger / Urgent**: Red (`#EF4444` / `#FEE2E2`)
- **Pending / In Progress**: Purple / Blue (`#8B5CF6` / `#3B82F6`)

---

## 2. 🔤 Typography
- **Font Families**: `'DM Sans'`, `'Plus Jakarta Sans'`, -apple-system, BlinkMacSystemFont, sans-serif

### Type Scale
- **Display**: 40px (`2.5rem`)
- **Page Titles**: 30px (`1.875rem`)
- **Section Titles**: 24px (`1.5rem`)
- **Card Titles**: 20px (`1.25rem`)
- **Body Text**: 16px (`1rem`)
- **Small / Tables**: 14px (`0.875rem`)
- **Captions / Meta**: 12px (`0.75rem`)

---

## 3. 📐 Geometry, Spacing & Elevation

### Corner Radii
- **Buttons**: 12px (`--radius-button`)
- **Cards**: 16px (`--radius-card`)
- **Inputs**: 10px (`--radius-input`)
- **Modals / Dialogs**: 20px (`--radius-dialog`)
- **Badges**: 9999px (Pill format)

### Shadows & Elevation
- Soft layered shadows: `rgba(0, 0, 0, 0.03)` to `rgba(0, 0, 0, 0.05)`.
- Cards: `0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)`.
- Modals / Flyouts: `0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)`.

### Grid System
- 8px baseline rhythm (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`).

---

## 4. 📋 Standard Table Design System Rules
All core data tables adhere strictly to this standardized specification:

### Interactive Row Selection
- Checkboxes styled with `accent-color: #0E7490`.
- Selected rows highlight in soft cyan tint (`#ECFEFF`) with a `4px solid #0E7490` vertical left border accent line.

### Floating Action Bar
- Fixed at bottom center (`position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%)`).
- Appears whenever rows are checked:
  `X Selected | ✏️ Edit Info | 🗑️ Delete | ••• | ✕`

### Standardized Pagination Footer
- **Left**: Rows-per-page selector restricted strictly to `[5, 10]` + `Showing X to Y of Z entries`.
- **Right**: Page controls (`<< < 1 2 3 > >>`) with active page in `#0E7490`, adjacent to `Go to page [ ]` and `Go ›`.

---

## 5. 🗂️ Component Architecture & Layout
- **Sidebar**: Fixed width **280px** (**72px** when collapsed) in crisp white with dark teal active pills (`#0E7490`).
- **Top Header**: Fixed height **72px** with company switcher, quick search, notifications, and user profile avatar.
- **Forms**: Clean inputs with hidden browser up/down number spin buttons, subtle `#94A3B8` placeholders, and 1px `#E2E8F0` borders focusing into `#0E7490` with a soft focus ring.
