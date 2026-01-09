# Stage 1: Base Data Expansion

## Goal
Expand the data model to support richer family information, including Zodiac signs, Job titles, Death details, and Notes. Improve the list view with sorting and gender differentiation.

## Changes

### 1. Data Model (`src/types/index.ts`)
- Add optional fields to `Member` interface:
    - `jobTitle?: string`
    - `deathDate?: string`
    - `deathReason?: string`
    - `notes?: string`
    - `isDeceased?: boolean` (derived or explicit?) -> usually explicit or derived from deathDate.

### 2. Logic (`src/utils/`)
- **Zodiac**: Create `src/utils/zodiac.ts`.
    - Function `getZodiac(birthDate: string): string` (Return 🐭, 🐮, etc.).
- **Sorting**: Update `MemberTable` to support:
    - Sort by `birthDate` (Age).
    - Sort by `generation` (needs graph traversal? or simple estimation). 
    - *Note*: "Generation" is hard in a graph loop, but we can assume `depth` from root. For now, "Age" is safest.

### 3. UI Components
- **`MemberForm.tsx`**: Add input fields for new data.
- **`MemberTable.tsx`**: 
    - Add columns for Job, Age, Zodiac.
    - Style rows based on Gender (Blue/Pink backgrounds? Or subtle borders/icons to fit 'Vintage' theme later).
- **`FamilyGraph.tsx` / `CustomNode.tsx`**:
    - Display Zodiac icon on card.
    - Display "Deceased" status (e.g., black border or cross).

## Execution Steps
1.  **Types**: Update `types/index.ts`.
2.  **Utils**: Create `utils/zodiac.ts`.
3.  **Form**: Update `MemberForm` inputs.
4.  **List**: Update `MemberTable` columns & sorting.
5.  **Graph**: Update `CustomNode` display.
