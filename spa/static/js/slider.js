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