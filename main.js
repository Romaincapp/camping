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
    }
  });
    
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
});
