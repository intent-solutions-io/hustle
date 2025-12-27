# Visual Validation with UI Visual Validator Agent

This guide explains how to use Claude Code's UI Visual Validator agent to verify
that UI modifications have achieved their intended goals.

## When to Use

Use the UI Visual Validator agent:
- After implementing UI changes to verify they look correct
- When debugging visual regressions in E2E tests
- To validate responsive design across breakpoints
- After fixing CSS/styling issues

## Screenshot Capture Points

Our E2E tests capture screenshots at these key journey points:

| Screenshot | Location | Purpose |
|------------|----------|---------|
| `login-page.png` | Login form | Verify auth UI styling |
| `dashboard-main.png` | Dashboard after login | Validate main layout |
| `dashboard-mobile.png` | 390x844 viewport | Mobile responsiveness |
| `dashboard-tablet.png` | 768x1024 viewport | Tablet responsiveness |
| `dashboard-desktop.png` | 1920x1080 viewport | Desktop layout |

## How to Generate Screenshots

```bash
# Run E2E tests to generate/update screenshots (Chromium only)
npm run qa:e2e:update-snapshots

# Screenshots are saved to: 03-Tests/snapshots/
```

## Using the UI Visual Validator Agent

In Claude Code, ask to validate screenshots:

```
Please use the ui-visual-validator agent to verify the login page screenshot
at 03-Tests/snapshots/05-login-healthcheck.spec.ts-chromium/login-page.png
looks correct and matches our design system.
```

The agent will:
1. Read the screenshot file
2. Analyze visual elements (layout, colors, spacing)
3. Report any issues or confirm the UI meets expectations

## Validation Checklist

When using the visual validator, check for:

- [ ] Correct color scheme (brand colors)
- [ ] Proper spacing and alignment
- [ ] Readable typography
- [ ] Responsive behavior at breakpoint
- [ ] No visual artifacts or clipping
- [ ] Consistent component styling

## CI Integration

Screenshots are automatically captured on test failure and uploaded as artifacts.
Access them from the GitHub Actions run to analyze failures.
