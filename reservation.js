// Script pour rendre le composant CalendarBookingForm dans la page

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initialisation du composant de réservation...");
  
  // Rechercher le conteneur dans lequel nous allons monter le composant React
  const reservationContainer = document.getElementById('reservation-container');
  
  // Vérifier si le conteneur existe
  if (!reservationContainer) {
    console.error('Conteneur de réservation non trouvé dans le DOM');
    return;
  }

  try {
    // Assurer que React et ReactDOM sont disponibles
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      console.error('React ou ReactDOM non disponible');
      return;
    }

    // Vérifier que le composant CalendarBookingForm existe
    if (typeof CalendarBookingForm !== 'function') {
      console.error('Le composant CalendarBookingForm n\'est pas défini');
      reservationContainer.innerHTML = '<div class="p-4 bg-red-100 text-red-700 rounded">Erreur de chargement du calendrier</div>';
      return;
    }
    
    // Rendre le composant React dans le conteneur
    ReactDOM.render(
      React.createElement(CalendarBookingForm),
      reservationContainer
    );
    
    console.log("Composant de réservation rendu avec succès");
  } catch (error) {
    console.error('Erreur lors du rendu du composant:', error);
    reservationContainer.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded">Erreur: ${error.message}</div>`;
  }
});
