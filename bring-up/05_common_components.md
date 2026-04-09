# Spec 05 — Common Components

**Status:** Draft
**Depends on:** Spec 02 (Design System), Spec 03 (Type Definitions)
**Kernel refs:** §2.2 (`components/common/`), §7 (Design System — colors, typography, badges)
**SRD refs:** §5.2 (worklist), §5.3 (alerts), §5.4 (confidence), §5.5 (dashboards)

---

## 1. Overview

This spec defines every reusable UI primitive component in `frontend/src/components/common/`. These are the building blocks that page-level components compose — badges, indicators, inputs, tables, modals, and layout primitives. Every component is self-contained, accepts typed props, follows the Kernel §7 design system, and renders independently.

---

## 2. File Structure

```
frontend/src/components/common/
  StatusBadge.tsx
  AlertSeverityBadge.tsx
  SourceNodeBadge.tsx
  ConfidenceScore.tsx
  DaysOfSupplyIndicator.tsx
  ParameterStatusBadge.tsx
  SearchInput.tsx
  FilterBar.tsx
  EmptyState.tsx
  PageHeader.tsx
  SummaryCard.tsx
  DataTable.tsx
  Modal.tsx
  Tooltip.tsx
  index.ts                  # Barrel re-export of all common components
```

---

## 3. Component Specifications

### 3.1 StatusBadge

A generic colored pill badge used for demand class labels, worklist status indicators, pipeline state, and any other categorical text label that needs a colored background.

**File:** `components/common/StatusBadge.tsx`

**Props:**

```typescript
interface StatusBadgeProps {
  /** Text to display inside the badge */
  label: string;
  /** Tailwind background color class (e.g., "bg-green-100") */
  bgColor: string;
  /** Tailwind text color class (e.g., "text-green-800") */
  textColor: string;
  /** Optional Tailwind border color class. When provided, badge renders with a 1px border. */
  borderColor?: string;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Visual Description:**

```
<span className={`
  inline-flex items-center
  px-2.5 py-0.5
  rounded-full
  text-xs font-medium uppercase tracking-wide
  ${bgColor} ${textColor}
  ${borderColor ? `border ${borderColor}` : ''}
  ${className ?? ''}
`}>
  {label}
</span>
```

**Typography:** `text-xs font-medium uppercase tracking-wide` per Kernel §7.4 badge/pill style.

**Behavior:**
- Purely presentational — no interactivity.
- Renders inline; flows naturally within table cells, card headers, and flex rows.

**Usage Examples:**

```tsx
// Demand class badge
<StatusBadge label="Smooth / Fast" bgColor="bg-success-100" textColor="text-success-700" />

// Worklist status
<StatusBadge label="Pending" bgColor="bg-gold-100" textColor="text-gold-700" />
<StatusBadge label="Approved" bgColor="bg-success-100" textColor="text-success-700" />
<StatusBadge label="Deferred" bgColor="bg-slate-100" textColor="text-slate-600" />
<StatusBadge label="Escalated" bgColor="bg-danger-100" textColor="text-danger-700" />

// Pipeline state
<StatusBadge label="Healthy" bgColor="bg-success-100" textColor="text-success-700" />
<StatusBadge label="Degraded" bgColor="bg-warning-100" textColor="text-warning-700" />
```

---

### 3.2 AlertSeverityBadge

A severity-specific badge rendering the four alert levels with their canonical Kernel §7.2 colors and a Lucide icon.

**File:** `components/common/AlertSeverityBadge.tsx`

**Props:**

```typescript
import { AlertLevel } from '@/lib/types';

interface AlertSeverityBadgeProps {
  /** Alert severity level — drives color and icon selection */
  level: AlertLevel;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Color & Icon Mapping:**

Uses the `SEVERITY_STYLES` lookup from `lib/design-tokens.ts` (defined in Spec 02 §4.3):

| Level | Background | Border | Text | Icon | Lucide Icon |
|---|---|---|---|---|---|
| `CRITICAL` | `bg-danger-50` | `border-danger-500` | `text-danger-700` | `text-danger-500` | `AlertOctagon` |
| `WARNING` | `bg-warning-50` | `border-warning-500` | `text-warning-700` | `text-warning-500` | `AlertTriangle` |
| `WATCH` | `bg-gold-50` | `border-gold-400` | `text-gold-700` | `text-gold-500` | `Eye` |
| `EXCESS` | `bg-info-50` | `border-info-500` | `text-info-700` | `text-info-500` | `TrendingUp` |

**Visual Description:**

```
<span className={`
  inline-flex items-center gap-1.5
  px-2.5 py-1
  rounded-full
  border
  text-xs font-medium uppercase tracking-wide
  ${colors.bg} ${colors.border} ${colors.text}
  ${className ?? ''}
`}>
  <Icon className="h-3.5 w-3.5" />
  {level}
</span>
```

**Behavior:**
- Purely presentational.
- Icon is sized at `h-3.5 w-3.5` to sit proportionally inside the pill.

**Usage Examples:**

```tsx
<AlertSeverityBadge level={AlertLevel.CRITICAL} />
<AlertSeverityBadge level={AlertLevel.WARNING} />
<AlertSeverityBadge level={AlertLevel.WATCH} />
<AlertSeverityBadge level={AlertLevel.EXCESS} />
```

---

### 3.3 SourceNodeBadge

A badge for the three manufacturing/sourcing nodes with their canonical Kernel §7.3 colors.

**File:** `components/common/SourceNodeBadge.tsx`

**Props:**

```typescript
import { SourceNode } from '@/lib/types';

interface SourceNodeBadgeProps {
  /** Source node — drives color selection */
  source: SourceNode;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Color & Label Mapping:**

Uses the `SOURCE_STYLES` lookup from `lib/design-tokens.ts` (defined in Spec 02 §4.4):

| SourceNode | Background | Text | Border | Display Label |
|---|---|---|---|---|
| `SCHECO_SHANGHAI` | `bg-navy-100` | `text-navy-800` | `border-navy-300` | `SCHECO` |
| `NIXA_MO` | `bg-success-100` | `text-success-700` | `border-success-500` | `Nixa` |
| `SHARK_NZ` | `bg-violet-100` | `text-violet-800` | `border-violet-300` | `Shark` |

**Label Mapping:**

```typescript
const SOURCE_LABELS: Record<SourceNode, string> = {
  SCHECO_SHANGHAI: 'SCHECO',
  NIXA_MO: 'Nixa',
  SHARK_NZ: 'Shark',
};
```

**Visual Description:**

```
<span className={`
  inline-flex items-center
  px-2.5 py-0.5
  rounded-full
  border
  text-xs font-medium uppercase tracking-wide
  ${colors.bg} ${colors.text} ${colors.border}
  ${className ?? ''}
`}>
  {SOURCE_LABELS[source]}
</span>
```

**Behavior:**
- Purely presentational.
- Displays the short human-readable label, not the full enum value.

**Usage Examples:**

```tsx
<SourceNodeBadge source={SourceNode.SCHECO_SHANGHAI} />
<SourceNodeBadge source={SourceNode.NIXA_MO} />
<SourceNodeBadge source={SourceNode.SHARK_NZ} />
```

---

### 3.4 ConfidenceScore

A circular or bar indicator showing 0-100% model confidence with color grading. Used on worklist items per SRD §5.4.3.

**File:** `components/common/ConfidenceScore.tsx`

**Props:**

```typescript
import { Percentage } from '@/lib/types';

interface ConfidenceScoreProps {
  /** Confidence value from 0 to 100 */
  value: Percentage;
  /** Display variant */
  variant?: 'ring' | 'bar';
  /** Size of the ring variant */
  size?: 'sm' | 'md';
  /** Optional additional CSS classes */
  className?: string;
}
```

**Defaults:** `variant = 'ring'`, `size = 'md'`.

**Color Grading:**

| Range | Color | Tailwind Stroke/Fill | Meaning |
|---|---|---|---|
| 0 - 59 | Red | `text-danger-500` / `stroke-danger-500` | Low confidence — requires justification |
| 60 - 79 | Amber | `text-warning-500` / `stroke-warning-500` | Moderate confidence |
| 80 - 100 | Green | `text-success-500` / `stroke-success-500` | High confidence |

```typescript
function getConfidenceColor(value: number): string {
  if (value < 60) return 'text-danger-500';
  if (value < 80) return 'text-warning-500';
  return 'text-success-500';
}
```

**Ring Variant (`variant="ring"`):**

Renders an SVG circular progress indicator with the percentage number in the center.

- `size="sm"`: 32x32px ring, `text-xs` center label.
- `size="md"`: 48x48px ring, `text-sm font-semibold` center label.
- Background track: `stroke-slate-200`, 3px stroke width.
- Progress arc: colored stroke per grading, 3px stroke width, `stroke-linecap="round"`.
- Center text: `{value}%` in `font-mono` for numeric alignment.

```
<div className={`relative inline-flex items-center justify-center ${className ?? ''}`}>
  <svg width={ringSize} height={ringSize} className="-rotate-90">
    {/* Background track */}
    <circle cx="50%" cy="50%" r={radius}
      fill="none" stroke="currentColor"
      className="text-slate-200" strokeWidth={3} />
    {/* Progress arc */}
    <circle cx="50%" cy="50%" r={radius}
      fill="none" stroke="currentColor"
      className={colorClass} strokeWidth={3}
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={circumference * (1 - value / 100)} />
  </svg>
  <span className={`absolute font-mono ${sizeClasses.text} ${colorClass}`}>
    {value}%
  </span>
</div>
```

**Bar Variant (`variant="bar"`):**

Renders a horizontal progress bar with a label to the right.

```
<div className={`flex items-center gap-2 ${className ?? ''}`}>
  <div className="h-2 w-24 rounded-full bg-slate-200 overflow-hidden">
    <div className={`h-full rounded-full ${bgColorClass}`}
         style={{ width: `${value}%` }} />
  </div>
  <span className={`text-sm font-mono ${colorClass}`}>{value}%</span>
</div>
```

**Behavior:**
- Purely presentational.
- Below 70% confidence, pages that consume this component should trigger a justification modal (that logic lives in the page, not in this component).

**Usage Examples:**

```tsx
<ConfidenceScore value={92} />
<ConfidenceScore value={67} variant="ring" size="sm" />
<ConfidenceScore value={55} variant="bar" />
```

---

### 3.5 DaysOfSupplyIndicator

A visual indicator showing current days-of-supply with a colored bar and numeric label. Used in worklist tables, alert cards, and SKU detail views.

**File:** `components/common/DaysOfSupplyIndicator.tsx`

**Props:**

```typescript
interface DaysOfSupplyIndicatorProps {
  /** Number of days of supply remaining */
  days: number;
  /** Maximum scale for the bar (default: 60). Bar fills proportionally: days / maxDays. */
  maxDays?: number;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Default:** `maxDays = 60`.

**Color Grading:**

| Range | Color | Tailwind Class | Meaning |
|---|---|---|---|
| < 7 days | Red | `bg-danger-500` | Critical — below lead time |
| 7 - 13 days | Amber | `bg-warning-500` | Low — approaching stock-out |
| 14 - 29 days | Gold | `bg-gold-400` | Watch — adequate but thin |
| 30+ days | Green | `bg-success-500` | Healthy |

```typescript
function getDaysOfSupplyColor(days: number): string {
  if (days < 7) return 'bg-danger-500';
  if (days < 14) return 'bg-warning-500';
  if (days < 30) return 'bg-gold-400';
  return 'bg-success-500';
}
```

**Visual Description:**

```
<div className={`flex items-center gap-2 ${className ?? ''}`}>
  <span className="text-sm font-mono tabular-nums w-8 text-right text-slate-900">
    {days}
  </span>
  <div className="h-2 w-20 rounded-full bg-slate-200 overflow-hidden">
    <div
      className={`h-full rounded-full ${colorClass} transition-all`}
      style={{ width: `${Math.min((days / maxDays) * 100, 100)}%` }}
    />
  </div>
  <span className="text-xs text-slate-500">days</span>
</div>
```

**Behavior:**
- Purely presentational.
- Bar is clamped at 100% (days >= maxDays fills the bar completely).
- Numeric value uses `font-mono tabular-nums` per Kernel §7.4 for table alignment.

**Usage Examples:**

```tsx
<DaysOfSupplyIndicator days={3} />
<DaysOfSupplyIndicator days={12} />
<DaysOfSupplyIndicator days={25} />
<DaysOfSupplyIndicator days={45} maxDays={90} />
```

---

### 3.6 ParameterStatusBadge

A badge for inventory parameter status values per Spec 02 §3.4 color mapping.

**File:** `components/common/ParameterStatusBadge.tsx`

**Props:**

```typescript
import { ParameterStatus } from '@/lib/types';

interface ParameterStatusBadgeProps {
  /** Parameter status — drives color and label */
  status: ParameterStatus;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Color & Label Mapping:**

| ParameterStatus | Background | Text | Display Label |
|---|---|---|---|
| `NOT_SET` | `bg-slate-100` | `text-slate-600` | `Not Set` |
| `SYSTEM_CALCULATED` | `bg-navy-100` | `text-navy-700` | `System` |
| `BUYER_OVERRIDE` | `bg-success-100` | `text-success-700` | `Override` |
| `NEEDS_REVIEW` | `bg-warning-100` | `text-warning-700` | `Review` |

Uses the `PARAMETER_STATUS_STYLES` lookup from `lib/design-tokens.ts` (defined in Spec 02 §4.5):

```typescript
const PARAMETER_STATUS_CONFIG: Record<ParameterStatus, { bg: string; text: string; dot: string; label: string }> = {
  NOT_SET:           { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400',   label: 'Not Set' },
  SYSTEM_CALCULATED: { bg: 'bg-navy-100',    text: 'text-navy-700',    dot: 'bg-navy-500',    label: 'System' },
  BUYER_OVERRIDE:    { bg: 'bg-success-100', text: 'text-success-700', dot: 'bg-success-500', label: 'Override' },
  NEEDS_REVIEW:      { bg: 'bg-warning-100', text: 'text-warning-700', dot: 'bg-warning-500', label: 'Review' },
};
```

**Visual Description:**

```
<span className={`
  inline-flex items-center
  px-2.5 py-0.5
  rounded-full
  text-xs font-medium uppercase tracking-wide
  ${config.bg} ${config.text}
  ${className ?? ''}
`}>
  {config.label}
</span>
```

**Behavior:**
- Purely presentational.

**Usage Examples:**

```tsx
<ParameterStatusBadge status={ParameterStatus.NOT_SET} />
<ParameterStatusBadge status={ParameterStatus.SYSTEM_CALCULATED} />
<ParameterStatusBadge status={ParameterStatus.BUYER_OVERRIDE} />
<ParameterStatusBadge status={ParameterStatus.NEEDS_REVIEW} />
```

---

### 3.7 SearchInput

A debounced text input with a search icon prefix and a clear button. Used in the Inventory Parameters page filter, BOM explorer search, and any list/table that supports text search.

**File:** `components/common/SearchInput.tsx`

**Props:**

```typescript
interface SearchInputProps {
  /** Current search value (controlled) */
  value: string;
  /** Callback fired after debounce with the new value */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Optional additional CSS classes for the outer container */
  className?: string;
}
```

**Defaults:** `placeholder = "Search..."`, `debounceMs = 300`.

**Visual Description:**

```
<div className={`relative ${className ?? ''}`}>
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
  <input
    type="text"
    value={internalValue}
    onChange={handleChange}
    placeholder={placeholder}
    className="
      w-full pl-10 pr-9 py-2
      text-sm
      bg-slate-100 border border-transparent rounded-lg
      focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-navy-500 focus:outline-none
      transition-colors
      placeholder:text-slate-400
    "
  />
  {internalValue && (
    <button
      onClick={handleClear}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
    >
      <X className="h-4 w-4" />
    </button>
  )}
</div>
```

Icons: `Search` and `X` from `lucide-react`.

**Internal State:**

| State | Type | Purpose |
|---|---|---|
| `internalValue` | `string` | Immediate value shown in the input (not debounced) |

**Behavior:**
- The input is controlled internally for immediate responsiveness.
- On every keystroke, `internalValue` updates immediately (no lag).
- After the user stops typing for `debounceMs` milliseconds, `onChange` is called with the final value.
- Debounce is implemented via `useEffect` + `setTimeout` / `clearTimeout` (no external library needed).
- Clicking the clear button (`X` icon) resets `internalValue` to `""` and immediately calls `onChange("")`.
- The clear button is only visible when `internalValue` is non-empty.

**Usage Examples:**

```tsx
const [search, setSearch] = useState('');

<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Filter by part number..."
  debounceMs={250}
/>
```

---

### 3.8 FilterBar

A horizontal row of toggle filter buttons supporting multi-select. Used for alert severity filters, worklist status filters, parameter status filters, and violation type filters.

**File:** `components/common/FilterBar.tsx`

**Props:**

```typescript
interface FilterOption<T extends string> {
  /** The value this option represents (typically an enum value) */
  value: T;
  /** Display label */
  label: string;
  /** Optional Tailwind classes for the active state background/text color. Defaults to navy. */
  activeColorClass?: string;
  /** Optional count badge number to show beside the label */
  count?: number;
}

interface FilterBarProps<T extends string> {
  /** Available filter options */
  options: FilterOption<T>[];
  /** Currently selected values */
  selected: T[];
  /** Callback when selection changes */
  onChange: (selected: T[]) => void;
  /** Label displayed to the left of the filter buttons */
  label?: string;
  /** Whether to show an "All" toggle at the start */
  showAll?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Defaults:** `showAll = true`.

**Visual Description:**

```
<div className={`flex items-center gap-2 flex-wrap ${className ?? ''}`}>
  {label && (
    <span className="text-sm font-medium text-slate-500 mr-1">{label}</span>
  )}
  {showAll && (
    <button
      onClick={handleAllToggle}
      className={allActive
        ? 'px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white'
        : 'px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200'
      }
    >
      All
    </button>
  )}
  {options.map(opt => (
    <button
      key={opt.value}
      onClick={() => handleToggle(opt.value)}
      className={isSelected(opt.value)
        ? `px-3 py-1.5 text-xs font-medium rounded-lg ${opt.activeColorClass ?? 'bg-navy-100 text-navy-700'}`
        : 'px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200'
      }
    >
      {opt.label}
      {opt.count !== undefined && (
        <span className="ml-1.5 text-xs opacity-70">{opt.count}</span>
      )}
    </button>
  ))}
</div>
```

**Behavior:**
- **Multi-select toggle:** Clicking a button toggles its value in/out of `selected`. Clicking an already-selected button deselects it.
- **"All" button:** When clicked, clears all individual selections (passes `[]` to `onChange`). The "All" button renders as active when `selected` is empty (meaning no filter applied — show all).
- Deselecting every individual filter automatically returns to "All" state.
- Selecting any individual filter deactivates the "All" button.
- Optional `count` badge renders inline after the label for showing the number of matching items.

**Usage Examples:**

```tsx
// Alert severity filter
<FilterBar<AlertLevel>
  label="Severity:"
  options={[
    { value: AlertLevel.CRITICAL, label: 'Critical', activeColorClass: 'bg-danger-100 text-danger-700', count: 3 },
    { value: AlertLevel.WARNING, label: 'Warning', activeColorClass: 'bg-warning-100 text-warning-700', count: 4 },
    { value: AlertLevel.WATCH, label: 'Watch', activeColorClass: 'bg-gold-100 text-gold-700', count: 2 },
    { value: AlertLevel.EXCESS, label: 'Excess', activeColorClass: 'bg-info-100 text-info-700', count: 1 },
  ]}
  selected={selectedLevels}
  onChange={setSelectedLevels}
/>

// Parameter status filter (violation filters from Kernel §4.7)
<FilterBar<string>
  label="Status:"
  options={[
    { value: 'below-min', label: 'Below Min', activeColorClass: 'bg-danger-100 text-danger-700' },
    { value: 'above-max', label: 'Above Max', activeColorClass: 'bg-info-100 text-info-700' },
    { value: 'no-params', label: 'No Parameters', activeColorClass: 'bg-slate-200 text-slate-700' },
    { value: 'needs-review', label: 'Needs Review', activeColorClass: 'bg-warning-100 text-warning-700' },
  ]}
  selected={selectedFilters}
  onChange={setSelectedFilters}
/>
```

---

### 3.9 EmptyState

A centered message with icon and optional action button, displayed when a table, list, or filtered view has no results.

**File:** `components/common/EmptyState.tsx`

**Props:**

```typescript
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  /** Lucide icon to display above the message */
  icon: LucideIcon;
  /** Primary message text */
  title: string;
  /** Optional secondary description text */
  description?: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Callback when the action button is clicked */
  onAction?: () => void;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Visual Description:**

```
<div className={`flex flex-col items-center justify-center py-16 ${className ?? ''}`}>
  <Icon className="h-12 w-12 text-slate-300 mb-4" />
  <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
  {description && (
    <p className="text-sm text-slate-500 mb-4 max-w-md text-center">{description}</p>
  )}
  {actionLabel && onAction && (
    <button
      onClick={onAction}
      className="
        px-4 py-2
        text-sm font-medium
        text-white bg-navy-700
        rounded-lg
        hover:bg-navy-600
        focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2
        transition-colors
      "
    >
      {actionLabel}
    </button>
  )}
</div>
```

**Behavior:**
- Purely presentational with an optional click handler on the action button.
- Centers itself within its parent container.
- Icon is large (48x48) and uses `text-slate-300` to appear muted.

**Usage Examples:**

```tsx
import { SearchX, Inbox, AlertTriangle } from 'lucide-react';

// No search results
<EmptyState
  icon={SearchX}
  title="No matching SKUs"
  description="Try adjusting your search or filter criteria."
  actionLabel="Clear Filters"
  onAction={handleClearFilters}
/>

// Empty worklist
<EmptyState
  icon={Inbox}
  title="All caught up"
  description="No pending actions in the worklist."
/>

// No alerts
<EmptyState
  icon={AlertTriangle}
  title="No active alerts"
  description="All inventory levels are within acceptable ranges."
/>
```

---

### 3.10 PageHeader

A consistent page header with title, optional subtitle, and an optional right-side action area for buttons, filters, or controls.

**File:** `components/common/PageHeader.tsx`

**Props:**

```typescript
import { ReactNode } from 'react';

interface PageHeaderProps {
  /** Page title — renders as h1 */
  title: string;
  /** Optional subtitle text below the title */
  subtitle?: string;
  /** Optional content rendered on the right side (buttons, filters, export actions) */
  actions?: ReactNode;
  /** Optional additional CSS classes */
  className?: string;
}
```

**Visual Description:**

```
<div className={`flex items-start justify-between mb-6 ${className ?? ''}`}>
  <div>
    <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
    {subtitle && (
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    )}
  </div>
  {actions && (
    <div className="flex items-center gap-3 shrink-0">
      {actions}
    </div>
  )}
</div>
```

**Typography:** Title uses `text-2xl font-semibold` per Kernel §7.4 page title spec.

**Behavior:**
- Purely presentational layout component.
- The `actions` slot is a render prop accepting any ReactNode — the page is responsible for passing buttons, filter bars, export controls, etc.
- Uses `items-start` so the title and actions top-align even if the title wraps to multiple lines.

**Usage Examples:**

```tsx
// Simple page header
<PageHeader title="Action Center" subtitle="15 items require attention" />

// Page header with actions
<PageHeader
  title="Inventory Parameters"
  subtitle="Manage min/max and safety stock levels across all SKUs"
  actions={
    <>
      <button className="...">Import</button>
      <button className="...">Export CSV</button>
    </>
  }
/>

// Dashboard header
<PageHeader title="Fill Rate Tracker" />
```

---

### 3.11 SummaryCard

A KPI summary card displaying a label, large value, trend indicator (up/down arrow with delta), and optional target comparison. Used at the top of dashboard pages and overview sections.

**File:** `components/common/SummaryCard.tsx`

**Props:**

```typescript
import { KPITrend } from '@/lib/types';

interface SummaryCardProps {
  /** KPI label (e.g., "Fill Rate", "Active Alerts") */
  label: string;
  /** Primary formatted value (e.g., "85%", "$1.2M", "12") */
  value: string;
  /** Optional trend data — direction, delta, favorability */
  trend?: KPITrend;
  /** Optional target comparison string (e.g., "Target: 98%") */
  target?: string;
  /** Optional additional CSS classes */
  className?: string;
  /** Optional click handler — makes the card a clickable drill-down target */
  onClick?: () => void;
}
```

**Visual Description:**

```
<div
  className={`
    bg-white rounded-xl border border-slate-200 p-5
    ${onClick ? 'cursor-pointer hover:shadow-card-hover transition-shadow' : ''}
    ${className ?? ''}
  `}
  onClick={onClick}
>
  <p className="text-sm font-medium text-slate-500">{label}</p>
  <div className="mt-2 flex items-baseline gap-3">
    <span className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
      {value}
    </span>
    {trend && (
      <span className={`
        inline-flex items-center gap-0.5 text-sm font-medium
        ${trend.favorable ? 'text-success-500' : 'text-danger-500'}
      `}>
        {trend.direction === 'up' && <TrendingUp className="h-4 w-4" />}
        {trend.direction === 'down' && <TrendingDown className="h-4 w-4" />}
        {trend.direction === 'flat' && <Minus className="h-4 w-4" />}
        {trend.delta}
      </span>
    )}
  </div>
  {target && (
    <p className="mt-2 text-xs text-slate-400">{target}</p>
  )}
</div>
```

Icons: `TrendingUp`, `TrendingDown`, `Minus` from `lucide-react`.

**Behavior:**
- Purely presentational.
- Value uses `font-mono tabular-nums` per Kernel §7.4 for numeric alignment when cards are displayed in a grid.
- Trend color is determined by `trend.favorable`: green when the trend is good for the business, red when bad — independent of direction (e.g., cost going down is `direction: 'down'` but `favorable: true`).
- When `onClick` is provided, the card renders as a clickable target with `cursor-pointer` and a hover shadow effect. Used for dashboard drill-downs (see Spec 16 §3.4.1).

**Usage Examples:**

```tsx
<div className="grid grid-cols-4 gap-4">
  <SummaryCard
    label="Fill Rate"
    value="85.2%"
    trend={{ direction: 'up', delta: '+3.1%', favorable: true }}
    target="Target: 98%"
  />
  <SummaryCard
    label="Active Alerts"
    value="12"
    trend={{ direction: 'down', delta: '-3', favorable: true }}
  />
  <SummaryCard
    label="Days of Supply (Median)"
    value="18"
    trend={{ direction: 'up', delta: '+4', favorable: true }}
  />
  <SummaryCard
    label="Working Capital"
    value="$6.5M"
    trend={{ direction: 'down', delta: '-$0.8M', favorable: true }}
    target="Target: $5.5M"
  />
</div>
```

---

### 3.12 DataTable

A TanStack Table wrapper providing sortable columns, pagination, optional row click handling, optional checkbox column for bulk selection, and a sticky header. This is the primary table component used across the Action Center worklist, Alerts table, Inventory Parameters table, Forecast Accuracy table, and Pipeline Status table.

**File:** `components/common/DataTable.tsx`

**Props:**

```typescript
import { ColumnDef, SortingState, PaginationState, RowSelectionState } from '@tanstack/react-table';

interface DataTableProps<TData> {
  /** Column definitions (TanStack Table ColumnDef format) */
  columns: ColumnDef<TData, any>[];
  /** Array of data rows */
  data: TData[];
  /** Callback when a row body cell is clicked (not header, not checkbox). Receives the row data. */
  onRowClick?: (row: TData) => void;
  /** Enable checkbox column for bulk row selection */
  enableSelection?: boolean;
  /** Controlled selection state (row IDs). Required when enableSelection is true. */
  rowSelection?: RowSelectionState;
  /** Callback when selection changes. Required when enableSelection is true. */
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /** Number of rows per page. Default 20. */
  pageSize?: number;
  /** Unique identifier field name on TData used as row ID. Default "id". */
  getRowId?: (row: TData) => string;
  /** Optional additional CSS classes for the outer container */
  className?: string;
}
```

**Defaults:** `pageSize = 20`, `enableSelection = false`.

**Visual Description:**

Outer container:
```
<div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className ?? ''}`}>
```

Table:
```
<div className="overflow-x-auto">
  <table className="w-full">
    <thead className="sticky top-0 z-10">
      <tr className="border-b border-slate-200 bg-slate-50">
        {/* Checkbox header (if enableSelection) */}
        {enableSelection && (
          <th className="w-12 px-4 py-3">
            <input type="checkbox" ... className="h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500" />
          </th>
        )}
        {/* Column headers */}
        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-700">
          {header.label}
          {/* Sort indicator */}
          {sorted === 'asc' && <ChevronUp className="inline h-3.5 w-3.5 ml-1" />}
          {sorted === 'desc' && <ChevronDown className="inline h-3.5 w-3.5 ml-1" />}
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      <tr className={`
        ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}
        transition-colors
      `}>
        {/* Checkbox cell (if enableSelection) */}
        {enableSelection && (
          <td className="w-12 px-4 py-3">
            <input type="checkbox" ... className="h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500" />
          </td>
        )}
        {/* Data cells */}
        <td className="px-4 py-3 text-sm text-slate-900">
          {cell.value}
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Numeric columns:** Consuming pages apply `text-sm font-mono tabular-nums text-right` via the column definition's `meta` or `cell` renderer per Kernel §7.4.

Pagination footer:
```
<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
  <span className="text-sm text-slate-500">
    Showing {startRow}–{endRow} of {totalRows}
  </span>
  <div className="flex items-center gap-2">
    <button
      disabled={!canPreviousPage}
      onClick={previousPage}
      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Previous
    </button>
    <span className="text-sm text-slate-700">
      Page {currentPage} of {totalPages}
    </span>
    <button
      disabled={!canNextPage}
      onClick={nextPage}
      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next
    </button>
  </div>
</div>
```

**Internal State (managed by TanStack Table):**

| State | Type | Default |
|---|---|---|
| `sorting` | `SortingState` | `[]` |
| `pagination` | `PaginationState` | `{ pageIndex: 0, pageSize: props.pageSize }` |

**Behavior:**
- **Sorting:** Clicking a column header cycles through: unsorted -> ascending -> descending -> unsorted. Sort indicator icon changes accordingly. Only single-column sorting.
- **Pagination:** Previous/Next buttons navigate pages. Disabled at boundaries. "Showing X-Y of Z" label updates dynamically.
- **Row click:** When `onRowClick` is provided, clicking a row body cell (not header, not checkbox) calls `onRowClick(rowData)`. Rows show `cursor-pointer` and `hover:bg-slate-50`.
- **Bulk selection:** When `enableSelection` is true, a checkbox column is prepended. Header checkbox toggles select-all for the current page. Individual row checkboxes toggle single selection. Selection state is controlled via `rowSelection` / `onRowSelectionChange`.
- **Sticky header:** The `<thead>` uses `sticky top-0 z-10` so it remains visible when the table content scrolls within its container.
- **Generic typing:** The component is generic over `TData` so it accepts any typed data array and provides type-safe column definitions.

**TanStack Table Integration:**

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
```

The component wraps `useReactTable` internally. Column definitions are passed through directly. Pages define their columns using TanStack's `ColumnDef<TData>` type, including custom cell renderers for badges, indicators, and action buttons.

**Usage Examples:**

```tsx
import { ColumnDef } from '@tanstack/react-table';
import { WorklistItem } from '@/lib/types';

const columns: ColumnDef<WorklistItem>[] = [
  { accessorKey: 'priorityRank', header: 'Rank', cell: ({ getValue }) => (
    <span className="text-sm font-mono tabular-nums">{getValue<number>()}</span>
  )},
  { accessorKey: 'skuId', header: 'SKU' },
  { accessorKey: 'actionType', header: 'Action' },
  { accessorKey: 'recommendedQty', header: 'Qty', cell: ({ getValue }) => (
    <span className="text-sm font-mono tabular-nums text-right">{getValue<number>()}</span>
  )},
  { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => (
    <StatusBadge label={getValue<string>()} ... />
  )},
];

<DataTable<WorklistItem>
  columns={columns}
  data={worklistItems}
  onRowClick={(item) => navigate(`/sku/${item.skuId}`)}
  enableSelection
  rowSelection={selection}
  onRowSelectionChange={setSelection}
  getRowId={(row) => row.itemId}
  pageSize={15}
/>
```

---

### 3.13 Modal

An overlay dialog used for bulk approval confirmation, justification entry (low confidence), parameter editing, and bulk import. Renders above the page content with a backdrop.

**File:** `components/common/Modal.tsx`

**Props:**

```typescript
import { ReactNode } from 'react';

interface ModalProps {
  /** Whether the modal is currently open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Modal title displayed in the header */
  title: string;
  /** Modal body content */
  children: ReactNode;
  /** Optional footer content (action buttons). Rendered in a right-aligned flex row. */
  footer?: ReactNode;
  /** Width variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional additional CSS classes for the modal panel */
  className?: string;
}
```

**Defaults:** `size = 'md'`.

**Size Mapping:**

| Size | Max Width |
|---|---|
| `sm` | `max-w-sm` (384px) |
| `md` | `max-w-lg` (512px) |
| `lg` | `max-w-2xl` (672px) |

**Visual Description:**

```
{/* Backdrop */}
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div
    className="absolute inset-0 bg-black/40 transition-opacity"
    onClick={onClose}
  />
  {/* Panel */}
  <div className={`
    relative z-10
    bg-white rounded-xl shadow-xl
    w-full ${sizeClass} mx-4
    flex flex-col max-h-[85vh]
    ${className ?? ''}
  `}>
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
    {/* Body */}
    <div className="px-6 py-4 overflow-y-auto flex-1">
      {children}
    </div>
    {/* Footer (optional) */}
    {footer && (
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 shrink-0">
        {footer}
      </div>
    )}
  </div>
</div>
```

Icon: `X` from `lucide-react`.

**Behavior:**
- **Open/close:** Controlled via the `open` prop. When `open` is false, the component renders nothing (returns `null`).
- **Backdrop click:** Clicking the backdrop overlay calls `onClose`.
- **Close button:** The `X` button in the header calls `onClose`.
- **Escape key:** Pressing `Escape` calls `onClose`. Implemented via a `useEffect` that adds a `keydown` event listener when the modal is open.
- **Scroll containment:** The modal body (`children`) scrolls independently when content exceeds `max-h-[85vh]`. Header and footer remain fixed.
- **Focus trap:** Not required for the demo, but the modal should auto-focus the first focusable element on open (a simple `useEffect` with `ref.focus()` on the panel).
- **Portal rendering:** Render via `createPortal` to `document.body` to ensure the modal sits above all other content regardless of DOM nesting.

**Usage Examples:**

```tsx
// Bulk approval modal
<Modal
  open={showApproval}
  onClose={() => setShowApproval(false)}
  title="Approve Selected Items"
  footer={
    <>
      <button onClick={() => setShowApproval(false)}
        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
        Cancel
      </button>
      <button onClick={handleApprove}
        className="px-4 py-2 text-sm font-medium text-white bg-navy-700 rounded-lg hover:bg-navy-600">
        Approve {selectedCount} Items
      </button>
    </>
  }
>
  <p className="text-sm text-slate-700">
    You are about to approve {selectedCount} purchase orders
    with a total estimated cost of <strong>{totalCost}</strong>.
  </p>
</Modal>

// Justification modal (confidence < 70%)
<Modal
  open={showJustification}
  onClose={() => setShowJustification(false)}
  title="Low Confidence — Justification Required"
  size="sm"
  footer={
    <>
      <button onClick={() => setShowJustification(false)} className="...">Cancel</button>
      <button onClick={handleSubmit} className="...">Submit</button>
    </>
  }
>
  <p className="text-sm text-slate-500 mb-3">
    This recommendation has a confidence score of {score}%.
    Please provide a justification for proceeding.
  </p>
  <textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm" rows={3}
    placeholder="Enter justification..." />
</Modal>
```

---

### 3.14 Tooltip

A hover-triggered tooltip for truncated text, additional context, and icon explanations.

**File:** `components/common/Tooltip.tsx`

**Props:**

```typescript
import { ReactNode } from 'react';

interface TooltipProps {
  /** Tooltip content (can be a string or ReactNode for rich tooltips) */
  content: ReactNode;
  /** The element that triggers the tooltip on hover */
  children: ReactNode;
  /** Tooltip position relative to the trigger element */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional additional CSS classes for the tooltip container */
  className?: string;
}
```

**Defaults:** `position = 'top'`.

**Visual Description:**

```
<div className={`relative inline-flex ${className ?? ''}`}
     onMouseEnter={show} onMouseLeave={hide}>
  {children}
  {visible && (
    <div className={`
      absolute z-50
      px-3 py-2
      text-xs text-white
      bg-slate-900 rounded-lg shadow-lg
      whitespace-nowrap
      pointer-events-none
      ${positionClasses}
    `}>
      {content}
      {/* Arrow */}
      <div className={`absolute w-2 h-2 bg-slate-900 rotate-45 ${arrowClasses}`} />
    </div>
  )}
</div>
```

**Position Classes:**

| Position | Tooltip Classes | Arrow Classes |
|---|---|---|
| `top` | `bottom-full left-1/2 -translate-x-1/2 mb-2` | `-bottom-1 left-1/2 -translate-x-1/2` |
| `bottom` | `top-full left-1/2 -translate-x-1/2 mt-2` | `-top-1 left-1/2 -translate-x-1/2` |
| `left` | `right-full top-1/2 -translate-y-1/2 mr-2` | `-right-1 top-1/2 -translate-y-1/2` |
| `right` | `left-full top-1/2 -translate-y-1/2 ml-2` | `-left-1 top-1/2 -translate-y-1/2` |

**Internal State:**

| State | Type | Default | Purpose |
|---|---|---|---|
| `visible` | `boolean` | `false` | Controls tooltip visibility |

**Behavior:**
- **Show on hover:** `onMouseEnter` on the wrapper sets `visible = true`. `onMouseLeave` sets `visible = false`.
- **Delay:** Optional 150ms delay before showing (via `setTimeout`) to prevent tooltip flicker during fast mouse movements. The timeout is cleared on `onMouseLeave`.
- **No click interaction:** Tooltip is display-only and has `pointer-events-none`.
- **Rich content:** The `content` prop accepts ReactNode, allowing multi-line or styled tooltip content when needed.
- **Arrow indicator:** A small rotated square element creates the pointer arrow pointing toward the trigger element.

**Usage Examples:**

```tsx
// Truncated text
<Tooltip content="1100031-1 — TRAC-LOCK SWIVEL LOCKING PEDESTAL BASE">
  <span className="truncate max-w-[200px] block">1100031-1 — TRAC-LOCK...</span>
</Tooltip>

// Icon explanation
<Tooltip content="System-calculated value based on forecast + lead-time model" position="right">
  <Info className="h-4 w-4 text-slate-400" />
</Tooltip>

// Bottom position
<Tooltip content="Click to sort ascending" position="bottom">
  <th>Priority</th>
</Tooltip>
```

---

## 4. Barrel Export

**File:** `components/common/index.ts`

Re-exports all common components for clean imports:

```typescript
export { StatusBadge } from './StatusBadge';
export { AlertSeverityBadge } from './AlertSeverityBadge';
export { SourceNodeBadge } from './SourceNodeBadge';
export { ConfidenceScore } from './ConfidenceScore';
export { DaysOfSupplyIndicator } from './DaysOfSupplyIndicator';
export { ParameterStatusBadge } from './ParameterStatusBadge';
export { SearchInput } from './SearchInput';
export { FilterBar } from './FilterBar';
export { EmptyState } from './EmptyState';
export { PageHeader } from './PageHeader';
export { SummaryCard } from './SummaryCard';
export { DataTable } from './DataTable';
export { Modal } from './Modal';
export { Tooltip } from './Tooltip';
```

Pages import from this barrel:

```typescript
import { PageHeader, DataTable, AlertSeverityBadge, FilterBar } from '@/components/common';
```

---

## 5. Shared Constants & Helpers

Several components rely on color/config lookup objects defined in Spec 02. All style mappings are consolidated in a single file:

| File | Exports | Used By |
|---|---|---|
| `lib/design-tokens.ts` | `SEVERITY_STYLES` (AlertLevel colors) | `AlertSeverityBadge`, `FilterBar` severity options |
| `lib/design-tokens.ts` | `SOURCE_STYLES` (SourceNode colors) | `SourceNodeBadge` |
| `lib/design-tokens.ts` | `PARAMETER_STATUS_STYLES` (ParameterStatus colors) | `ParameterStatusBadge` |
| `lib/design-tokens.ts` | `CHART_COLORS`, `DEMAND_CLASS_COLORS` etc. | Chart components (Spec 06) |

All color mappings use the custom Tailwind theme tokens defined in Spec 02 §4.1 (e.g., `bg-navy-100`, `text-danger-500`, `bg-success-100`) rather than generic Tailwind colors.

---

## 6. Acceptance Criteria

| # | Criterion | Verification |
|---|---|---|
| AC-1 | All 14 component files exist under `frontend/src/components/common/` | Path check |
| AC-2 | `index.ts` barrel file exports all 14 components | Import test |
| AC-3 | Every component compiles with `tsc --strict --noEmit` — no `any` types | TypeScript check |
| AC-4 | `StatusBadge` renders a colored pill with the given label, bgColor, and textColor | Visual inspection |
| AC-5 | `AlertSeverityBadge` renders all four AlertLevel values with correct Kernel §7.2 colors and distinct icons | Render each level; compare colors to spec |
| AC-6 | `SourceNodeBadge` renders all three SourceNode values with correct Kernel §7.3 colors and short labels | Render each source; compare colors to spec |
| AC-7 | `ConfidenceScore` ring variant shows colored progress arc and center percentage; color grades correctly at <60, 60-79, 80+ thresholds | Render at values 55, 70, 92 |
| AC-8 | `ConfidenceScore` bar variant shows horizontal colored bar with percentage label | Render at values 55, 70, 92 |
| AC-9 | `DaysOfSupplyIndicator` renders correct color at thresholds: 3 (red), 10 (amber), 20 (yellow), 45 (green) | Render at each value |
| AC-10 | `ParameterStatusBadge` renders all four ParameterStatus values with correct Spec 02 §3.4 colors | Render each status |
| AC-11 | `SearchInput` debounces onChange: typing fires onChange only after debounceMs of inactivity | Type quickly; verify single callback after pause |
| AC-12 | `SearchInput` clear button resets value and fires onChange immediately | Click X; verify empty callback |
| AC-13 | `FilterBar` supports multi-select toggle: clicking a button toggles it in/out of selected; clicking "All" clears selection | Click sequence test |
| AC-14 | `EmptyState` renders centered icon, title, description, and action button when all props are provided | Visual inspection |
| AC-15 | `PageHeader` renders title at 2xl, optional subtitle, and optional right-side actions | Visual inspection |
| AC-16 | `SummaryCard` renders label, large mono value, trend with correct color (green=favorable, red=unfavorable), and target text | Render with trend data |
| AC-16a | `SummaryCard` with `onClick` renders `cursor-pointer` and `hover:shadow-card-hover`; clicking fires the handler | Click test |
| AC-17 | `DataTable` renders sorted data: clicking a column header sorts ascending then descending then unsorted | Click header; verify row order |
| AC-18 | `DataTable` paginates: Previous/Next buttons navigate pages; "Showing X-Y of Z" updates | Click through pages |
| AC-19 | `DataTable` checkbox column: header checkbox selects all on current page; individual checkboxes toggle; selection state is reported via onRowSelectionChange | Toggle checkboxes; verify state |
| AC-20 | `DataTable` row click: clicking a row fires onRowClick with the row data; rows show pointer cursor and hover highlight | Click a row; verify callback |
| AC-21 | `DataTable` numeric columns render with `text-sm font-mono tabular-nums` when configured via column definition | Visual inspection of numeric cells |
| AC-22 | `Modal` opens and closes via the `open` prop; backdrop click closes; Escape key closes; X button closes | Test each close mechanism |
| AC-23 | `Modal` body scrolls independently when content exceeds viewport height; header and footer remain fixed | Add tall content; verify scroll behavior |
| AC-24 | `Modal` renders via portal to `document.body` | Inspect DOM; verify modal is a direct child of body |
| AC-25 | `Tooltip` appears on hover after a brief delay and disappears on mouse leave | Hover test |
| AC-26 | `Tooltip` positions correctly in all four positions (top, bottom, left, right) with arrow indicator | Test each position |
| AC-27 | All components follow Kernel §7.4 typography: badges use `text-xs font-medium uppercase tracking-wide`; numeric values use `font-mono tabular-nums` | Visual review |

---

## 7. Out of Scope

- Page-specific components (worklist action buttons, alert cards, forecast charts) — those belong in their respective `components/worklist/`, `components/alerts/`, etc. directories
- Animation beyond basic Tailwind `transition-colors` and `transition-all`
- Virtualized table rows (not needed for demo-scale data of 40-60 SKUs)
- Internationalization / localization
- Dark mode variants
- Accessibility audit (basic keyboard support is included where noted; full ARIA compliance is a future concern)
