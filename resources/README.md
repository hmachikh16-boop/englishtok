# Lin Go app artwork

The launcher icon and splash screens are generated from the SVG files in this
folder:

- `app-icon.svg` — rounded-square launcher icon.
- `app-icon-round.svg` — circular legacy launcher icon.
- `app-icon-foreground.svg` — transparent open-book foreground for adaptive icons.
- `app-icon-monochrome.svg` — Android 13 themed-icon artwork.

Regenerate every Android density, splash screen, and web icon with:

```bash
npm run icons:generate
```

Edit the SVGs rather than the generated PNG files so the artwork stays sharp at
every screen density.
