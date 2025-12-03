window.canvas = document.getElementById("canvas");
window.draggedEl = null; // Holds element being reordered
window.currentNoteId = null;
window.API_BASE_URL = "/api/notes/";

// Category variables
window.categories = [];
window.CATEGORY_API_URL = "/api/categories/";

// --- FETCH & INITIALIZE CATEGORIES ---
async function fetchCategories() {
    try {
        const response = await fetch(window.CATEGORY_API_URL);
        if (!response.ok) throw new Error("Failed to fetch categories");
        const fetchedCategories = await response.json();
        window.categories = fetchedCategories;
        populateCategoryDropdown(fetchedCategories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        window.categories = [];
    }
}

function populateCategoryDropdown(categories) {
    const selector = document.getElementById("note-category-select");
    selector.innerHTML = "";

    if (!categories.length) {
        selector.innerHTML =
            '<option value="" disabled>No categories available</option>';
        return;
    }

    selector.innerHTML +=
        '<option value="" disabled selected>Select Category</option>';
    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        selector.appendChild(option);
    });
}

// --- SIDEBAR DRAG ---
document.querySelectorAll(".sidebar .element").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
        window.draggedEl = null; // sidebar new item
        e.dataTransfer.setData("type", e.target.dataset.type);
        e.dataTransfer.effectAllowed = "copy";
    });
});

// --- CANVAS DROP ---
canvas.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = window.draggedEl ? "move" : "copy";
});

canvas.addEventListener("drop", (e) => {
    e.preventDefault();
    if (window.draggedEl) return; // handled by element-level drop

    const type = e.dataTransfer.getData("type");
    if (type) window.addElementToCanvas(type);
});

// --- ELEMENT LOGIC ---
window.attachElementLogic = function attachElementLogic(
    contentContainer,
    type
) {
    // Checklist helper
    const createNewChecklistItem = (
        text = "",
        checked = false,
        placeholder = "New item"
    ) => {
        const newItem = document.createElement("div");
        newItem.className = "checklist-item";
        newItem.innerHTML = `
        <input type="checkbox" ${checked ? "checked" : ""}>
        <div contenteditable="true">${text || placeholder}</div>
        <button class="remove-item-btn">&times;</button>
    `;

        const editable = newItem.querySelector("[contenteditable]");
        const parentEl =
            newItem.closest(".note-element") ||
            contentContainer.closest(".note-element");

        // Remove button
        newItem
            .querySelector(".remove-item-btn")
            .addEventListener("click", () => {
                newItem.remove();
            });

        // Stop parent drag while editing
        editable.addEventListener("focusin", () => {
            if (parentEl) parentEl.draggable = false;
        });
        editable.addEventListener("focusout", () => {
            if (parentEl) parentEl.draggable = true;
        });

        // Prevent drag interference
        editable.addEventListener("mousedown", (e) => e.stopPropagation());
        editable.addEventListener("dragstart", (e) => e.preventDefault());

        // Only clear placeholder if content matches placeholder
        editable.addEventListener("focus", (e) => {
            if (text === "" && e.target.textContent.trim() === placeholder)
                e.target.textContent = "";
            setTimeout(() => window.setEndOfContenteditable(e.target), 0);
        });
        editable.addEventListener("blur", (e) => {
            if (text === "" && e.target.textContent.trim() === "")
                e.target.textContent = placeholder;
        });

        return newItem;
    };

    contentContainer.createNewChecklistItem = createNewChecklistItem;

    // Table buttons
    if (type === "table") {
        const tableEl = contentContainer.querySelector(".simple-table");
        const getColCount = () => tableEl.querySelector("tr").cells.length;

        contentContainer
            .querySelector(".add-col-btn")
            ?.addEventListener("click", () => {
                const newHeader = document.createElement("th");
                newHeader.contentEditable = "true";
                newHeader.textContent = `Header ${getColCount() + 1}`;
                tableEl.querySelector("thead tr").appendChild(newHeader);
                tableEl.querySelectorAll("tbody tr").forEach((row) => {
                    const newCell = document.createElement("td");
                    newCell.contentEditable = "true";
                    row.appendChild(newCell);
                });
            });

        contentContainer
            .querySelector(".remove-col-btn")
            ?.addEventListener("click", () => {
                if (getColCount() > 1) {
                    tableEl.querySelector("thead tr").lastElementChild.remove();
                    tableEl
                        .querySelectorAll("tbody tr")
                        .forEach((row) => row.lastElementChild.remove());
                }
            });

        contentContainer
            .querySelector(".add-row-btn")
            ?.addEventListener("click", () => {
                const newRow = document.createElement("tr");
                for (let i = 0; i < getColCount(); i++) {
                    const newCell = document.createElement("td");
                    newCell.contentEditable = "true";
                    newRow.appendChild(newCell);
                }
                tableEl.querySelector("tbody").appendChild(newRow);
            });

        contentContainer
            .querySelector(".remove-row-btn")
            ?.addEventListener("click", () => {
                const tbody = tableEl.querySelector("tbody");
                if (tbody.children.length > 1) tbody.lastElementChild.remove();
            });
    }

    // Checklist buttons
    if (type === "checklist") {
        const wrapper = contentContainer.querySelector(".checklist-wrapper");
        const addBtn = contentContainer.querySelector(
            ".add-checklist-item-btn"
        );
        if (addBtn && !addBtn.dataset.listenerAttached) {
            addBtn.addEventListener("click", () => {
                const newItem = contentContainer.createNewChecklistItem();
                wrapper.appendChild(newItem);
            });
            addBtn.dataset.listenerAttached = "true"; // prevents double-attach
        }

        // Attach remove listeners to existing items
        contentContainer.querySelectorAll(".remove-item-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.currentTarget.closest(".checklist-item").remove();
            });
        });
    }

    // Prevent drag interference on existing contenteditable fields
    contentContainer.querySelectorAll("[contenteditable]").forEach((ed) => {
        ed.addEventListener("mousedown", (e) => e.stopPropagation());
        ed.addEventListener("dragstart", (e) => e.preventDefault());
    });
};

// --- ADD ELEMENT TO CANVAS ---
window.addElementToCanvas = function addElementToCanvas(type) {
    const { newEl, contentContainer } = window.createElementStructure(type);

    let defaultContent = "";
    let editableContent = null;

    switch (type) {
        case "heading":
            defaultContent = "Heading";
            contentContainer.innerHTML = `<h2 contenteditable="true">${defaultContent}</h2>`;
            break;
        case "text":
            defaultContent = "Text...";
            contentContainer.innerHTML = `<div contenteditable="true">${defaultContent}</div>`;
            break;
        case "code":
            defaultContent = "// Code";
            contentContainer.innerHTML = `<div contenteditable="true">${defaultContent}</div>`;
            break;
        case "checklist":
            defaultContent = "First item";
            contentContainer.innerHTML = `
                <div class="checklist-wrapper">
                    <div class="checklist-item">
                        <input type="checkbox">
                        <div contenteditable="true">${defaultContent}</div>
                        <button class="remove-item-btn">&times;</button>
                    </div>
                </div>
                <button class="add-checklist-item-btn">Add Item</button>
            `;
            break;
        case "divider":
            contentContainer.innerHTML = `<hr class="fancy-divider">`;
            break;
        case "image":
            contentContainer.innerHTML = `<div class="upload-placeholder">📷 Upload</div>`;
            break;
        case "voice":
            contentContainer.innerHTML = `<div class="audio-placeholder"><button>🔴 Record</button><span>00:00</span></div>`;
            break;
        case "table":
            contentContainer.innerHTML = `
                <div class="table-actions">
                    <button class="add-col-btn">Col +</button>
                    <button class="add-row-btn">Row +</button>
                    <button class="remove-col-btn">Col -</button>
                    <button class="remove-row-btn">Row -</button>
                </div>
                <table class="simple-table">
                    <thead><tr><th contenteditable="true">Header 1</th></tr></thead>
                    <tbody><tr><td contenteditable="true">Data 1</td></tr></tbody>
                </table>
            `;
            break;
        case "img-text":
            contentContainer.innerHTML = `
                <div class="row-layout">
                    <div class="row-image">Img</div>
                    <div class="row-text">
                        <h3 contenteditable="true">Title</h3>
                        <p contenteditable="true">Description...</p>
                    </div>
                </div>
            `;
            break;
    }

    editableContent = contentContainer.querySelector("[contenteditable]");
    if (editableContent) {
        editableContent.addEventListener("mousedown", (e) =>
            e.stopPropagation()
        );
        editableContent.addEventListener("dragstart", (e) =>
            e.preventDefault()
        );

        const parentEl = newEl.closest(".note-element");
        parentEl.draggable = true;
        editableContent.addEventListener(
            "focusin",
            () => (parentEl.draggable = false)
        );
        editableContent.addEventListener(
            "focusout",
            () => (parentEl.draggable = true)
        );

        editableContent.addEventListener("focus", (e) => {
            if (e.target.textContent.trim() === defaultContent)
                e.target.textContent = "";
            setTimeout(() => window.setEndOfContenteditable(e.target), 0);
        });
        editableContent.addEventListener("blur", (e) => {
            if (e.target.textContent.trim() === "")
                e.target.textContent = defaultContent;
        });

        setTimeout(() => {
            editableContent.focus();
            newEl.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 0);
    }

    window.attachElementLogic(contentContainer, type);
    canvas.appendChild(newEl);
};

// --- REORDERING LOGIC ---
window.dragStartElement = function (e) {
    const noteEl = e.target.closest(".note-element");
    window.draggedEl = noteEl;
    e.dataTransfer.setData("text/plain", noteEl.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setDragImage(noteEl, 20, 20);
    noteEl.classList.add("dragging");
};

window.dragOverElement = function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = window.draggedEl ? "move" : "copy";
};

window.dropElement = function (e) {
    e.preventDefault();
    if (!window.draggedEl) return;
    e.stopPropagation();

    const target = e.currentTarget;
    if (window.draggedEl !== target) {
        const draggedIndex = Array.from(canvas.children).indexOf(
            window.draggedEl
        );
        const targetIndex = Array.from(canvas.children).indexOf(target);
        if (draggedIndex < targetIndex) target.after(window.draggedEl);
        else target.before(window.draggedEl);
    }
};

window.dragEndElement = function (e) {
    e.target.closest(".note-element").classList.remove("dragging");
    window.draggedEl = null;
};

// --- INITIALIZE ---
document.addEventListener("DOMContentLoaded", () => {
    fetchCategories();
});
