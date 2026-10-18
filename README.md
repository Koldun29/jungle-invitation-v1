# youin · jungle invitation

Mobile-first dinosaur birthday invite for Corina, and the first theme package for [youin.lol](https://youin.lol). A host picks a theme, adds a child photo, a pet photo, and the party details, and gets a link.

The flagship party details are unchanged from the previous storybook: **25 May 1996**, **McDonalds Centru**, host line **Contact Vasile**, Corina turning **7**. No phone number was supplied, so WhatsApp stays off until a number is added.

## Architecture

```
app/                  Next.js routes: /, /i/[slug], /create, RSVP, calendar, create API
engine/               Theme-agnostic runtime
  runtime/            Stage, leaf wipe, desktop frame, scene chrome
  audio/              Synthesized jungle bed, roar, dig, hatch (starts on first tap)
  webgl/              Firefly and dust shader (raw WebGL, no three.js bundle)
  typography/         Split-letter stamps and word reveals
  input/              Footprints, haptics
  rsvp/               In-page RSVP, WhatsApp link, calendar, map
themes/dinosaur/      Scenes, copy, and art for this theme only
invites/              Typed invite schema, seed, formatting, host routing, store
lib/photos/           Sticker pipeline and optional AI Gateway stylisation
lib/jobs/             Photo job used by the create route
samples/corina/       Original photo inputs
public/invites/corina Cached sticker outputs plus the original photos
```

`middleware.ts` rewrites `{slug}.youin.lol` to `/i/{slug}`. `dino.youin.lol` and the apex stay on `/`, which renders the seeded Corina invite. New themes register a `ThemePackage` in `themes/registry.ts` (scenes, preload list, leaf art, experience component) without touching RSVP, audio, or storage.

The first scene is server-rendered with its images preloaded. Later scenes mount on the leaf wipe and the next scene’s images are fetched while the current one is on screen. Reveals finish in under a second. `prefers-reduced-motion` turns off the shader loop, footprints, letter stamps, and the leaf wipe.

## Photo pipeline

1. Sample inputs live in `samples/corina/` (`corina.jpg`, `cat.jpg`).
2. `scripts/process-sample-photos.py` runs OpenCV grab-cut, posterizes, and paints a cream sticker stroke. Outputs are cached at `public/invites/corina/stickers/` so requests never wait on a model.
3. Uploads from `/create` go through `lib/jobs/process-photos.ts` → `lib/photos/stylize.ts` (sharp, corner flood-fill, posterize, sticker stroke) inside the create request. The same function is the worker a queue can call later.
4. If `AI_GATEWAY_API_KEY` and `AI_GATEWAY_IMAGE_MODEL` are set, the job can ask the Vercel AI Gateway for an illustrated variant and cache that instead.
5. If a cut-out is uncertain, the scene keeps the painted illustrations.

## RSVP

The party scene has:

- a tappable map link (explicit `mapUrl`, or a Google Maps search for the venue)
- an `.ics` download and a Google Calendar link
- a one-tap WhatsApp button when `whatsappNumber` is set: `https://wa.me/<digits>?text=...` including the guest name, adults, and kids
- an in-page form (name, attending, adults, kids, note) posted to `POST /api/rsvp`

Storage, in order:

1. **Upstash Redis** when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
2. else **Neon** when `DATABASE_URL` is set (tables are created on first write)
3. else in-memory on that instance, plus `/tmp` when the filesystem allows it

Without a database the form still accepts the RSVP and says it was kept for the session. Created invites are also stored in `sessionStorage` so the link opens in the same browser.

## Local development

```bash
npm install
npm test
npm run dev
```

Open `/` for Corina, `/i/corina` for the same invite, `/create` for the host stub.

## Environment

Copy `.env.example`. Nothing is required for the seeded invite, the story, or a session RSVP.

| Variable | Purpose |
| --- | --- |
| `INVITE_ROOT_DOMAIN` | Defaults to `youin.lol`. Used by middleware and the host shown after create. |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL from the Vercel Marketplace integration. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash token. |
| `DATABASE_URL` | Neon connection string, used only if Upstash is unset. |
| `AI_GATEWAY_API_KEY` | Optional. Enables the image stylisation hook. |
| `AI_GATEWAY_IMAGE_MODEL` | Optional. Model id from `GET https://ai-gateway.vercel.sh/v1/models`. |

Marketplace setup from the project:

```bash
vercel integration add upstash
# or, instead of Upstash:
vercel integration add neon
```

## Wildcard subdomains on youin.lol

1. In the Vercel project **jungle-invitation-v1**, add the domain `*.youin.lol` (and keep `dino.youin.lol` on `main` for production).
2. At the DNS host for `youin.lol`, add a `CNAME` for `*` to `cname.vercel-dns.com`. If the DNS host cannot wildcard a CNAME, add one record per invite slug (`corina` → `cname.vercel-dns.com`).
3. `dino` is reserved by middleware so `dino.youin.lol` keeps serving the flagship at `/`. `corina.youin.lol` rewrites to `/i/corina`.
4. Preview deployments use their `*.vercel.app` host, so test those at `/` and `/i/corina`. The wildcard only applies on `youin.lol`.

Do not point production `main` at an unreviewed branch. This repo’s preview is the pull request deployment.
