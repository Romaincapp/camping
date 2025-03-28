// Script pour rendre le composant CalendarBookingForm dans la page

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
  // Rechercher le conteneur dans lequel nous allons monter le composant React
  const reservationContainer = document.getElementById('reservation-container');
  
  // Vérifier si le conteneur existe
  if (!reservationContainer) {
    console.error('Conteneur de réservation non trouvé dans le DOM');
    return;
  }
  
  // Rendre le composant React dans le conteneur
  ReactDOM.render(
    React.createElement(CalendarBookingForm),
    reservationContainer
  );
});
