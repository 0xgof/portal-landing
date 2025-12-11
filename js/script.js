// Portal Landing Page - Minimal JavaScript

// ==========================================
// GLOBAL CONFIG - Toggle Coming Soon overlays
// ==========================================
const PORTAL_CONFIG = {
    designerComingSoon: false,   // Set to false to remove overlay
    partnerComingSoon: false     // Set to false to remove overlay
};

// Make config globally accessible
window.PORTAL_CONFIG = PORTAL_CONFIG;

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
