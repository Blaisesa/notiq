// Get the logo track element
const logoTrack = document.querySelector('.logo-track');

// If the user navigates away from the tab, pause the animation
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    logoTrack.style.animationPlayState = 'paused';
  } else {
    logoTrack.style.animationPlayState = 'running';
  }
});

// Tab Navigation Logic
document.addEventListener('DOMContentLoaded', function() {
    // 1. Get all tab buttons and content sections
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // 2. Add a click listener to each button
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab; // e.g., 'founder-content'

            // --- Step A: Update Button States ---

            // Remove 'active' class from all buttons
            tabLinks.forEach(item => item.classList.remove('active'));
            // Add 'active' class to the clicked button
            link.classList.add('active');


            // --- Step B: Update Content Visibility ---

            // Hide all content sections
            tabContents.forEach(content => content.classList.remove('active'));

            // Show the specific content section linked to the button
            const activeContent = document.getElementById(tabId);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
});

// Glowing Card Effect
const cards = Array.from(document.querySelectorAll(".glowing-card"));
const cardsContainer = document.querySelector("#glowing-cards");

cardsContainer.addEventListener("mousemove", (e) => {
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  }
});