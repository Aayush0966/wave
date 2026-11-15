# wave

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Self, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **tRPC** - End-to-end type-safe APIs
- **Prisma** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system
- **Starlight** - Documentation site with Astro
- **Biome** - Linting and formatting
- **Husky** - Git hooks for code quality

## Getting Started

First, install the dependencies:

```bash
pnpm install
```
## Database Setup

This project uses PostgreSQL with Prisma.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/web/.env` file with your PostgreSQL connection details.

3. Generate the Prisma client and push the schema:
```bash
pnpm db:push
```


Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see your fullstack application.
Use the Expo Go app to run the mobile application.







## Project Structure

```
wave/
├── apps/
│   └── web/         # Fullstack application (Next.js)
│   ├── native/      # Mobile application (React Native, Expo)
│   ├── docs/        # Documentation site (Astro Starlight)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm dev:native`: Start the React Native/Expo development server
- `pnpm db:push`: Push schema changes to database
- `pnpm db:studio`: Open database studio UI
- `pnpm check`: Run Biome formatting and linting
- `cd apps/docs && pnpm dev`: Start documentation site
- `cd apps/docs && pnpm build`: Build documentation site

## Chat features

The web chat supports text, image/video attachments, reactions, read receipts, unread counts, replies, message edits, search, unsend, and delete-for-me. The mobile layout switches between the conversation list and the selected chat. Searching a user opens the conversation automatically.

Realtime events use authenticated Pusher presence channels (`presence-chat-<chatId>`), with a separate private channel for each user's sidebar and personal deletion updates. Chat reads, receipts, typing updates, and channel authorization all check membership. Presence and expiring typing indicators need no Pusher client-event setting.

Open conversations catch up after subscription/reconnection, browser focus, and network recovery, with a periodic fallback. Catch-up refreshes loaded messages as well as missed messages, edits, reactions, receipts, and personal deletions. Live events are buffered during snapshots. Failed receipts retry with backoff; text and media retries reuse a sender-scoped idempotency key.

New messages show in-app notifications. Desktop notifications are opt-in from the chat sidebar and require browser permission and an open app tab. These are browser notifications, not push delivery to a closed browser.

### Database update

Run `pnpm --filter @wave/db exec prisma migrate deploy` and `pnpm db:generate` when deploying. Migration `20261114000100_chat_reliability` adds nullable reply references, edit timestamps, sender-scoped client message identifiers, and a timeline index. Existing messages remain valid.

### Persistent media storage

JPEG, PNG, GIF, WebP, MP4, and WebM files up to 25 MB are supported, with optional captions. Downloads require chat membership; videos support byte ranges for seeking.

Development defaults to `apps/web/.chat-media` when starting the web workspace. **Production requires `MEDIA_STORAGE_DIR`**, an absolute path to a persistent, writable volume owned by the web server's user. All server instances must share that volume. Configure the reverse proxy to allow requests up to 26 MB. Ephemeral serverless filesystems are not suitable for this storage backend.

A Compose volume override is provided at `deploy/compose.media.yaml`; merge it with your deployment's existing web service definition. It mounts `chat-media` at `/var/lib/wave/chat-media` and sets the environment variable. Provision volume permissions for your container's runtime UID before starting the service. Keep the volume across releases and include it in backups.

Unsend clears message content, reactions, and attachment records, blocks future downloads, and removes the uploaded files immediately. Delete-for-me only hides the message for that participant. Previously downloaded copies cannot be recalled.

A sweep on uploads, at most hourly per server process, removes unreferenced media older than 24 hours. The grace period protects in-progress uploads. Run cleanup independently during low-upload periods using the same storage directory:

```sh
MEDIA_STORAGE_DIR=/var/lib/wave/chat-media pnpm media:cleanup --dry-run
MEDIA_STORAGE_DIR=/var/lib/wave/chat-media pnpm media:cleanup
```

You can schedule the second command using your deployment's job scheduler. Referenced files and files younger than 24 hours are preserved.

### Build verification

```sh
pnpm exec tsc --noEmit -p apps/web/tsconfig.json
pnpm --filter web build
```
