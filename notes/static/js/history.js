let fullNoteHistory = []; // Store full history for searching
window.currentCategoryFilterId = null; // Global variable for category filter

window.fetchNoteHistory = async function fetchNoteHistory() {
    let url = API_BASE_URL;
    const params = new URLSearchParams();

    if (window.currentCategoryFilterId) {
        params.append('category_id', window.currentCategoryFilterId);
    }

    const searchTerm = document.getElementById('history-search-input').value.trim();
    
    if (searchTerm) {
        params.append('search', searchTerm);
    }

    if (params.toString()) {
        url += '?' + params.toString();
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch history: ${response.status}`);
        }

        const history = await response.json();
        
        // CRITICAL: Render the notes immediately after a successful fetch
        window.renderNoteHistory(history); 
        
        return history;
    } catch (error) {
        console.error("Error fetching note history:", error);
        // Display an error message to the user
        window.renderNoteHistory([]); // Render empty list or an error message
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
        const categoryName = note.category_name || 'Uncategorized';

        listItem.innerHTML = `
            <span class="history-category">${categoryName}</span>
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

window.renderCategoryList = function renderCategoryList(categories) {
    // ... (logic to populate the category list element, e.g., category-list)
    const categoryListElement = document.getElementById("category-list");
    if (!categoryListElement) return;

    // Clear and add all/default category option
    categoryListElement.innerHTML = `<li data-id="all" onclick="window.setCategoryFilter(null)" class="active">All Notes</li>`;

    categories.forEach(category => {
        const listItem = document.createElement("li");
        listItem.textContent = category.name;
        listItem.dataset.id = category.id;
        listItem.style.borderLeft = `3px solid ${category.color || '#ccc'}`;
        
        // --- NEW CLICK HANDLER ---
        listItem.onclick = () => window.setCategoryFilter(category.id);
        
        categoryListElement.appendChild(listItem);
    });
    window.categories = categories;
};

window.setCategoryFilter = function setCategoryFilter(categoryId) {
    // 1. Update global state and UI active class
    window.currentCategoryFilterId = categoryId;
    
    const activeList = document.querySelectorAll('#category-list li.active');
    activeList.forEach(el => el.classList.remove('active'));
    
    const targetElement = document.querySelector(`#category-list li[data-id="${categoryId || 'all'}"]`);
    if (targetElement) {
        targetElement.classList.add('active');
    }

    // 2. Re-fetch the note history with the new filter
    window.fetchNoteHistory(); 
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
            window.fetchNoteHistory();
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

    alert("New blank note created.");
};
