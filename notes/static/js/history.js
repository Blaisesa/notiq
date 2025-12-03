window.fetchNoteHistory = async function fetchNoteHistory() {
    try {
        // Uses the global API_BASE_URL
        const response = await fetch(API_BASE_URL);

        if (!response.ok) {
            throw new Error(`Failed to fetch history: ${response.status}`);
        }

        const history = await response.json();
        return history;
    } catch (error) {
        console.error("Error fetching note history:", error);
        return [];
    }
};

// --- RENDER NOTE HISTORY (MUST BE GLOBAL) ---
window.renderNoteHistory = function renderNoteHistory(notes) {
    const listContainer = document.getElementById("note-history-list");
    listContainer.innerHTML = "";

    if (notes.length === 0) {
        listContainer.innerHTML =
            '<li class="no-notes">No saved notes yet.</li>';
        return;
    }

    notes.forEach((note) => {
        const date = new Date(note.updated_at);
        const formattedDate =
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const listItem = document.createElement("li");
        listItem.className = "history-item";
        listItem.dataset.noteId = note.id;

        listItem.innerHTML = `
            <span class="history-title">${note.title || "Untitled Note"}</span>
            <span class="history-date">${formattedDate}</span>
        `;

        // Attach the click event handler
        listItem.addEventListener("click", () => {
            window.handleNoteClick(note.id);
        });

        listContainer.appendChild(listItem);
    });
};

// --- HANDLE NOTE CLICK FROM HISTORY (MUST BE GLOBAL) ---
window.handleNoteClick = function handleNoteClick(noteId) {
    if (
        confirm(
            `Are you sure you want to load note ID ${noteId}? Any unsaved changes will be lost.`
        )
    ) {
        // Calls the global loadNote function from load-notes.js
        window.loadNote(noteId);
        document.getElementById("history-drawer").classList.add("closed");
    }
};

// --- EVENT LISTENERS FOR HISTORY DRAWER ---
document.addEventListener("DOMContentLoaded", () => {
    // We assume the save button listener is handled in save-notes.js,
    // but the history drawer logic is here:

    const drawer = document.getElementById("history-drawer");
    const toggleBtn = document.getElementById("toggle-history-btn");
    const closeBtn = document.getElementById("close-drawer-btn");
    const clearButton = document.querySelector(".toolbar #clear-note-btn");

    if (toggleBtn) {
        toggleBtn.addEventListener("click", async () => {
            drawer.classList.toggle("closed");
            // Only fetch and render if opening the drawer
            if (!drawer.classList.contains("closed")) {
                const history = await window.fetchNoteHistory();
                window.renderNoteHistory(history);
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            drawer.classList.add("closed");
        });
    }

    if (clearButton) {
        clearButton.addEventListener("click", () => window.clearNote());
    }
    
});

// --- CLEAR NOTE BUTTON FUNCTIONALITY ---
window.clearNote = function clearNote() {
    if (
        !confirm(
            "Are you sure you want to clear the current note? Any unsaved changes will be lost."
        )
    ) {
        return;
    }

    // 1. Clear all elements from the canvas
    window.canvas.innerHTML = "";

    // 2. Clear the title input
    const titleInput = document.getElementById("note-title");
    if (titleInput) {
        titleInput.value = "Untitled Note";
    }

    // 3. Reset the global ID to null
    // This ensures the next save operation uses POST to create a new record.
    window.currentNoteId = null;

    console.log("Canvas cleared and currentNoteId reset to null.");
    alert("New blank note created.");
};
