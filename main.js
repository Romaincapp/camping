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

// Nouvelle fonction pour initialiser la galerie horizontale
function initHorizontalGallery() {
  const gallery = document.querySelector('.horizontal-gallery');
  const scrollThumb = document.querySelector('.scroll-thumb');
  
  if (!gallery || !scrollThumb) return;
  
  function updateScrollThumb() {
    const scrollPercentage = gallery.scrollLeft / (gallery.scrollWidth - gallery.clientWidth);
    const maxTranslate = 100 - (scrollThumb.clientWidth / scrollThumb.parentElement.clientWidth * 100);
    const translateValue = scrollPercentage * maxTranslate;
    const boundedTranslate = Math.max(0, Math.min(translateValue, maxTranslate));
    scrollThumb.style.transform = `translateX(${boundedTranslate}%)`;
  }
  
  gallery.addEventListener('scroll', updateScrollThumb);
  updateScrollThumb();
  
  setTimeout(() => {
    const firstItem = gallery.querySelector('.gallery-item');
    if (firstItem) {
      const itemWidth = firstItem.offsetWidth;
      const containerWidth = gallery.offsetWidth;
      const scrollPosition = (itemWidth - containerWidth) / 2;
      gallery.scrollLeft = scrollPosition > 0 ? scrollPosition : 0;
    }
  }, 100);
  
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  if (typeof gsap !== 'undefined') {
    galleryItems.forEach(item => {
      item.addEventListener('mouseenter', function() {
        gsap.to(this, { scale: 1.03, duration: 0.3, ease: "power2.out" });
      });
      
      item.addEventListener('mouseleave', function() {
        gsap.to(this, { scale: 1, duration: 0.3, ease: "power2.out" });
      });
    });

    gsap.from('.gallery-item', {
      scrollTrigger: {
        trigger: '.horizontal-gallery',
        start: 'top bottom',
        end: 'bottom top',
        toggleActions: 'play none none reverse'
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1
    });
  }
  
  return gallery;
}

// Nouvelle fonction pour initialiser la navigation dans la galerie
function initGalleryNavigation() {
  const gallery = document.querySelector('.horizontal-gallery');
  const prevBtn = document.querySelector('.gallery-prev');
  const nextBtn = document.querySelector('.gallery-next');
  
  if (!gallery || !prevBtn || !nextBtn) return;
  
  const scrollAmount = 800; // Ajustez selon la largeur de vos images
  
  prevBtn.addEventListener('click', () => {
    gallery.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  });
  
  nextBtn.addEventListener('click', () => {
    gallery.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  });
  
  // Mise à jour de la visibilité des boutons
  const updateButtonsVisibility = () => {
    const isAtStart = gallery.scrollLeft <= 0;
    const isAtEnd = gallery.scrollLeft >= gallery.scrollWidth - gallery.clientWidth;
    
    prevBtn.style.opacity = isAtStart ? '0' : '1';
    prevBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';
    
    nextBtn.style.opacity = isAtEnd ? '0' : '1';
    nextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
  };
  
  gallery.addEventListener('scroll', updateButtonsVisibility);
  window.addEventListener('resize', updateButtonsVisibility);
  
  // Initial check
  updateButtonsVisibility();
}

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
  // Initialisation de la galerie horizontale
  initHorizontalGallery();
  
  // Initialisation de la navigation dans la galerie
  initGalleryNavigation();
  
  // Initialiser GLightbox
  const lightbox = initGLightbox();
  
  // Animations GSAP
  gsap.registerPlugin(ScrollTrigger);
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

  // Initialisation du Swiper avec des paramètres optimisés
  const swiper = new Swiper('.swiper', {
    loop: true,
    slidesPerView: 5,
    spaceBetween: 0,    // Réduit l'espace pour permettre un meilleur scaling
    centeredSlides: true,
    autoplay: {
      delay: 4000,     // Délai augmenté
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    speed: 1000,       // Transition plus douce
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 10
      },
      640: {
        slidesPerView: 2,
        spaceBetween: 20
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 25
      },
      1440: {          // Nouveau breakpoint pour grands écrans
        slidesPerView: 5,
        spaceBetween: 30
      }
    },
    effect: 'coverflow',
    coverflowEffect: {
      rotate: 20,      // Rotation réduite
      stretch: 0,
      depth: 200,      // Profondeur augmentée
      modifier: 1,
      slideShadows: true,
    },
    on: {
      init: function() {
        const style = document.createElement('style');
        style.textContent = `
          .swiper-container {
            padding: 60px 0;  // Plus d'espace pour les transformations
          }

          .swiper-slide {
            transition: all 0.4s ease;
            cursor: pointer;
            height: 250px;     // Hauteur réduite pour les slides inactives
            width: 350px;      // Largeur de base
            filter: brightness(0.7);
            transform: scale(0.7);
            overflow: hidden;
          }
          
          .swiper-slide img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 12px;
            transition: all 0.4s ease;
          }

          .swiper-slide-active {
            transform: scale(1.6);     // Scale augmenté significativement
            height: 350px;            // Hauteur plus importante
            width: 600px;             // Largeur plus importante
            filter: brightness(1);
            z-index: 10;
          }

          .swiper-slide-prev,
          .swiper-slide-next {
            transform: scale(0.9);
            filter: brightness(0.8);
            z-index: 5;
          }

          .swiper-button-next,
          .swiper-button-prev {
            color: #16a34a;
            background: rgba(255, 255, 255, 0.9);
            padding: 25px;
            border-radius: 50%;
            transform: scale(0.6);
            z-index: 20;
          }

          @media (min-width: 1440px) {
            .swiper-container {
              padding: 80px 0;
            }
            .swiper-wrapper {
              align-items: center;
            }
            .swiper-slide-active {
              transform: scale(1.8);   // Encore plus grand sur les grands écrans
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  });
});
