# Munger Nagar Nigam — Citizen Services Portal

Next.js 15 (App Router) + React + Tailwind CSS v4 landing page for the
Munger Municipal Corporation citizen services portal.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Wiring up the Property Tax link

The "Pay Property Tax" buttons point to `lib/config.ts`'s
`PROPERTY_TAX_URL`, which reads `NEXT_PUBLIC_PROPERTY_TAX_URL`.

1. Copy `.env.local.example` to `.env.local`.
2. Set `NEXT_PUBLIC_PROPERTY_TAX_URL` to your deployed Apps Script web
   app URL (Code.gs / Index.html), e.g.
   `https://script.google.com/macros/s/AKfycb.../exec`.

## Editing placeholder content

- `components/contact.tsx` — office address, phone, email (highlighted
  in yellow) are placeholders.
- `lib/config.ts` — service list, stats, and the tax URL fallback.

## Structure

```
app/            # App Router pages, layout, global styles
components/     # Header, hero, stats, about, services, contact, footer
lib/config.ts   # Editable content: services, stats, tax URL
```
