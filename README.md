# Merry Christmas · A Wish in Light

An interactive 3D Christmas experience built with React, TypeScript, Three.js,
React Three Fiber and MediaPipe.

## Local development

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite.

## Production build

```bash
pnpm build
```

The deployable static site is written to `dist/`.

## GitHub Pages

1. Create an empty GitHub repository.
2. Push this project to its `main` branch.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **GitHub Actions**.
5. Open the **Actions** tab and wait for `Deploy to GitHub Pages` to complete.

The published URL will look like:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

The included Pages workflow builds and publishes the site on every push to
`main`. Relative build paths are configured for project repositories.

## Other hosting

The production folder can also be deployed to Netlify or Vercel. Camera access
requires HTTPS outside localhost.
