# Pranav Shukla — Cinematic Video Editing & Thumbnail Portfolio

A world-class, 10-year durable portfolio website engineered for **Pranav Shukla**, high-retention video editor and thumbnail designer based in India.

Built with an intentional **Cinema Studio Aesthetic** using pure vanilla web technologies—zero bloated frameworks, zero build steps, zero third-party tracking, and zero AI-slop tropes.

---

## ✦ Architectural Philosophy

- **10-Year Durability**: Pure HTML5, modern CSS custom properties, and Vanilla ES6 modules. No npm build dependencies to rot, break, or patch over time.
- **Discussion-First Pricing**: No rigid pricing tiers or public numbers. Clients collaborate on tailored scopes based on channel cadence, narrative depth, and editing complexity.
- **Privacy & Compliance First**: 100% compliant with India's Digital Personal Data Protection (DPDP) Act 2023 and GDPR. Zero third-party tracking cookies or external analytics pixels.
- **Stealth Zero-Loophole Admin Vault**: Client-side Web Crypto API with salted SHA-256 hash authentication, 5-strike brute-force lockout, and transient session memory.
- **Accessible & High-Performance**: WCAG AA contrast compliance in dark and light modes, keyboard-trapped modal dialogs, and full `prefers-reduced-motion` support.

---

## ✦ Features & Engineering Highlights

### 1. Visual Craftsmanship & Micro-Interactions
- **Emil Kowalski Physics**: Custom cubic-bezier timing curves (`--ease-out`, `--ease-drawer`, `--spring-snap`) and tactile button press feedback (`transform: scale(0.97)`).
- **Cinematic Story Studio & Retention Hook Simulator**: Interactive scrubber illustrating audience retention comparison between amateur pacing vs. high-retention pattern interrupts, coupled with a 49-bar SVG waveform visualizer.
- **Studio Amber Cinema Palette**: Deep Onyx (`#0b0c10`), Film Slate neutrals, and Studio Amber (`#e5a93c`) accents. Zero purple gradients, glowing orbs, or emoji icons.

### 2. Multi-Aspect Ratio Lightbox Modal
- Seamlessly plays 16:9 widescreen YouTube documentaries and 9:16 vertical YouTube Shorts / Instagram Reels in responsive, viewport-constrained viewports without audio leaks on close.
- Full keyboard trapping with accessible `Escape` key dismissal and focus restoration.

### 3. Frictionless Client Communication
- **1-Click Copy**: Instant clipboard copy of `pranav.uknow@gmail.com` with accessible toast notifications.
- **Direct Dispatch**: Automated Gmail Web Compose and client mailto launchers.
- **Instagram DM Channel**: Direct verified link to `@pranav.uknow`.
- **Zero Phone Calls**: Complete removal of phone/WhatsApp numbers to protect creator focus and privacy.

### 4. Zero-Loophole Admin Control Room (`admin.html`)
- **Stealth Access**:
  - Hotkey: Press `Ctrl + Shift + A` on any page.
  - Secret Click: Triple-click the copyright year (`© 2026`) in the footer.
- **Cryptographic Security**: Pre-hashed salted SHA-256 validation via Web Crypto API. Zero plaintext credentials in source code.
- **Brute-Force Shield**: Enforces a 15-minute freeze on 5 consecutive invalid passphrase attempts.
- **Privacy-Preserving Telemetry (`analytics.js`)**: Locally aggregates anonymized page views, unique sessions, referral sources (YouTube, Instagram, LinkedIn, Google, Direct), and inquiry clicks into `localStorage` with CSV/JSON export capability.

### 5. Comprehensive Legal Suite
- [privacy-policy.html](privacy-policy.html) — Explicit DPDP Act 2023 & GDPR disclosures.
- [terms.html](terms.html) — Professional creative service agreement, turnaround windows, and IP ownership.
- [cookie-policy.html](cookie-policy.html) — Zero-cookie verification and local storage transparency.
- [refund-policy.html](refund-policy.html) — Clear custom creative services deposit & revision policies.

---

## ✦ File Structure

```text
pranav-portfolio/
├── index.html              # Main homepage with simulator, reel showcase & inquiry engine
├── work.html               # Extended archive of client video projects & thumbnails
├── admin.html              # Stealth Admin Control Room & private analytics dashboard
├── 404.html                # Bespoke 404 "Lost in the Timeline" error page
├── privacy-policy.html     # Legal: Privacy policy (DPDP Act 2023)
├── terms.html              # Legal: Terms of Service
├── cookie-policy.html      # Legal: Cookie policy
├── refund-policy.html      # Legal: Refund & revision policy
├── _headers                # Production security headers (CSP, HSTS, X-Frame-Options)
├── robots.txt              # Search engine directives (admin room disallowed)
├── sitemap.xml             # Search engine index sitemap
├── manifest.webmanifest    # Progressive Web App manifest
├── LICENSE                 # MIT License
├── README.md               # Documentation & setup guide
├── test-site.js            # Automated structural & accessibility test suite (100 checks)
├── test-runtime.js         # Headless DOM runtime simulation test suite (15 checks)
├── test-security.js        # Cryptography, CSP & admin security test suite (40 checks)
├── test-pre-public-audit.js# 4-Agent pre-public launch simulation suite (30 checks)
└── assets/
    ├── favicon.svg         # Studio lens aperture SVG favicon
    ├── og-image.jpg        # Open Graph social preview card (1200x630)
    ├── css/
    │   ├── main.css        # Core design system, cinema tokens, and animations
    │   ├── work.css        # Work archive layout
    │   ├── legal.css       # Clean editorial typography for legal documents
    │   └── admin.css       # Stealth dark studio aesthetic for admin vault
    └── js/
        ├── main.js         # Theme, nav, filter, modal, estimator, and form controllers
        ├── analytics.js    # Privacy-first client-side analytics vault
        └── admin.js        # Salted SHA-256 auth, brute-force shield & dashboard engine
```

---

## ✦ Local Development & Verification

No build tools or package managers required. Simply run the automated test suites using Node.js:

```bash
# Run all test suites
node test-site.js
node test-runtime.js
node test-security.js
node test-pre-public-audit.js

# Preview locally in your browser
python -m http.server 8080
# Or using Node:
npx serve .
```

---

## ✦ Deployment Guide

This site is 100% static and can be deployed anywhere with zero configuration:

### GitHub Pages
1. Push repository to GitHub.
2. In your repository settings, go to **Settings > Pages**.
3. Under **Build and deployment > Branch**, select `main` / `root` and click **Save**.
4. If using a custom domain (`pranavshukla.in`), add it under **Custom domain** and enforce HTTPS.

### Cloudflare Pages / Vercel / Netlify
1. Connect your GitHub repository.
2. Build command: *(leave empty)*.
3. Output directory: `.` *(root)*.
4. The included `_headers` file will automatically configure production Content Security Policies and HTTP headers.

---

## ✦ Creator Contact

- **Email**: [pranav.uknow@gmail.com](mailto:pranav.uknow@gmail.com)
- **Instagram**: [@pranav.uknow](https://instagram.com/pranav.uknow)
- **YouTube**: [@pranavuknow](https://youtube.com/@pranavuknow)

---

## ✦ License

Code and templates released under the [MIT License](LICENSE).  
Content, client media, and branding © 2026 Pranav Shukla. All rights reserved.
