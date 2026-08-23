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

    // Filter Functionality
    const toggles = document.querySelectorAll('.toggle-switch input');
    const showAllBtns = document.querySelectorAll('.diet-icon.all');
    const searchInputs = document.querySelectorAll('.search-input');
    
    function applyFilters() {
        const savedPref = localStorage.getItem('dietPreference') || 'all';
        const searchQuery = (searchInputs[0] ? searchInputs[0].value : '').toLowerCase().trim();
        
        const items = document.querySelectorAll('.menu-item');
        items.forEach(item => {
            const hasVeg = item.querySelector('.diet-icon.veg') !== null;
            const hasNonVeg = item.querySelector('.diet-icon.non-veg') !== null;
            const title = item.querySelector('.item-name')?.textContent.toLowerCase() || '';
            const desc = item.querySelector('.item-desc')?.textContent.toLowerCase() || '';
            
            // Diet check
            let dietMatch = true;
            if (savedPref === 'non-veg') {
                dietMatch = hasNonVeg || (!hasVeg && !hasNonVeg);
            } else if (savedPref === 'veg') {
                dietMatch = hasVeg || (!hasVeg && !hasNonVeg);
            }
            
            // Search check
            let searchMatch = true;
            if (searchQuery) {
                searchMatch = title.includes(searchQuery) || desc.includes(searchQuery);
            }
            
            if (dietMatch && searchMatch) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Hide empty sections
        sections.forEach(section => {
            const visibleItems = section.querySelectorAll('.menu-item[style="display: flex;"], .menu-item:not([style*="display: none"])');
            if (visibleItems.length === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = ''; 
            }
        });
    }

    function updateToggleUI(state) {
        toggles.forEach(t => {
            if (state === 'all') {
                t.indeterminate = true;
                t.checked = false;
            } else if (state === 'non-veg') {
                t.indeterminate = false;
                t.checked = true;
            } else {
                t.indeterminate = false;
                t.checked = false;
            }
        });
        
        showAllBtns.forEach(btn => {
            btn.style.opacity = state === 'all' ? '1' : '0.5';
        });
    }

    function setDietPreference(state) {
        localStorage.setItem('dietPreference', state);
        updateToggleUI(state);
        applyFilters();
    }

    if (toggles.length > 0 || searchInputs.length > 0) {
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const state = e.target.checked ? 'non-veg' : 'veg';
                setDietPreference(state);
            });
        });
        
        showAllBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setDietPreference('all');
            });
        });
        
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                searchInputs.forEach(i => { if (i !== e.target) i.value = val; });
                applyFilters();
            });
        });
        
        const savedPref = localStorage.getItem('dietPreference') || 'all';
        updateToggleUI(savedPref);
        applyFilters();
    }
});
