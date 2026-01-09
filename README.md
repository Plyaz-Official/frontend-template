# Plyaz Frontend Template

Frontend template for building applications with the Plyaz ecosystem. Provides a pre-configured Next.js application with `@plyaz/core`, `@plyaz/store`, and other Plyaz packages integrated out of the box.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment file and configure
cp .env.example .env

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) - this app is for **local development only**.

## What This Editor Does

This app provides a visual interface to create and edit:

### Storage Templates
- **Documents**: PDF, DOCX, Excel generation (invoices, receipts, reports, tax documents)
- **Runtime Templates**: Markdown/HTML templates with Handlebars syntax
- **Reusable Components**: YAML-defined building blocks (headers, footers, tables, cards, signatures, etc.)
- **Layouts**: Headers, footers, and wrappers for consistent document styling

### Notification Templates
- **Email**: HTML/Markdown transactional and marketing emails
- **SMS**: Text message templates
- **Push Notifications**: In-app notification templates
- **Layouts**: Channel-specific headers and footers

## Core Features Demo

Visit **[http://localhost:3000/en/example](http://localhost:3000/en/example)** for a comprehensive demonstration of all Plyaz Core features:

### What the Example Page Demonstrates

| Feature | Description |
|---------|-------------|
| **Storage API** | Upload files (single/bulk), download, signed URLs, delete |
| **Document Generation** | Generate PDF/DOCX/Excel from templates with live preview |
| **Notifications** | Email sending, in-app notifications, SMS templates |
| **Streaming (SSE)** | Real-time upload/download progress via Server-Sent Events |
| **Error Handling** | Validation errors, error store, error boundaries |
| **Event System** | Service events, global events, event subscriptions |
| **Store Integration** | Files store, notifications store, error store, feature flags |
| **Progress Tracking** | Upload/download progress bars with speed metrics |
| **Service Lifecycle** | Health checks, polling, service registration |

### API Endpoints Tested

```
# Examples (CRUD)
GET/POST    /api/examples
GET/PATCH/DELETE /api/examples/:id
POST/DELETE /api/examples/bulk

# Files (Storage)
POST        /api/upload
POST        /api/upload/bulk
GET         /api/files
GET/DELETE  /api/files/:id
GET         /api/files/:id/download
GET         /api/files/:id/signed-url
POST        /api/generate-document

# Notifications
GET         /api/notifications
DELETE      /api/notifications/:id
POST        /api/examples/email

# Streaming
GET         /api/events/stream (SSE)

# Error Demos
GET         /api/examples/errors/single
GET         /api/examples/errors/array
```

### Hooks Demonstrated

```typescript
// File operations
useFileUpload(), useFileDownload(), useFile(), useFileDelete()
useAllFileProgress(), useUploadProgress(), useDownloadProgress()

// Streaming
useStreamConnected(), useStreamMessages(), useStreamConnectionId()

// Stores
useFilesStore(), useNotificationsStore(), useErrors(), useFeatureFlags()

// Core
usePlyaz(), usePlyazReady(), useService(), useEvents()
```

## Template Locations

Templates are written directly to the linked packages:

| Package | Path | Content |
|---------|------|---------|
| `@plyaz/storage` | `../Packages/storage/templates/` | Document templates by locale |
| `@plyaz/storage` | `../Packages/storage/cli-templates/` | Components, layouts, configs |
| `@plyaz/notifications` | `../Packages/notifications/templates/` | Email, SMS, push templates |

## Template Format

All templates use:
- **YAML frontmatter** for metadata (name, category, locale, layout, outputFormat)
- **Handlebars templating**: `{{variable}}`, `{{#each items}}`, `{{#if condition}}`
- **Built-in helpers**: `{{formatCurrency amount}}`, `{{formatDate date}}`, `{{multiply a b}}`

### Example Storage Template
```markdown
---
name: standard-invoice
title: Invoice
category: invoices
locale: en
layout: invoice
outputFormat: pdf
---

## Bill To
**{{customerName}}**
{{customerAddress}}

## Items
| Description | Qty | Price |
|-------------|-----|-------|
{{#each items}}
| {{description}} | {{quantity}} | {{formatCurrency unitPrice}} |
{{/each}}
```

### Example Notification Template
```markdown
---
subject: "Order #{{orderNumber}} Confirmed"
category: transactional
channel: email
layout: transactional
---

Hi **{{customerName}}**,

Your order has been confirmed!

{{#each items}}
- {{name}} x{{quantity}}
{{/each}}
```

## Architecture

This app uses `@plyaz/core` as the central orchestrator, following standard Plyaz architecture patterns.

### Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Backend | Next.js API routes | NestJS microservice |
| API Base | `/api` | External URL |
| Streaming | `/api/events/stream` | External SSE endpoint |

In production, Plyaz apps connect to a **NestJS backend microservice** - the frontend configuration simply points to the external API URL.

### Key Dependencies
- `@plyaz/core` - Core provider, services, streaming
- `@plyaz/store` - Zustand state management and hooks
- `@plyaz/storage` (linked) - Document generation engine
- `@plyaz/notifications` (linked) - Notification template engine
- `@plyaz/ui` - UI component library
- `@plyaz/types` - Shared TypeScript types
- `@plyaz/errors` - Error handling utilities

### Configuration Files

```
src/config/
├── env.ts              # Environment variables
├── plyaz.shared.ts     # Shared config (frontend + backend)
├── plyaz.frontend.ts   # Client-only config
└── plyaz.backend.ts    # Server-only config (Next.js API routes)
```

## Scripts

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
pnpm type:check   # TypeScript checking
pnpm format       # Format with Prettier
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required for storage
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=

# Or Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Required for notifications
INFOBIP_API_KEY=
INFOBIP_BASE_URL=
FROM_EMAIL=
FROM_NAME=

# Or SendGrid
SENDGRID_API_KEY=

# Optional
DATABASE_URL=
REDIS_URL=
ENCRYPTION_KEY=
```

## Requirements

- Node.js >= 22.4.0
- pnpm >= 8.0.0
- Linked packages: `@plyaz/storage`, `@plyaz/notifications`

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation including:
- Domain services pattern
- API route patterns
- Streaming architecture
- Store integration
- Production deployment
