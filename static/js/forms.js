document.addEventListener("DOMContentLoaded", () => {
    const newsletterWrapper = document.getElementById("newsletter-wrapper");
    const newsletterForm = newsletterWrapper.querySelector(".newsletter-form");

    newsletterForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(newsletterForm);

        try {
            const response = await fetch(newsletterForm.action, {
                method: "POST",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: formData
            });

            if (response.ok) {
                // Replace form with thank-you message
                newsletterWrapper.innerHTML = `
                    <div class="newsletter-thankyou">
                        🎉 Thank you for subscribing to our newsletter!
                    </div>
                `;
            } else {
                // Handle form errors
                const errorText = await response.text();
                alert("There was an error: " + errorText);
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
        }
    });
});
