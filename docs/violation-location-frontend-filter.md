# Violation location frontend filter

## Understanding summary

- Scope is limited to the frontend `CreateViolationModal`.
- The Location dropdown must show only stalls that are currently rented.
- A rented stall is identified by `stallStatus === "Rented"`.
- Available and maintenance stalls are hidden from the selectable list.
- The API contract and backend validation are not changed in this work.
- Existing violation creation behavior and data remain unchanged.

## Assumptions

- `stallStatus` is present in each record returned by `/api/staff/stalls/lookup`.
- A violation may only be created for a currently rented stall in this frontend flow.

## Decision log

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Filter the response in the frontend after it loads | Add a query filter or change the backend endpoint | The requested scope is frontend-only and this avoids changing the shared API. |
| Treat only `Rented` as eligible | Infer eligibility from vendor name or other fields | Status is explicit and avoids false positives from incomplete vendor data. |
| Keep a prefilled stall only when it remains eligible | Always render the prefilled stall | Prevents a stale non-rented stall from being selected through the UI. |

## Verification

- Build the frontend.
- Open the create-violation form from the violation list and verify only rented stalls are listed.
- Open it from a rented stall's Violation button and verify the selected location remains available.
