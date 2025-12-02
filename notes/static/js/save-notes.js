// Convert the current state of the canvas DOM elements into a serializable JSON array.
function serializeCanvas() {
    const elements = []; 
    const noteElements = document.querySelectorAll("#canvas .note-element"); 
    let idCounter = 0; 

    noteElements.forEach((el) => {
        const type = el.dataset.type;
        const elementData = {
            id: `element-${idCounter++}`, 
            type: type,
            content: null, 
            data: {}, 
        };

        const contentContainer = el.querySelector(".element-content");
        
        switch (type) {
            case "heading":
                elementData.content = contentContainer.querySelector(".editable-header").textContent;
                break;
            case "text":
            case "code":
                elementData.content = contentContainer.querySelector('[contenteditable="true"]').textContent;
                break;
            case "divider":
                break;
            case "checklist":
                const items = [];
                contentContainer
                    .querySelectorAll(".checklist-item")
                    .forEach((itemEl) => {
                        items.push({
                            text: itemEl.querySelector(".editable-text").textContent,
                            checked: itemEl.querySelector('input[type="checkbox"]').checked,
                        });
                    });
                elementData.data.items = items;
                break;
            case "table":
                const table = contentContainer.querySelector(".simple-table");
                const headers = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent);
                const rows = [];

                table.querySelectorAll("tbody tr").forEach((rowEl) => {
                    const rowData = Array.from(rowEl.querySelectorAll("td")).map((td) => td.textContent);
                    rows.push(rowData);
                });

                elementData.data = {
                    headers: headers,
                    rows: rows,
                };
                break;
            case "image":
            case "voice":
            case "img-text":
                elementData.data.placeholder = `Media content for ${type}`;
                break;
        }
        elements.push(elementData);
    });

    return elements;
}

// Save the current note by sending serialized data to the backend API. (MUST BE GLOBAL)
window.saveNote = async function saveNote(noteID = window.currentNoteId) {
    const titleInput = document.getElementById("note-title");
    const title = titleInput ? titleInput.value : "Untitled Note";
    const elementsData = serializeCanvas();

    const categoryID = 1;

    const payload = {
        title: title,
        category_id: categoryID, 
        data: { elements: elementsData }, 
    };

    const method = noteID ? "PATCH" : "POST";
    const url = noteID ? `${API_BASE_URL}${noteID}/` : API_BASE_URL;

    console.log("Saving Note (POST/PATCH)");

    // CSRF token retrieval for Django
    const csrftoken = window.getCookie("csrftoken");

    try {
        const response = await fetch(url, {
            method: method,
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

        // Update the global ID after a successful POST (creation)
        if (method === "POST") {
            window.currentNoteId = savedNote.id;
        }

        console.log("Note saved successfully:", savedNote);
        alert(`Note '${savedNote.title}' saved! ID: ${savedNote.id}`);
        return savedNote;
    } catch (error) {
        console.error("Error saving note:", error);
        alert("Failed to save the note. Please check the console.");
    }
}

// Helper function to get CSRF token from cookies (for Django) (MUST BE GLOBAL)
window.getCookie = function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// --- EVENT LISTENERS FOR SAVE BUTTON ---
document.addEventListener("DOMContentLoaded", () => {
    // Hook up the save button from the toolbar
    const saveButton = document.querySelector(".toolbar #save");
    saveButton.addEventListener("click", () => window.saveNote());
});