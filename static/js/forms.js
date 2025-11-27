document.addEventListener("DOMContentLoaded", () => {
    const forms = document.querySelectorAll(".newsletter-form");

    forms.forEach(form => {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Remove any existing message
            const existingMsg = form.parentElement.querySelector(".newsletter-message");
            if (existingMsg) existingMsg.remove();

            const formData = new FormData(form);

            try {
                const response = await fetch(form.action, {
                    method: "POST",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    },
                    body: formData
                });

                const data = await response.json();

                // Create message element
                const messageEl = document.createElement("p");
                messageEl.classList.add("newsletter-message");
                messageEl.style.marginTop = "10px";
                messageEl.style.fontWeight = "bold";

                if (data.success) {
                    messageEl.textContent = "Thank you for subscribing!";
                    form.style.display = "none"; // hide the form
                } else {
                    messageEl.textContent = `There was an error: ${data.error || "Please try again."}`;
                }

                // Insert message below the form
                form.parentElement.appendChild(messageEl);

            } catch (err) {
                console.error("Newsletter submission error:", err);
            }
        });
    });
});
