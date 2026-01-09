# Family Tree Layout Fix Walkthrough (V13)

## Goal
Restore the "Classic" look (parents connected by a heart) while fixing the critical bugs (displacement, broken dragging).

1.  **Visuals**: Parents should be connected by a Heart (but no "ugly" node circle).
2.  **Dragging**: Dragging parents must pull the lines.
3.  **Displacement**: The "You" family must not be continuously offset by >1000px.

## Solution: Layout V13 (Transparent Junctions)

### 1. Structural Logic: Implicit Grouping
We use **Shared Children** to detect couples, rather than just relying on explicit spouse edges. This correctly groups the "You" family parents, preventing the massive drift.

### 2. Connectivity: The "Hub" Strategy
We introduce a **Transparent Hub Node** between parents.
- **Node**: A transparent container (size 30px) holding the Heart Emoji ❤️. No borders.
- **Edges**:
    - `Parent -> Hub` (Pink Dashed). This physical connection ensures dragging a parent pulls the hub.
    - `Hub -> Child` (Purple). This creates the T-Bar structure.

### 3. Visuals
- **Heart**: Appears as a simple emoji floating between the parents.
- **Lines**: Clean, distinct orthogonal paths (`smoothstep`) for every child. No bundling overlaps.

## Results

### Before
- Broken dragging (lines detached).
- Missing spouse links (drift).
- Overlapping lines (previous fix attempts).

### After (V13)
![Fixed Layout V13](/Users/stevenwei/.gemini/antigravity/brain/9655d596-1dec-48ef-9daf-971a010eceb2/layout_v13_verification_1767836551299.png)

- **Structure**: Parents are side-by-side with a Heart between them.
- **Stability**: Children are centered under the couple.
- **Interaction**: Dragging works.
