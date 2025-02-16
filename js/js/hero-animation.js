// js/hero-animation.js
const HeroAnimation = () => {
    const [camping, tent, trees, bonfire] = [
        createIcon('🚐', 'camping'),
        createIcon('⛺', 'tent'),
        createIcon('🌲', 'trees'),
        createIcon('🔥', 'bonfire')
    ];

    // Configuration des animations GSAP
    gsap.set([camping, tent, trees, bonfire], {
        opacity: 0,
        scale: 0.8
    });

    const tl = gsap.timeline({ repeat: -1 });

    // Animation des éléments
    tl.to(trees, {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "back.out(1.7)"
    })
    .to(tent, {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "back.out(1.7)"
    }, "-=0.5")
    .to(bonfire, {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "back.out(1.7)"
    }, "-=0.5")
    .to(camping, {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "back.out(1.7)"
    }, "-=0.5");

    // Animations continues
    gsap.to(bonfire, {
        scale: 1.1,
        repeat: -1,
        yoyo: true,
        duration: 0.5,
        ease: "power1.inOut"
    });

    return `
        <div class="hero-animation">
            ${trees}
            ${tent}
            ${camping}
            ${bonfire}
        </div>
    `;
};

// Fonction helper pour créer les icônes
function createIcon(emoji, className) {
    return `<div class="icon ${className}">${emoji}</div>`;
}

// Initialiser l'animation
document.addEventListener('DOMContentLoaded', () => {
    const heroContainer = document.getElementById('hero-animation');
    if (heroContainer) {
        heroContainer.innerHTML = HeroAnimation();
    }
});
