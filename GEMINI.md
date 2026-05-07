# GEMINI Instructions

## 1. Single Source of Truth
The file `docs/PROJECT_SPEC.md` is the authoritative source for architecture, file mapping, and standards. **Always read it first.**

## 2. Context Efficiency
- **Skip Research:** For standard UI/Logic updates, refer to the 'Core File Map' in `docs/PROJECT_SPEC.md` instead of full-project `grep`.
- **No Structure File:** Do not look for `project_structure.md`. Use the tree provided in the session context.

## 3. General Mandates
- Ensure all code changes align with the tech stack defined in `docs/PROJECT_SPEC.md`.
- Update `docs/PROJECT_SPEC.md` immediately if architectural paths or core JSON schemas change.
- **API Documentation:** Always update `docs/openapi.json` whenever modifying or adding REST API endpoints to ensure the documentation remains synchronized with the implementation.
- **Shell & Scripting:** Always use **Bash** for scripts, automation, and testing. Use `c:\tools\git\bin\bash` for execution. Avoid PowerShell scripts (`.ps1`).
