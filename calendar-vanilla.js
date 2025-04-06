// calendar-vanilla.js

document.addEventListener('DOMContentLoaded', function() {
  // État global du calendrier
  const calendarState = {
    currentDate: new Date(),
    selectedStartDate: null,
    selectedEndDate: null,
    events: [],
    isLoading: true,
    formData: {
      name: '',
      email: '',
      phone: '',
      country: '',
      accommodationType: '',
      adults: 1,
      children: 0,
      message: '',
      checkin: '',
      checkout: ''
    },
    priceInfo: {
      nights: 0,
      adultPrice: '19 €',
      childPrice: '13 €',
      totalPrice: 0
    }
  };

  // Constantes
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Sélecteurs DOM
  const container = document.getElementById('reservation-container');
  
  // Initialiser l'interface
  initializeCalendarUI();

  // Fonction pour initialiser l'interface utilisateur
  function initializeCalendarUI() {
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
    console.log("Début du chargement des événements...");
    calendarState.isLoading = true;
    updateLoadingState();
    
    // Essayer de récupérer les événements depuis Google Calendar
    try {
      fetchGoogleCalendarEvents()
        .then(events => {
          calendarState.events = events;
          calendarState.isLoading = false;
          updateLoadingState();
          renderCalendar(); // Mettre à jour le calendrier avec les nouveaux événements
          console.log("Événements chargés avec succès:", events.length);
        })
        .catch(error => {
          console.error("Erreur lors de la récupération des événements:", error);
          // Utiliser des événements de démonstration en cas d'erreur
          calendarState.events = generateDemoEvents();
          calendarState.isLoading = false;
          updateLoadingState();
          renderCalendar();
        });
    } catch (error) {
      console.error("Exception lors de la récupération des événements:", error);
      // Utiliser des événements de démonstration en cas d'erreur
      calendarState.events = generateDemoEvents();
      calendarState.isLoading = false;
      updateLoadingState();
      renderCalendar();
    }
    
    // Ajouter un délai maximum pour le chargement
    setTimeout(() => {
      if (calendarState.isLoading) {
        console.log("Délai d'attente dépassé, chargement des événements de démo");
        calendarState.events = generateDemoEvents();
        calendarState.isLoading = false;
        updateLoadingState();
        renderCalendar();
      }
    }, 5000);
  }

  // Fonction pour récupérer les événements depuis l'API Google Calendar
  async function fetchGoogleCalendarEvents() {
    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth();
    
    // Calculer le premier et dernier jour du mois
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Formater les dates pour l'API Google (format ISO)
    const timeMin = firstDay.toISOString();
    const timeMax = lastDay.toISOString();
    
    // ID de votre calendrier
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
    console.log(`${data.items ? data.items.length : 0} événements récupérés`);
    
    // Transformer les événements Google Calendar en format utilisable par notre calendrier
    return data.items ? data.items.map(event => ({
      id: event.id,
      title: event.summary || 'Réservé',
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date)
    })) : [];
  }

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
        return;
      }
      
      // Définir la date de fin
      calendarState.selectedEndDate = currentDate;
      
      // Mettre à jour le champ checkout du formulaire
      calendarState.formData.checkout = formatDateForInput(currentDate);
      updateFormFields();
    }
    
    // Mettre à jour l'affichage du calendrier
    renderCalendar();
    
    // Calculer le prix
    calculatePrice();
  }

  // Mettre à jour les champs de formulaire
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

 // Remplacer la fonction updatePriceDisplay dans calendar-vanilla.js

function updatePriceDisplay() {
  // Mettre à jour les informations de prix dans le DOM
  document.getElementById('numberOfNights').textContent = calendarState.priceInfo.nights;
  document.getElementById('pricePerAdult').textContent = calendarState.priceInfo.adultPrice;
  document.getElementById('pricePerChild').textContent = calendarState.priceInfo.childPrice;
  document.getElementById('numberOfAdults').textContent = calendarState.formData.adults;
  document.getElementById('numberOfChildren').textContent = calendarState.formData.children;
  
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
      discountReason: ''
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
    
    let adultPrice, childPrice, totalPrice;
    let discountReason = '';
    
    // --- Vérifier si c'est une réservation de dernière minute (jour même) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateOnly = new Date(start);
    startDateOnly.setHours(0, 0, 0, 0);
    const isLastMinute = startDateOnly.getTime() === today.getTime();
    
    // --- Calcul du prix de base (sans aucune réduction) ---
    // Ce prix sera toujours utilisé comme prix barré
    let fullPriceWithoutReduction;
    
    if (isHighSeason) {
      // Haute saison: 19€ par adulte, 13€ par enfant sans AUCUNE réduction
      adultPrice = '19 €';
      childPrice = '13 €';
      fullPriceWithoutReduction = (adults * 19 + children * 13) * nights;
    } else {
      // Basse saison: 19€ pour la première personne, 10€ pour chaque personne supplémentaire
      adultPrice = '19€ (1er) / 10€ (autres)';
      childPrice = '10 €';
      fullPriceWithoutReduction = totalPersons > 0 
        ? (19 + (totalPersons - 1) * 10) * nights 
        : 0;
    }
    
    // --- Appliquer la promo dernière minute si applicable ---
    if (isLastMinute) {
      // Promo dernière minute: 10€ par personne pour la première nuit, tarif normal pour les suivantes
      let firstNightPrice = totalPersons * 10;
      let remainingNightsPrice = 0;
      
      if (nights > 1) {
        // Calculer le prix normal pour les nuits restantes
        if (isHighSeason) {
          // Haute saison pour les nuits restantes
          if (totalPersons >= 6 && totalPersons < 10) {
            // Tarif dégressif pour 6-9 personnes
            const regularPrice = (adults * 19 + children * 13) * (nights - 1);
            const discountFactor = 1 - ((totalPersons - 5) * 0.05);
            remainingNightsPrice = Math.round(regularPrice * discountFactor);
          } else if (totalPersons >= 10 && totalPersons <= 14) {
            remainingNightsPrice = 100 * (nights - 1); // 100€/nuit pour 10-14 personnes
          } else if (totalPersons >= 15 && totalPersons <= 19) {
            remainingNightsPrice = 150 * (nights - 1); // 150€/nuit pour 15-19 personnes
          } else if (totalPersons >= 20) {
            remainingNightsPrice = 200 * (nights - 1); // 200€/nuit pour 20+ personnes
          } else {
            remainingNightsPrice = (adults * 19 + children * 13) * (nights - 1);
          }
        } else {
          // Basse saison pour les nuits restantes
          if (totalPersons >= 6 && totalPersons < 10) {
            const regularPrice = totalPersons > 0 
              ? (19 + (totalPersons - 1) * 10) * (nights - 1) 
              : 0;
            const discountFactor = 1 - ((totalPersons - 5) * 0.05);
            remainingNightsPrice = Math.round(regularPrice * discountFactor);
          } else if (totalPersons >= 10 && totalPersons <= 19) {
            remainingNightsPrice = 100 * (nights - 1); // 100€/nuit pour 10-19 personnes
          } else if (totalPersons >= 20) {
            remainingNightsPrice = 150 * (nights - 1); // 150€/nuit pour 20+ personnes
          } else {
            remainingNightsPrice = totalPersons > 0 
              ? (19 + (totalPersons - 1) * 10) * (nights - 1) 
              : 0;
          }
        }
        
        // Appliquer réduction séjour sur les nuits restantes
        let stayDiscount = 0;
        if (nights >= 4) {
          stayDiscount = 0.10; // 10% pour 4 nuits ou plus
        } else if (nights >= 2) {
          stayDiscount = 0.05; // 5% pour 2-3 nuits
        }
        
        if (stayDiscount > 0) {
          remainingNightsPrice = Math.round(remainingNightsPrice * (1 - stayDiscount));
        }
      }
      
      // Prix total = promo première nuit + prix normal pour les nuits restantes
      totalPrice = firstNightPrice + remainingNightsPrice;
      
      if (nights === 1) {
        discountReason = 'Promo dernière minute (10€/personne)';
      } else {
        discountReason = `Promo dernière minute pour la 1ère nuit (10€/personne) + tarif normal pour les ${nights-1} nuits suivantes`;
      }
    } else {
      // --- Calcul du prix avec les réductions de groupe ---
      if (isHighSeason) {
        // Haute saison
        if (totalPersons >= 6 && totalPersons < 10) {
          // Tarif dégressif pour 6-9 personnes
          const regularPrice = (adults * 19 + children * 13) * nights;
          const discountFactor = 1 - ((totalPersons - 5) * 0.05);  // 5% de réduction par personne au-delà de 5
          totalPrice = Math.round(regularPrice * discountFactor);
          discountReason = 'Tarif groupe appliqué';
        } else if (totalPersons >= 10 && totalPersons <= 14) {
          // Prix fixe pour groupes de 10-14 personnes: 100€/nuit max
          const dailyPrice = 100;
          totalPrice = dailyPrice * nights;
          discountReason = 'Forfait groupe appliqué (max 100€/nuit)';
        } else if (totalPersons >= 15 && totalPersons <= 19) {
          // Prix fixe pour groupes de 15-19 personnes: 150€/nuit max
          const dailyPrice = 150;
          totalPrice = dailyPrice * nights;
          discountReason = 'Forfait groupe appliqué (max 150€/nuit)';
        } else if (totalPersons >= 20) {
          // Prix fixe pour groupes de 20+ personnes: 200€/nuit max
          const dailyPrice = 200;
          totalPrice = dailyPrice * nights;
          discountReason = 'Forfait groupe appliqué (max 200€/nuit)';
        } else {
          // Tarif standard pour moins de 6 personnes
          totalPrice = (adults * 19 + children * 13) * nights;
        }
      } else {
        // Basse saison
        if (totalPersons >= 6 && totalPersons < 10) {
          // Tarif dégressif pour 6-9 personnes
          const regularPrice = totalPersons > 0 
            ? (19 + (totalPersons - 1) * 10) * nights 
            : 0;
          const discountFactor = 1 - ((totalPersons - 5) * 0.05);  // 5% de réduction par personne au-delà de 5
          totalPrice = Math.round(regularPrice * discountFactor);
          discountReason = 'Tarif groupe appliqué';
        } else if (totalPersons >= 10 && totalPersons <= 19) {
          // Prix fixe pour groupes de 10-19 personnes: 100€/nuit max
          const dailyPrice = 100;
          totalPrice = dailyPrice * nights;
          discountReason = 'Forfait groupe appliqué (max 100€/nuit)';
        } else if (totalPersons >= 20) {
          // Prix fixe pour groupes de 20+ personnes: 150€/nuit max
          const dailyPrice = 150;
          totalPrice = dailyPrice * nights;
          discountReason = 'Forfait groupe appliqué (max 150€/nuit)';
        } else {
          // Tarif standard pour moins de 6 personnes
          totalPrice = totalPersons > 0 
            ? (19 + (totalPersons - 1) * 10) * nights 
            : 0;
        }
      }
      
      // Prix intermédiaire après application des tarifs groupe mais avant réduction durée
      let priceAfterGroupDiscount = totalPrice;
      
      // --- Appliquer réduction sur la durée du séjour ---
      let stayDiscount = 0;
      if (nights >= 4) {
        stayDiscount = 0.10; // 10% pour 4 nuits ou plus
        if (discountReason) discountReason += ' + ';
        discountReason += 'Réduction 10% pour séjour de 4 nuits ou plus';
      } else if (nights >= 2) {
        stayDiscount = 0.05; // 5% pour 2-3 nuits
        if (discountReason) discountReason += ' + ';
        discountReason += 'Réduction 5% pour séjour de 2-3 nuits';
      }
      
      // Appliquer la réduction sur durée du séjour
      if (stayDiscount > 0) {
        totalPrice = Math.round(totalPrice * (1 - stayDiscount));
      }
    }
    
    // Utiliser fullPriceWithoutReduction comme prix barré original
    calendarState.priceInfo = {
      nights,
      adultPrice,
      childPrice,
      totalPrice,
      originalTotalPrice: fullPriceWithoutReduction,
      discount: fullPriceWithoutReduction - totalPrice,
      discountReason
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
      
      // Vérifier si l'élément est un champ de notre formulaire
      if (calendarState.formData.hasOwnProperty(id)) {
        calendarState.formData[id] = target.value;
        
        // Recalculer le prix si nécessaire
        if (id === 'adults' || id === 'children') {
          calculatePrice();
        }
      }
    });
    
    // Gestionnaires pour les boutons de navigation du calendrier
    document.addEventListener('click', function(event) {
      const target = event.target;
      
      // Gérer le clic sur le bouton du mois précédent
      if (target.closest('#prev-month-btn')) {
        calendarState.currentDate = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() - 1, 1);
        fetchEvents();
      }
      
      // Gérer le clic sur le bouton du mois suivant
      if (target.closest('#next-month-btn')) {
        calendarState.currentDate = new Date(calendarState.currentDate.getFullYear(), calendarState.currentDate.getMonth() + 1, 1);
        fetchEvents();
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
    });
  }

  // Gérer la soumission du formulaire
  function handleSubmit(event) {
    event.preventDefault();
    
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
    
    // Ajouter le résumé du prix aux données du formulaire
    const formDataWithPrice = {
      ...calendarState.formData,
      priceSummary: `Nombre de nuits: ${calendarState.priceInfo.nights}, Prix total estimé: ${calendarState.priceInfo.totalPrice} €`
    };
    
    // Envoyer à FormSpree
    fetch('https://formspree.io/f/xzzdykyq', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formDataWithPrice)
    })
    .then(response => {
      if (response.ok) {
        alert("Demande de réservation envoyée avec succès!");
        // Réinitialiser le formulaire
        calendarState.selectedStartDate = null;
        calendarState.selectedEndDate = null;
        calendarState.formData = {
          name: '',
          email: '',
          phone: '',
          country: '',
          accommodationType: '',
          adults: 1,
          children: 0,
          message: '',
          checkin: '',
          checkout: ''
        };
        // Mettre à jour l'interface
        updateFormFields();
        renderCalendar();
        calculatePrice();
      } else {
        alert("Une erreur est survenue lors de l'envoi du formulaire.");
      }
    })
    .catch(error => {
      console.error('Erreur:', error);
      alert("Une erreur est survenue lors de l'envoi du formulaire.");
    });
  }

  // Rendre le calendrier
  function renderCalendar() {
    const calendarWrapper = document.getElementById('calendar-wrapper');
    if (!calendarWrapper) return;
    
    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth();
    
    // Obtenir les informations sur le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDay = new Date(year, month, 1).getDay(); // 0 = Dimanche
    
    // Ajuster pour que la semaine commence le lundi
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    let calendarHTML = `
      <div class="flex justify-between items-center mb-4">
        <button 
          id="prev-month-btn"
          class="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <h3 class="text-xl font-bold text-green-800">
          ${monthNames[month]} ${year}
        </h3>
        
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
      </div>
      
      <!-- Légende -->
      <div class="mt-4 flex flex-wrap items-center justify-center gap-4">
        <div class="flex items-center">
          <div class="w-4 h-4 bg-blue-600 mr-2 rounded-sm"></div>
          <span class="text-sm text-gray-700">Sélectionné</span>
        </div>
        <div class="flex items-center">
          <div class="w-4 h-4 bg-blue-100 mr-2 rounded-sm"></div>
          <span class="text-sm text-gray-700">Plage sélectionnée</span>
        </div>
        <div class="flex items-center">
          <div class="w-4 h-4 bg-red-500 opacity-30 mr-2 rounded-sm"></div>
          <span class="text-sm text-gray-700">Réservé</span>
        </div>
        <div class="flex items-center">
          <div class="relative w-4 h-4 mr-2 rounded-sm">
            <div class="absolute bottom-0 right-0 w-0 h-0 border-b-[8px] border-r-[8px] border-b-red-500 border-r-red-500"></div>
          </div>
          <span class="text-sm text-gray-700">Check-in (14h)</span>
        </div>
        <div class="flex items-center">
          <div class="relative w-4 h-4 mr-2 rounded-sm">
            <div class="absolute top-0 left-0 w-0 h-0 border-t-[8px] border-l-[8px] border-t-red-500 border-l-red-500"></div>
          </div>
          <span class="text-sm text-gray-700">Check-out (12h)</span>
        </div>
      </div>
      
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Sélectionnez d'abord votre date d'arrivée, puis votre date de départ.
        </p>
      </div>
    `;
    
    calendarWrapper.innerHTML = calendarHTML;
  }

 // Modifier la fonction renderBookingForm dans calendar-vanilla.js

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
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label for="country" class="block text-gray-700 font-medium mb-2">Pays</label>
          <input 
            type="text" 
            id="country" 
            value="${calendarState.formData.country}"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
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
            value="${calendarState.formData.children}"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
    
    <!-- Information supplémentaire -->
    <div class="mb-6">
      <h3 class="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-gray-200">Information supplémentaire</h3>
      <div>
        <label for="message" class="block text-gray-700 font-medium mb-2">Message (questions, requêtes spéciales...)</label>
        <textarea 
          id="message" 
          rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >${calendarState.formData.message}</textarea>
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
          <span>Prix par adulte:</span>
          <span id="pricePerAdult">${calendarState.priceInfo.adultPrice}</span>
        </div>
        <div class="flex justify-between">
          <span>Prix par enfant:</span>
          <span id="pricePerChild">${calendarState.priceInfo.childPrice}</span>
        </div>
        <div class="flex justify-between">
          <span>Nombre d'adultes:</span>
          <span id="numberOfAdults">${calendarState.formData.adults}</span>
        </div>
        <div class="flex justify-between">
          <span>Nombre d'enfants:</span>
          <span id="numberOfChildren">${calendarState.formData.children}</span>
        </div>
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
        <p>Prix haute saison (1er avril - 1er novembre): 19€ par adulte/nuit, 13€ par enfant/nuit</p>
        <p>Prix basse saison: 19€ pour le premier adulte, 10€ par adulte supplémentaire/nuit</p>
        <p>Cette estimation est fournie à titre indicatif. Le montant final sera confirmé lors de la validation de votre réservation.</p>
      </div>
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
});
