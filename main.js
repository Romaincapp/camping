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

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
  // Initialisation du Swiper avec des paramètres optimisés
  const swiper = new Swiper('.swiper', {
    loop: true,
    effect: "fade",
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    speed: 1000,
    breakpoints: {
      320: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 1,
      },
      1024: {
        slidesPerView: 1,
      }
    },
    // Ajout d'un peu de zoom au survol des slides
    on: {
      init: function() {
        // Ajouter un style hover aux slides
        const style = document.createElement('style');
        style.textContent = `
          .swiper-slide {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
          }
          .swiper-slide:hover {
            transform: scale(1.02);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          }
        `;
        document.head.appendChild(style);
      }
    }
  });
    
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

// Appeler ces fonctions après le chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
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
    }
  `;
  document.head.appendChild(styleElement);
});
