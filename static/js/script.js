// Add fade-out before navigating away from the page
// This script adds a fade-out effect when navigating to internal links
// So that the transition looks smooth and not overly different from spa page transitions
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  // Fade in page on load
  body.style.opacity = 0;
  requestAnimationFrame(() => {
    body.style.transition = "opacity 0.5s ease";
    body.style.opacity = 1;
  });

  // Handle page navigation links
  document.querySelectorAll("a[href]").forEach(link => {
    const href = link.getAttribute("href");

    // Skip SPA links (anchors within the home page)
    if (href.startsWith("/#") || href === "/") return;

    // Skip external links
    if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;

    link.addEventListener("click", e => {
      e.preventDefault();

      // Fade out
      body.style.opacity = 0;

      // After fade-out, navigate
      setTimeout(() => {
        window.location.href = href;
      }, 200); // match CSS transition duration
    });
  });
});
