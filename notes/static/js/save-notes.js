// --- SERIALIZE CANVAS ---
window.serializeCanvas = function () {
    return Array.from(canvas.children).map((el) => {
        const contentContainer = el.querySelector(".element-content");
        const type = el.dataset.type;
        let content = "";
        let data = {};

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
            case "image":
            case "img-text":
                // 1. Get the element ID from the main wrapper
                const elementId = el.id;

                // 2. Get the current URL from the rendered image
                const imgWrapper =
                    contentContainer.querySelector(".image-wrapper");
                const img = contentContainer.querySelector("img");

                data.url = img ? img.src : null;

                // 3. Check if this is a newly uploaded file (has a temporary ID AND a Data URL)
                if (
                    elementId &&
                    data.url &&
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
    const title = titleInput ? titleInput.value : "Untitled Note";

    const categorySelector = document.getElementById("note-category-select");
    const selectedCategoryValue = categorySelector ? categorySelector.value : null;

    // 1. Serialize canvas data (now includes 'temp_id' for new images)
    const elementsData = window.serializeCanvas();
    const csrftoken = window.getCookie("csrftoken");

    // --- UPLOAD TEMPORARY FILES BEFORE SAVING NOTE STRUCTURE ---
    const uploadPromises = [];
    
    // 2. Identify files that need uploading
    const filesToUpload = elementsData.filter(el => 
        el.type === 'image' && el.data.temp_id && window.newFilesToUpload.has(el.data.temp_id)
    );

    // 3. Execute Uploads
    for (const element of filesToUpload) {
        const fileObject = window.newFilesToUpload.get(element.data.temp_id);
        const formData = new FormData();
        formData.append('image', fileObject);
        // Ensure the server knows which note this belongs to (for organization)
        if (noteID) formData.append('note_id', noteID); 

        // Define a separate API endpoint for file uploads
        uploadPromises.push(
            fetch('/api/upload-image/', { 
                method: 'POST',
                headers: { 'X-CSRFToken': csrftoken },
                body: formData
            })
            .then(response => {
                if (!response.ok) throw new Error(`Image Upload failed: ${response.status}`);
                return response.json();
            })
            .then(uploadResult => {
                // On success, update the element's data with the permanent URL
                element.data.url = uploadResult.permanent_url; 
                
                // Remove temporary markers and file from cache
                delete element.data.temp_id; 
                window.newFilesToUpload.delete(element.data.temp_id);
            })
            .catch(error => {
                console.error(`Error uploading image (ID: ${element.data.temp_id}):`, error);
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
        data: { elements: elementsData }
    };
    if (selectedCategoryValue) payload.category_id = selectedCategoryValue;

    const method = noteID ? "PATCH" : "POST";
    const url = noteID ? `${window.API_BASE_URL}${noteID}/` : window.API_BASE_URL;

    try {
        // 5. Save the note structure
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const savedNote = await response.json();
        if (method === "POST") window.currentNoteId = savedNote.id;

        console.log("Note saved successfully:", savedNote);
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
