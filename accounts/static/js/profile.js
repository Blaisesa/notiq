document.addEventListener("DOMContentLoaded", function () {
    const profileLinks = document.querySelectorAll(
        ".profile-link, .active-profile-link"
    );
    const overviewSection = document.getElementById("overview");
    const settingsSection = document.getElementById("settings");

    // --- 1. Tab Switching Logic ---
    profileLinks.forEach((link) => {
        link.addEventListener("click", function () {
            // Remove active class from all links
            profileLinks.forEach((l) =>
                l.classList.remove("active-profile-link")
            );
            // Add active class to the clicked link
            this.classList.add("active-profile-link");

            const section = this.getAttribute("data-section");
            if (section === "overview") {
                overviewSection.style.display = "block";
                settingsSection.style.display = "none";
            } else if (section === "settings") {
                overviewSection.style.display = "none";
                settingsSection.style.display = "block";
            }
        });
    });

    // --- 2. Safe Account Deletion Logic ---
    // Target the link using its class (e.g., '.delete-account-link')
    const deleteLink = document.querySelector(".delete-account-link");

    if (deleteLink) {
        deleteLink.addEventListener("click", function (e) {
            // STEP 1: Always prevent the default navigation immediately.
            e.preventDefault(); 
            
            // STEP 2: Display the confirmation dialog.
            const isConfirmed = confirm('WARNING: Are you sure you want to delete your account? This action is permanent and cannot be undone. All notes and data will be lost.');
            
            // STEP 3: If confirmed, manually redirect using the URL stored in data-href.
            if (isConfirmed) {
                const url = this.getAttribute("data-href");
                if (url) {
                    window.location.href = url;
                }
            }
            // If NOT confirmed, the function ends, and the page is not redirected.
        });
    }
});