// --- SERIALIZE CANVAS ---
window.serializeCanvas = function () {
    return Array.from(canvas.children).map((el) => {
        const contentContainer = el.querySelector(".element-content");
        const type = el.dataset.type;
        let content = "";
        let data = {};
        let elementId = el.id;

        if (!contentContainer) return { type, content, data };

        switch (type) {
            case "heading":
            case "text":
            case "code":
                const editable = contentContainer.querySelector(
                    '[contenteditable="true"]'
                );
                content = editable ? editable.textContent : "";
                break;

            case "checklist":
                const items = [];
                contentContainer
                    .querySelectorAll(".checklist-item")
                    .forEach((item) => {
                        const textEl = item.querySelector(
                            '[contenteditable="true"]'
                        );
                        const checkboxEl = item.querySelector(
                            'input[type="checkbox"]'
                        );
                        items.push({
                            text: textEl ? textEl.textContent : "",
                            checked: checkboxEl ? checkboxEl.checked : false,
                        });
                    });
                data.items = items;
                break;

            case "table":
                const headers = Array.from(
                    contentContainer.querySelectorAll("thead th")
                ).map((th) => th.textContent);
                const rows = Array.from(
                    contentContainer.querySelectorAll("tbody tr")
                ).map((tr) => Array.from(tr.cells).map((td) => td.textContent));
                data.headers = headers;
                data.rows = rows;
                break;

            case "voice":
                // Get permanent URL from the hidden audio player
                const audioPlayer =
                    contentContainer.querySelector(".audio-player");
                // Get duration from the display element
                const durationEl =
                    contentContainer.querySelector(".audio-duration");

                data.url = audioPlayer ? audioPlayer.src : null;
                data.duration = durationEl ? durationEl.textContent : "00:00";

                // Check for new, unsaved file (uses the main element ID)
                if (
                    elementId && // elementId is already declared
                    data.url &&
                    data.url.startsWith("blob:") && // Voice recordings start as Blob URLs
                    window.newFilesToUpload.has(elementId)
                ) {
                    // Pass the elementId through to the server for tracking
                    data.temp_id = elementId;
                } else {
                    delete data.temp_id;
                }
                break;

            case "image":
            case "img-text":
                // 1. elementId is already declared

                // 2. Get the current URL from the rendered image
                const img = contentContainer.querySelector("img");

                data.url = img ? img.src : null;

                // 3. Check if this is a newly uploaded file (has a temporary ID AND a Data URL)
                if (
                    elementId && // elementId is already declared
                    data.url &&
                    // NOTE: Use Data URL check for images
                    data.url.startsWith("data:") &&
                    window.newFilesToUpload.has(elementId)
                ) {
                    // pass the elementId through to the server for tracking
                    data.temp_id = elementId;
                } else {
                    // Ensure no temporary marker is saved for permanent/old URLs
                    delete data.temp_id;
                }

                // Handle image-text editable parts
                if (type === "img-text") {
                    data.title = contentContainer.querySelector("h3")
                        ? contentContainer.querySelector("h3").textContent
                        : "";
                    data.description = contentContainer.querySelector("p")
                        ? contentContainer.querySelector("p").textContent
                        : "";
                }
                break;

            case "divider":
                break;

            default:
                const defaultEditable = contentContainer.querySelector(
                    '[contenteditable="true"]'
                );
                content = defaultEditable ? defaultEditable.textContent : "";
        }

        return { type, content, data };
    });
};

// --- SAVE NOTE ---
window.saveNote = async function (noteID = window.currentNoteId) {
    const titleInput = document.getElementById("note-title");
    const title = titleInput?.value.trim() || "Untitled Note";

    const categorySelector = document.getElementById("note-category-select");
    const selectedCategoryValue = categorySelector
        ? categorySelector.value
        : null;

    // 1. Serialize canvas data (now includes 'temp_id' for new images)
    const elementsData = window.serializeCanvas();
    const csrftoken = window.getCookie("csrftoken");

    // --- UPLOAD TEMPORARY FILES BEFORE SAVING NOTE STRUCTURE ---
    const uploadPromises = [];

    // 2. Identify files that need uploading
    const filesToUpload = elementsData.filter(el => 
        (el.type === "image" || el.type === "voice") &&
            el.data.temp_id &&
            window.newFilesToUpload.has(el.data.temp_id)
    );

    // 3. Execute Uploads
    for (const element of filesToUpload) {
        const fileObject = window.newFilesToUpload.get(element.data.temp_id);
        const formData = new FormData();
        formData.append("image", fileObject);
        // Ensure the server knows which note this belongs to (for organization)
        if (noteID) formData.append("note_id", noteID);

        // Define a separate API endpoint for file uploads
        uploadPromises.push(
            fetch("/api/upload-image/", {
                method: "POST",
                headers: { "X-CSRFToken": csrftoken },
                body: formData,
            })
                .then((response) => {
                    if (!response.ok)
                        throw new Error(
                            `Image Upload failed: ${response.status}`
                        );
                    return response.json();
                })
                .then((uploadResult) => {
                    // Get the ID BEFORE you delete the temp_id property on the element object
                    const tempIdToDelete = element.data.temp_id;

                    // On success, update the element's data with the permanent URL
                    element.data.url = uploadResult.permanent_url;

                    // Remove temporary marker from data object
                    delete element.data.temp_id;

                    // Use the captured ID to remove the file from the cache Map
                    window.newFilesToUpload.delete(tempIdToDelete);
                })
                .catch((error) => {
                    console.error(
                        `Error uploading image (ID: ${element.data.temp_id}):`,
                        error
                    );
                    // On failure, clear the URL so the element shows a placeholder on load
                    element.data.url = null;
                })
        );
    }

    // Wait for all uploads to complete before proceeding to save the note's structure
    await Promise.all(uploadPromises);
    // -----------------------------------------------------------------

    // 4. Prepare final payload (elementsData now contains permanent URLs)
    const payload = {
        title,
        data: { elements: elementsData },
    };
    if (selectedCategoryValue) payload.category_id = selectedCategoryValue;

    const method = noteID ? "PATCH" : "POST";
    const url = noteID
        ? `${window.API_BASE_URL}${noteID}/`
        : window.API_BASE_URL;

    try {
        // 5. Save the note structure
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const savedNote = await response.json();
        if (method === "POST") window.currentNoteId = savedNote.id;

        alert(`Note '${savedNote.title}' saved! ID: ${savedNote.id}`);
        return savedNote;
    } catch (error) {
        console.error("Error saving note:", error);
        alert("Failed to save the note. Check console for details.");
    }
};

// --- DELETE NOTE ---
window.deleteNote = async function () {
    if (!window.currentNoteId) return alert("Cannot delete: No note loaded.");

    if (
        !confirm(
            `Delete note ID ${window.currentNoteId}? This cannot be undone.`
        )
    )
        return;

    const url = `${window.API_BASE_URL}${window.currentNoteId}/`;
    const csrftoken = window.getCookie("csrftoken");

    try {
        const response = await fetch(url, {
            method: "DELETE",
            headers: { "X-CSRFToken": csrftoken },
        });

        if (!response.ok) {
            throw new Error(
                `API Error: Failed to delete note: ${response.status}`
            );
        }

        alert(`Note ID ${window.currentNoteId} deleted successfully.`);
        window.clearNote();

        // Optionally refresh history drawer if open
        const drawer = document.getElementById("history-drawer");
        if (
            drawer &&
            !drawer.classList.contains("closed") &&
            window.fetchNoteHistory
        ) {
            const history = await window.fetchNoteHistory();
            window.renderNoteHistory(history);
        }
    } catch (error) {
        console.error("Error deleting note:", error);
        alert(`Failed to delete note: ${error.message}`);
    }
};

// --- GET COOKIE ---
window.getCookie = function (name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );
                break;
            }
        }
    }
    return cookieValue;
};

// --- CLEAR NOTE ---
window.clearNote = function () {
    window.currentNoteId = null;
    canvas.innerHTML = "";
    const titleInput = document.getElementById("note-title");
    if (titleInput) titleInput.value = "";
    const categorySelector = document.getElementById("note-category-select");
    if (categorySelector) categorySelector.selectedIndex = 0;
};

// --- EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    const saveButton = document.querySelector(".toolbar #save");
    if (saveButton)
        saveButton.addEventListener("click", () => window.saveNote());

    const deleteButton = document.querySelector(".toolbar #delete");
    if (deleteButton)
        deleteButton.addEventListener("click", () => window.deleteNote());
});

// --- Download PDF Note ---
document.getElementById('download-btn').addEventListener('click', () => {
    // Assume currentNoteId is the ID of the note currently open
    const currentNoteId = getCurrentNoteIdFromURL(); 

    if (currentNoteId) {
        // Construct the URL to hit the new Django view
        const downloadUrl = `/api/notes/${currentNoteId}/export-pdf/`;
        
        // This instantly triggers the download via the server response headers
        window.location.href = downloadUrl; 
    } else {
        alert('Please save the note before downloading.');
    }
});