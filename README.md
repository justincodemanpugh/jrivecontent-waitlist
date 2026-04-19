# JriveContent — Waitlist Landing Page

A Next.js + TailwindCSS waitlist landing page for **JriveContent**, a platform connecting small brands/startups with affordable UGC creators.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stack

- **Next.js 14** (App Router)
- **TailwindCSS** for styling
- **lucide-react** for icons
- **Youform** (embedded) for waitlist signups

## Project Structure

```
app/
  layout.js        # Root layout + fonts + metadata
  page.js          # Home page (imports all sections)
  globals.css      # Tailwind + global styles
components/
  Navbar.js
  Hero.js          # Headline + waitlist form (Youform embed)
  PainPoints.js    # Carousel of pain points
  HowItWorks.js    # 4-step explainer + CTA
  Footer.js
public/
  logo.svg         # Brand logo (replace with your real one)
```

## Customizing

- **Copy/text**: edit the relevant component in `components/`
- **Colors**: tweak `brand.*` tokens in `tailwind.config.js`
- **Logo**: replace `public/logo.svg` with your actual logo file
- **Waitlist form**: update the `src` URL in `components/Hero.js` (currently points to your Youform)
- **Pain points**: edit the `PAIN_POINTS` array in `components/PainPoints.js`

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
3. Click **Import Project** → select this repo → **Deploy**.
4. Done. You'll get a free `*.vercel.app` URL.

## Notes

- The `@tailwind` warnings in `globals.css` are harmless — your IDE's CSS linter doesn't understand Tailwind directives, but Tailwind processes them at build time.
- The logo in `public/logo.svg` is a placeholder approximation of the "J" mark you provided. Replace it with your real asset when ready.
