# Interaction Rules

## Code Changes Policy

**CRITICAL: Never make code changes until explicitly instructed by the user.**

### Rules:
1. **Analysis First**: When asked to check or investigate an issue, provide analysis and recommendations ONLY
2. **Wait for Approval**: After presenting your findings and proposed solutions, wait for the user to explicitly say:
   - "make the changes"
   - "apply the fix"
   - "go ahead"
   - "implement it"
   - Or similar explicit approval
3. **No Assumptions**: Do not assume the user wants changes applied just because they asked you to investigate
4. **Explain Before Acting**: Always explain what you found and what you would change, then wait for confirmation

### Example Flow:
```
User: "check the transact Vue, the continue button isn't working"

✅ CORRECT Response:
- Read the relevant files
- Analyze the issue
- Explain what's wrong
- Propose a solution
- Wait for user to say "apply the fix"

❌ INCORRECT Response:
- Read the files
- Immediately make changes without asking
```

### Exceptions:
- User explicitly asks you to "fix", "implement", "create", or "update" something in their initial request
- User has already approved changes in the conversation

This rule ensures the user maintains full control over their codebase and prevents unwanted modifications.

## Context Files

When working on this project, always reference these files for context:
- `understand` - Business context, blueprint system, market positioning
- `frontend.md` - Frontend architecture, design system, visual patterns
- `README.md` - Project overview, tech stack, setup instructions

## Communication Style

### Be Concise
- Get to the point quickly
- Use bullet points for lists
- Avoid unnecessary explanations

### Be Specific
- Reference exact file paths
- Include line numbers when relevant
- Show code snippets, not just descriptions

### Be Actionable
- Provide clear next steps
- Offer specific solutions, not vague suggestions
- Include commands that can be copy-pasted

## Project-Specific Guidelines

### Crossview LMS Context
- This is a multi-tenant SaaS LMS for the Kenyan education market
- Supports multiple educational models via "Blueprints" (Theology, TVET, Vocational, K-12)
- Primary client: Crossview College of Theology and Technology
- Target expansion: Vocational schools in Eldoret region

### Key Architectural Decisions
- Django 5.0+ backend with Inertia.js for SPA-like experience
- React 19 + MUI v7 frontend
- Shared database multi-tenancy with tenant_id isolation
- Blueprint-driven academic structure (not hardcoded)
- Services layer for business logic (not in views)

### When Building Features
1. Check if similar patterns exist in the codebase
2. Follow existing conventions
3. Ensure tenant isolation
4. Add appropriate tests
5. Update documentation if needed
