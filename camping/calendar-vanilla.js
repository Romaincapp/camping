// calendar-vanilla.js

// ============================================
// FETCH ANTICIPÉ - Lancé immédiatement au chargement du script
// ============================================
const CALENDAR_ID = 'romainfrancedumoulin@gmail.com';
const CACHE_KEY = 'camping_calendar_events';

// Charger depuis le cache (synchrone)
function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { events } = JSON.parse(cached);
      return events.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
      }));
    }
  } catch (e) {}
  return null;
}

// Sauvegarder dans le cache
function saveToCache(events) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ events, timestamp: Date.now() }));
  } catch (e) {}
}

// Parser les données iCal (version simplifiée pour le fetch anticipé)
function parseICalEventsEarly(icalData) {
  const events = [];
  const lines = icalData.split(/\r?\n/);
  let currentEvent = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].substring(1);
    }

    if (line === 'BEGIN:VEVENT') {
      currentEvent = { id: '', title: 'Réservé', start: null, end: null, isBusy: true };
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.start && currentEvent.end && currentEvent.isBusy) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('UID:')) currentEvent.id = line.substring(4);
      else if (line.startsWith('SUMMARY:')) currentEvent.title = line.substring(8) || 'Réservé';
      else if (line.startsWith('DTSTART')) currentEvent.start = parseICalDateEarly(line);
      else if (line.startsWith('DTEND')) currentEvent.end = parseICalDateEarly(line);
      else if (line.startsWith('TRANSP:')) currentEvent.isBusy = line.substring(7).trim() !== 'TRANSPARENT';
    }
  }
  return events;
}

function parseICalDateEarly(line) {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return null;
  const dateStr = line.substring(colonIndex + 1);

  if (dateStr.length === 8) {
    return new Date(parseInt(dateStr.substring(0, 4)), parseInt(dateStr.substring(4, 6)) - 1, parseInt(dateStr.substring(6, 8)));
  }
  if (dateStr.length >= 15) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(9, 11));
    const minute = parseInt(dateStr.substring(11, 13));
    const second = parseInt(dateStr.substring(13, 15));
    if (dateStr.endsWith('Z')) return new Date(Date.UTC(year, month, day, hour, minute, second));
    return new Date(year, month, day, hour, minute, second);
  }
  return null;
}

// Lancer le fetch IMMÉDIATEMENT (avant DOMContentLoaded)
const earlyFetchPromise = (async function() {
  // 1. Essayer de charger le fichier JSON local (généré par GitHub Actions)
  // Ajouter cache-busting pour toujours avoir la dernière version
  try {
    const response = await fetch('calendar-data.json?t=' + Date.now());
    if (response.ok) {
      const data = await response.json();
      const events = data.events.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
      }));
      saveToCache(events);
      console.log(`📅 ${events.length} événements chargés`);
      return events;
    }
  } catch (e) {}

  // 2. Fallback: proxy CORS (pour dev local ou si JSON manquant)
  const icalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(icalUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(icalUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const icalData = await response.text();
        const events = parseICalEventsEarly(icalData);
        saveToCache(events);
        console.log(`📅 ${events.length} événements via proxy`);
        return events;
      }
    } catch (e) {}
  }

  // 3. Dernier recours: cache localStorage (si tout échoue)
  const cached = loadFromCache();
  if (cached && cached.length > 0) {
    console.log('📅 Calendrier depuis le cache (hors-ligne)');
    return cached;
  }

  return null;
})();

// ============================================
// CODE PRINCIPAL - Après DOMContentLoaded
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  // État global du calendrier
  const calendarState = {
    currentDate: new Date(),
    selectedStartDate: null,
    selectedEndDate: null,
    events: [], // Sera rempli par earlyFetchPromise
    isLoading: true,
    formData: {
      name: '',
      email: '',
      phone: '',
      country: '',
      street: '',
      postalCode: '',
      city: '',
      languages: [],
      accommodationType: '',
      adults: 1,
      children: 0,
      message: '',
      checkin: '',
      checkout: '',
      woodOption: '',
      woodQuantity: 0,
      sailingExperience: '',
      sailingDuration: ''
    },
    priceInfo: {
      nights: 0,
      adultPrice: '19 €',
      childPrice: '13 €',
      totalPrice: 0,
      originalTotalPrice: 0,
      discount: 0,
      discountReason: '',
      woodPrice: 0,
      sailingPrice: 0
    }
  };

  // Suivi des modifications de champs (anti-fraude)
  const fieldEditTracker = {};
  const TRACKED_FIELDS = ['name', 'email', 'phone', 'country', 'street', 'postalCode', 'city', 'adults', 'children', 'accommodationType', 'woodOption', 'woodQuantity', 'message'];

  document.addEventListener('input', function(e) {
    const id = e.target.id;
    if (TRACKED_FIELDS.includes(id)) {
      if (!fieldEditTracker[id]) fieldEditTracker[id] = { count: 0, values: [] };
      fieldEditTracker[id].count++;
      const val = e.target.value;
      const history = fieldEditTracker[id].values;
      if (history[history.length - 1] !== val) {
        history.push(val);
        if (history.length > 10) history.shift();
      }
    }
  });

  document.addEventListener('change', function(e) {
    const id = e.target.id;
    if (TRACKED_FIELDS.includes(id)) {
      if (!fieldEditTracker[id]) fieldEditTracker[id] = { count: 0, values: [] };
      fieldEditTracker[id].count++;
      const val = e.target.value;
      const history = fieldEditTracker[id].values;
      if (history[history.length - 1] !== val) {
        history.push(val);
        if (history.length > 10) history.shift();
      }
    }
  });

  // Constantes
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Préfixes téléphoniques par pays
  const PHONE_PREFIXES = {
    'BE': { prefix: '+32', placeholder: '+32 4xx xx xx xx', example: '+32 470 12 34 56' },
    'FR': { prefix: '+33', placeholder: '+33 6 xx xx xx xx', example: '+33 6 12 34 56 78' },
    'NL': { prefix: '+31', placeholder: '+31 6 xxxx xxxx', example: '+31 6 1234 5678' },
    'DE': { prefix: '+49', placeholder: '+49 1xx xxxxxxx', example: '+49 170 1234567' },
    'LU': { prefix: '+352', placeholder: '+352 xxx xxx xxx', example: '+352 621 123 456' },
    'GB': { prefix: '+44', placeholder: '+44 7xxx xxxxxx', example: '+44 7911 123456' },
    'CH': { prefix: '+41', placeholder: '+41 7x xxx xx xx', example: '+41 79 123 45 67' },
    'ES': { prefix: '+34', placeholder: '+34 6xx xxx xxx', example: '+34 612 345 678' },
    'IT': { prefix: '+39', placeholder: '+39 3xx xxx xxxx', example: '+39 320 123 4567' },
    'OTHER': { prefix: '+', placeholder: '+xx xxx xxx xxx', example: '+xx xxx xxx xxx' }
  };

  // Met à jour le placeholder et le préfixe du champ téléphone selon le pays
  function updatePhoneForCountry(countryCode) {
    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;
    const info = PHONE_PREFIXES[countryCode] || PHONE_PREFIXES['OTHER'];
    phoneInput.placeholder = info.placeholder;
    // Si le champ est vide ou contient juste un ancien préfixe, pré-remplir le préfixe
    const currentVal = phoneInput.value.trim();
    const isJustPrefix = !currentVal || Object.values(PHONE_PREFIXES).some(p => currentVal === p.prefix);
    if (isJustPrefix) {
      phoneInput.value = info.prefix + ' ';
      calendarState.formData.phone = info.prefix + ' ';
    }
  }

  // Variables pour le fetch des événements
  let eventsLoaded = calendarState.events.length > 0;

  // Sélecteurs DOM
  const container = document.getElementById('reservation-container');

  // Initialiser l'interface
  initializeCalendarUI();

  // Fonction pour initialiser l'interface utilisateur
  function initializeCalendarUI() {
    // S'assurer que currentDate n'est pas dans le passé (toujours au moins le mois actuel)
    const today = new Date();
    if (calendarState.currentDate.getFullYear() < today.getFullYear() || 
        (calendarState.currentDate.getFullYear() === today.getFullYear() && 
         calendarState.currentDate.getMonth() < today.getMonth())) {
      calendarState.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    // Créer la structure de base
    container.innerHTML = `
      <div class="container mx-auto max-w-6xl">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Côté gauche: Calendrier -->
          <div>
            <h2 class="text-3xl font-bold text-center text-green-800 mb-6">Disponibilités</h2>
            <div id="calendar-container" class="relative">
              <div id="loading-indicator" class="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-10">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
              </div>
              <div id="calendar-wrapper" class="bg-white rounded-lg shadow-lg p-4">
                <!-- Le calendrier sera rendu ici -->
              </div>
            </div>
          </div>
          
          <!-- Côté droit: Formulaire de réservation -->
          <div>
            <h2 class="text-3xl font-bold text-center text-green-800 mb-6">Demande de réservation</h2>
            
            <!-- Avertissement -->
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded shadow-md">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-yellow-700">
                    Ce formulaire est uniquement une demande d'information et ne confirme pas votre réservation. Un lien de paiement ainsi que l'adresse exacte du camp vous seront envoyés une fois vos dates validées.
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Formulaire -->
            <form id="booking-form" class="bg-white p-6 rounded-lg shadow-lg">
              <!-- Le formulaire sera rendu ici -->
            </form>
          </div>
        </div>
      </div>
    `;

    // Initialiser le chargement du calendrier
    renderCalendar();
    renderBookingForm();
    
    // Récupérer les événements
    fetchEvents();

    // Ajouter les gestionnaires d'événements de formulaire
    setupFormEventListeners();
  }

  // Fonction pour récupérer les événements du calendrier
  function fetchEvents() {
    // Si déjà chargé depuis le cache, afficher immédiatement
    if (calendarState.events.length > 0) {
      calendarState.isLoading = false;
      renderCalendar();
    }

    // Attendre le résultat du fetch anticipé
    earlyFetchPromise.then(events => {
      if (events && events.length > 0) {
        calendarState.events = events;
        eventsLoaded = true;
      }
      calendarState.isLoading = false;
      updateLoadingState();
      renderCalendar();
    }).catch(error => {
      console.error("Erreur fetch:", error);
      if (calendarState.events.length === 0) {
        calendarState.events = generateDemoEvents();
      }
      calendarState.isLoading = false;
      updateLoadingState();
      renderCalendar();
    });
  }

  // Gestionnaire pour la saisie en temps réel
  document.addEventListener('input', function(event) {
    const target = event.target;
    const id = target.id;

    // Gérer les champs de contact en temps réel
    if (id === 'name' || id === 'email' || id === 'phone' || id === 'street' || id === 'postalCode' || id === 'city') {
      calendarState.formData[id] = target.value;
      if (id === 'name' || id === 'email' || id === 'phone') {
        checkFormProgress();
      }
    }
  });

  // Générer des événements de démonstration
  function generateDemoEvents() {
    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth();
    
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
        start: new Date(year, month, 12),
        end: new Date(year, month, 15)
      },
      {
        id: "event3",
        title: "Réservé",
        start: new Date(year, month, 20),
        end: new Date(year, month, 23)
      }
    ];
  }

  // Mettre à jour l'état de chargement dans l'interface
  function updateLoadingState() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = calendarState.isLoading ? 'flex' : 'none';
    }
  }

  // Vérifier si une date est dans une plage réservée
  function isDateBooked(date) {
    const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return calendarState.events.some(event => {
      const eventStart = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
      const eventEnd = new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate());
      
      return formattedDate >= eventStart && formattedDate < eventEnd;
    });
  }
  
  // Vérifier si une date est une date de check-in d'un événement
  function isCheckInDate(date) {
    const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return calendarState.events.some(event => {
      const eventStart = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
      return formattedDate.getTime() === eventStart.getTime();
    });
  }
  
  // Vérifier si une date est une date de check-out d'un événement
  function isCheckOutDate(date) {
    const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return calendarState.events.some(event => {
      const eventEnd = new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate());
      return formattedDate.getTime() === eventEnd.getTime();
    });
  }
  
  // Formater une date pour le champ input
  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Vérifier si une plage de dates est valide (pas de conflits)
  function checkDateRangeConflicts(startDate, endDate) {
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1); // Commencer au jour après start
    
    const endTime = endDate.getTime();
    
    while (currentDate.getTime() < endTime) {
      // On autorise les check-in et check-out dans la plage, mais pas les jours complètement réservés
      if (isDateBooked(currentDate) && !isCheckInDate(currentDate) && !isCheckOutDate(currentDate)) {
        return true; // Conflit trouvé
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return false; // Pas de conflit
  }

  // Gérer le clic sur une date du calendrier
function handleDateClick(date) {
  // Convertir en objets Date pour assurer une comparaison correcte
  const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Ne pas permettre de sélectionner des dates passées
  if (currentDate < today) {
    return;
  }
  
  // Autoriser la sélection de TOUTES les dates de check-in ET check-out
  // Ne bloquer que les dates complètement réservées qui ne sont ni check-in ni check-out
  if (isDateBooked(date) && !isCheckInDate(date) && !isCheckOutDate(date)) {
    return;
  }
  
  // Mode Airbnb : Première sélection = début, deuxième = fin
  if (!calendarState.selectedStartDate || (calendarState.selectedStartDate && calendarState.selectedEndDate)) {
    // Premier clic ou réinitialisation après une plage complète
    calendarState.selectedStartDate = currentDate;
    calendarState.selectedEndDate = null;
    
    // Mettre à jour les champs du formulaire
    calendarState.formData.checkin = formatDateForInput(currentDate);
    calendarState.formData.checkout = '';
    updateFormFields();
  } else {
    // Deuxième clic pour date de fin
    if (currentDate <= calendarState.selectedStartDate) {
      // Si la date cliquée est avant ou égale à la date de début,
      // on considère que l'utilisateur veut changer sa date de début
      calendarState.selectedStartDate = currentDate;
      
      // Mettre à jour uniquement le champ checkin
      calendarState.formData.checkin = formatDateForInput(currentDate);
      updateFormFields();
      renderCalendar(); // Mettre à jour l'affichage du calendrier
      return;
    }
    
    // Vérifier s'il y a des dates réservées entre le début et la fin
    const hasConflict = checkDateRangeConflicts(calendarState.selectedStartDate, currentDate);
    
    if (hasConflict) {
      alert("Il y a des dates déjà réservées dans cette plage. Veuillez choisir une autre date de fin.");
      
      // MODIFICATION: Réinitialiser la sélection en cas de conflit pour permettre à l'utilisateur de recommencer
      calendarState.selectedStartDate = null;
      calendarState.selectedEndDate = null;
      calendarState.formData.checkin = '';
      calendarState.formData.checkout = '';
      updateFormFields();
      renderCalendar();
      return;
    }
    
    // Définir la date de fin
    calendarState.selectedEndDate = currentDate;

    // Mettre à jour le champ checkout du formulaire
    calendarState.formData.checkout = formatDateForInput(currentDate);
    updateFormFields();

    // Auto-scroll vers le formulaire sur mobile après sélection des dates
    scrollToFormOnMobile();
  }

  // Mettre à jour l'affichage du calendrier
  renderCalendar();

  // Calculer le prix
  calculatePrice();
}

  // Fonction pour scroller vers le formulaire sur mobile
  function scrollToFormOnMobile() {
    // Vérifier si on est sur mobile/tablette (écran < 1024px)
    if (window.innerWidth < 1024) {
      const bookingForm = document.getElementById('booking-form');
      if (bookingForm) {
        // Petit délai pour laisser le temps au calendrier de se mettre à jour
        setTimeout(() => {
          bookingForm.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 300);
      }
    }
  }

  // Fonction pour révéler progressivement la section voilier
  function revealSailingSection() {
    const sailingSection = document.getElementById('sailingExperienceSection');
    if (sailingSection && sailingSection.classList.contains('hidden')) {
      // Ajouter une animation de révélation
      sailingSection.classList.remove('hidden');
      sailingSection.style.opacity = '0';
      sailingSection.style.transform = 'translateY(20px)';
      
      // Animation CSS
      setTimeout(() => {
        sailingSection.style.transition = 'all 0.8s ease-out';
        sailingSection.style.opacity = '1';
        sailingSection.style.transform = 'translateY(0)';
        
        // Ajouter un effet de pulsation sur le badge "Nouveau"
        const badge = sailingSection.querySelector('.bg-blue-600');
        if (badge) {
          badge.style.animation = 'pulse 2s infinite';
        }
      }, 100);
    }
  }

  // Fonction pour vérifier si l'utilisateur a commencé à remplir le formulaire
  function checkFormProgress() {
    const { name, email, phone } = calendarState.formData;
    
    // Si l'utilisateur a commencé à remplir au moins un champ de contact
    if (name.length > 2 || email.length > 3 || phone.length > 3) {
      revealSailingSection();
    }
  }

  // Fonction pour gérer les changements des checkboxes de langues
  function handleLanguageChange() {
    const checkboxes = document.querySelectorAll('input[name="languages"]:checked');
    calendarState.formData.languages = Array.from(checkboxes).map(cb => cb.value);
  }
  function updateFormFields() {
    // Mettre à jour la date d'arrivée
    const checkinInput = document.getElementById('checkin');
    if (checkinInput) {
      checkinInput.value = calendarState.formData.checkin;
    }
    
    // Mettre à jour la date de départ
    const checkoutInput = document.getElementById('checkout');
    if (checkoutInput) {
      checkoutInput.value = calendarState.formData.checkout;
    }
    
    // Mettre à jour les champs de texte/nombre
    for (const key in calendarState.formData) {
      if (key !== 'checkin' && key !== 'checkout') {
        const input = document.getElementById(key);
        if (input) {
          input.value = calendarState.formData[key];
        }
      }
    }
  }

  function updatePriceDisplay() {
    // Mettre à jour les informations de prix dans le DOM
    document.getElementById('numberOfNights').textContent = calendarState.priceInfo.nights;
    document.getElementById('numberOfAdults').textContent = calendarState.formData.adults;
    document.getElementById('numberOfChildren').textContent = calendarState.formData.children;
    
    // Ajouter l'affichage du prix du bois dans la section d'estimation des frais
    const woodPriceElement = document.getElementById('woodPrice');
    const woodQuantityElement = document.getElementById('displayWoodQuantity');
    const woodTypeElement = document.getElementById('displayWoodType');
    
    if (woodPriceElement && woodQuantityElement && woodTypeElement) {
      if (calendarState.formData.woodOption) {
        const woodType = calendarState.formData.woodOption === 'brouette' ? 'Brouette(s)' : 'Caisse(s)';
        woodTypeElement.textContent = woodType;
        woodQuantityElement.textContent = calendarState.formData.woodQuantity || 0;
        woodPriceElement.textContent = `${calendarState.priceInfo.woodPrice} €`;
        document.getElementById('woodPriceSection').classList.remove('hidden');
      } else {
        document.getElementById('woodPriceSection').classList.add('hidden');
      }
    }
    
    // Ajouter l'affichage du prix de l'expérience voilier
    const sailingPriceElement = document.getElementById('sailingPrice');
    const sailingDurationElement = document.getElementById('displaySailingDuration');
    
    if (sailingPriceElement && sailingDurationElement) {
      if (calendarState.formData.sailingExperience === 'yes' && calendarState.formData.sailingDuration) {
        sailingDurationElement.textContent = calendarState.formData.sailingDuration;
        sailingPriceElement.textContent = `${calendarState.priceInfo.sailingPrice} €`;
        document.getElementById('sailingPriceSection').classList.remove('hidden');
      } else {
        document.getElementById('sailingPriceSection').classList.add('hidden');
      }
    }
    
    // Mettre à jour l'affichage du prix total avec ou sans réduction
    const priceElement = document.getElementById('totalPrice');
    if (calendarState.priceInfo.discount > 0) {
      // Afficher le prix original barré et le nouveau prix
      priceElement.innerHTML = `
        <span class="line-through text-gray-500">${calendarState.priceInfo.originalTotalPrice} €</span>
        <span class="text-green-600 font-bold ml-2">${calendarState.priceInfo.totalPrice} €</span>
      `;
      
      // Afficher la raison de la réduction
      const discountElement = document.getElementById('discountInfo');
      if (discountElement) {
        discountElement.innerHTML = `
          <div class="mt-2 bg-green-100 text-green-800 p-2 rounded-md">
            <span class="font-semibold">Économisez ${calendarState.priceInfo.discount} € : </span>
            ${calendarState.priceInfo.discountReason}
          </div>
        `;
        discountElement.classList.remove('hidden');
      }
    } else {
      // Afficher le prix normal sans barré
      priceElement.innerHTML = `${calendarState.priceInfo.totalPrice} €`;

      // Masquer la section de réduction
      const discountElement = document.getElementById('discountInfo');
      if (discountElement) {
        discountElement.classList.add('hidden');
      }
    }

    // Afficher le prix par personne par nuit
    const avgElement = document.getElementById('avgPricePerNight');
    const avgValueElement = document.getElementById('avgPricePerNightValue');
    if (avgElement && avgValueElement) {
      const nights = calendarState.priceInfo.nights;
      const totalPersons = (parseInt(calendarState.formData.adults) || 0) + (parseInt(calendarState.formData.children) || 0);
      if (nights > 0 && totalPersons > 0 && calendarState.priceInfo.totalPrice > 0) {
        const priceWithoutExtras = calendarState.priceInfo.totalPrice - calendarState.priceInfo.woodPrice - calendarState.priceInfo.sailingPrice;
        const originalWithoutExtras = calendarState.priceInfo.originalTotalPrice - calendarState.priceInfo.woodPrice - calendarState.priceInfo.sailingPrice;
        const perPersonPerNight = Math.round((priceWithoutExtras / totalPersons / nights) * 100) / 100;
        const originalPerPersonPerNight = Math.round((originalWithoutExtras / totalPersons / nights) * 100) / 100;
        if (calendarState.priceInfo.discount > 0 && originalPerPersonPerNight > perPersonPerNight) {
          avgValueElement.innerHTML = `<span class="line-through text-gray-500">${originalPerPersonPerNight.toFixed(2)} €</span> <span class="text-green-600 font-bold">${perPersonPerNight.toFixed(2)} €</span>`;
        } else {
          avgValueElement.textContent = `${perPersonPerNight.toFixed(2)} €`;
        }
        avgElement.classList.remove('hidden');
      } else {
        avgElement.classList.add('hidden');
      }
    }
  }

  function calculatePrice() {
    if (!calendarState.selectedStartDate || !calendarState.selectedEndDate) {
      calendarState.priceInfo = {
        nights: 0,
        adultPrice: '19 €',
        childPrice: '13 €',
        totalPrice: 0,
        originalTotalPrice: 0,
        discount: 0,
        discountReason: '',
        woodPrice: 0,
        sailingPrice: 0
      };
    } else {
      // Calculer le nombre de nuits
      const start = new Date(calendarState.selectedStartDate);
      const end = new Date(calendarState.selectedEndDate);
      const diffTime = Math.abs(end - start);
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Déterminer si c'est la haute saison
      const isHighSeason = start.getMonth() >= 3 && start.getMonth() <= 10;
      
      // Nombre total de personnes
      const adults = parseInt(calendarState.formData.adults) || 0;
      const children = parseInt(calendarState.formData.children) || 0;
      const totalPersons = adults + children;
      
      // Calculer le prix du bois
      let woodPrice = 0;
      if (calendarState.formData.woodOption && calendarState.formData.woodQuantity > 0) {
        const woodQuantity = parseInt(calendarState.formData.woodQuantity) || 0;
        if (calendarState.formData.woodOption === 'brouette') {
          woodPrice = woodQuantity * 10; // 10€ par brouette
        } else if (calendarState.formData.woodOption === 'caisse') {
          woodPrice = woodQuantity * 5;  // 5€ par caisse
        }
      }
      
      // Calculer le prix de l'expérience voilier
      let sailingPrice = 0;
      if (calendarState.formData.sailingExperience === 'yes' && calendarState.formData.sailingDuration) {
        switch (calendarState.formData.sailingDuration) {
          case '2h':
            sailingPrice = 90;
            break;
          case '3h':
            sailingPrice = 120;
            break;
          case '4h':
            sailingPrice = 140;
            break;
        }
      }
      
      let adultPrice, childPrice, totalPrice;
      let discountReason = '';

      // --- Calcul du prix de base (sans aucune réduction) ---
      // Ce prix sera toujours utilisé comme prix barré
      let fullPriceWithoutReduction;
      
      if (isHighSeason) {
        // Haute saison: 24€ premier adulte, 21€ suivants, 15€ par enfant, max 200€/nuit
        adultPrice = '24€ (1er) / 21€ (suiv.)';
        childPrice = '15 €';
        let nightlyBase = (adults > 0 ? 24 + (adults - 1) * 21 : 0) + children * 15;
        fullPriceWithoutReduction = nightlyBase * nights;
      } else {
        // Basse saison: 19€ par adulte, 13€ par enfant, max 200€/nuit
        adultPrice = '19 €';
        childPrice = '13 €';
        let nightlyBase = adults * 19 + children * 13;
        fullPriceWithoutReduction = nightlyBase * nights;
      }
      
      {
        // --- Calcul du prix par nuit ---
        let nightlyRaw;
        if (isHighSeason) {
          // Haute saison: 24€ premier adulte, 21€ suivants, 15€/enfant
          nightlyRaw = (adults > 0 ? 24 + (adults - 1) * 21 : 0) + children * 15;
        } else {
          // Basse saison: 19€/adulte, 13€/enfant
          nightlyRaw = adults * 19 + children * 13;
        }

        // Prix de base plafonné à 200€/nuit
        let baseTotalPrice = Math.min(nightlyRaw, 200) * nights;

        // Calculer le prix avec réduction groupe (à partir de 6 personnes, max 25%)
        // Réduction sur le prix non-plafonné, puis plafond à 200€/nuit
        let groupPrice = baseTotalPrice;
        let groupReason = '';
        if (totalPersons >= 6) {
          const discountFactor = Math.max(0.85, 1 - ((totalPersons - 5) * 0.05));
          let groupNightly = Math.min(Math.round(nightlyRaw * discountFactor), 200);
          groupPrice = groupNightly * nights;
          groupReason = 'Tarif groupe appliqué';
        }

        // Calculer le prix avec réduction séjour uniquement
        // Réduction sur le prix non-plafonné, puis plafond à 200€/nuit
        let stayPrice = baseTotalPrice;
        let stayReason = '';
        if (nights >= 4) {
          let stayNightly = Math.min(Math.round(nightlyRaw * 0.90), 200);
          stayPrice = stayNightly * nights;
          stayReason = 'Réduction 10% pour séjour de 4 nuits ou plus';
        } else if (nights >= 2) {
          let stayNightly = Math.min(Math.round(nightlyRaw * 0.95), 200);
          stayPrice = stayNightly * nights;
          stayReason = 'Réduction 5% pour séjour de 2-3 nuits';
        }

        // Appliquer uniquement la réduction la plus avantageuse (jamais combinées)
        if (groupPrice <= stayPrice && groupPrice < baseTotalPrice) {
          totalPrice = groupPrice;
          discountReason = 'Tarif groupe appliqué';
        } else if (stayPrice < baseTotalPrice) {
          totalPrice = stayPrice;
          discountReason = stayReason;
        } else {
          totalPrice = baseTotalPrice;
          // Le plafond 200€/nuit profite quand même aux groupes de 6+
          if (totalPersons >= 6) {
            discountReason = 'Tarif groupe appliqué';
          }
        }
      }
      
      // Ajouter le prix du bois et de l'expérience voilier au prix total
      totalPrice += woodPrice + sailingPrice;
      
      // Calculer le discount total
      const discount = fullPriceWithoutReduction - totalPrice + woodPrice + sailingPrice;
      
      // Mettre à jour les informations de prix
      calendarState.priceInfo = {
        nights,
        adultPrice,
        childPrice,
        totalPrice,
        originalTotalPrice: fullPriceWithoutReduction + woodPrice + sailingPrice,
        discount,
        discountReason,
        woodPrice,
        sailingPrice
      };
    }
    
    // Mettre à jour l'affichage des prix
    updatePriceDisplay();
  }

  // Configurer les écouteurs d'événements pour le formulaire
  function setupFormEventListeners() {
    // Gestionnaire pour la soumission du formulaire
    const form = document.getElementById('booking-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
    
    // Gestionnaires pour les changements de valeurs de formulaire
    document.addEventListener('change', function(event) {
      const target = event.target;
      const id = target.id;
      
      // Gérer les checkboxes de langues
      if (target.name === 'languages') {
        handleLanguageChange();
        return;
      }
      
      // Vérifier si l'élément est un champ de notre formulaire
      if (calendarState.formData.hasOwnProperty(id)) {
        calendarState.formData[id] = target.value;

        // Limiter le total adultes + enfants à 20 personnes
        if (id === 'adults' || id === 'children') {
          const adults = parseInt(calendarState.formData.adults) || 0;
          const children = parseInt(calendarState.formData.children) || 0;
          if (adults + children > 20) {
            const max = 20 - (id === 'adults' ? children : adults);
            target.value = Math.max(id === 'adults' ? 1 : 0, max);
            calendarState.formData[id] = target.value;
          }
        }

        // Mettre à jour le téléphone si le pays change
        if (id === 'country') {
          updatePhoneForCountry(target.value);
        }

        // Vérifier le progrès du formulaire pour révéler la section voilier
        if (id === 'name' || id === 'email' || id === 'phone') {
          checkFormProgress();
        }

        // Recalculer le prix si nécessaire
        if (id === 'adults' || id === 'children' || id === 'woodQuantity' || id === 'sailingDuration') {
          calculatePrice();
        }
      }
      
      if (target.id === 'woodOption') {
        calendarState.formData.woodOption = target.value;
        
        // Afficher/masquer le champ de quantité en fonction de la sélection
        const woodQuantityContainer = document.getElementById('woodQuantityContainer');
        if (woodQuantityContainer) {
          if (target.value) {
            woodQuantityContainer.classList.remove('hidden');
            const woodTypeLabel = target.value === 'brouette' ? 'brouettes' : 'caisses';
            const quantityLabel = woodQuantityContainer.querySelector('label');
            if (quantityLabel) {
              quantityLabel.textContent = `Quantité de ${woodTypeLabel}`;
            }
            // Définir une valeur par défaut de 1 lorsqu'on sélectionne une option
            calendarState.formData.woodQuantity = 1;
            const woodQuantityInput = document.getElementById('woodQuantity');
            if (woodQuantityInput) {
              woodQuantityInput.value = 1;
            }
          } else {
            // Si "Non merci" est sélectionné (valeur "")
            woodQuantityContainer.classList.add('hidden');
            calendarState.formData.woodQuantity = 0;
            // S'assurer que le formulaire considère cette valeur comme valide
            calendarState.formData.woodOption = ''; // Valeur vide explicite
          }
        }

        // Recalculer le prix
        calculatePrice();
      }
      
      if (target.id === 'woodQuantity') {
        // S'assurer que la valeur n'est jamais négative
        const value = parseInt(target.value) || 0;
        if (value < 0) {
          target.value = 0;
          calendarState.formData.woodQuantity = 0;
        } else {
          calendarState.formData.woodQuantity = value;
        }
        calculatePrice();
      }
      
    });
    
    // Gestionnaires pour les boutons de navigation du calendrier
    document.addEventListener('click', function(event) {
      const target = event.target;
      
      // Gérer le clic sur le bouton du mois précédent
      if (target.closest('#prev-month-btn')) {
        // Vérifier si le mois précédent n'est pas dans le passé
        const prevMonth = calendarState.currentDate.getMonth() - 1;
        const prevYear = prevMonth < 0 ? calendarState.currentDate.getFullYear() - 1 : calendarState.currentDate.getFullYear();
        const normalizedPrevMonth = prevMonth < 0 ? 11 : prevMonth;

        if (!isPastMonth(prevYear, normalizedPrevMonth)) {
          calendarState.currentDate = new Date(prevYear, normalizedPrevMonth, 1);
          renderCalendar();
        }
      }

      // Gérer le clic sur le bouton du mois suivant
      if (target.closest('#next-month-btn')) {
        calendarState.currentDate = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() + 1, 1);
        renderCalendar();
      }
      
      // Gérer le clic sur une cellule du calendrier
      if (target.closest('.calendar-day')) {
        const calendarDay = target.closest('.calendar-day');
        const dateAttr = calendarDay.getAttribute('data-date');
        if (dateAttr) {
          const date = new Date(dateAttr);
          handleDateClick(date);
        }
      }

      // Gérer le clic sur les options de sortie en voilier
      if (target.closest('.sailing-option')) {
        const sailingButton = target.closest('.sailing-option');
        const duration = sailingButton.getAttribute('data-sailing-duration');

        // Sauvegarder les valeurs actuelles du formulaire avant re-render
        const currentFormData = { ...calendarState.formData };
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const adultsInput = document.getElementById('adults');
        const childrenInput = document.getElementById('children');
        const messageInput = document.getElementById('message');
        const woodOptionSelect = document.getElementById('woodOption');
        const woodQuantityInput = document.getElementById('woodQuantity');

        if (nameInput) currentFormData.name = nameInput.value;
        if (emailInput) currentFormData.email = emailInput.value;
        if (phoneInput) currentFormData.phone = phoneInput.value;
        if (adultsInput) currentFormData.adults = parseInt(adultsInput.value) || 1;
        if (childrenInput) currentFormData.children = parseInt(childrenInput.value) || 0;
        if (messageInput) currentFormData.message = messageInput.value;
        if (woodOptionSelect) currentFormData.woodOption = woodOptionSelect.value;
        if (woodQuantityInput) currentFormData.woodQuantity = parseInt(woodQuantityInput.value) || 0;

        // Sauvegarder les langues cochées
        const languageCheckboxes = document.querySelectorAll('input[name="languages"]:checked');
        if (languageCheckboxes.length > 0) {
          currentFormData.languages = Array.from(languageCheckboxes).map(cb => cb.value);
        }

        // Mettre à jour l'état voilier
        if (duration) {
          currentFormData.sailingExperience = 'yes';
          currentFormData.sailingDuration = duration;
        } else {
          currentFormData.sailingExperience = 'no';
          currentFormData.sailingDuration = '';
        }

        // Appliquer les changements à l'état global
        calendarState.formData = currentFormData;

        // Re-render le formulaire pour afficher les nouveaux styles
        renderBookingForm();

        // Recalculer le prix
        calculatePrice();

        // Auto-scroll vers le résumé du prix après sélection voilier
        if (window.innerWidth < 1024) {
          setTimeout(() => {
            const priceSection = document.getElementById('price-estimation');
            if (priceSection) {
              const elementRect = priceSection.getBoundingClientRect();
              const absoluteElementTop = elementRect.top + window.pageYOffset;
              const middle = absoluteElementTop - (window.innerHeight / 3);
              window.scrollTo({ top: middle, behavior: 'smooth' });
            }
          }, 300);
        }
      }
    });

    // S'assurer que woodOption a une valeur définie même quand "Non, merci" est sélectionné
    const woodOptionSelect = document.getElementById('woodOption');
    if (woodOptionSelect && !calendarState.formData.woodOption) {
      calendarState.formData.woodOption = '';
    }
  }

  // --- FONCTIONS DE VALIDATION ANTI-FRAUDE ---

  // Validation du numéro de téléphone (format européen)
  function isValidPhone(phone) {
    const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
    // Format : optionnel + suivi de 9-15 chiffres
    if (!/^\+?[0-9]{9,15}$/.test(cleaned)) return false;
    // Bloquer les numéros manifestement faux (tous identiques)
    const digits = cleaned.replace(/^\+/, '');
    if (/^(\d)\1{8,}$/.test(digits)) return false;
    return true;
  }

  // Liste de domaines email jetables — fallback statique + chargement dynamique
  const DISPOSABLE_EMAIL_FALLBACK = new Set([
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
    'dispostable.com', 'maildrop.cc', 'temp-mail.org', 'fakeinbox.com',
    'trashmail.com', 'getnada.com', 'mohmal.com', 'emailondeck.com',
    'tempail.com', 'burnermail.io', 'mailnesia.com', 'tempr.email',
    'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org',
    'throwawaymail.com', 'mailcatch.com', 'trashmail.me', 'trashmail.net',
    'mailexpire.com', 'tempinbox.com', 'filzmail.com', 'inboxalias.com',
    'jetable.org', 'trash-mail.com', 'mytemp.email', 'tempmailo.com',
    'minutemail.com', 'spamgourmet.com', 'mailforspam.com', 'safetymail.info',
    'trashmail.io', 'harakirimail.com', '10minutemail.com', 'mailnull.com',
    'spamfree24.org', 'spaml.com', 'isfew.com', 'emailfake.com',
    'crazymailing.com', 'temporarymail.com', 'binkmail.com'
  ]);

  // Set dynamique chargé depuis GitHub (~4000 domaines, mis à jour par la communauté)
  let disposableDomains = DISPOSABLE_EMAIL_FALLBACK;
  (function loadDisposableDomains() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    fetch('https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf', { signal: controller.signal })
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(text => {
        const domains = text.split('\n').map(d => d.trim().toLowerCase()).filter(d => d && !d.startsWith('#'));
        if (domains.length > 100) {
          // Fusionner avec le fallback
          disposableDomains = new Set([...DISPOSABLE_EMAIL_FALLBACK, ...domains]);
          console.log(`\ud83d\udee1\ufe0f ${disposableDomains.size} domaines email jetables charg\u00e9s`);
        }
      })
      .catch(() => { /* fallback statique utilis\u00e9 */ })
      .finally(() => clearTimeout(timer));
  })();

  // Validation de l'email (format + domaines jetables)
  function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return { valid: false, reason: 'format' };
    const domain = email.split('@')[1].toLowerCase();
    if (disposableDomains.has(domain)) return { valid: false, reason: 'disposable' };
    if (domain.length < 4) return { valid: false, reason: 'format' };
    return { valid: true };
  }

  // Rate limiting via localStorage
  function checkRateLimit() {
    const STORAGE_KEY = 'camping_submissions';
    const MAX_PER_DAY = 3;
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"times":[]}');
      const now = Date.now();
      data.times = data.times.filter(t => now - t < 24 * 60 * 60 * 1000);
      if (data.times.length >= MAX_PER_DAY) {
        return { allowed: false, reason: 'daily_limit' };
      }
      if (data.times.length > 0 && now - data.times[data.times.length - 1] < COOLDOWN_MS) {
        const waitSec = Math.ceil((COOLDOWN_MS - (now - data.times[data.times.length - 1])) / 1000);
        return { allowed: false, reason: 'cooldown', waitSeconds: waitSec };
      }
      return { allowed: true };
    } catch (e) { return { allowed: true }; }
  }

  function recordSubmission() {
    const STORAGE_KEY = 'camping_submissions';
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"times":[]}');
      data.times.push(Date.now());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // Détection de doublons
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }

  // --- VÉRIFICATION CROISÉE DES DONNÉES ---

  // Formats de code postal par pays
  const POSTAL_CODE_FORMATS = {
    'BE': { regex: /^\d{4}$/, example: '5670', label: '4 chiffres' },
    'FR': { regex: /^\d{5}$/, example: '75001', label: '5 chiffres' },
    'NL': { regex: /^\d{4}\s?[A-Za-z]{2}$/, example: '1234 AB', label: '4 chiffres + 2 lettres' },
    'DE': { regex: /^\d{5}$/, example: '10115', label: '5 chiffres' },
    'LU': { regex: /^\d{4}$/, example: '1234', label: '4 chiffres' },
    'GB': { regex: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, example: 'SW1A 1AA', label: 'format UK' },
    'CH': { regex: /^\d{4}$/, example: '3000', label: '4 chiffres' },
    'ES': { regex: /^\d{5}$/, example: '28001', label: '5 chiffres' },
    'IT': { regex: /^\d{5}$/, example: '00100', label: '5 chiffres' }
  };

  // Préfixe téléphonique attendu par pays
  const EXPECTED_PHONE_PREFIX = {
    'BE': '32', 'FR': '33', 'NL': '31', 'DE': '49',
    'LU': '352', 'GB': '44', 'CH': '41', 'ES': '34', 'IT': '39'
  };

  // Vérifie la cohérence entre pays, code postal, téléphone et IP
  function crossValidateData(formData) {
    const checks = [];
    const country = formData.country;

    // 1. Code postal vs pays
    const postalFormat = POSTAL_CODE_FORMATS[country];
    if (postalFormat) {
      const postalClean = formData.postalCode.trim();
      if (postalFormat.regex.test(postalClean)) {
        checks.push({ test: 'Code postal vs Pays', result: 'ok', detail: `${postalClean} valide pour ${country}` });
      } else {
        checks.push({ test: 'Code postal vs Pays', result: 'suspect', detail: `"${postalClean}" ne correspond pas au format ${country} (attendu: ${postalFormat.label}, ex: ${postalFormat.example})` });
      }
    }

    // 2. Préfixe téléphone vs pays
    const expectedPrefix = EXPECTED_PHONE_PREFIX[country];
    if (expectedPrefix) {
      const phoneClean = formData.phone.replace(/[\s\-\.\(\)]/g, '');
      const phonePrefix = phoneClean.startsWith('+') ? phoneClean.substring(1) : phoneClean;
      if (phonePrefix.startsWith(expectedPrefix)) {
        checks.push({ test: 'Tel vs Pays', result: 'ok', detail: `+${expectedPrefix} correspond a ${country}` });
      } else {
        checks.push({ test: 'Tel vs Pays', result: 'suspect', detail: `${formData.phone} ne commence pas par +${expectedPrefix} (attendu pour ${country})` });
      }
    }

    // 3. IP vs pays déclaré
    if (ipGeoData && ipGeoData.country_code) {
      if (ipGeoData.country_code === country) {
        checks.push({ test: 'IP vs Pays', result: 'ok', detail: `IP ${ipGeoData.country_name} = ${country}` });
      } else {
        checks.push({ test: 'IP vs Pays', result: 'suspect', detail: `IP ${ipGeoData.country_name} (${ipGeoData.country_code}) != Declare ${country}` });
      }

      // 4. IP vs ville déclarée (comparaison approximative)
      if (ipGeoData.city) {
        const ipCity = ipGeoData.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const declaredCity = formData.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (ipCity === declaredCity || ipCity.includes(declaredCity) || declaredCity.includes(ipCity)) {
          checks.push({ test: 'IP vs Ville', result: 'ok', detail: `"${ipGeoData.city}" ~ "${formData.city}"` });
        } else {
          checks.push({ test: 'IP vs Ville', result: 'info', detail: `IP ville "${ipGeoData.city}" != Declare "${formData.city}" (peut etre normal)` });
        }
      }

      // 5. IP code postal vs déclaré
      if (ipGeoData.postal) {
        if (ipGeoData.postal === formData.postalCode.trim()) {
          checks.push({ test: 'IP vs Code postal', result: 'ok', detail: `${ipGeoData.postal} correspond` });
        } else {
          checks.push({ test: 'IP vs Code postal', result: 'info', detail: `IP postal "${ipGeoData.postal}" != Declare "${formData.postalCode}" (peut etre normal)` });
        }
      }
    } else {
      checks.push({ test: 'IP', result: 'info', detail: 'Geolocalisation IP non disponible' });
    }

    // Générer le rapport
    const suspectCount = checks.filter(c => c.result === 'suspect').length;
    const totalChecks = checks.length;
    const okCount = checks.filter(c => c.result === 'ok').length;

    let scoreLabel;
    if (suspectCount === 0) {
      scoreLabel = '\u2705 Tout coherent (' + okCount + '/' + totalChecks + ' OK)';
    } else if (suspectCount === 1) {
      scoreLabel = '\u26a0\ufe0f Attention : 1 incoherence detectee';
    } else {
      scoreLabel = '\ud83d\udea8 ALERTE : ' + suspectCount + ' incoherences detectees sur ' + totalChecks + ' verifications';
    }

    const details = checks.map(c => {
      const icon = c.result === 'ok' ? '\u2705' : c.result === 'suspect' ? '\u26a0\ufe0f' : '\u2139\ufe0f';
      return icon + ' ' + c.test + ': ' + c.detail;
    }).join('\n');

    return {
      score: scoreLabel,
      suspectCount: suspectCount,
      details: details,
      checks: checks
    };
  }

  // Géolocalisation IP (fetch au chargement)
  let ipGeoData = null;
  (function fetchIpGeo() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then(r => r.json())
      .then(data => { ipGeoData = data; })
      .catch(() => { ipGeoData = null; })
      .finally(() => clearTimeout(timer));
  })();

  // Timestamp de chargement de la page
  const PAGE_LOAD_TIME = Date.now();

  // Gérer la soumission du formulaire
  function handleSubmit(event) {
    event.preventDefault();

    // --- HONEYPOT : si les champs cachés sont remplis, c'est un bot ---
    const hpWebsite = document.getElementById('hp_website');
    const hpAddress2 = document.getElementById('hp_address2');
    if ((hpWebsite && hpWebsite.value) || (hpAddress2 && hpAddress2.value)) {
      alert("Demande de réservation envoyée avec succès !");
      return;
    }

    // --- RATE LIMITING ---
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      if (rateCheck.reason === 'daily_limit') {
        alert("Vous avez atteint le nombre maximum de demandes pour aujourd'hui (3). Veuillez réessayer demain.");
      } else {
        const minutes = Math.ceil(rateCheck.waitSeconds / 60);
        alert(`Veuillez patienter encore ${minutes} minute(s) avant de soumettre une nouvelle demande.`);
      }
      return;
    }

    // --- DÉTECTION DE DOUBLONS ---
    const submissionFingerprint = simpleHash(
      calendarState.formData.name + calendarState.formData.email +
      calendarState.formData.checkin + calendarState.formData.checkout
    );
    const prevSubmissions = JSON.parse(localStorage.getItem('camping_fingerprints') || '[]');
    if (prevSubmissions.includes(submissionFingerprint)) {
      alert("Cette demande semble être un doublon d'une réservation déjà envoyée. Si vous souhaitez modifier votre réservation, veuillez nous contacter directement.");
      return;
    }

    // Vérifier si les dates sont valides
    if (!calendarState.selectedStartDate || !calendarState.selectedEndDate) {
      alert("Veuillez sélectionner des dates d'arrivée et de départ.");
      return;
    }

    // Vérifier si la date de départ est après la date d'arrivée
    if (calendarState.selectedEndDate <= calendarState.selectedStartDate) {
      alert("La date de départ doit être postérieure à la date d'arrivée.");
      return;
    }

    // --- VALIDATION DU PAYS ---
    if (!calendarState.formData.country) {
      alert("Veuillez sélectionner votre pays.");
      document.getElementById('country')?.focus();
      return;
    }

    // --- VALIDATION DE L'ADRESSE ---
    if (!calendarState.formData.street || calendarState.formData.street.trim().length < 3) {
      alert("Veuillez entrer votre adresse (rue et numéro).");
      document.getElementById('street')?.focus();
      return;
    }
    if (!calendarState.formData.postalCode || calendarState.formData.postalCode.trim().length < 2) {
      alert("Veuillez entrer votre code postal.");
      document.getElementById('postalCode')?.focus();
      return;
    }
    if (!calendarState.formData.city || calendarState.formData.city.trim().length < 2) {
      alert("Veuillez entrer votre ville.");
      document.getElementById('city')?.focus();
      return;
    }

    // --- VALIDATION DU TÉLÉPHONE ---
    if (!isValidPhone(calendarState.formData.phone)) {
      alert("Veuillez entrer un numéro de téléphone valide (format: +32 xxx xx xx xx).");
      document.getElementById('phone')?.focus();
      return;
    }

    // --- VALIDATION DE L'EMAIL ---
    const emailCheck = isValidEmail(calendarState.formData.email);
    if (!emailCheck.valid) {
      const msg = emailCheck.reason === 'disposable'
        ? "Les adresses email temporaires ne sont pas acceptées. Veuillez utiliser votre adresse email personnelle."
        : "Veuillez entrer une adresse email valide.";
      alert(msg);
      document.getElementById('email')?.focus();
      return;
    }

    // Vérifier qu'au moins une langue est sélectionnée
    if (calendarState.formData.languages.length === 0) {
      alert("Veuillez sélectionner au moins une langue parlée.");
      return;
    }

    // Vérifier que le message est rempli
    if (!calendarState.formData.message || calendarState.formData.message.trim() === '') {
      alert("Veuillez remplir le champ message.");
      document.getElementById('message')?.focus();
      return;
    }

    // Assurer que l'option de bois a une valeur valide
    const woodOptionSelect = document.getElementById('woodOption');
    if (woodOptionSelect) {
      if (!woodOptionSelect.value) {
        calendarState.formData.woodOption = '';
        calendarState.formData.woodQuantity = 0;
      }
    }

    if (calendarState.formData.woodOption && (!calendarState.formData.woodQuantity || calendarState.formData.woodQuantity <= 0)) {
      calendarState.formData.woodQuantity = 1;
      const woodQuantityInput = document.getElementById('woodQuantity');
      if (woodQuantityInput) {
        woodQuantityInput.value = 1;
      }
    }

    if (!calendarState.formData.woodOption) {
      calendarState.formData.woodQuantity = 0;
    }

    if (calendarState.formData.sailingExperience !== 'yes') {
      calendarState.formData.sailingDuration = '';
    }

    // --- DÉSACTIVER LE BOUTON PENDANT L'ENVOI ---
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours...';
    }

    // --- VALIDATION FORMAT CODE POSTAL vs PAYS ---
    const postalFormat = POSTAL_CODE_FORMATS[calendarState.formData.country];
    if (postalFormat && !postalFormat.regex.test(calendarState.formData.postalCode.trim())) {
      alert(`Le code postal "${calendarState.formData.postalCode}" ne correspond pas au format attendu pour votre pays (${postalFormat.label}, ex: ${postalFormat.example}).`);
      document.getElementById('postalCode')?.focus();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer ma demande';
      }
      return;
    }

    // --- VÉRIFICATION CROISÉE COMPLÈTE ---
    const verification = crossValidateData(calendarState.formData);

    // --- HASH D'INTÉGRITÉ DES DONNÉES ---
    const integrityPayload = calendarState.formData.checkin + calendarState.formData.checkout +
      calendarState.formData.adults + calendarState.formData.children +
      calendarState.formData.accommodationType + calendarState.formData.woodOption +
      calendarState.formData.woodQuantity + calendarState.formData.sailingDuration;
    const integrityHash = 'v1-' + Math.abs(simpleHash(integrityPayload));

    // Ajouter le résumé du prix + métadonnées anti-fraude + rapport de vérification
    const formDataWithPrice = {
      ...calendarState.formData,
      languages: calendarState.formData.languages.join(', '),
      priceSummary: `Nombre de nuits: ${calendarState.priceInfo.nights}, Prix total estimé: ${calendarState.priceInfo.totalPrice} €`,
      _submittedAt: new Date().toISOString(),
      _timeOnPage: Math.round((Date.now() - PAGE_LOAD_TIME) / 1000) + 's',
      _userAgent: navigator.userAgent,
      _language: navigator.language,
      _screenRes: screen.width + 'x' + screen.height,
      _verificationScore: verification.score,
      _verificationDetails: verification.details,
      _ipInfo: ipGeoData ? `${ipGeoData.country_name || '?'}, ${ipGeoData.city || '?'}, CP: ${ipGeoData.postal || '?'}` : 'Non disponible',
      _integrity: integrityHash,
      _fieldEdits: Object.keys(fieldEditTracker).length > 0
        ? Object.entries(fieldEditTracker)
            .filter(([, data]) => data.count > 1)
            .map(([field, data]) => `${field}: ${data.count}x [${data.values.join(' → ')}]`)
            .join(' | ') || 'Aucune modification suspecte'
        : 'Aucune modification'
    };

    // Supprimer les champs honeypot du payload
    delete formDataWithPrice.hp_website;
    delete formDataWithPrice.hp_address2;

    // Envoyer à FormSpree
    const _ep = [104,116,116,112,115,58,47,47,102,111,114,109,115,112,114,101,101,46,105,111,47,102,47,120,122,122,100,121,107,121,113];
    fetch(_ep.map(c => String.fromCharCode(c)).join(''), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formDataWithPrice)
    })
    .then(response => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer ma demande';
      }
      if (response.ok) {
        // Enregistrer la soumission pour le rate limiting et les doublons
        recordSubmission();
        const updatedFingerprints = JSON.parse(localStorage.getItem('camping_fingerprints') || '[]');
        updatedFingerprints.push(submissionFingerprint);
        localStorage.setItem('camping_fingerprints', JSON.stringify(updatedFingerprints.slice(-20)));

        alert("Demande de réservation envoyée avec succès !\n\nImportant : Votre réservation ne sera considérée comme finalisée qu'après réception du paiement dans un délai de 3 jours suivant la confirmation de vos dates. Passé ce délai, les dates seront remises à disposition.");
        // Réinitialiser le formulaire
        calendarState.selectedStartDate = null;
        calendarState.selectedEndDate = null;
        calendarState.formData = {
          name: '',
          email: '',
          phone: '',
          country: '',
          street: '',
          postalCode: '',
          city: '',
          languages: [],
          accommodationType: '',
          adults: 1,
          children: 0,
          message: '',
          checkin: '',
          checkout: '',
          woodOption: '',
          woodQuantity: 0,
          sailingExperience: '',
          sailingDuration: ''
        };
        updateFormFields();
        renderCalendar();
        calculatePrice();
      } else {
        alert("Une erreur est survenue lors de l'envoi du formulaire.");
      }
    })
    .catch(error => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer ma demande';
      }
      console.error('Erreur:', error);
      alert("Une erreur est survenue lors de l'envoi du formulaire.");
    });
  }

  // Calculer le nombre de nuitées disponibles dans un mois
  function getAvailableNights(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let availableNights = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);

      // Ne pas compter les jours passés
      if (date < today) continue;

      // Compter si la nuit est libre (personne ne dort sur place)
      if (!isDateBooked(date)) {
        availableNights++;
      }
    }

    return availableNights;
  }

  // Rendre le calendrier
  function renderCalendar() {
    const calendarWrapper = document.getElementById('calendar-wrapper');
    if (!calendarWrapper) return;

    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth();
    
    // Vérifier si le mois précédent est dans le passé pour désactiver le bouton si nécessaire
    const prevMonth = month - 1;
    const prevYear = prevMonth < 0 ? year - 1 : year;
    const normalizedPrevMonth = prevMonth < 0 ? 11 : prevMonth;
    const isPrevMonthDisabled = isPastMonth(prevYear, normalizedPrevMonth);
    
    // Obtenir les informations sur le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDay = new Date(year, month, 1).getDay(); // 0 = Dimanche
    
    // Ajuster pour que la semaine commence le lundi
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    // Calculer les nuitées disponibles
    const availableNights = getAvailableNights(year, month);

    let calendarHTML = `
    </div>
      <div class="flex justify-between items-center mb-2">
        <button
          id="prev-month-btn"
          class="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors ${isPrevMonthDisabled ? 'opacity-50 cursor-not-allowed' : ''}"
          ${isPrevMonthDisabled ? 'disabled' : ''}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div class="text-center">
          <h3 class="text-xl font-bold text-green-800">
            ${monthNames[month]} ${year}
          </h3>
          <p class="text-sm ${availableNights <= 5 ? 'text-orange-600 font-semibold' : 'text-gray-600'}">
            ${availableNights === 0 ? 'Complet !' : `Il reste ${availableNights} nuitée${availableNights > 1 ? 's' : ''} disponible${availableNights > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          id="next-month-btn"
          class="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
        >
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
    
    // Ajouter les jours du mois
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      // Vérifier si la date est aujourd'hui
      const isToday = date.getDate() === today.getDate() && 
                     date.getMonth() === today.getMonth() && 
                     date.getFullYear() === today.getFullYear();
      
      // Vérifier si la date est réservée
      const booked = isDateBooked(date);
      const isCheckIn = isCheckInDate(date);
      const isCheckOut = isCheckOutDate(date);
      
      // Vérifier si la date est sélectionnée
      const isStartDate = calendarState.selectedStartDate && 
                       date.getDate() === calendarState.selectedStartDate.getDate() && 
                       date.getMonth() === calendarState.selectedStartDate.getMonth() && 
                       date.getFullYear() === calendarState.selectedStartDate.getFullYear();
      
      const isEndDate = calendarState.selectedEndDate && 
                     date.getDate() === calendarState.selectedEndDate.getDate() && 
                     date.getMonth() === calendarState.selectedEndDate.getMonth() && 
                     date.getFullYear() === calendarState.selectedEndDate.getFullYear();
      
      const isInRange = calendarState.selectedStartDate && calendarState.selectedEndDate && 
                     date > calendarState.selectedStartDate && date < calendarState.selectedEndDate;
      
      // Définir les classes CSS en fonction de l'état de la date
      let cellClass = "p-2 border-t border-l relative cursor-pointer ";
      let dateClass = "inline-block rounded-full w-7 h-7 leading-7 text-center text-sm ";
      
      if (isToday) {
        cellClass += "bg-green-50 ";
        if (!booked && !isStartDate && !isEndDate) {
          dateClass += "bg-green-600 text-white ";
        }
      } else {
        cellClass += "bg-white ";
      }
      
      if (booked && !isCheckIn && !isCheckOut) {
        cellClass += "cursor-not-allowed ";
      }
      
      if (isStartDate) {
        dateClass += "bg-blue-600 text-white ";
      } else if (isEndDate) {
        dateClass += "bg-blue-600 text-white ";
      } else if (isInRange) {
        cellClass += "bg-blue-100 ";
      }
      
      calendarHTML += `
        <div 
          class="${cellClass} calendar-day"
          data-date="${date.toISOString()}"
        >
          ${booked && !isCheckIn && !isCheckOut ? 
            `<div class="absolute inset-0 bg-red-500 opacity-70 z-5"></div>` : ''}
          
          ${isCheckIn ? 
            `<div class="absolute inset-0 overflow-hidden z-5">
              <div class="absolute top-0 right-0 w-1/2 h-full bg-red-500 opacity-70"></div>
            </div>` : ''}
          
          ${isCheckOut ? 
            `<div class="absolute inset-0 overflow-hidden z-5">
              <div class="absolute top-0 left-0 w-1/2 h-full bg-red-500 opacity-70"></div>
            </div>` : ''}
          
          <span class="${dateClass}">
            ${day}
          </span>
        </div>    
      `;
    }
    
    
calendarHTML += `

<!-- Légende -->
</div>
<div class="mt-4 flex flex-wrap items-center justify-center gap-4">
  <div class="flex items-center">
    <div class="w-4 h-4 bg-blue-600 mr-2 rounded-sm"></div>
    <span class="text-sm text-gray-700">Votre sélection</span>
  </div>
  <div class="flex items-center">
    <div class="w-4 h-4 bg-red-500 opacity-70 mr-2 rounded-sm"></div>
    <span class="text-sm text-gray-700">Déjà occupé</span>
  </div>
</div>

<div class="mt-6 text-center">
  <p class="text-sm text-gray-600 font-medium">
    Sélectionnez d'abord votre date d'arrivée, puis votre date de départ.<br>
    <span class="text-red-600">Les dates en rouge ne sont pas disponibles.</span>
  </p>      
</div>
`;
    
    calendarWrapper.innerHTML = calendarHTML;
  }

  function renderBookingForm() {
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;
    
    bookingForm.innerHTML = `
      <!-- Section dates -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-gray-200">Dates sélectionnées</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="checkin" class="block text-gray-700 font-medium mb-2">Date d'arrivée (Check-in 14h) *</label>
            <input 
              type="date" 
              id="checkin" 
              value="${calendarState.formData.checkin}"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              readonly
              required
            />
            <p class="text-sm text-gray-500 mt-1">Sélectionnez une date dans le calendrier</p>
          </div>
          <div>
            <label for="checkout" class="block text-gray-700 font-medium mb-2">Date de départ (Check-out 12h) *</label>
            <input 
              type="date" 
              id="checkout" 
              value="${calendarState.formData.checkout}"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              readonly
              required
            />
            <p class="text-sm text-gray-500 mt-1">
              ${calendarState.selectedStartDate && !calendarState.selectedEndDate 
                ? 'Sélectionnez une date de fin' 
                : 'Date de départ'}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Coordonnées -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-gray-200">Vos coordonnées</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="name" class="block text-gray-700 font-medium mb-2">Nom complet *</label>
            <input 
              type="text" 
              id="name" 
              value="${calendarState.formData.name}"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label for="email" class="block text-gray-700 font-medium mb-2">Email *</label>
            <input 
              type="email" 
              id="email" 
              value="${calendarState.formData.email}"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label for="phone" class="block text-gray-700 font-medium mb-2">Téléphone *</label>
            <input 
              type="tel" 
              id="phone"
              value="${calendarState.formData.phone}"
              placeholder="${(PHONE_PREFIXES[calendarState.formData.country] || PHONE_PREFIXES['OTHER']).placeholder}"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label for="country" class="block text-gray-700 font-medium mb-2">Pays *</label>
            <select
              id="country"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="" ${calendarState.formData.country === '' ? 'selected' : ''}>-- S\u00e9lectionnez --</option>
              <option value="BE" ${calendarState.formData.country === 'BE' ? 'selected' : ''}>Belgique</option>
              <option value="FR" ${calendarState.formData.country === 'FR' ? 'selected' : ''}>France</option>
              <option value="NL" ${calendarState.formData.country === 'NL' ? 'selected' : ''}>Pays-Bas</option>
              <option value="DE" ${calendarState.formData.country === 'DE' ? 'selected' : ''}>Allemagne</option>
              <option value="LU" ${calendarState.formData.country === 'LU' ? 'selected' : ''}>Luxembourg</option>
              <option value="GB" ${calendarState.formData.country === 'GB' ? 'selected' : ''}>Royaume-Uni</option>
              <option value="CH" ${calendarState.formData.country === 'CH' ? 'selected' : ''}>Suisse</option>
              <option value="ES" ${calendarState.formData.country === 'ES' ? 'selected' : ''}>Espagne</option>
              <option value="IT" ${calendarState.formData.country === 'IT' ? 'selected' : ''}>Italie</option>
              <option value="OTHER" ${calendarState.formData.country === 'OTHER' ? 'selected' : ''}>Autre</option>
            </select>
          </div>
          <div>
            <label for="street" class="block text-gray-700 font-medium mb-2">Rue et num\u00e9ro *</label>
            <input
              type="text"
              id="street"
              value="${calendarState.formData.street}"
              placeholder="Ex: Rue de la Gare 12"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label for="postalCode" class="block text-gray-700 font-medium mb-2">Code postal *</label>
            <input
              type="text"
              id="postalCode"
              value="${calendarState.formData.postalCode}"
              placeholder="Ex: 5670"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label for="city" class="block text-gray-700 font-medium mb-2">Ville *</label>
            <input
              type="text"
              id="city"
              value="${calendarState.formData.city}"
              placeholder="Ex: Olloy-sur-Viroin"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-gray-700 font-medium mb-3">Langue(s) parlée(s) * <span class="text-sm text-gray-500">(Sélectionnez toutes les langues que vous parlez)</span></label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label class="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" name="languages" value="Français" class="text-green-600 focus:ring-green-500" ${calendarState.formData.languages.includes('Français') ? 'checked' : ''}>
                <span class="text-sm">🇫🇷 Français</span>
              </label>
              <label class="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" name="languages" value="Nederlands" class="text-green-600 focus:ring-green-500" ${calendarState.formData.languages.includes('Nederlands') ? 'checked' : ''}>
                <span class="text-sm">🇳🇱 Nederlands</span>
              </label>
              <label class="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" name="languages" value="English" class="text-green-600 focus:ring-green-500" ${calendarState.formData.languages.includes('English') ? 'checked' : ''}>
                <span class="text-sm">🇬🇧 English</span>
              </label>
              <label class="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" name="languages" value="Deutsch" class="text-green-600 focus:ring-green-500" ${calendarState.formData.languages.includes('Deutsch') ? 'checked' : ''}>
                <span class="text-sm">🇩🇪 Deutsch</span>
              </label>
              <label class="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" name="languages" value="Español" class="text-green-600 focus:ring-green-500" ${calendarState.formData.languages.includes('Español') ? 'checked' : ''}>
                <span class="text-sm">🇪🇸 Español</span>
              </label>
              <label class="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" name="languages" value="Autre" class="text-green-600 focus:ring-green-500" ${calendarState.formData.languages.includes('Autre') ? 'checked' : ''}>
                <span class="text-sm">🌍 Autre</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Détails du séjour -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-gray-200">Détails du séjour</h3>
        <div class="mb-4">
          <label for="accommodationType" class="block text-gray-700 font-medium mb-2">Type d'hébergement *</label>
          <select 
            id="accommodationType" 
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="" ${calendarState.formData.accommodationType === '' ? 'selected' : ''}>-- Sélectionnez --</option>
            <option value="Tente" ${calendarState.formData.accommodationType === 'Tente' ? 'selected' : ''}>Tente</option>
            <option value="Van" ${calendarState.formData.accommodationType === 'Van' ? 'selected' : ''}>Van</option>
            <option value="Camping-car" ${calendarState.formData.accommodationType === 'Camping-car' ? 'selected' : ''}>Camping-car</option>
            <option value="Tente de toit" ${calendarState.formData.accommodationType === 'Tente de toit' ? 'selected' : ''}>Tente de toit</option>
          </select>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="adults" class="block text-gray-700 font-medium mb-2">Nombre d'adultes *</label>
            <input
              type="number"
              id="adults"
              min="1"
              max="20"
              value="${calendarState.formData.adults}"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label for="children" class="block text-gray-700 font-medium mb-2">Nombre d'enfants</label>
            <input
              type="number"
              id="children"
              min="0"
              max="20"
              value="${calendarState.formData.children}"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      <!-- Option Bois de Chauffage -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-gray-200">Bois de Chauffage</h3>
        <div class="mb-4">
          <label for="woodOption" class="block text-gray-700 font-medium mb-2">Besoin de bois pour le feu ?</label>
          <select 
            id="woodOption" 
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="" ${calendarState.formData.woodOption === '' ? 'selected' : ''}>Non, merci</option>
            <option value="brouette" ${calendarState.formData.woodOption === 'brouette' ? 'selected' : ''}>Brouette de bois (10€)</option>
            <option value="caisse" ${calendarState.formData.woodOption === 'caisse' ? 'selected' : ''}>Caisse de bois (5€)</option>
          </select>
        </div>
        <div id="woodQuantityContainer" class="${calendarState.formData.woodOption ? '' : 'hidden'}">
          <label for="woodQuantity" class="block text-gray-700 font-medium mb-2">
            Quantité de ${calendarState.formData.woodOption === 'brouette' ? 'brouettes' : 'caisses'}
          </label>
          <input 
            type="number" 
            id="woodQuantity" 
            min="0" 
            max="10" 
            value="${calendarState.formData.woodQuantity || 1}"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <!-- Information supplémentaire -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-gray-200">Information supplémentaire</h3>
        <div>
          <label for="message" class="block text-gray-700 font-medium mb-2">Message (questions, requêtes spéciales...) *</label>
          <textarea
            id="message"
            rows="4"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >${calendarState.formData.message}</textarea>
        </div>
      </div>
      
      <!-- Section Expérience Voilier - Style promotionnel (visible si dates sélectionnées ou déjà interagi) -->
      <div id="sailingExperienceSection" class="${(calendarState.selectedStartDate && calendarState.selectedEndDate) || calendarState.formData.sailingExperience ? '' : 'hidden'} mb-6 -mx-6 md:mx-0 bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 md:rounded-xl border-y md:border border-blue-200 shadow-lg">
        <div class="flex items-center mb-4">
          <div class="bg-blue-600 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold uppercase mr-2 md:mr-3">
            🎉 Exclusif
          </div>
          <span class="text-blue-800 font-semibold text-sm md:text-base">Nouveau !</span>
        </div>

        <h3 class="text-xl md:text-2xl font-bold text-blue-800 mb-3">
          ⛵ Balade en Voilier sur le Lac de l'Eau d'Heure
        </h3>

        <div class="bg-white p-3 md:p-4 rounded-lg mb-4 shadow-sm">
          <p class="text-gray-700 mb-3 text-sm md:text-base">
            <strong>Découvrez le plus grand lac de Belgique à bord de mon voilier de 7m10 !</strong><br>
            Naviguons et allons nager dans la plus belle crique du Lac de l'Eau d'Heure.
          </p>

          <p class="text-blue-800 font-semibold mb-3 text-sm md:text-base">Cliquez sur une formule pour la sélectionner :</p>

          <div class="grid grid-cols-3 gap-2 md:gap-3 mb-3">
            <button type="button" data-sailing-duration="2h" class="sailing-option text-center p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${calendarState.formData.sailingDuration === '2h' ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : 'bg-blue-50 hover:bg-blue-100'}">
              <div class="text-xl md:text-2xl font-bold ${calendarState.formData.sailingDuration === '2h' ? 'text-white' : 'text-blue-800'}">2h</div>
              <div class="font-semibold text-sm md:text-base ${calendarState.formData.sailingDuration === '2h' ? 'text-blue-100' : 'text-blue-600'}">90€</div>
              <div class="text-xs ${calendarState.formData.sailingDuration === '2h' ? 'text-blue-200' : 'text-gray-500'}">🌊</div>
            </button>
            <button type="button" data-sailing-duration="3h" class="sailing-option text-center p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${calendarState.formData.sailingDuration === '3h' ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : 'bg-blue-50 border-2 border-blue-400 hover:bg-blue-100'}">
              <div class="text-xl md:text-2xl font-bold ${calendarState.formData.sailingDuration === '3h' ? 'text-white' : 'text-blue-800'}">3h</div>
              <div class="font-semibold text-sm md:text-base ${calendarState.formData.sailingDuration === '3h' ? 'text-blue-100' : 'text-blue-600'}">120€</div>
              <div class="text-xs ${calendarState.formData.sailingDuration === '3h' ? 'text-blue-200' : 'text-gray-500'}">⭐</div>
            </button>
            <button type="button" data-sailing-duration="4h" class="sailing-option text-center p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${calendarState.formData.sailingDuration === '4h' ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : 'bg-blue-50 hover:bg-blue-100'}">
              <div class="text-xl md:text-2xl font-bold ${calendarState.formData.sailingDuration === '4h' ? 'text-white' : 'text-blue-800'}">4h</div>
              <div class="font-semibold text-sm md:text-base ${calendarState.formData.sailingDuration === '4h' ? 'text-blue-100' : 'text-blue-600'}">140€</div>
              <div class="text-xs ${calendarState.formData.sailingDuration === '4h' ? 'text-blue-200' : 'text-gray-500'}">🏊</div>
            </button>
          </div>

          <button type="button" data-sailing-duration="" class="sailing-option w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${calendarState.formData.sailingDuration === '' || !calendarState.formData.sailingExperience ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
            Non merci, pas cette fois
          </button>

          <!-- Message de confirmation de sélection -->
          <div id="sailingSelectionConfirm" class="${calendarState.formData.sailingDuration ? '' : 'hidden'} mt-3 p-2 bg-green-100 border border-green-300 rounded-lg text-center">
            <span class="text-green-800 font-medium text-sm">✓ Balade de ${calendarState.formData.sailingDuration || '...'} sélectionnée</span>
          </div>
        </div>
        
        <div class="mt-4 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
          <p class="font-semibold mb-1">ℹ️ Informations importantes :</p>
          <ul class="list-disc ml-4 space-y-1">
            <li>Expérience soumise aux conditions météo</li>
            <li>Maximum 5 adultes</li>
            <li>Gilets de sauvetage fournis</li>
            <li>Nous plannifions la sortie par message</li>
            <li>Réservez maintenant, payez après la sortie</li>
          </ul>
        </div>
      </div>
      
      <!-- Calcul des frais -->
      <div id="price-estimation" class="mb-6 p-4 bg-green-50 rounded-lg border border-green-100">
        <h3 class="text-xl font-semibold text-green-800 mb-4">Estimation des frais</h3>
        <div class="space-y-2 mb-4">
          <div class="flex justify-between">
            <span>Nombre de nuits:</span>
            <span id="numberOfNights">${calendarState.priceInfo.nights}</span>
          </div>
          <div class="flex justify-between">
            <span>Nombre d'adultes:</span>
            <span id="numberOfAdults">${calendarState.formData.adults}</span>
          </div>
          <div class="flex justify-between">
            <span>Nombre d'enfants:</span>
            <span id="numberOfChildren">${calendarState.formData.children}</span>
          </div>
          <!-- Prix du bois -->
          <div id="woodPriceSection" class="${calendarState.formData.woodOption ? '' : 'hidden'} flex justify-between">
            <span><span id="displayWoodQuantity">0</span> <span id="displayWoodType">-</span> de bois:</span>
            <span id="woodPrice">0 €</span>
          </div>
          <!-- Prix de l'expérience voilier -->
          <div id="sailingPriceSection" class="${calendarState.formData.sailingExperience === 'yes' && calendarState.formData.sailingDuration ? '' : 'hidden'} flex justify-between border-t border-blue-200 pt-2">
            <span>⛵ Balade voilier (<span id="displaySailingDuration">-</span>):</span>
            <span id="sailingPrice" class="text-blue-600 font-semibold">0 €</span>
          </div>
        </div>
        <div id="avgPricePerNight" class="hidden flex justify-between text-sm text-green-700 mb-2">
          <span>Prix par personne / nuit:</span>
          <span id="avgPricePerNightValue">0 €</span>
        </div>
        <div class="border-t border-green-200 pt-2 flex justify-between font-bold">
          <span>Total estimé:</span>
          <span id="totalPrice">
            ${calendarState.priceInfo.discount > 0
              ? `<span class="line-through text-gray-500">${calendarState.priceInfo.originalTotalPrice} €</span>
                 <span class="text-green-600 font-bold ml-2">${calendarState.priceInfo.totalPrice} €</span>`
              : `${calendarState.priceInfo.totalPrice} €`}
          </span>
        </div>
        <!-- Nouvel élément pour afficher les informations de réduction -->
        <div id="discountInfo" class="${calendarState.priceInfo.discount > 0 ? '' : 'hidden'} mt-2 bg-green-100 text-green-800 p-2 rounded-md">
          <span class="font-semibold">Économisez ${calendarState.priceInfo.discount} € :</span>
          ${calendarState.priceInfo.discountReason}
        </div>
        <div class="mt-4 text-xs text-gray-600">
          <p>Prix haute saison (1er avril - 1er novembre): 24€ (1er adulte), 21€ (suivants), 15€/enfant - max 200€/nuit</p>
          <p>Prix basse saison: 19€/adulte, 13€/enfant - max 200€/nuit</p>
          <p>Seule la réduction la plus avantageuse est appliquée (groupe ou long séjour, non cumulables).</p>
          <p>Cette estimation est fournie à titre indicatif. Le montant final sera confirmé lors de la validation de votre réservation.</p>
        </div>
      </div>
      
      <!-- Honeypot anti-bot (invisible) -->
      <div style="position:absolute;left:-9999px;opacity:0;height:0;width:0;overflow:hidden;" aria-hidden="true">
        <input type="text" id="hp_website" name="website" tabindex="-1" autocomplete="off" />
        <input type="text" id="hp_address2" name="address2" tabindex="-1" autocomplete="off" />
      </div>

      <!-- Bouton d'envoi -->
      <div class="text-center">
        <button
          type="submit"
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 inline-block"
        >
          Envoyer ma demande
        </button>
      </div>
    `;
  }

  // Vérifier si un mois est dans le passé
  function isPastMonth(year, month) {
    const today = new Date();
    return year < today.getFullYear() || 
           (year === today.getFullYear() && month < today.getMonth());
  }
});