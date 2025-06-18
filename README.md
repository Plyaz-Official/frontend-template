# 🧱 Plyaz Frontend Template

Welcome to the Plyaz Frontend Template — a flexible, scalable foundation for building frontend applications at Plyaz. This template supports SSR, strict linting rules, shared configuration via `@plyaz/devtools`, and first-class support for CI/CD and modular architecture.

This template is ideal for creating:
- Landing pages
- Web applications
- Micro frontends
- Dashboard tools (e.g. backoffice portals)

---

## 🚀 Quick Start

### 🔁 Option 1: Use from GitHub Template

1. Go to the [`@plyaz/fe-template`](https://github.com/Plyaz-Official/frontend-template) repository.
2. Click **“Use this template”** on GitHub.
3. Choose your new repo name (e.g. `backoffice`, `landing`, `scout-hub`).
4. Clone your new repo and start building.

### 🖥 Option 2: Clone Manually

```bash
git clone https://github.com/Plyaz-Official/frontend-template.git @plyaz/backoffice
cd @plyaz/backoffice
pnpm install
pnpm dev
````

Then:

* Rename `"name"` in `package.json` to match your project (e.g. `"@plyaz/backoffice"`)
* Update metadata (README, CI/CD name, etc.)

---

## 📦 Included Packages

| Package                                                         | Purpose                                                               |
| --------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`next`](https://nextjs.org/)                                   | Core framework (SSR, routing, API routes)                             |
| [`react`](https://react.dev/)                                   | Frontend                                                              |
| [`@plyaz/devtools`](https://github.com/Plyaz-Official/devtools) | Shared dev configuration (linting, formatting, testing, CI templates) |

---

## 🧪 Scripts & Commands

```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "lint:fix": "next lint --fix",
  "test": "vitest",
  "format": "prettier --write './**/*.{js,ts,tsx,js,jsx,mjs,cjs}'",
  "format:check": "prettier --check './**/*.{js,ts,tsx,js,jsx,mjs,cjs}'",
  "type:check": "tsc --noEmit"
}
```

---

## 🛠 Dev Requirements

* [Node.js v22.4.0+](https://nodejs.org/)
* [pnpm v8+](https://pnpm.io/)
* [VSCode](https://code.visualstudio.com/) with recommended extensions
* [@plyaz/devtools](https://github.com/Plyaz-Official/devtools) for linting, formatting, and CI standards

---

## 📏 Conventions & Standards

This template is pre-configured to match Plyaz engineering standards:

* ✅ ESLint + Prettier from `@plyaz/devtools`
* ✅ TypeScript strict mode
* ✅ Vitest for unit testing
* ✅ GitHub Actions-ready CI/CD config (if required)
* ✅ Future-ready for Chromatic, Storybook, and e2e testing

---

## 📦 Publish/Refactor Guide

When initializing a new frontend repo:

* [ ] Rename `"name"` in `package.json` from `@plyaz/fe-template` → `@plyaz/{your-app}`
* [ ] Confirm project title, description, and Vercel name match repo
* [ ] Ensure `.npmrc` includes `@plyaz:registry=https://npm.pkg.github.com/`
* [ ] `pnpm install` to install modules:
  * `@plyaz/devtools` - Most important to run the app
* [ ] Confirm env setup (`.env.local`, etc.) is correct
* [ ] Set `GITHUB_TOKEN` in GitHub Secrets for CI usage

---

## 🧩 Shared Configuration

This repo uses all shared tooling from [`@plyaz/devtools`](https://github.com/Plyaz-Official/devtools). That includes:

* Base `tsconfig`, `.eslintrc`, `.prettierrc`, `next.config.ts`, `vitest.config.ts`, `vitest.setup.ts`
* GitHub Actions CI/CD templates
* Storybook + Chromatic preview config (if needed)

🟡 Always make sure you’re using the **latest `@plyaz/devtools` version**. If tooling changes, this repo should upgrade accordingly to stay aligned with the latest standards.

---

## 🌐 Deployment

By default, this template is Vercel-ready:

* Add your repo on Vercel
* Configure `main`, `dev`, or `staging` as deployment branches
* Set up environment variables in the Vercel dashboard

---

## 🤝 Contributing

When starting a new Plyaz frontend app, follow this template strictly to maintain consistency across teams. If changes are required, update this template for others to benefit.

For internal team standards, visit the [Plyaz Confluence Documentation](https://plyaz.atlassian.net/wiki/spaces/SD/overview).

---

## 🧠 License & Ownership

This repository is internal to the Plyaz platform. All components, utilities, and configs are governed by the Plyaz engineering guidelines.