# Contributing to MindCheck

Thank you for considering contributing to MindCheck. Your help makes this project better for everyone managing stress.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/mindcheck.git`
3. **Create a branch** for your feature: `git checkout -b feature/your-feature-name`
4. **Install dependencies**: `npm install`
5. **Start development**: `npm run dev`

## Development Workflow

### Before You Start

- Check existing issues and PRs to avoid duplicate work
- Open an issue first if it's a large feature—let's align on the approach

### Making Changes

1. **Run tests** before committing:
   ```bash
   npm run test
   ```

2. **Follow the code style**:
   - Use TypeScript with strict mode
   - Name components, functions, and types clearly
   - Keep components focused and small
   - Write comments for non-obvious logic

3. **Keep commits atomic**:
   - One logical change per commit
   - Write clear commit messages: `feat: add breathing guide`, `fix: stress score calculation`

### Testing

- **Unit tests**: `npm run test:shared` (algorithms)
- **API tests**: `npm run test:server` (routes and logic)
- **Component tests**: `npm run test:client` (React components)
- **All tests**: `npm run test`

If adding a feature, please add tests. If fixing a bug, add a test that catches the regression.

## Code Guidelines

### React Components

- Use functional components with hooks
- Keep components under 300 lines—split large ones
- Use TypeScript types instead of PropTypes
- Name files with PascalCase: `MoodPicker.tsx`

Example:
```tsx
import type { ReactNode } from "react";

export const MoodPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="mood-grid" role="list">
    {/* Component content */}
  </div>
);
```

### Server Routes

- Use Express Router for modularity
- Validate input with Zod schemas from `@mindcheck/shared`
- Return consistent JSON responses
- Handle errors gracefully

Example:
```ts
import { checkInSchema } from "@mindcheck/shared";
import { requireAuth } from "../middleware/auth.js";

checkInRouter.post("/", requireAuth, (req, res) => {
  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid check-in data" });
    return;
  }

  const record = checkInRepository.upsert(req.userId, parsed.data);
  res.status(201).json(record);
});
```

### Shared Code

- Keep types in `packages/shared/src/types.ts`
- Algorithms go in `packages/shared/src/lib/`
- Relief content in `packages/shared/src/content/`
- Add tests for utility functions

## Commit Message Format

Use clear, descriptive commit messages:

```
feat: add breathing guide component
fix: correct stress score calculation for sleep
refactor: simplify burnout detection logic
docs: update README with API endpoints
test: add check-in validation tests
```

## Pull Request Process

1. **Push** your branch to your fork
2. **Open a PR** against `main`
3. **Title**: Clear, concise description (under 70 chars)
4. **Description**:
   - What does this change?
   - Why is it needed?
   - How was it tested?
   - Any breaking changes?

Example:
```
## Description
Add weekly reflection journal prompt system.

## Why
Users requested a dedicated space for weekly summaries of stress patterns and wins.

## Testing
- Added 5 new tests in `journal.test.ts`
- Manual testing: verified prompts appear on Sunday evenings
- Verified with 3x check-in modes (once, thrice)

## Related
Fixes #42, closes #55
```

4. **Review**: Respond to feedback, make changes if needed
5. **Merge**: Maintainer will merge once approved

## Reporting Bugs

Open an issue with:

- **Title**: Clear description of the bug
- **Steps to reproduce**: How to see the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What happens instead
- **Environment**: OS, browser, Node version (if relevant)
- **Logs**: Error messages or console output

Example:
```
Title: Stress score calculation shows NaN for 8-hour sleep

Steps:
1. Log a check-in with 8 hours of sleep and quality 9/10
2. View dashboard

Expected: Stress score calculates normally
Actual: Shows "NaN" in stress ring

Environment: Windows 11, Chrome 125, Node 22
```

## Feature Requests

Open an issue with:

- **Title**: Clear description of the feature
- **Why**: The problem it solves
- **How**: Suggested implementation (optional)
- **Examples**: Similar features or apps

Example:
```
Title: Add timezone support for check-in reminders

Why: Users in different timezones don't get reminders at the right time

How: Add `timezone` field to user settings, adjust reminder times server-side

Example: If user sets timezone to "America/New_York", evening reminder fires at 8 PM ET not UTC
```

## Questions?

- **Discord/Community**: [Link to your community if you have one]
- **Discussions**: Use GitHub Discussions for open-ended questions
- **Email**: [Contact method if applicable]

---

Thank you for contributing to making stress management more accessible and human. 💙
