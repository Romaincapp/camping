// Fonctions utilitaires qui peuvent être encore utiles
function calculateNumberOfNights(checkinDate, checkoutDate) {
  if (!checkinDate || !checkoutDate) return 0;
  
  const checkin = new Date(checkinDate);
  const checkout = new Date(checkoutDate);
  
  // Vérifier si les dates sont valides
  if (isNaN(checkin.getTime()) || isNaN(checkout.getTime())) return 0;
  
  // Calculer la différence en jours
  const timeDiff = checkout.getTime() - checkin.getTime();
  const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return nights > 0 ? nights : 0;
}

// Fonction pour déterminer si une date est en haute saison
function isHighSeason(date) {
  if (!date || isNaN(date.getTime())) return true; // Par défaut, considérer haute saison
  
  const month = date.getMonth(); // 0 = Janvier, 11 = Décembre
  
  // Haute saison: du 1er avril (mois 3) au 1er novembre (mois 10)
  return month >= 3 && month <= 10;
}

// Fonction pour initialiser le formulaire de réservation (désactivée)
function initBookingForm() {
  console.log("Ancien formulaire désactivé - utilisation du composant React à la place");
  // Fonction désactivée
}

// Fonction pour initialiser le calendrier personnalisé (désactivée)
function initCalendar() {
  console.log("Ancien calendrier désactivé - utilisation du composant React à la place");
  // Fonction désactivée
}

// Initialiser GLightbox
function initGLightbox() {
  if (typeof GLightbox !== 'undefined') {
    const lightbox = GLightbox({
      selector: '.glightbox',
      touchNavigation: true,
      loop: true,
      autoplayVideos: true,
      openEffect: 'zoom',
      closeEffect: 'fade',
      cssEfects: {
        fade: { in: 'fadeIn', out: 'fadeOut' },
        zoom: { in: 'zoomIn', out: 'zoomOut' }
      },
      zoomable: true,
      draggable: true
    });
    
    console.log('GLightbox initialized');
    return lightbox;
  } else {
    console.error('GLightbox library not found');
    return null;
  }
}

// Fonction pour animer les économies dans l'affichage des prix
function animateDiscountDisplay() {
  // Surveiller l'élément discountInfo
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' || mutation.type === 'childList') {
        const discountInfo = document.getElementById('discountInfo');
        
        // Si l'élément est visible (n'a pas la classe 'hidden')
        if (discountInfo && !discountInfo.classList.contains('hidden')) {
          // Trouver l'élément de prix avec la réduction
          const priceElement = document.getElementById('totalPrice');
          if (priceElement) {
            const newPriceElement = priceElement.querySelector('.text-green-600');
            
            if (newPriceElement) {
              // Ajouter une classe pour l'effet de pulse
              newPriceElement.classList.add('discount-pulse');
              
              // Appliquer une animation de pulse
              gsap.fromTo(
                newPriceElement, 
                { scale: 1 }, 
                { 
                  scale: 1.1, 
                  duration: 0.5, 
                  repeat: 2, 
                  yoyo: true,
                  onComplete: () => {
                    // Reset de l'échelle à la fin
                    gsap.to(newPriceElement, { scale: 1, duration: 0.2 });
                  }
                }
              );
              
              // Animer aussi la notification de réduction
              gsap.fromTo(
                discountInfo.querySelector('div'), 
                { opacity: 0, y: 20 }, 
                { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
              );
            }
          }
        }
      }
    });
  });
  
  // Observer tout changement dans le DOM de l'élément price-estimation
  const priceEstimation = document.getElementById('price-estimation');
  if (priceEstimation) {
    observer.observe(priceEstimation, { 
      attributes: true, 
      childList: true, 
      subtree: true 
    });
  }
}

// Ajouter un style pour l'animation de pulse des prix
function addDiscountStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes discount-highlight {
      0%, 100% { background-color: transparent; }
      50% { background-color: rgba(22, 163, 74, 0.1); }
    }
    
    .discount-pulse {
      animation: discount-highlight 2s ease-in-out;
      border-radius: 4px;
      padding: 2px 4px;
    }
  `;
  document.head.appendChild(style);
}

// Galerie horizontale : défilement natif avec aimantation (scroll-snap),
// flèches sur ordinateur, points + compteur pour savoir où on en est.
function initGallery() {
  const gallery = document.querySelector('.horizontal-gallery');
  if (!gallery) return;

  const items = Array.from(gallery.querySelectorAll('.gallery-item'));
  const prevBtn = document.querySelector('.gallery-prev');
  const nextBtn = document.querySelector('.gallery-next');
  const dotsBox = document.querySelector('.gallery-dots');
  const counter = document.querySelector('.gallery-counter');
  let current = 0;

  const dots = items.map((item, i) => {
    if (!dotsBox) return null;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gallery-dot';
    dot.setAttribute('aria-label', `Photo ${i + 1} sur ${items.length}`);
    dot.addEventListener('click', () => goTo(i));
    dotsBox.appendChild(dot);
    return dot;
  });

  function goTo(index) {
    const item = items[Math.max(0, Math.min(index, items.length - 1))];
    const left = item.offsetLeft - (gallery.clientWidth - item.offsetWidth) / 2;
    gallery.scrollTo({ left, behavior: 'smooth' });
  }

  // Photo la plus proche du centre de la galerie
  function update() {
    const center = gallery.scrollLeft + gallery.clientWidth / 2;
    let best = 0;
    items.forEach((item, i) => {
      const d = Math.abs(item.offsetLeft + item.offsetWidth / 2 - center);
      if (d < Math.abs(items[best].offsetLeft + items[best].offsetWidth / 2 - center)) best = i;
    });
    current = best;
    dots.forEach((dot, i) => dot && dot.setAttribute('aria-current', i === current ? 'true' : 'false'));
    if (counter) counter.textContent = `${current + 1} / ${items.length}`;

    const atStart = gallery.scrollLeft <= 1;
    const atEnd = gallery.scrollLeft >= gallery.scrollWidth - gallery.clientWidth - 1;
    [[prevBtn, atStart], [nextBtn, atEnd]].forEach(([btn, hidden]) => {
      if (!btn) return;
      btn.style.opacity = hidden ? '0' : '1';
      btn.style.pointerEvents = hidden ? 'none' : 'auto';
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  gallery.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
  });

  let ticking = false;
  gallery.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// Variables globales pour la modal Campspace
let campspaceUrl = '';

function openCampspaceModal(url) {
  campspaceUrl = url;
  const modal = document.getElementById('campspace-modal');
  const content = document.getElementById('campspace-modal-content');

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  // Animation d'entrée
  setTimeout(() => {
    content.classList.remove('scale-95', 'opacity-0');
    content.classList.add('scale-100', 'opacity-100');
  }, 10);
}

function closeCampspaceModal() {
  const modal = document.getElementById('campspace-modal');
  const content = document.getElementById('campspace-modal-content');

  content.classList.remove('scale-100', 'opacity-100');
  content.classList.add('scale-95', 'opacity-0');

  setTimeout(() => {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }, 300);
}

function goToCampspace() {
  window.open(campspaceUrl, '_blank');
  closeCampspaceModal();
}

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
  // Intercepter les clics sur les liens Campspace
  document.querySelectorAll('.campspace-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openCampspaceModal(this.href);
    });
  });
  // Initialisation de la galerie horizontale
  initGallery();
  
  // Initialiser GLightbox
  const lightbox = initGLightbox();
  
  // Animations GSAP
  gsap.registerPlugin(ScrollTrigger);

  // Animation des logos hero - apparition séquentielle avec bounce
  const heroLogos = document.querySelectorAll('.hero-logo');
  if (heroLogos.length > 0) {
    gsap.set(heroLogos, { opacity: 0, y: 50, scale: 0.5 });
    gsap.to(heroLogos, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.15,
      ease: "back.out(1.7)",
      delay: 0.5
    });
  }

  // Animation des cartes de fonctionnalités
  gsap.from('.feature-card', {
    scrollTrigger: {
      trigger: '.feature-card',
      start: 'top bottom-=100',
      toggleActions: 'play none none reverse'
    },
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2
  });

  // Les appels à initCalendar() et initBookingForm() sont désactivés
  // initCalendar();
  // initBookingForm();
  
  // Appliquer des styles corrects pour l'animation float
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes float {
      0% { transform: translate(0, 0px); }
      50% { transform: translate(0, -5px); }
      100% { transform: translate(0, 0px); }
    }
    
    .floating, .text-yellow-400 {
      animation: float 3s ease-in-out infinite;
      transform: translate(0, 0); /* Valeur initiale explicite */
    }
  `;
  document.head.appendChild(styleElement);

  // Ajouter les styles personnalisés
  addDiscountStyles();
  
  // Initialiser l'animation des remises
  animateDiscountDisplay();
  
  // Autres initialisations d'événements pour les sections promotionnelles
  const promoCards = document.querySelectorAll('.feature-card, [class*="bg-gradient-to-br"]');
  
  promoCards.forEach(card => {
    // Effet de survol pour les cartes promo
    card.addEventListener('mouseenter', function() {
      gsap.to(this, { 
        y: -10, 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
        duration: 0.3 
      });
    });
    
    card.addEventListener('mouseleave', function() {
      gsap.to(this, { 
        y: 0, 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
        duration: 0.3 
      });
    });
  });
});
