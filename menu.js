document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.category-section');
    const desktopLinks = document.querySelectorAll('.sidebar-categories a');
    const mobileLinks = document.querySelectorAll('.mobile-category-scroll a');

    function activateSection(sectionId) {
        // Remove active class from all links and sections
        desktopLinks.forEach(link => link.classList.remove('active'));
        mobileLinks.forEach(link => link.classList.remove('active'));
        sections.forEach(sec => sec.classList.remove('active-section'));
        
        // Find target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active-section');
            
            // Add active to corresponding links
            const targetHref = `#${sectionId}`;
            desktopLinks.forEach(link => {
                if (link.getAttribute('href') === targetHref) {
                    link.classList.add('active');
                }
            });
            
            mobileLinks.forEach(link => {
                if (link.getAttribute('href') === targetHref) {
                    link.classList.add('active');
                    
                    // Scroll mobile pill container
                    const container = document.querySelector('.mobile-category-scroll');
                    if (container) {
                        const scrollLeft = link.offsetLeft - (container.offsetWidth / 2) + (link.offsetWidth / 2);
                        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                    }
                }
            });
            
            // Scroll to top of page (or near top) when changing tabs
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Handle clicks
    [...desktopLinks, ...mobileLinks].forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // If the link is an anchor on the same page
            if (href.startsWith('#')) {
                e.preventDefault(); // Stop normal anchor link jump behavior
                const sectionId = href.substring(1);
                
                // Update URL without jumping
                window.history.pushState(null, '', href);
                activateSection(sectionId);
            }
        });
    });

    // Check URL hash on load
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
        activateSection(hash.substring(1));
    } else if (sections.length > 0) {
        // Default to first section
        activateSection(sections[0].getAttribute('id'));
    }
});
