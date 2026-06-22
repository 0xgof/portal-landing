// Portal Landing Page - Minimal JavaScript

// ==========================================
// GLOBAL CONFIG - Toggle Coming Soon overlays
// ==========================================
const PORTAL_CONFIG = {
    designerComingSoon: false,   // Set to false to remove overlay
    partnerComingSoon: false,    // Set to false to remove overlay
    backgroundLayout: "B",      // Set to "A" or "B" to switch background layout
    cardRevealAnimation: true    // Set to false to disable card reveal animation on load
};

// Make config globally accessible
window.PORTAL_CONFIG = PORTAL_CONFIG;

// Apply background layout data attribute immediately
document.body.setAttribute('data-bg-layout', PORTAL_CONFIG.backgroundLayout);

// STIX Two Math is only used by the hero title, which is hidden in layout B.
// Load it on demand so the default (B) path doesn't fetch an unused webfont.
if (PORTAL_CONFIG.backgroundLayout === 'A') {
    const stix = document.createElement('link');
    stix.rel = 'stylesheet';
    stix.href = 'https://fonts.googleapis.com/css2?family=STIX+Two+Math&display=swap';
    document.head.appendChild(stix);
}

// Mark body for card reveal animation (prevents flash before JS runs)
if (PORTAL_CONFIG.cardRevealAnimation) {
    document.body.setAttribute('data-card-reveal', 'true');
}

document.addEventListener('DOMContentLoaded', function() {
    
    // Apply Coming Soon overlays based on config
    const designerCard = document.querySelector('.designer-card');
    const partnerCard = document.querySelector('.partner-card');
    
    if (designerCard) {
        designerCard.classList.toggle('coming-soon', PORTAL_CONFIG.designerComingSoon);
    }
    if (partnerCard) {
        partnerCard.classList.toggle('coming-soon', PORTAL_CONFIG.partnerComingSoon);
    }
    
    // Handle disabled button clicks
    const disabledButtons = document.querySelectorAll('.portal-btn-disabled');
    disabledButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            // Could show a tooltip or message here
        });
    });

    // Add keyboard navigation for cards
    const cards = document.querySelectorAll('.portal-card');
    cards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const link = card.querySelector('.portal-btn:not(.portal-btn-disabled)');
                if (link) {
                    link.click();
                }
            }
        });
    });
});
