// Helper function to create the bare element wrapper
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

    // Attach drag event listeners from notes-script.js
    newEl.addEventListener("dragstart", window.dragStartElement);
    newEl.addEventListener("dragover", window.dragOverElement);
    newEl.addEventListener("drop", window.dropElement);
    newEl.addEventListener("dragend", window.dragEndElement);

    return { newEl, contentContainer };
};

// DESERIALIZATION FUNCTION (MUST BE GLOBAL)
window.deserializeElement = function deserializeElement(elementData) {
    const type = elementData.type;
    const content = elementData.content;
    const data = elementData.data || {};

    const { newEl, contentContainer } = window.createElementStructure(type);

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
            const wrapper =
                contentContainer.querySelector(".checklist-wrapper");

            // Reconstruct checklist items based on saved data
            if (data.items && data.items.length > 0) {
                // Attach the logic first to get the helper function
                window.attachElementLogic(contentContainer, type);

                const createItem = contentContainer.createNewChecklistItem;

                data.items.forEach((item) => {
                    const newItem = createItem(item.text, item.checked);
                    wrapper.appendChild(newItem);
                });
            }
            break;

        case "table":
            const headers = data.headers || ["Header 1", "Header 2"];
            const rows = data.rows || [];

            let tableHTML = `
                <div class="table-actions">
                    <button class="add-col-btn" title="Add Column">Column +</button>
                    <button class="add-row-btn" title="Add Row">Row +</button>
                    <button class="remove-col-btn" title="Remove Last Column">Column -</button>
                    <button class="remove-row-btn" title="Remove Last Row">Row -</button>
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
            contentContainer.innerHTML = tableHTML;
            break;

        case "image":
        case "voice":
        case "img-text":
            contentContainer.innerHTML = data.url
                ? `<img src="${data.url}" alt="Saved Media">`
                : `<p>Saved ${type} content</p>`;
            break;
    }

    if (type === "checklist" || type === "table") {
        // Re-attach specific logic for table (checklist logic attached conditionally above)
        window.attachElementLogic(contentContainer, type);
    }

    return newEl;
};

// --- LOAD NOTE FUNCTION ---
window.loadNote = async function loadNote(noteId) {
    if (!noteId) {
        console.warn("No Note ID provided to load.");
        return;
    }

    // Uses the global API_BASE_URL
    const url = `${API_BASE_URL}${noteId}/`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to load note: ${response.status}`);
        }

        const noteData = await response.json();
        console.log("Note loaded successfully:", noteData);

        // 1. Clear the canvas before loading new content
        canvas.innerHTML = "";

        // 2. Set the global current Note ID
        window.currentNoteId = noteData.id;

        // 3. Set the title
        const titleInput = document.getElementById("note-title");
        if (titleInput) {
            titleInput.value = noteData.title || "Untitled Note";
        }

        // 4. Set the category selector text
        const categorySelector = document.getElementById(
            "note-category-select"
        );
        if (categorySelector) {
            if (window.categories.length === 0) {
                await window.fetchCategories();
            }

            const noteCategoryName = noteData.category_name || "Uncategorized";

            const placeholderOption = categorySelector.querySelector(
                'option[value=""], option:first-child'
            );

            if (noteCategoryName && placeholderOption) {
                // If the note has a category name, update the placeholder text
                placeholderOption.textContent = `${noteCategoryName}`;

                // Optionally: Disable the option to prevent selection,
                // but keep it visually selected/displayed.
                placeholderOption.disabled = false; // Make it selectable if needed
                categorySelector.value = ""; // Ensure the default 'blank' is displayed

                console.log(
                    `DEBUG: Updated category placeholder to: ${noteCategoryName}`
                );
            } else if (placeholderOption) {
                // If the note is uncategorized, reset the placeholder
                placeholderOption.textContent = "Select Category...";
                placeholderOption.value = "";
                placeholderOption.selected = true;
            }
        }

        // 5. Deserialization
        if (noteData.data && noteData.data.elements) {
            noteData.data.elements.forEach((elementData) => {
                const element = window.deserializeElement(elementData);
                canvas.appendChild(element);
            });
        }
    } catch (error) {
        console.error("Error loading note:", error);
        alert("Failed to load the note. Please check the console.");
    }
};
