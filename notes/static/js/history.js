let fullNoteHistory = []; // Store full history for searching

window.fetchNoteHistory = async function fetchNoteHistory() {
    try {
        // Uses the global API_BASE_URL
        const response = await fetch(API_BASE_URL);

        if (!response.ok) {
            throw new Error(`Failed to fetch history: ${response.status}`);
        }

        const history = await response.json();
        fullNoteHistory = history; // Store the full history for searching
        return history;
    } catch (error) {
        console.error("Error fetching note history:", error);
        fullNoteHistory = []; // Clear the full history on error
        return [];
    }
};

// --- RENDER NOTE HISTORY ---
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

// --- SEARCH FUNCTIONALITY FOR HISTORY ---
function searchNoteHistory(query) {
    const lowerCaseQuery = query.toLowerCase().trim(); // Trim whitespace for accurate matching

    if (lowerCaseQuery.length === 0) {
        // If query is empty, show full history
        window.renderNoteHistory(fullNoteHistory);
        return;
    }

    const filteredNotes = fullNoteHistory.filter((note) => {
        const title = note.title || "Untitled Note";
        return title.toLowerCase().includes(lowerCaseQuery);
    });

    window.renderNoteHistory(filteredNotes);
}

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

    const drawer = document.getElementById("history-drawer");
    const toggleBtn = document.getElementById("toggle-history-btn");
    const closeBtn = document.getElementById("close-drawer-btn");
    const clearButton = document.querySelector(".toolbar #clear-note-btn");
    const searchInput = document.getElementById("history-search-input");

    if (toggleBtn) {
        toggleBtn.addEventListener("click", async () => {
            drawer.classList.toggle("closed");
            // Only fetch and render if opening the drawer
            if (!drawer.classList.contains("closed")) {
                const history = await window.fetchNoteHistory();
                searchInput.value = ""; // Clear search input
                window.renderNoteHistory(history);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchNoteHistory(e.target.value);
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
