/**
 * Core JavaScript logic for Single Page Application (SPA) navigation.
 * Handles hash-based routing, active link styling, and content switching.
 */

// Function to handle the routing logic
function navigateTo(pageId) {
    // 1. Determine the target content ID based on the data-page attribute
    const contentId = `${pageId}-content`;
    
    // 2. Hide all SPA pages
    document.querySelectorAll('.spa-page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });

    // 3. Show the active page
    const activePage = document.getElementById(contentId);
    if (activePage) {
        // We use a small timeout to allow the transition effect (if any) to work cleanly
        setTimeout(() => {
            activePage.classList.remove('hidden');
            activePage.classList.add('active');
        }, 50); 
    } else {
        // Fallback for an invalid page ID (e.g., redirect to home)
        navigateTo('home');
        return;
    }

    // 4. Update the active state of navigation links
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active-link');
    });

    // Select the specific link that triggered the navigation
    const activeLink = document.querySelector(`.nav-menu a[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active-link');
    }
}

// Function to handle link clicks
function handleLinkClick(event) {
    // Only handle links that have the data-page attribute (our SPA links)
    if (event.target.closest('a') && event.target.closest('a').hasAttribute('data-page')) {
        event.preventDefault(); // STOP the browser from following the link normally

        const link = event.target.closest('a');
        const pageId = link.getAttribute('data-page');

        // Update the browser history (URL hash) and navigate
        window.history.pushState(null, null, `#${pageId}`);
        navigateTo(pageId);
    }
}

// Function to get the initial page ID from the URL hash
function getInitialPageId() {
    const hash = window.location.hash.slice(1); // Remove the '#'
    
    // Check if the hash corresponds to a valid page content ID
    if (hash && document.getElementById(`${hash}-content`)) {
        return hash;
    }
    // Default to 'home' if hash is empty or invalid
    return 'home';
}

// --- Event Listeners and Initial Load ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Set up the click handler on the navigation menu
    const navMenu = document.getElementById('spa-nav');
    if (navMenu) {
        navMenu.addEventListener('click', handleLinkClick);
    }

    // 2. Handle initial page load based on URL hash
    const initialPage = getInitialPageId();
    // Use replaceState to set the initial hash cleanly without adding a new history entry
    window.history.replaceState(null, null, `#${initialPage}`);
    navigateTo(initialPage);
});

// 3. Handle back/forward button clicks (popstate event)
window.addEventListener('popstate', () => {
    const targetPage = getInitialPageId();
    navigateTo(targetPage);
});