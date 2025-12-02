const canvas = document.getElementById("canvas");
let draggedEl = null; // Holds the element being reordered

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
                newHeader.textContent = `Header ${getColCount() + 1}`;
                tableEl.querySelector("thead tr").appendChild(newHeader);

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

        // Helper function to create a new list item
        const createNewChecklistItem = (text = "New item") => {
            const newItem = document.createElement("div");
            newItem.className = "checklist-item";
            newItem.innerHTML = `
        <input type="checkbox">
        <div contenteditable="true" class="editable-text">${text}</div>
        <button class="remove-item-btn">&times;</button>
      `;

            // Attach the remove listener immediately
            newItem
                .querySelector(".remove-item-btn")
                .addEventListener("click", (e) => {
                    // Remove the parent .checklist-item
                    e.currentTarget.closest(".checklist-item").remove();
                });

            return newItem;
        };

        // 1. Add Item functionality
        contentContainer
            .querySelector(".add-checklist-item-btn")
            .addEventListener("click", () => {
                const newItem = createNewChecklistItem();
                wrapper.appendChild(newItem);
            });

        // 2. Initial Remove listeners for items created in the HTML string
        contentContainer
            .querySelectorAll(".remove-item-btn")
            .forEach((button) => {
                button.addEventListener("click", (e) => {
                    e.currentTarget.closest(".checklist-item").remove();
                });
            });
    }

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
    newEl.addEventListener("dragend", dragEndElement); // CRITICAL NEW LISTENER

    canvas.appendChild(newEl);
}

// --- 4. REORDERING LOGIC (The Fix) ---

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
