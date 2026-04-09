# DPC Dashboard — UI/UX Fix Tasks

## Global Issues (affects all pages)

### G1: Sidebar is too plain and cramped
- The sidebar nav items have no visual hierarchy or spacing
- Active state is barely visible — needs stronger dpc-red accent
- Logo area at top needs more breathing room and a subtle separator
- Add hover states with subtle bg transition
- Nav items need more padding (py-2.5 at least) and slightly larger text
- Add subtle section divider between logo and nav

### G2: Top bar is too thin and forgettable
- Breadcrumbs text is too small and low contrast
- The right-side "Pre-Engagement Analysis" label blends into nothing
- Needs a subtle bottom border or shadow to separate from content
- Breadcrumb separators should be chevrons, not slashes

### G3: Page content needs more horizontal padding and max-width
- Content goes edge-to-edge on wide screens — looks stretched
- Add max-w-7xl mx-auto with px-8 padding
- Consistent top padding of pt-8 on all pages

### G4: Card styling is inconsistent across pages
- Some cards have borders, some don't, some have shadows — pick one system
- Standard: rounded-xl border border-border/50 bg-card shadow-sm
- Hover state on interactive cards: shadow-md transition-shadow
- Consistent internal padding: p-6

### G5: Typography hierarchy is weak
- Page titles should be text-3xl font-bold tracking-tight (not text-2xl)
- Section headers should be text-xl font-semibold with mb-1 subtitle
- Body text line-height is too tight — use leading-relaxed
- Muted text is too faint — use text-muted-foreground/80 not pure muted

### G6: Color usage is too muted overall
- The dpc-red (#8B1A1A) barely appears — it should anchor the design
- KPI card values should be larger (text-3xl) and bolder
- Accent colors for findings/metrics need more punch — use dpc-red for key numbers
- The donut/bar chart colors are fine but need slightly more saturation

---

## Page-Specific Issues

### P1: Overview Page
- KPI cards are cramped — icons are too small, values need to be text-3xl font-bold
- Finding cards: the metric number should be much larger (text-4xl) and in dpc-red, not just regular bold
- "Building on a Strong Foundation" section looks like every other card — needs visual distinction (subtle gradient bg, or a left accent stripe, or an icon with more presence)
- Navigation cards at bottom are tiny and hard to read — make them taller with better icon sizing
- The donut chart section has too much text crammed next to it — give it more room
- Overall feels like a wall of samey gray cards — needs visual rhythm breaks (section dividers, bg color shifts)

### P2: Order Book Page
- The EDI Visibility chart is good but the bars are thin — make them wider/fuller
- The red callout box below the chart is good — keep it
- Monthly volume table: the "Sparkle" baseline tag on April is too subtle — highlight the whole row with a light bg
- Customer breakdown bar chart: labels are cut off on the left — needs more left margin
- The customer bar chart and donut are crammed side by side — give each more room, or stack on medium screens
- Visibility % badges in the table need to be actual colored badges, not just colored text

### P3: Risk Analysis Page
- The HHI KPI card shows "2,053" but should be "1,053" — DATA BUG, fix immediately
- Platform cards grid is too dense — cards are too small with too much info crammed in
- Platform cards need more visual hierarchy: code should be large monospace, vehicle name prominent, metadata secondary
- The OEM color coding (left border) is great but too subtle — make borders thicker (border-l-4)
- Risk cards section: the colored left borders are good but card content is too dense — add more spacing
- The GM Code Structure reference at the bottom is nice but uses a generic blue bg — use slate-100 instead
- Concentration stacked bar at top is hard to read — customer names are tiny

### P4: Materials & Inventory Page
- The filter buttons (All/Shortages/OK) need more visual weight — they look like plain text
- Table: negative numbers in red are good, but the red is too bright against white — use a softer red bg-red-50 cell background instead
- The "Material Commonality" bar chart section feels disconnected — add a card wrapper
- Inventory Health donut: green/red is too simplistic — the "268 positive" shouldn't be bright green since many of those may have their own issues
- The insight text blocks are walls of text — break into shorter paragraphs with headers
- BOM Match Gap section needs an icon and better visual hierarchy

### P5: Market Outlook Page
- The tariff KPI cards look good
- The positive/negative comparison cards are effective — keep the green/amber borders
- EV Timeline: the timeline dots and lines are too small — make the timeline more visual with larger markers
- Data Center section: the Missouri projects table is plain — add row hover effects
- ICF Technical Fit table: the green/red status colors are good but the table needs better spacing
- The three opportunity cards at bottom need icons to differentiate them
- Revenue sizing note gets lost — put it in a distinct callout card

### P6: Next Steps Page
- This page is the LONGEST and most text-heavy — it desperately needs visual breaks
- The "Current Status" cards are good but the check/x lists inside are cramped
- Data Request cards: the must-have cards should be visually larger/more prominent than nice-to-have
- The "Dataset Unlocks" flow (Data → Capability → Value) arrows are probably not rendering well
- Forecasting methodology cards: the 3 layer cards need distinct visual treatment (numbered, colored top borders)
- The accuracy table needs better styling — use alternating row colors
- Questions list needs numbered circles, not just plain numbers
- Implementation timeline cards need icons and visual phase progression

---

## Priority Order
1. G1-G6 (global fixes transform every page at once)
2. P1 (Overview is the first impression)
3. P3 data bug (HHI showing wrong value)
4. P2, P4, P5, P6 (remaining pages)
