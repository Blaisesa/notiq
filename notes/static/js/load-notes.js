// --- CREATE ELEMENT STRUCTURE ---
window.createElementStructure = function createElementStructure(type) {
    const newEl = document.createElement("div");
    newEl.className = "note-element";
    newEl.setAttribute("draggable", true);
    newEl.dataset.type = type;

    // Drag Handle
    const dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = "&#8942;&#8942;";
    newEl.appendChild(dragHandle);

    // Content Container
    const contentContainer = document.createElement("div");
    contentContainer.className = "element-content";
    newEl.appendChild(contentContainer);

    // Remove Button
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.innerHTML = "&times;";
    removeBtn.onclick = () => newEl.remove();
    newEl.appendChild(removeBtn);

    // Attach drag event listeners
    newEl.addEventListener("dragstart", window.dragStartElement);
    newEl.addEventListener("dragover", window.dragOverElement);
    newEl.addEventListener("drop", window.dropElement);
    newEl.addEventListener("dragend", window.dragEndElement);

    return { newEl, contentContainer };
};

// --- DESERIALIZE ELEMENT ---
window.deserializeElement = function deserializeElement(elementData) {
    const type = elementData.type;
    const content = elementData.content || "";
    const data = elementData.data || {};

    // 1. Create the element structure first
    const { newEl, contentContainer } = window.createElementStructure(type);

    // 2. Populate content
    switch (type) {
        case "heading":
            contentContainer.innerHTML = `<h2 contenteditable="true" class="editable-header">${content}</h2>`;
            break;
        case "text":
        case "code":
            contentContainer.innerHTML = `<div contenteditable="true" class="${
                type === "code" ? "code-block" : "editable-text"
            }">${content}</div>`;
            break;
        case "divider":
            contentContainer.innerHTML = `<hr class="fancy-divider">`;
            break;
        case "checklist":
            contentContainer.innerHTML = `
                <div class="checklist-wrapper"></div>
                <button class="add-checklist-item-btn" title="Add New Item">Add Item</button>
            `;
            break;
        case "table":
            const headers = data.headers || ["Header 1"];
            const rows = data.rows || [];
            contentContainer.innerHTML = `
                <div class="table-actions">
                    <button class="add-col-btn">Col +</button>
                    <button class="add-row-btn">Row +</button>
                    <button class="remove-col-btn">Col -</button>
                    <button class="remove-row-btn">Row -</button>
                </div>
                <table class="simple-table">
                    <thead><tr>${headers
                        .map((h) => `<th contenteditable="true">${h}</th>`)
                        .join("")}</tr></thead>
                    <tbody>
                        ${rows
                            .map(
                                (row) =>
                                    `<tr>${row
                                        .map(
                                            (cell) =>
                                                `<td contenteditable="true">${cell}</td>`
                                        )
                                        .join("")}</tr>`
                            )
                            .join("")}
                    </tbody>
                </table>
            `;
            break;
        case "image":
            // If URL exists, render the full image wrapper with the remove button
            if (data.url) {
                contentContainer.innerHTML = `
            <div class="image-wrapper">
                <img src="${data.url}" alt="Note Image">
                <button class="remove-image-btn">&times;</button>
            </div>
        `;
                // We need to attach the remove listener using a similar structure as renderImageContent
                setTimeout(() => {
                    const removeBtn =
                        contentContainer.querySelector(".remove-image-btn");
                    if (removeBtn) {
                        removeBtn.addEventListener("click", (e) => {
                            contentContainer.innerHTML = `<div class="upload-placeholder">📷 Upload</div>`;
                            attachImagePlaceholderHandler(contentContainer);
                        });
                    }
                }, 0);
            } else {
                // Otherwise, show the clickable placeholder
                contentContainer.innerHTML = `<div class="upload-placeholder">📷 Upload</div>`;
                setTimeout(() => {
                    attachImagePlaceholderHandler(contentContainer);
                }, 0);
            }
            break;
        case "voice":
            contentContainer.innerHTML = `<div class="placeholder">${type} content</div>`;
            break;
        case "img-text":
            // --- 1. Recreate the base structure (copied from addElementToCanvas) ---
            contentContainer.innerHTML = `
                <div class="row-layout">
                    <div class="row-image">
                        </div>
                    <div class="row-text">
                        <h3 contenteditable="true">${data.title || "Title"}</h3>
                        <p contenteditable="true">${
                            data.description || "Description..."
                        }</p>
                    </div>
                </div>
            `;

            // --- 2. Handle Image Loading ---
            const rowImageContainer =
                contentContainer.querySelector(".row-image");

            // NOTE: newEl.id might be empty if this is the first time loading an old note
            // We set a temporary ID if one isn't on the note-element already.
            let elementId = newEl.id || "saved-" + Date.now();
            newEl.id = elementId;

            if (data.url) {
                // If URL exists, render the permanent image into the nested image container
                // We pass the specific nested container to renderImgContent
                window.renderImgContent(rowImageContainer, data.url, elementId);
            } else {
                // If no URL, show the clickable placeholder
                rowImageContainer.innerHTML = `<div class="upload-placeholder">📷 Upload</div>`;
                setTimeout(() => {
                    // Attach the upload handler to the specific nested container
                    window.attachImagePlaceholderHandler(rowImageContainer);
                }, 0);
            }
            break;
    }

    // 3. Attach interactive logic (checklist buttons, table buttons, etc.)
    window.attachElementLogic(contentContainer, type);

    // 4. Populate checklist items if applicable
    if (type === "checklist") {
        const wrapper = contentContainer.querySelector(".checklist-wrapper");
        if (data.items && data.items.length > 0) {
            const createItem = contentContainer.createNewChecklistItem;
            data.items.forEach((item) => {
                const newItem = createItem(item.text, item.checked);
                wrapper.appendChild(newItem);
            });
        }
    }

    // 5. Apply contenteditable drag prevention and caret logic
    contentContainer
        .querySelectorAll('[contenteditable="true"]')
        .forEach((ed) => {
            const parentEl = newEl;
            ed.addEventListener("mousedown", (e) => e.stopPropagation());
            ed.addEventListener("dragstart", (e) => e.preventDefault());
            ed.addEventListener("focusin", () => (parentEl.draggable = false));
            ed.addEventListener("focusout", () => (parentEl.draggable = true));
            ed.addEventListener("focus", (e) =>
                setTimeout(() => window.setEndOfContenteditable(e.target), 0)
            );
        });

    return newEl;
};

// --- LOAD NOTE ---
window.loadNote = async function loadNote(noteId) {
    if (!noteId) return console.warn("No Note ID provided.");

    try {
        const response = await fetch(`${window.API_BASE_URL}${noteId}/`);
        if (!response.ok)
            throw new Error(`Failed to load note: ${response.status}`);
        const noteData = await response.json();

        // Clear canvas
        canvas.innerHTML = "";
        window.currentNoteId = noteData.id;

        // Set title
        const titleInput = document.getElementById("note-title");
        if (titleInput) titleInput.value = noteData.title || "Untitled Note";

        // Set category
        const categorySelector = document.getElementById(
            "note-category-select"
        );
        if (categorySelector) {
            if (window.categories.length === 0) await window.fetchCategories();

            const noteCategoryName = noteData.category_name || "Uncategorized";
            let existingOption = Array.from(categorySelector.options).find(
                (o) => o.textContent === noteCategoryName
            );

            if (!existingOption) {
                const tempOption = document.createElement("option");
                tempOption.textContent = noteCategoryName;
                tempOption.value = "";
                tempOption.selected = true;
                categorySelector.prepend(tempOption);
            } else {
                existingOption.selected = true;
            }
        }

        // Deserialize and append elements
        if (noteData.data?.elements) {
            noteData.data.elements.forEach((elData) => {
                const element = window.deserializeElement(elData);
                canvas.appendChild(element);
            });
        }

        console.log("Note loaded successfully.");
    } catch (error) {
        console.error("Error loading note:", error);
        alert("Failed to load note. Check console for details.");
    }
};
