// Add fade-out before navigating away from the page
// This script adds a fade-out effect when navigating to internal links
// So that the transition looks smooth and not overly different from spa page transitions
document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;

    // Wait for next paint + assets to settle
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            body.classList.add("fade-ready"); // smooth fade-in
        });
    });

    // Fade out on navigation
    document.querySelectorAll("a[href]").forEach(link => {
        const href = link.getAttribute("href");

        // Skip SPA and anchor links
        if (href.startsWith("/#") || href.startsWith("#")) return;

        // Skip external links
        if (href.startsWith("http") && !href.startsWith(location.origin)) return;

        // Skip email link
        if (link.id === "email-link") return;

        link.addEventListener("click", e => {
            e.preventDefault();
            body.style.opacity = 0;
            setTimeout(() => (window.location.href = href), 300);
        });
    });
});

// Fix BFCache restore
window.addEventListener("pageshow", e => {
    if (e.persisted) {
        document.body.style.opacity = 1;
    }
});