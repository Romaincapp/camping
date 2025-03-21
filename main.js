function initBookingForm() {
  console.log("Initialisation du formulaire de réservation...");
  
  // Vérifier si le formulaire existe sur la page
  const bookingForm = document.getElementById('bookingForm');
  if (!bookingForm) {
    console.log("Formulaire de réservation non trouvé");
    return;
  }
  
  console.log("Formulaire de réservation trouvé");
  
  // Référence aux éléments du formulaire
  const checkinInput = document.getElementById('checkin');
  const checkoutInput = document.getElementById('checkout');
  const adultsInput = document.getElementById('adults');
  const childrenInput = document.getElementById('children');
  
  // Référence aux éléments d'affichage du prix
  const numberOfNightsElement = document.getElementById('numberOfNights');
  const pricePerAdultElement = document.getElementById('pricePerAdult');
  const pricePerChildElement = document.getElementById('pricePerChild');
  const numberOfAdultsElement = document.getElementById('numberOfAdults');
  const numberOfChildrenElement = document.getElementById('numberOfChildren');
  const totalPriceElement = document.getElementById('totalPrice');
  const priceSummaryInput = document.getElementById('priceSummary');
  
  // Vérification de la présence des éléments
  if (!checkinInput || !checkoutInput || !adultsInput || !childrenInput ||
      !numberOfNightsElement || !pricePerAdultElement || !pricePerChildElement ||
      !numberOfAdultsElement || !numberOfChildrenElement || !totalPriceElement || !priceSummaryInput) {
    console.log("Certains éléments du formulaire sont manquants");
    return;
  }
  
  console.log("Tous les éléments du formulaire sont présents");
  
  // Fonction pour calculer le prix
function calculatePrice() {
  console.log("Calcul du prix...");
  
  const checkin = checkinInput.value;
  const checkout = checkoutInput.value;
  const adults = parseInt(adultsInput.value) || 0;
  const children = parseInt(childrenInput.value) || 0;
  
  console.log(`Dates: ${checkin} - ${checkout}, Adultes: ${adults}, Enfants: ${children}`);
  
  // Calculer le nombre de nuits
  const nights = calculateNumberOfNights(checkin, checkout);
  console.log(`Nombre de nuits: ${nights}`);
  
  // Vérifier si c'est la haute saison
  const highSeason = isHighSeason(checkin ? new Date(checkin) : null);
  console.log(`Haute saison: ${highSeason}`);
  
  // Calculer le prix selon la saison
  let adultPrice, childPrice, totalPrice;
  
  if (highSeason) {
    // Haute saison: 19€ par adulte, 13€ par enfant
    adultPrice = 19;
    childPrice = 13;
    totalPrice = (adults * adultPrice + children * childPrice) * nights;
  } else {
    // Basse saison: 19€ pour la première personne, 10€ pour chaque personne supplémentaire
    // (pas de distinction entre adultes et enfants en basse saison)
    adultPrice = "19€ (1er) / 10€ (autres)";
    childPrice = "10€";
    
    // Calculer le prix total
    const totalPersons = adults + children;
    totalPrice = totalPersons > 0 
      ? (19 + (totalPersons - 1) * 10) * nights 
      : 0;
  }
  
  console.log(`Prix adulte: ${adultPrice}, Prix enfant: ${childPrice}, Total: ${totalPrice}`);
  
  // Mettre à jour l'affichage
  numberOfNightsElement.textContent = nights;
  pricePerAdultElement.textContent = adultPrice;
  pricePerChildElement.textContent = childPrice;
  numberOfAdultsElement.textContent = adults;
  numberOfChildrenElement.textContent = children;
  totalPriceElement.textContent = `${totalPrice} €`;
  
  // Mettre à jour le champ caché pour FormSpree
  priceSummaryInput.value = `Nombre de nuits: ${nights}, Prix total estimé: ${totalPrice} €`;
}
  
  console.log("Ajout des écouteurs d'événements...");
  
  // Écouteurs d'événements pour recalculer le prix à chaque changement
  checkinInput.addEventListener('input', calculatePrice);
  checkinInput.addEventListener('change', calculatePrice);
  
  checkoutInput.addEventListener('input', calculatePrice);
  checkoutInput.addEventListener('change', calculatePrice);
  
  adultsInput.addEventListener('input', calculatePrice);
  adultsInput.addEventListener('change', calculatePrice);
  
  childrenInput.addEventListener('input', calculatePrice);
  childrenInput.addEventListener('change', calculatePrice);
  
  // Initialiser le calcul
  calculatePrice();
  
  // Validation avant soumission
  bookingForm.addEventListener('submit', function(event) {
    const checkin = new Date(checkinInput.value);
    const checkout = new Date(checkoutInput.value);
    
    if (checkout <= checkin) {
      event.preventDefault();
      alert("La date de depart doit etre posterieure a la date d'arrivee.");
    }
  });
  
  console.log("Formulaire de réservation initialisé");
}

// Fonction pour initialiser le calendrier personnalisé
function initCalendar() {
  // Vérifier si le conteneur existe
  const calendarContainer = document.getElementById('calendarContainer');
  if (!calendarContainer) return;

  // Fonction pour récupérer les événements depuis l'API Google Calendar
  async function fetchGoogleCalendarEvents(year, month) {
    try {
      // Calculer le premier et dernier jour du mois
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Formater les dates pour l'API Google (format ISO)
      const timeMin = firstDay.toISOString();
      const timeMax = lastDay.toISOString();
      
      // ID de votre calendrier (généralement votre adresse email)
      const calendarId = 'romainfrancedumoulin@gmail.com'; 
      
      // Votre clé API
      const apiKey = 'AIzaSyCECx-Qj4APoyaDXEMKq9y4fVCidvxyOUk';
      
      // Construire l'URL de l'API
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
      
      console.log("Récupération des événements du calendrier...");
      
      // Faire la requête à l'API
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des événements: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`${data.items.length} événements récupérés`);
      
      // Transformer les événements Google Calendar en format utilisable par notre calendrier
      return data.items.map(event => ({
        id: event.id,
        title: event.summary || 'Réservé',
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date)
      }));
    } catch (error) {
      console.error('Erreur API Google Calendar:', error);
      // En cas d'erreur, revenir aux événements de démonstration
      console.log('Utilisation des événements de démonstration');
      
      // Événements de démonstration en cas d'échec de l'API
      return [
        {
          id: "event1",
          title: "Réservé",
          start: new Date(year, month, 5),
          end: new Date(year, month, 8)
        },
        {
          id: "event2",
          title: "Réservé",
          start: new Date(year, month, 8),
          end: new Date(year, month, 12)
        },
        {
          id: "event3",
          title: "Réservé",
          start: new Date(year, month, 15),
          end: new Date(year, month, 18)
        },
        {
          id: "event4",
          title: "Réservé",
          start: new Date(year, month, 22),
          end: new Date(year, month, 25)
        },
        {
          id: "event5",
          title: "Réservé",
          start: new Date(year, month, 25),
          end: new Date(year, month, 28)
        }
      ];
    }
  }

  // Variables pour suivre l'état du calendrier
  let currentDate = new Date();
  let currentEvents = [];
  
  // Fonction pour mettre à jour l'affichage du calendrier
  async function updateCalendar() {
    // Afficher un indicateur de chargement
    calendarContainer.innerHTML = `
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    `;
    
    // Récupérer les événements
    const events = await fetchGoogleCalendarEvents(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
    currentEvents = events;
    
    // Générer le HTML du calendrier
    renderCalendar();
  }
  
  // Fonction pour générer le HTML du calendrier
  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Obtenir les informations sur le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDay = new Date(year, month, 1).getDay(); // 0 = Dimanche
    
    // Ajuster pour que la semaine commence le lundi
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // Noms des jours de la semaine en français
    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    // Nom du mois en français
    const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(currentDate);
    
    // Créer le HTML du calendrier
    let calendarHTML = `
      <div class="bg-white rounded-lg shadow-lg p-4">
        <div class="flex justify-between items-center mb-4">
          <button id="prevMonth" class="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          
          <h3 class="text-xl font-bold text-green-800">
            ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}
          </h3>
          
          <button id="nextMonth" class="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
        
        <!-- En-tête des jours de la semaine -->
        <div class="grid grid-cols-7 mb-2">
          ${weekDays.map(day => `
            <div class="text-center font-medium text-gray-600 text-sm py-2">
              ${day}
            </div>
          `).join('')}
        </div>
        
        <!-- Grille du calendrier -->
        <div class="grid grid-cols-7 border-r border-b rounded-lg overflow-hidden">
    `;
    
    // Ajouter des cellules vides pour les jours avant le début du mois
    for (let i = 0; i < firstDay; i++) {
      calendarHTML += `<div class="p-2 border-t border-l bg-gray-50"></div>`;
    }
    
    // Générer les jours du mois
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      // Vérifier si la date est aujourd'hui
      const isToday = date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() && 
                       date.getFullYear() === today.getFullYear();
      
      // Vérifier le statut de la date (check-in, séjour, check-out)
      let isCheckIn = false;
      let isCheckOut = false;
      let isStay = false;
      
      // Parcourir tous les événements pour déterminer le statut de cette date
      currentEvents.forEach(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Formater les dates pour comparer uniquement année, mois, jour
        const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const formattedStart = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
        const formattedEnd = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
        
        // Vérifier si c'est un jour d'arrivée
        if (formattedDate.getTime() === formattedStart.getTime()) {
          isCheckIn = true;
        }
        
        // Vérifier si c'est un jour de départ
        if (formattedDate.getTime() === formattedEnd.getTime()) {
          isCheckOut = true;
        }
        
        // Vérifier si c'est un jour de séjour (ni arrivée ni départ)
        if (formattedDate > formattedStart && formattedDate < formattedEnd) {
          isStay = true;
        }
      });
      
      // Construire la cellule avec le style approprié
      calendarHTML += `
        <div class="p-2 border-t border-l relative ${isToday ? 'bg-green-50' : 'bg-white'}">
          <span class="inline-block rounded-full w-7 h-7 leading-7 text-center text-sm
            ${isToday ? 'bg-green-600 text-white' : ''}">
            ${day}
          </span>
          
          <div class="flex absolute bottom-0 left-0 right-0 h-6">
            ${isStay && !isCheckIn && !isCheckOut ? `
              <div class="flex-grow bg-red-500 text-white text-xs flex items-center justify-center">
            
              </div>
            ` : `
              ${isCheckOut ? `
                <div class="w-1/2 bg-orange-500 text-white text-xs flex items-center justify-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>12h</span>
                </div>
              ` : `
                <div class="w-1/2"></div>
              `}
              
              ${isStay && (isCheckIn || isCheckOut) ? `
                <div class="flex-grow bg-red-500"></div>
              ` : ''}
              
              ${isCheckIn ? `
                <div class="w-1/2 bg-green-500 text-white text-xs flex items-center justify-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>14h</span>
                </div>
              ` : `
                <div class="w-1/2"></div>
              `}
            `}
          </div>
        </div>
      `;
    }
    
    // Finaliser le HTML
    calendarHTML += `
        </div>
        
        <!-- Légende améliorée avec horaires mis à jour -->
        <div class="mt-4 flex flex-wrap items-center justify-center gap-4">
          <div class="flex items-center">
            <div class="w-4 h-4 bg-green-500 mr-2 rounded-sm"></div>
            <span class="text-sm text-gray-700">Check-in (14h)</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 bg-red-500 mr-2 rounded-sm"></div>
            <span class="text-sm text-gray-700">Séjour</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 bg-orange-500 mr-2 rounded-sm"></div>
            <span class="text-sm text-gray-700">Check-out (12h)</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 bg-green-600 mr-2 rounded-sm"></div>
            <span class="text-sm text-gray-700">Aujourd'hui</span>
          </div>
        </div>
        
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Pour vérifier les disponibilités exactes et faire une demande de réservation, 
            veuillez utiliser le formulaire ci-dessous.
          </p>
        </div>
      </div>
    `;
    
    // Insérer le HTML dans le conteneur
    calendarContainer.innerHTML = calendarHTML;
    
    // Ajouter les écouteurs d'événements pour les boutons de navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      updateCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      updateCalendar();
    });
  }
  
  // Initialiser le calendrier
  updateCalendar();
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

  // Initialiser le calendrier
  initCalendar();
  
  // Initialiser le formulaire de réservation
  initBookingForm();
});
