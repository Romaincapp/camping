document.addEventListener('DOMContentLoaded', function() {
  console.log("Test d'initialisation du composant...");
  
  const container = document.getElementById('reservation-container');
  
  if (!container) {
    console.error('Conteneur non trouvé');
    return;
  }
  
  try {
    console.log("React disponible:", typeof React !== 'undefined');
    console.log("ReactDOM disponible:", typeof ReactDOM !== 'undefined');
    console.log("SimpleTest disponible:", typeof SimpleTest !== 'undefined');
    
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      container.innerHTML = '<div style="color:red">Erreur: React ou ReactDOM non disponible</div>';
      return;
    }
    
    if (typeof SimpleTest !== 'function') {
      container.innerHTML = '<div style="color:red">Erreur: Composant de test non disponible</div>';
      return;
    }
    
    ReactDOM.render(
      React.createElement(SimpleTest),
      container
    );
    
    console.log("Rendu du composant SimpleTest terminé");
  } catch (error) {
    console.error('Erreur lors du test:', error);
    container.innerHTML = `<div style="color:red">Erreur: ${error.message}</div>`;
  }
});

