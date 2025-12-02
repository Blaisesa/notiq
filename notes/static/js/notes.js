const canvas = document.getElementById("canvas");
let draggedEl = null; // Holds the element being reordered
let currentNoteId = null; // Holds the ID of the current note
const API_BASE_URL = "/api/notes/"; // Base URL for API endpoints

// --- 1. SIDEBAR DRAG (Creating new items) ---
document.querySelectorAll(".sidebar .element").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
        // We are dragging a NEW item
        draggedEl = null; // Ensure this is null so reorder logic doesn't fire
        e.dataTransfer.setData("type", e.target.dataset.type);
        e.dataTransfer.effectAllowed = "copy";
    });
});

// --- 2. CANVAS DROP (Adding new items only) ---
canvas.addEventListener("dragover", (e) => {
    e.preventDefault();
    // If we are dragging a sidebar item, it's a copy. If reordering, it's a move.
    e.dataTransfer.dropEffect = draggedEl ? "move" : "copy";
});

canvas.addEventListener("drop", (e) => {
    e.preventDefault();

    // If 'draggedEl' exists, this is a reorder event that bubbled up.
    // We ignore it here because the element-level handler takes care of reordering.
    if (draggedEl) return;

    // If we get here, it means it's a Sidebar Drop
    const type = e.dataTransfer.getData("type");
    if (type) {
        addElementToCanvas(type);
    }
});

// --- 3. ELEMENT CREATION & LOGIC ---

// --- REUSABLE FUNCTION FOR ATTACHING ACTION BUTTON LISTENERS ---
function attachElementLogic(contentContainer, type) {
    // --- LOGIC TO MAKE TABLE BUTTONS WORK ---
    if (type === "table") {
        const tableEl = contentContainer.querySelector(".simple-table");

        // Helper function to get the number of columns
        const getColCount = () => tableEl.querySelector("tr").cells.length;

        // --- Add Column Logic ---
        contentContainer
            .querySelector(".add-col-btn")
            .addEventListener("click", () => {
                // Add a header cell
                const newHeader = document.createElement("th");
                newHeader.contentEditable = "true";
                // Only use 'Header' title if there is already a header row
                const currentHeaders = tableEl.querySelector("thead tr");
                newHeader.textContent = currentHeaders ? `Header ${getColCount() + 1}` : "";
                currentHeaders.appendChild(newHeader);

                // Add a data cell to every body row
                tableEl.querySelectorAll("tbody tr").forEach((row) => {
                    const newCell = document.createElement("td");
                    newCell.contentEditable = "true";
                    newCell.textContent = "";
                    row.appendChild(newCell);
                });
            });

        // --- Remove Column Logic ---
        contentContainer
            .querySelector(".remove-col-btn")
            .addEventListener("click", () => {
                const colCount = getColCount();
                if (colCount > 1) {
                    // Remove the last header cell
                    tableEl.querySelector("thead tr").lastElementChild.remove();

                    // Remove the last cell from every body row
                    tableEl.querySelectorAll("tbody tr").forEach((row) => {
                        row.lastElementChild.remove();
                    });
                }
            });

        // --- Add Row Logic ---
        contentContainer
            .querySelector(".add-row-btn")
            .addEventListener("click", () => {
                const newRow = document.createElement("tr");
                const colCount = getColCount();

                // Add cells based on the current number of columns
                for (let i = 0; i < colCount; i++) {
                    const newCell = document.createElement("td");
                    newCell.contentEditable = "true";
                    newCell.textContent = "";
                    newRow.appendChild(newCell);
                }
                tableEl.querySelector("tbody").appendChild(newRow);
            });

        // --- Remove Row Logic ---
        contentContainer
            .querySelector(".remove-row-btn")
            .addEventListener("click", () => {
                const tbody = tableEl.querySelector("tbody");
                if (tbody.children.length > 1) {
                    tbody.lastElementChild.remove();
                }
            });
    }

    // --- LOGIC TO MAKE CHECKLIST BUTTONS WORK ---
    if (type === "checklist") {
        const wrapper = contentContainer.querySelector(".checklist-wrapper");

        // Helper function to create a new list item (made global/reusable)
        const createNewChecklistItem = (text = "New item", checked = false) => {
            const newItem = document.createElement("div");
            newItem.className = "checklist-item";
            newItem.innerHTML = `
                <input type="checkbox" ${checked ? 'checked' : ''}>
                <div contenteditable="true" class="editable-text">${text}</div>
                <button class="remove-item-btn">&times;</button>
            `;

            // Attach the remove listener immediately
            newItem
                .querySelector(".remove-item-btn")
                .addEventListener("click", (e) => {
                    e.currentTarget.closest(".checklist-item").remove();
                });

            return newItem;
        };
        
        // Expose the helper function if needed outside (optional, but good practice)
        contentContainer.createNewChecklistItem = createNewChecklistItem;

        // 1. Add Item functionality (if the button exists)
        const addBtn = contentContainer.querySelector(".add-checklist-item-btn");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                const newItem = createNewChecklistItem();
                wrapper.appendChild(newItem);
            });
        }

        // 2. Initial Remove listeners for items already created
        contentContainer
            .querySelectorAll(".remove-item-btn")
            .forEach((button) => {
                button.addEventListener("click", (e) => {
                    e.currentTarget.closest(".checklist-item").remove();
                });
            });
    }
}

function addElementToCanvas(type) {
    const newEl = document.createElement("div");
    newEl.className = "note-element";
    newEl.setAttribute("draggable", true);
    newEl.dataset.type = type;

    // Drag Handle
    const dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = "&#8942;&#8942;"; // dots
    newEl.appendChild(dragHandle);

    // Content Generation
    const contentContainer = document.createElement("div");
    contentContainer.className = "element-content";

    // Switch statement to generate content based on type
    switch (type) {
        case "heading":
            contentContainer.innerHTML = `<h2 contenteditable="true" class="editable-header">Heading</h2>`;
            break;
        case "text":
            contentContainer.innerHTML = `<div contenteditable="true" class="editable-text">Text...</div>`;
            break;
        case "checklist":
            contentContainer.innerHTML = `
        <div class="checklist-wrapper">
            <div class="checklist-item">
                <input type="checkbox">
                <div contenteditable="true" class="editable-text">First item</div>
                <button class="remove-item-btn">&times;</button>
            </div>
            <div class="checklist-item">
                <input type="checkbox">
                <div contenteditable="true" class="editable-text">Second item</div>
                <button class="remove-item-btn">&times;</button>
            </div>
        </div>
        <button class="add-checklist-item-btn" title="Add New Item">Add Item</button>
      `;
            break;
        case "divider":
            contentContainer.innerHTML = `<hr class="fancy-divider">`;
            break;
        case "image":
            contentContainer.innerHTML = `<div class="upload-placeholder"><p>📷 Upload</p></div>`;
            break;
        case "voice":
            contentContainer.innerHTML = `<div class="audio-placeholder"><button>🔴 Record</button><span>00:00</span></div>`;
            break;
        case "code":
            contentContainer.innerHTML = `<div contenteditable="true" class="code-block">// Code</div>`;
            break;
        case "table":
            contentContainer.innerHTML = `
        <div class="table-actions">
          <button class="add-col-btn" title="Add Column">Column +</button>
          <button class="add-row-btn" title="Add Row">Row +</button>
          <button class="remove-col-btn" title="Remove Last Column">Column -</button>
          <button class="remove-row-btn" title="Remove Last Row">Row -</button>
        </div>
        <table class="simple-table">
          <thead>
            <tr>
              <th contenteditable="true">Header 1</th>
              <th contenteditable="true">Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td contenteditable="true">Data 1</td>
              <td contenteditable="true">Data 2</td>
            </tr>
            <tr>
              <td contenteditable="true">Data 3</td>
              <td contenteditable="true">Data 4</td>
            </tr>
          </tbody>
        </table>
      `;
            break;
        case "img-text":
            contentContainer.innerHTML = `<div class="row-layout"><div class="row-image">Img</div><div class="row-text"><h3 contenteditable="true">Title</h3><p contenteditable="true">Description...</p></div></div>`;
            break;
    }

    // Attach specific logic based on type
    attachElementLogic(contentContainer, type);

    // Remove Button
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.innerHTML = "&times;";
    removeBtn.onclick = () => newEl.remove();

    newEl.appendChild(contentContainer);
    newEl.appendChild(removeBtn);

    // --- ATTACH EVENTS TO THE NEW ELEMENT ---
    newEl.addEventListener("dragstart", dragStartElement);
    newEl.addEventListener("dragover", dragOverElement);
    newEl.addEventListener("drop", dropElement);
    newEl.addEventListener("dragend", dragEndElement);

    canvas.appendChild(newEl);
}

// --- 4. REORDERING LOGIC ---

function dragStartElement(e) {
    // CRITICAL: Get the PARENT element that needs to be moved.
    const noteEl = e.target.closest(".note-element");

    // Set the global reference immediately
    draggedEl = noteEl;

    // 1. Set data for reliable transfer (using the ID set in addElementToCanvas)
    e.dataTransfer.setData("text/plain", noteEl.id);
    e.dataTransfer.effectAllowed = "move";

    // 2. Set the drag image to the whole note element for visual clarity
    // This is often required for the drag operation to fully initialize.
    e.dataTransfer.setDragImage(noteEl, 20, 20);

    // 3. Add visual feedback immediately (removed setTimeout)
    noteEl.classList.add("dragging");
}

function dragOverElement(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedEl ? "move" : "copy";
}

function dropElement(e) {
    e.preventDefault();

    // If draggedEl is null, this is a sidebar drop. Allow bubbling to canvas.
    if (!draggedEl) {
        return;
    }

    // Reorder (Element -> Element)
    e.stopPropagation();

    const target = e.currentTarget;

    if (draggedEl !== target) {
        const draggedIndex = Array.from(canvas.children).indexOf(draggedEl);
        const targetIndex = Array.from(canvas.children).indexOf(target);

        if (draggedIndex < targetIndex) {
            target.after(draggedEl);
        } else {
            target.before(draggedEl);
        }
    }
}

function dragEndElement(e) {
    // Clean up the state using the PARENT element.
    e.target.closest(".note-element").classList.remove("dragging");
    draggedEl = null;
}

// --- 5. SERIALIZATION LOGIC & SAVING ---

// Convert the current state of the canvas DOM elements into a serializable JSON array.
function serializeCanvas() {
    const elements = []; // Array to hold serialized elements
    const noteElements = document.querySelectorAll("#canvas .note-element"); // Select all note elements within the canvas
    let idCounter = 0; // Initialize ID counter

    noteElements.forEach((el) => {
        const type = el.dataset.type;
        const elementData = {
            id: `element-${idCounter++}`, // Assign a unique temporary ID
            type: type,
            content: null, // Placeholder for content
            data: {}, // Placeholder for additional data
        };

        const contentContainer = el.querySelector(".element-content");
        // Extract content based on element type
        switch (type) {
            case "heading":
                // Get the text content of the editable header
                elementData.content =
                    contentContainer.querySelector(
                        ".editable-header"
                    ).textContent;
                break;

            case "text":
            case "code":
                // Get the text content of the editable div
                elementData.content = contentContainer.querySelector(
                    '[contenteditable="true"]'
                ).textContent;
                break;

            case "divider":
                // Divider has no content to save
                break;

            case "checklist":
                const items = [];
                // Scrape each checklist item
                contentContainer
                    .querySelectorAll(".checklist-item")
                    .forEach((itemEl) => {
                        items.push({
                            text: itemEl.querySelector(".editable-text")
                                .textContent,
                            checked: itemEl.querySelector(
                                'input[type="checkbox"]'
                            ).checked,
                        });
                    });
                elementData.data.items = items;
                break;

            case "table":
                const table = contentContainer.querySelector(".simple-table");
                const headers = Array.from(
                    table.querySelectorAll("thead th")
                ).map((th) => th.textContent);
                const rows = [];

                table.querySelectorAll("tbody tr").forEach((rowEl) => {
                    const rowData = Array.from(
                        rowEl.querySelectorAll("td")
                    ).map((td) => td.textContent);
                    rows.push(rowData);
                });

                elementData.data = {
                    headers: headers,
                    rows: rows,
                };
                break;
            // Temporary placeholder content for image, voice, img-text
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

// Save the current note by sending serialized data to the backend API.
async function saveNote(noteID = currentNoteId) {
    const titleInput = document.getElementById("note-title");
    const title = titleInput ? titleInput.value : "Untitled Note";
    const elementsData = serializeCanvas();

    // Use a temporary category ID (1) for now.
    // NOTE: If your Note model accepts 'category', not 'category_id', use 'category' below.
    const categoryID = 1;

    const payload = {
        title: title,
        category_id: categoryID, // Ensure this matches your serializer field name
        data: { elements: elementsData }, // Wrap elements in a 'data' object
    };

    const method = noteID ? "PATCH" : "POST";
    // Append ID only for PATCH (update) requests
    const url = noteID ? `${API_BASE_URL}${noteID}/` : API_BASE_URL;

    // TESTING LOGS
    console.log("Saving Note (POST/PATCH)");
    console.log("Method:", method);
    console.log("URL:", url);
    console.log("Payload:", payload);


    // CSRF token retrieval for Django
    const csrftoken = getCookie("csrftoken");

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken, // Include CSRF token
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const savedNote = await response.json();

        // TESTING LOG
        console.log("API Response Data:", savedNote);

        // Update the global ID after a successful POST (creation)
        if (method === "POST") {
            currentNoteId = savedNote.id;
            // TESTING LOG
            console.log("New Note ID Set:", currentNoteId);
        }

        console.log("Note saved successfully:", savedNote);
        alert(`Note '${savedNote.title}' saved! ID: ${savedNote.id}`);
        return savedNote;
    } catch (error) {
        console.error("Error saving note:", error);
        alert("Failed to save the note. Please check the console.");
    }
}

// Helper function to get CSRF token from cookies (for Django)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );
                break;
            }
        }
    }
    return cookieValue;
}

// --- 6. EVENT LISTENERS FOR SAVE BUTTON ---
document.addEventListener("DOMContentLoaded", () => {
    // Hook up the save button from the toolbar
    const saveButton = document.querySelector(".toolbar #save");
    saveButton.addEventListener("click", () => saveNote());
});
