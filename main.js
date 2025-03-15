 
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
   

         document.addEventListener('DOMContentLoaded', function() {
        // Récupération des éléments
        const toggleButton = document.getElementById('toggleAgenda');
        const agendaContainer = document.getElementById('agendaContainer');

        // État initial
        let isAgendaVisible = false;

        // Fonction pour basculer l'affichage
        toggleButton.addEventListener('click', function() {
            isAgendaVisible = !isAgendaVisible;
            
            // Changement de la hauteur pour révéler ou cacher
            if (isAgendaVisible) {
                agendaContainer.style.maxHeight = agendaContainer.scrollHeight + "px";
                toggleButton.textContent = "Cacher les disponibilités";
            } else {
                agendaContainer.style.maxHeight = "0";
                toggleButton.textContent = "Voir les disponibilités";
            }
        });
    });
