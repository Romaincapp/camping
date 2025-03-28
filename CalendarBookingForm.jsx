const { useState, useEffect } = React;

const CalendarBookingForm = () => {
  // État pour stocker les données du calendrier
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour stocker les données du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    accommodationType: '',
    adults: 1,
    children: 0,
    message: ''
  });
  
  // État pour le calcul du prix
  const [priceInfo, setPriceInfo] = useState({
    nights: 0,
    adultPrice: '19 €',
    childPrice: '13 €',
    totalPrice: 0
  });

// Fonction pour récupérer les événements du calendrier
const fetchEvents = async () => {
  setIsLoading(true);
  try {
    // Récupérer les événements depuis Google Calendar
    const events = await fetchGoogleCalendarEvents(currentDate.getFullYear(), currentDate.getMonth());
    setEvents(events);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    // Utiliser des événements de démonstration en cas d'erreur
    const demoEvents = generateDemoEvents(currentDate.getFullYear(), currentDate.getMonth());
    setEvents(demoEvents);
  } finally {
    setIsLoading(false);
  }
};

// Fonction pour récupérer les événements depuis l'API Google Calendar
const fetchGoogleCalendarEvents = async (year, month) => {
  // Calculer le premier et dernier jour du mois
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Formater les dates pour l'API Google (format ISO)
  const timeMin = firstDay.toISOString();
  const timeMax = lastDay.toISOString();
  
  // ID de votre calendrier (généralement votre adresse email)
  const calendarId = 'romainfrancedumoulin@gmail.com'; 
  
  // Votre clé API
  const apiKey = 'AIzaSyCECx-Qj4APoyaDXEMKq9y4fVCidvxyOUk'; // Utilisez votre clé API actuelle
  
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
};
  
  // Générer des événements de démonstration
  const generateDemoEvents = (year, month) => {
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
  };
  
  // Vérifier si une date est dans une plage réservée
  const isDateBooked = (date) => {
    const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return events.some(event => {
      const eventStart = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
      const eventEnd = new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate());
      
      return formattedDate >= eventStart && formattedDate < eventEnd;
    });
  };
  
  // Vérifier si une date est une date de check-in d'un événement
  const isCheckInDate = (date) => {
    const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return events.some(event => {
      const eventStart = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
      return formattedDate.getTime() === eventStart.getTime();
    });
  };
  
  // Vérifier si une date est une date de check-out d'un événement
  const isCheckOutDate = (date) => {
    const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return events.some(event => {
      const eventEnd = new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate());
      return formattedDate.getTime() === eventEnd.getTime();
    });
  };
  
  // Gérer le clic sur une date du calendrier - Style Airbnb amélioré
  const handleDateClick = (date) => {
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
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Premier clic ou réinitialisation après une plage complète
      setSelectedStartDate(currentDate);
      setSelectedEndDate(null);
      
      // Mettre à jour le champ checkin du formulaire
      const formattedDate = formatDateForInput(currentDate);
      updateFormData('checkin', formattedDate);
      updateFormData('checkout', '');
    } else {
      // Deuxième clic pour date de fin
      if (currentDate <= selectedStartDate) {
        // Si la date cliquée est avant ou égale à la date de début,
        // on considère que l'utilisateur veut changer sa date de début
        setSelectedStartDate(currentDate);
        
        // Mettre à jour uniquement le champ checkin
        const formattedDate = formatDateForInput(currentDate);
        updateFormData('checkin', formattedDate);
        return;
      }
      
      // Vérifier s'il y a des dates réservées entre le début et la fin
      const hasConflict = checkDateRangeConflicts(selectedStartDate, currentDate);
      
      if (hasConflict) {
        alert("Il y a des dates déjà réservées dans cette plage. Veuillez choisir une autre date de fin.");
        return;
      }
      
      // Définir la date de fin
      setSelectedEndDate(currentDate);
      
      // Mettre à jour le champ checkout du formulaire
      const formattedDate = formatDateForInput(currentDate);
      updateFormData('checkout', formattedDate);
    }
  };
  
  // Vérifier si une plage de dates est valide (pas de conflits)
  const checkDateRangeConflicts = (startDate, endDate) => {
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
  };
  
  // Vérifier s'il y a des dates réservées entre deux dates
  const hasBookedDatesBetween = (startDate, endDate) => {
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Incrémenter d'un jour à la fois
    let currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + 1); // Commencer au jour après start
    
    while (currentDate < end) {
      // Permettre la sélection des dates de check-out comme fin de séjour
      if (isDateBooked(currentDate) || (isCheckInDate(currentDate) && !isCheckOutDate(currentDate))) {
        return true;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return false;
  };
  
  // Formater une date pour le champ input
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Mettre à jour les données du formulaire
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Calculer le prix du séjour
  const calculatePrice = () => {
    if (!selectedStartDate || !selectedEndDate) {
      setPriceInfo({
        nights: 0,
        adultPrice: '19 €',
        childPrice: '13 €',
        totalPrice: 0
      });
      return;
    }
    
    // Calculer le nombre de nuits
    const start = new Date(selectedStartDate);
    const end = new Date(selectedEndDate);
    const diffTime = Math.abs(end - start);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Déterminer si c'est la haute saison
    const isHighSeason = start.getMonth() >= 3 && start.getMonth() <= 10;
    
    let adultPrice, childPrice, totalPrice;
    
    if (isHighSeason) {
      // Haute saison: 19€ par adulte, 13€ par enfant
      adultPrice = '19 €';
      childPrice = '13 €';
      totalPrice = (formData.adults * 19 + formData.children * 13) * nights;
    } else {
      // Basse saison: 19€ pour la première personne, 10€ pour chaque personne supplémentaire
      adultPrice = '19€ (1er) / 10€ (autres)';
      childPrice = '10 €';
      
      const totalPersons = parseInt(formData.adults) + parseInt(formData.children);
      totalPrice = totalPersons > 0 
        ? (19 + (totalPersons - 1) * 10) * nights 
        : 0;
    }
    
    setPriceInfo({
      nights,
      adultPrice,
      childPrice,
      totalPrice
    });
  };
  
const handleSubmit = (event) => {
  event.preventDefault();
  
  // Vérifications...
  
  // Construire les données pour FormSpree
  const formDataWithPrice = {
    ...formData,
    priceSummary: `Nombre de nuits: ${priceInfo.nights}, Prix total estimé: ${priceInfo.totalPrice} €`
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
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      // Reste du code de réinitialisation...
    } else {
      alert("Une erreur est survenue lors de l'envoi du formulaire.");
    }
  })
  .catch(error => {
    console.error('Erreur:', error);
    alert("Une erreur est survenue lors de l'envoi du formulaire.");
  });
};
    
   
  
  // Charger les événements au chargement initial et à chaque changement de mois
  useEffect(() => {
    fetchEvents();
  }, [currentDate]);
  
  // Calculer le prix chaque fois que les dates ou le nombre de personnes change
  useEffect(() => {
    calculatePrice();
  }, [selectedStartDate, selectedEndDate, formData.adults, formData.children]);
  
  // Générer le calendrier
  const renderCalendar = () => {
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
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    // Préparer les cellules du calendrier
    const calendarCells = [];
    
    // Ajouter des cellules vides pour les jours avant le début du mois
    for (let i = 0; i < firstDay; i++) {
      calendarCells.push(
        <div key={`empty-${i}`} className="p-2 border-t border-l bg-gray-50"></div>
      );
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
      const isStartDate = selectedStartDate && 
                         date.getDate() === selectedStartDate.getDate() && 
                         date.getMonth() === selectedStartDate.getMonth() && 
                         date.getFullYear() === selectedStartDate.getFullYear();
      
      const isEndDate = selectedEndDate && 
                       date.getDate() === selectedEndDate.getDate() && 
                       date.getMonth() === selectedEndDate.getMonth() && 
                       date.getFullYear() === selectedEndDate.getFullYear();
      
      const isInRange = selectedStartDate && selectedEndDate && 
                       date > selectedStartDate && date < selectedEndDate;
      
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
      
      if (booked || isCheckIn) {
        cellClass += "cursor-not-allowed ";
      }
      
      if (isStartDate) {
        dateClass += "bg-blue-600 text-white ";
      } else if (isEndDate) {
        dateClass += "bg-blue-600 text-white ";
      } else if (isInRange) {
        cellClass += "bg-blue-100 ";
      }
      
      calendarCells.push(
        <div 
          key={`day-${day}`} 
          className={`${cellClass} calendar-day`}
          onClick={() => handleDateClick(date)}
        >
          {/* Fond réservé */}
          {booked && !isCheckIn && !isCheckOut && (
            <div className="absolute inset-0 bg-red-500 opacity-70 z-5"></div>
          )}
          
          {/* Check-in: moitié droite de la case remplie */}
          {isCheckIn && (
            <div className="absolute inset-0 overflow-hidden z-5">
              <div 
                className="absolute top-0 right-0 w-1/2 h-full bg-red-500 opacity-70"
              ></div>
            </div>
          )}
          
          {/* Check-out: moitié gauche de la case remplie */}
          {isCheckOut && (
            <div className="absolute inset-0 overflow-hidden z-5">
              <div 
                className="absolute top-0 left-0 w-1/2 h-full bg-red-500 opacity-70"
              ></div>
            </div>
          )}
          
          {/* Numéro du jour */}
          <span className={dateClass}>
            {day}
          </span>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <button 
            className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          
          <h3 className="text-xl font-bold text-green-800">
            {monthNames[month]} {year}
          </h3>
          
          <button 
            className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
        
        {/* En-tête des jours de la semaine */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center font-medium text-gray-600 text-sm py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 border-r border-b rounded-lg overflow-hidden">
          {calendarCells}
        </div>
        
        {/* Légende mise à jour avec nouveaux styles */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 mr-2 rounded-sm"></div>
            <span className="text-sm text-gray-700">Sélectionné</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 mr-2 rounded-sm"></div>
            <span className="text-sm text-gray-700">Plage sélectionnée</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 opacity-30 mr-2 rounded-sm"></div>
            <span className="text-sm text-gray-700">Réservé</span>
          </div>
          <div className="flex items-center">
            <div className="relative w-4 h-4 mr-2 rounded-sm">
              <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[8px] border-r-[8px] border-b-red-500 border-r-red-500"></div>
            </div>
            <span className="text-sm text-gray-700">Check-in (14h)</span>
          </div>
          <div className="flex items-center">
            <div className="relative w-4 h-4 mr-2 rounded-sm">
              <div className="absolute top-0 left-0 w-0 h-0 border-t-[8px] border-l-[8px] border-t-red-500 border-l-red-500"></div>
            </div>
            <span className="text-sm text-gray-700">Check-out (12h)</span>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Sélectionnez d'abord votre date d'arrivée, puis votre date de départ.
          </p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Côté gauche: Calendrier */}
        <div>
          <h2 className="text-3xl font-bold text-center text-green-800 mb-6">Disponibilités</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : (
            renderCalendar()
          )}
        </div>
        
        {/* Côté droit: Formulaire de réservation */}
        <div>
          <h2 className="text-3xl font-bold text-center text-green-800 mb-6">Demande de réservation</h2>
          
          {/* Avertissement */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded shadow-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Ce formulaire est uniquement une demande d'information et ne confirme pas votre réservation. Un lien de paiement vous sera envoyé une fois vos dates validées.
                </p>
              </div>
            </div>
          </div>
          
          {/* Formulaire */}
          <form 
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-gray-200">Dates sélectionnées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkin" className="block text-gray-700 font-medium mb-2">Date d'arrivée (Check-in 14h) *</label>
                  <input 
                    type="date" 
                    id="checkin" 
                    value={selectedStartDate ? formatDateForInput(selectedStartDate) : ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    readOnly
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Sélectionnez une date dans le calendrier</p>
                </div>
                <div>
                  <label htmlFor="checkout" className="block text-gray-700 font-medium mb-2">Date de départ (Check-out 12h) *</label>
                  <input 
                    type="date" 
                    id="checkout" 
                    value={selectedEndDate ? formatDateForInput(selectedEndDate) : ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    readOnly
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedStartDate && !selectedEndDate
                      ? 'Sélectionnez une date de fin'
                      : 'Date de départ'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Coordonnées */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-gray-200">Vos coordonnées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Nom complet *</label>
                  <input 
                    type="text" 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email *</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">Téléphone *</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-gray-700 font-medium mb-2">Pays</label>
                  <input 
                    type="text" 
                    id="country" 
                    value={formData.country}
                    onChange={(e) => updateFormData('country', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            {/* Détails du séjour */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-gray-200">Détails du séjour</h3>
              <div className="mb-4">
                <label htmlFor="accommodationType" className="block text-gray-700 font-medium mb-2">Type d'hébergement *</label>
                <select 
                  id="accommodationType" 
                  value={formData.accommodationType}
                  onChange={(e) => updateFormData('accommodationType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Sélectionnez --</option>
                  <option value="Tente">Tente</option>
                  <option value="Van">Van</option>
                  <option value="Camping-car">Camping-car</option>
                  <option value="Tente de toit">Tente de toit</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adults" className="block text-gray-700 font-medium mb-2">Nombre d'adultes *</label>
                  <input 
                    type="number" 
                    id="adults" 
                    min="1" 
                    value={formData.adults}
                    onChange={(e) => updateFormData('adults', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="children" className="block text-gray-700 font-medium mb-2">Nombre d'enfants</label>
                  <input 
                    type="number" 
                    id="children" 
                    min="0" 
                    value={formData.children}
                    onChange={(e) => updateFormData('children', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            {/* Information supplémentaire */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-gray-200">Information supplémentaire</h3>
              <div>
                <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message (questions, requêtes spéciales...)</label>
                <textarea 
                  id="message" 
                  value={formData.message}
                  onChange={(e) => updateFormData('message', e.target.value)}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Calcul des frais */}
            <div id="price-estimation" className="mb-6 p-4 bg-green-50 rounded-lg border border-green-100">
              <h3 className="text-xl font-semibold text-green-800 mb-4">Estimation des frais</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Nombre de nuits:</span>
                  <span id="numberOfNights">{priceInfo.nights}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prix par adulte:</span>
                  <span id="pricePerAdult">{priceInfo.adultPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prix par enfant:</span>
                  <span id="pricePerChild">{priceInfo.childPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nombre d'adultes:</span>
                  <span id="numberOfAdults">{formData.adults}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nombre d'enfants:</span>
                  <span id="numberOfChildren">{formData.children}</span>
                </div>
              </div>
              <div className="border-t border-green-200 pt-2 flex justify-between font-bold">
                <span>Total estimé:</span>
                <span id="totalPrice">{priceInfo.totalPrice} €</span>
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <p>Prix haute saison (1er avril - 1er novembre): 19€ par adulte/nuit, 13€ par enfant/nuit</p>
                <p>Prix basse saison: 19€ pour le premier adulte, 10€ par adulte supplémentaire/nuit</p>
                <p>Cette estimation est fournie à titre indicatif. Le montant final sera confirmé lors de la validation de votre réservation.</p>
              </div>
            </div>
      
            {/* Bouton d'envoi */}
            <div className="text-center">
              <button 
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 inline-block"
              >
                Envoyer ma demande
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Section des tarifs */}
      <div className="mt-12 bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-green-800 mb-4">Tarifs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="font-semibold">Haute saison (1er avril - 1er novembre) :</p>
            <ul className="list-disc ml-6 text-sm">
              <li>Adulte : 19€/nuit</li>
              <li>Enfant : 13€/nuit</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Basse saison :</p>
            <ul className="list-disc ml-6 text-sm">
              <li>Premier adulte : 19€/nuit</li>
              <li>Adultes supplémentaires : 10€/nuit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarBookingForm;
