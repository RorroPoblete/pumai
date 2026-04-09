---
name: Design System - Premium Dark Theme
description: Design tokens and style guide for the Australian Dream project — dark theme with violet accents
type: project
---

**Core Design Tokens:**
- Background: #000000 (primary), #0a0a0a (secondary), #111111 (cards)
- Accent: #8B5CF6 (violet), #A78BFA (light violet)
- Text: #FFFFFF (primary), #A1A1AA (secondary/muted), #71717A (grey)
- Font: Inter or system sans-serif, weight 900 for h1, 800 for h2, 700 for h3
- Gradients: violet-based for hero, buttons, cards, text
- Effects: glassmorphism (blur 20px), glow (box-shadow violet), parallax, fade-in animations
- Border radius: 0.5-1.5rem
- Transitions: 0.3s ease (base), cubic-bezier for smooth

**Why:** Premium dark SaaS look with space/tech feel.

**How to apply:** Use CSS variables, Tailwind v4 @theme inline. Mobile-first responsive. Next.js Image for optimization.
