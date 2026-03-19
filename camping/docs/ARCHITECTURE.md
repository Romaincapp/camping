# Architecture technique

## Fichiers principaux

### index.html (834 lignes)

**Sections :**
- `<head>` : Meta tags SEO, Open Graph, Twitter Cards, Schema.org
- Hero section avec animations flottantes
- Badge Campspace (4.93/5)
- Galerie Swiper (12+ images)
- 4 cartes de caractéristiques
- Section stages de survie
- Calendrier de réservation
- Footer

**Points d'attention :**
- IDs Analytics/AdSense hardcodés
- Schema.org type Campground
- Scripts en fin de body
- Images avec `loading="lazy"`

### main.js (431 lignes)

```javascript
// Animations GSAP
gsap.to('.floating-element', {...})
gsap.from('.fade-in', {...})

// ScrollTrigger
ScrollTrigger.create({
    trigger: '.feature-card',
    start: 'top 80%',
    onEnter: () => {...}
})

// Swiper Carousel
const swiper = new Swiper('.gallery-swiper', {
    slidesPerView: 'auto',
    spaceBetween: 20,
    loop: true
})

// GLightbox
const lightbox = GLightbox({ selector: '.gallery-item' })
```

Breakpoints responsive : 640px, 768px, 1024px, 1440px

### css.css (387 lignes)

```css
:root {
    --primary-color: #2c5f2d;
    --secondary-color: #f4a460;
    --text-color: #333;
}
```

- Design mobile-first
- Tailwind CSS en complément
- Variables CSS pour cohérence

## Animations GSAP

**Hero floating :**
```javascript
gsap.to('.floating', {
    y: -20, duration: 2, repeat: -1, yoyo: true, ease: 'power1.inOut'
})
```

**Fade in au scroll :**
```javascript
gsap.from('.fade-in', {
    scrollTrigger: { trigger: '.fade-in', start: 'top 80%' },
    opacity: 0, y: 50, duration: 1
})
```

## SEO

```html
<title>Camping Privatif du Wignet - Olloy-sur-Viroin | Réservation</title>
<meta property="og:url" content="https://campingduwignet.com">
<script type="application/ld+json">
{
    "@type": "Campground",
    "name": "Camping du Wignet",
    "aggregateRating": { "ratingValue": "4.93", "reviewCount": "81" }
}
</script>
```

## Performances

- **Images :** Lazy loading, preload hero
- **Scripts :** Async, fin de body
- **API :** Timeout 5s, fallback data
