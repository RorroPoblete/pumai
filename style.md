# Vambe.ai - Guía Completa de Estilos y Diseño

## 🎨 PALETA DE COLORES

### Colores Primarios
```css
/* Fondo Principal - Negro/Oscuro */
--bg-primary: #000000;
--bg-secondary: #0a0a0a;
--bg-card: #111111;

/* Acentos - Morado/Violeta Neón */
--accent-primary: #8B5CF6; /* Violeta */
--accent-secondary: #A78BFA; /* Violeta claro */
--accent-glow: rgba(139, 92, 246, 0.3);

/* Texto */
--text-primary: #FFFFFF;
--text-secondary: #A1A1AA; /* Gris claro */
--text-muted: #71717A; /* Gris medio */
```

### Gradientes
```css
/* Gradiente Hero */
background: linear-gradient(180deg, #000000 0%, #1a0033 50%, #000000 100%);

/* Gradiente de Cards */
background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%);

/* Gradiente de Botones */
background: linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%);

/* Glow Effect */
box-shadow: 0 0 40px rgba(139, 92, 246, 0.4);
```

## 📝 TIPOGRAFÍA

```css
/* Font Family - Probablemente usando Inter o similar */
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
--font-display: 'Inter', sans-serif;

/* Tamaños Hero */
--h1-size: clamp(3rem, 8vw, 6rem); /* 48px - 96px */
--h1-weight: 900;
--h1-line-height: 1.1;
--h1-letter-spacing: -0.04em;

/* Tamaños Secciones */
--h2-size: clamp(2rem, 5vw, 3.5rem); /* 32px - 56px */
--h2-weight: 800;
--h2-line-height: 1.2;

--h3-size: clamp(1.5rem, 3vw, 2rem); /* 24px - 32px */
--h3-weight: 700;

/* Cuerpo de texto */
--body-size: 1.125rem; /* 18px */
--body-weight: 400;
--body-line-height: 1.7;

/* Pequeño/Caption */
--small-size: 0.875rem; /* 14px */
```

## 🏗️ ESTRUCTURA Y LAYOUT

### Container Principal
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}
```

### Espaciado Sistema
```css
--spacing-xs: 0.5rem;   /* 8px */
--spacing-sm: 1rem;     /* 16px */
--spacing-md: 1.5rem;   /* 24px */
--spacing-lg: 2rem;     /* 32px */
--spacing-xl: 3rem;     /* 48px */
--spacing-2xl: 4rem;    /* 64px */
--spacing-3xl: 6rem;    /* 96px */
--spacing-4xl: 8rem;    /* 128px */
```

## 🎭 COMPONENTES PRINCIPALES

### 1. Hero Section
```css
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #1a0033 0%, #000000 70%);
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 900px;
  padding: 2rem;
}

.hero-title {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.1;
  background: linear-gradient(180deg, #FFFFFF 0%, #A78BFA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #A1A1AA;
  max-width: 700px;
  margin: 0 auto 2rem;
  line-height: 1.7;
}
```

### 2. Botones CTA
```css
.btn-primary {
  background: linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%);
  color: white;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1.125rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.6);
}

.btn-secondary {
  background: transparent;
  color: white;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1.125rem;
  border: 2px solid rgba(139, 92, 246, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: #8B5CF6;
  background: rgba(139, 92, 246, 0.1);
}
```

### 3. Cards de Producto
```css
.product-card {
  background: linear-gradient(135deg, rgba(17, 17, 17, 0.8) 0%, rgba(10, 10, 10, 0.9) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 1.5rem;
  padding: 2.5rem;
  backdrop-filter: blur(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-card:hover {
  transform: translateY(-8px);
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);
}

.product-card-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1.5rem;
}

.product-card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.product-card-description {
  color: #A1A1AA;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}
```

### 4. Logo Carousel
```css
.logo-carousel {
  overflow: hidden;
  position: relative;
  padding: 3rem 0;
  background: linear-gradient(90deg, transparent 0%, rgba(10, 10, 10, 0.5) 50%, transparent 100%);
}

.logo-track {
  display: flex;
  gap: 3rem;
  animation: scroll 30s linear infinite;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.logo-item {
  flex-shrink: 0;
  width: 150px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: grayscale(100%) brightness(0.7);
  transition: all 0.3s ease;
}

.logo-item:hover {
  filter: grayscale(0%) brightness(1);
}
```

### 5. Navbar
```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.navbar-container {
  max-width: 1536px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-logo {
  height: 2rem;
}

.navbar-menu {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.navbar-link {
  color: #A1A1AA;
  font-weight: 500;
  transition: color 0.3s ease;
}

.navbar-link:hover {
  color: white;
}
```

## ✨ EFECTOS Y ANIMACIONES

### Glassmorphism
```css
.glass {
  background: rgba(17, 17, 17, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
}
```

### Glow Effect
```css
.glow {
  position: relative;
}

.glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #8B5CF6, #A78BFA, #8B5CF6);
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: blur(20px);
  z-index: -1;
}

.glow:hover::before {
  opacity: 0.7;
}
```

### Fade In Animations
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.fade-in-delay-1 {
  animation-delay: 0.2s;
}

.fade-in-delay-2 {
  animation-delay: 0.4s;
}
```

### Parallax Effect
```css
.parallax-layer {
  position: absolute;
  inset: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Aplicar con JavaScript */
.parallax-layer-1 {
  transform: translateY(calc(var(--scroll) * 0.1px));
}

.parallax-layer-2 {
  transform: translateY(calc(var(--scroll) * 0.3px));
}
```

## 📊 SECCIÓN DE MÉTRICAS

```css
.metrics-section {
  padding: 6rem 0;
  background: linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 3rem;
  margin-top: 4rem;
}

.metric-card {
  text-align: center;
  padding: 2rem;
}

.metric-number {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 1rem;
}

.metric-label {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.metric-description {
  color: #A1A1AA;
  font-size: 0.95rem;
}
```

## 🖼️ IMÁGENES Y MEDIA

### Optimización de Imágenes Next.js
```jsx
// Usando Next.js Image component
<Image
  src="/hero_nxg/001_BKG.png"
  width={2048}
  height={1024}
  quality={90}
  priority
  alt="Background"
/>
```

### Efectos de Imagen
```css
.hero-image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
  mix-blend-mode: screen;
}

.floating-image {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
```

## 📱 RESPONSIVE BREAKPOINTS

```css
/* Mobile First Approach */

/* Extra Small - Mobile */
@media (min-width: 0px) {
  .hero-title {
    font-size: 3rem;
  }
}

/* Small - Tablets */
@media (min-width: 640px) {
  .hero-title {
    font-size: 4rem;
  }
}

/* Medium - Tablets Landscape */
@media (min-width: 768px) {
  .hero-title {
    font-size: 5rem;
  }
}

/* Large - Desktop */
@media (min-width: 1024px) {
  .hero-title {
    font-size: 6rem;
  }
}

/* Extra Large - Large Desktop */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}

/* 2XL - Ultra Wide */
@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}
```

## 🎯 PATRONES DE DISEÑO CLAVE

### 1. Dark Mode Premium
- Fondo negro profundo (#000000)
- Uso extensivo de transparencias
- Bordes sutiles con alpha
- Glows y halos morados

### 2. Espacial/Tech Aesthetic
- Backgrounds de galaxias/espacio
- Efectos de profundidad con layers
- Parallax scrolling
- Partículas o estrellas animadas

### 3. Gradientes Modernos
- Violeta a violeta claro
- Transparencias en overlays
- Text gradients para énfasis
- Glow effects en hover

### 4. Micro-interacciones
- Hover elevations (translateY)
- Smooth transitions (0.3s - 0.4s)
- Cubic bezier timing functions
- Scale y glow en hover

## 🔧 UTILIDADES TAILWIND (Si usas Tailwind)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#8B5CF6',
          600: '#7c3aed',
          900: '#4c1d95',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': 'linear-gradient(180deg, #000000 0%, #1a0033 50%, #000000 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'scroll': 'scroll 30s linear infinite',
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
}
```

## 🎨 CSS VARIABLES COMPLETAS

```css
:root {
  /* Colores */
  --color-bg-primary: #000000;
  --color-bg-secondary: #0a0a0a;
  --color-accent: #8B5CF6;
  --color-accent-light: #A78BFA;
  --color-text: #FFFFFF;
  --color-text-muted: #A1A1AA;
  
  /* Espaciado */
  --spacing-unit: 0.25rem;
  --spacing-xs: calc(var(--spacing-unit) * 2);
  --spacing-sm: calc(var(--spacing-unit) * 4);
  --spacing-md: calc(var(--spacing-unit) * 6);
  --spacing-lg: calc(var(--spacing-unit) * 8);
  --spacing-xl: calc(var(--spacing-unit) * 12);
  
  /* Border Radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md: 0 4px 20px rgba(139, 92, 246, 0.4);
  --shadow-lg: 0 20px 60px rgba(139, 92, 246, 0.3);
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-base: 0.3s ease;
  --transition-slow: 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Configurar paleta de colores dark con morado
- [ ] Implementar tipografía Inter o similar
- [ ] Crear sistema de spacing consistente
- [ ] Implementar componentes de botón con gradientes
- [ ] Añadir efectos de glassmorphism
- [ ] Configurar animaciones de scroll
- [ ] Implementar carousel de logos
- [ ] Añadir efectos de hover con glow
- [ ] Configurar parallax en hero
- [ ] Implementar responsive breakpoints
- [ ] Añadir backdrop blur effects
- [ ] Configurar transiciones suaves
- [ ] Implementar text gradients
- [ ] Añadir micro-interacciones

## 🚀 TIPS DE RENDIMIENTO

1. **Usar Next.js Image** para optimización automática
2. **Lazy loading** en imágenes fuera del viewport
3. **CSS-in-JS** o **CSS Modules** para scope
4. **Prefetch** en links importantes
5. **Debounce** en efectos de scroll
6. **Transform** en lugar de position para animaciones
7. **Will-change** para optimizar animaciones pesadas

---

**Nota**: Este diseño usa mucho:
- Gradientes morados (#8B5CF6, #A78BFA)
- Fondos negros profundos
- Transparencias y blur
- Animaciones suaves
- Efectos de glow
- Parallax scrolling
- Glassmorphism
