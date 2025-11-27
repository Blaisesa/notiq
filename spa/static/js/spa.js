/**
 * SPA logic for smooth manual CSS sliding transitions
 * Forward: old slides right, new slides left
 * Backward: old slides left, new slides right
 * Dynamically adjusts height on content changes
 */

const mainContainer = document.querySelector("main");
let currentPageElement = null;
let lastPageIndex = 0;
let resizeTimeout;

// --- Height Management ---
function adjustMainContainerHeight(pageElement) {
    if (!mainContainer || !pageElement) return;
    const footer = document.querySelector("footer");
    const footerHeight = footer ? footer.offsetHeight : 0;
    const minHeight = window.innerHeight - footerHeight;
    const calculatedHeight = Math.max(pageElement.scrollHeight, minHeight);
    mainContainer.style.height = `${calculatedHeight}px`;
}

// --- Dynamic Height Observer ---
const observer = new MutationObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        adjustMainContainerHeight(currentPageElement);
    }, 50);
});

function observeCurrentPage() {
    observer.disconnect();
    if (!currentPageElement) return;
    observer.observe(currentPageElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "open"]
    });

    // Listen for <details> toggle events
    currentPageElement.querySelectorAll("details").forEach((d) => {
        d.addEventListener("toggle", () => adjustMainContainerHeight(currentPageElement));
    });
}

// --- Utility Functions ---
function getInitialPageId() {
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(`${hash}-content`)) return hash;
    return "home";
}

function updateNavLinks(pageId) {
    document.querySelectorAll(".nav-menu a").forEach(link => link.classList.remove("active-link"));
    const activeLink = document.querySelector(`.nav-menu a[data-page="${pageId}"]`);
    if (activeLink) activeLink.classList.add("active-link");
}

// --- Core Navigation ---
function navigateTo(newPageId) {
    const oldPage = currentPageElement;
    const newPage = document.getElementById(`${newPageId}-content`);
    if (!newPage || newPage === oldPage) return;

    if (!oldPage) {
        currentPageElement = newPage;
        newPage.classList.remove("hidden");
        updateNavLinks(newPageId);
        adjustMainContainerHeight(newPage);
        observeCurrentPage();
        return;
    }

    const currentIndex = parseInt(oldPage.getAttribute("data-index"));
    const newIndex = parseInt(newPage.getAttribute("data-index"));
    const forward = newIndex > lastPageIndex;
    lastPageIndex = newIndex;

    const oldEnd = forward ? "150%" : "-150%";
    const newStart = forward ? "-150%" : "150%";

    // --- Prepare new page ---
    newPage.style.transition = "none";
    newPage.style.transform = `translateX(${newStart})`;
    newPage.style.opacity = 0;
    newPage.style.zIndex = 2;
    newPage.classList.remove("hidden");

    // Force reflow
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const easing = "transform 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.55s ease";
            newPage.style.transition = easing;
            oldPage.style.transition = easing;

            // --- Slide + Fade ---
            newPage.style.transform = "translateX(-50%)";
            newPage.style.opacity = 1;
            oldPage.style.transform = `translateX(${oldEnd})`;
            oldPage.style.opacity = 0;
        });
    });

    // --- Cleanup & Adjust Height AFTER transition ---
    const onTransitionEnd = () => {
        oldPage.classList.add("hidden");
        oldPage.style.transition = "none";
        oldPage.style.transform = "translateX(-50%)";
        oldPage.style.opacity = 1;
        oldPage.style.zIndex = "";

        currentPageElement = newPage;
        newPage.style.transition = ""; // restore CSS transitions

        // --- Adjust height after slide/fade completes ---
        adjustMainContainerHeight(newPage);

        // Start observing for dynamic changes
        observeCurrentPage();

        oldPage.removeEventListener("transitionend", onTransitionEnd);
    };
    oldPage.addEventListener("transitionend", onTransitionEnd);

    updateNavLinks(newPageId);
}

// --- Event Handlers ---
function handleLinkClick(event) {
    const link = event.target.closest("a");
    if (link && link.hasAttribute("data-page")) {
        event.preventDefault();
        const pageId = link.getAttribute("data-page");
        if (pageId === window.location.hash.slice(1)) return;
        window.history.pushState(null, null, `#${pageId}`);
        navigateTo(pageId);
    }
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", handleLinkClick);

    document.querySelectorAll(".spa-page").forEach((page, index) => page.setAttribute("data-index", index));

    const initialId = getInitialPageId();
    const initialPage = document.getElementById(`${initialId}-content`);

    if (initialPage) {
        document.querySelectorAll(".spa-page").forEach(p => p.classList.add("hidden"));
        initialPage.classList.remove("hidden");
        initialPage.classList.add("active");
        currentPageElement = initialPage;
        lastPageIndex = parseInt(initialPage.getAttribute("data-index"));
        adjustMainContainerHeight(initialPage);
        observeCurrentPage();
    }

    updateNavLinks(initialId);
    window.history.replaceState(null, null, `#${initialId}`);

    window.addEventListener("load", () => adjustMainContainerHeight(currentPageElement));
    window.addEventListener("resize", () => setTimeout(() => adjustMainContainerHeight(currentPageElement), 50));
});

// --- Browser back/forward buttons ---
window.addEventListener("popstate", () => {
    const targetPage = getInitialPageId();
    navigateTo(targetPage);
});
