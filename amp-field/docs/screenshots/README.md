# AMP Field shell screenshots

Captured from the exported `staging` web build of the same bundle that ships to
iOS and Android, at 390×844 (iPhone 14 width) with a 2× device pixel ratio.
These are real rendered components, not mockups. The capture run reported zero
console errors.

Regenerate after a UI change:

```bash
APP_ENV=staging npx expo export --platform web --clear --output-dir dist-web
# then serve dist-web and screenshot /sign-in and /does-not-exist at 390×844
```

| File                         | State                                                                      |
| ---------------------------- | -------------------------------------------------------------------------- |
| `01-sign-in.png`             | Sign in — branding, environment ribbon, provisioning notice                |
| `02-sign-in-validation.png`  | Sign in — per-field validation, announced to screen readers                |
| `03-sign-in-notice.png`      | Sign in — honest report that authentication is not connected in this build |
| `04-forgot-password.png`     | Password recovery notice                                                   |
| `05-not-found.png`           | Recoverable error state with a route back                                  |
| `06-fatal-configuration.png` | Fatal configuration error listing the exact missing settings               |
