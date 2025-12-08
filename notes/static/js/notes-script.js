window.canvas = document.getElementById("canvas");
window.draggedEl = null; // Holds element being reordered
window.currentNoteId = null;
window.newFilesToUpload = new Map(); // Map to store File objects by element ID
window.API_BASE_URL = "/api/notes/";

// Mobile drawer elements
const elementDrawer = document.getElementById("mobile-element-drawer");
const openDrawerBtn = document.getElementById("open-element-drawer-btn");
const closeDrawerBtn = document.getElementById("close-element-drawer-btn");
const sidebarElements = document.querySelectorAll(".sidebar .element");

// Toggle the visibility of the element drawer
function toggleElementDrawer(open) {
    if (window.innerWidth <= 900) {
        if (open) {
            elementDrawer.classList.add("open");
        } else {
            elementDrawer.classList.remove("open");
        }
    }
}
// Attach listeners to the FAB and Close button
if (openDrawerBtn) {
    openDrawerBtn.addEventListener("click", () => toggleElementDrawer(true));
}
if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener("click", () => toggleElementDrawer(false));
}


// --- MOBILE ELEMENT INJECTION (TAP INSTEAD OF DRAG) ---

sidebarElements.forEach((el) => {
    // Keep dragstart for desktop, but add click for mobile touch input
    el.addEventListener("click", (e) => {
        // Only run the click logic if we are on a mobile size
        if (window.innerWidth <= 900) {
            const type = e.currentTarget.dataset.type;
            if (type) {
                // 1. Add the element to the canvas
                window.addElementToCanvas(type); 

                // 2. Automatically close the drawer after adding
                toggleElementDrawer(false); 

                // 3. Scroll to the new element
                const newElement = canvas.lastElementChild;
                if (newElement) {
                    newElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }
        }
    });

    // You may need to disable the default drag behavior on touch devices 
    // to prevent conflicting with the new click/tap logic.
    el.addEventListener("touchstart", (e) => {
        if (window.innerWidth <= 900) {
            // Prevent the default touch-and-hold drag behavior
            e.preventDefault(); 
            // Trigger the click logic immediately on touch
            e.currentTarget.click();
        }
    }, { passive: false }); // Use passive: false to allow preventDefault
});

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

// --- IMAGE HELPER ---

function attachImagePlaceholderHandler(contentContainer) {
    const placeholder = contentContainer.querySelector(
        ".placeholder, .upload-placeholder"
    );
    if (placeholder) {
        placeholder.onclick = () => window.handleImageUpload(contentContainer);
    }
}

// --- Voice Helper ---
window.setupVoiceRecording = function (contentContainer) {
    const parentEl = contentContainer.closest(".note-element");
    const recordBtn = contentContainer.querySelector(".record-btn");
    const durationEl = contentContainer.querySelector(".audio-duration");
    const audioPlayer = contentContainer.querySelector(".audio-player");
    let recorder;
    let chunks = [];
    let startTime;
    let timerInterval;

    if (!recordBtn) {
        return; 
    }
    
    const startRecording = () => {
        chunks = [];
        startTime = Date.now();
        durationEl.textContent = "00:00";
        recordBtn.textContent = "⏹ Stop";
        recordBtn.classList.add("recording");

        timerInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const totalSeconds = Math.floor(elapsed / 1000);
            const minutes = String(Math.floor(totalSeconds / 60)).padStart(
                2,
                "0"
            );
            const seconds = String(totalSeconds % 60).padStart(2, "0");
            durationEl.textContent = `${minutes}:${seconds}`;
        }, 1000);

        // MediaRecorder setup
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                recorder = new MediaRecorder(stream);
                recorder.ondataavailable = (e) => chunks.push(e.data);
                recorder.onstop = stopRecording;
                recorder.start();
            })
            .catch((err) => {
                console.error("Recording failed:", err);
                alert("Recording permission denied or microphone error.");
                stopAndReset();
            });
    };

    const stopAndReset = () => {
        clearInterval(timerInterval);
        recordBtn.textContent = "🔴 Record";
        recordBtn.classList.remove("recording");
    };

    const stopRecording = () => {
        stopAndReset();

        const blob = new Blob(chunks, { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(blob);

        let elementId = parentEl.id;
        if (!elementId || !elementId.startsWith("temp-")) {
            elementId = "temp-" + Date.now();
            parentEl.id = elementId;
        }

        // 1. Store the actual Blob/File object using the element's ID for saving
        window.newFilesToUpload.set(elementId, blob);

        // 2. Update the UI to show the player
        audioPlayer.src = audioUrl;
        audioPlayer.style.display = "block";

        // Replace the record button with a play button/player for saved file
        recordBtn.style.display = "none";

        // Re-enable drag
        parentEl.draggable = true;

        // Cleanup stream tracks
        if (recorder.stream) {
            recorder.stream.getTracks().forEach((track) => track.stop());
        }
    };

    // Toggle handler
    recordBtn.onclick = () => {
        if (recordBtn.classList.contains("recording")) {
            recorder?.stop();
        } else {
            // Hide player before starting new recording
            audioPlayer.style.display = "none";
            // Disable drag while recording
            parentEl.draggable = false;
            startRecording();
        }
    };
};

// Accept and use elementId
function renderImgContent(contentContainer, imgUrl, elementId) {
    contentContainer.innerHTML = `
        <div class="image-wrapper" data-element-id="${elementId}">
            <img src="${imgUrl}" alt="image content">
            <button class="remove-image-btn">&times;</button>
        </div>
    `;

    // Remove button logic
    contentContainer
        .querySelector(".remove-image-btn")
        .addEventListener("click", () => {
            // Clear the file from the Map when removed from the canvas
            if (elementId) {
                window.newFilesToUpload.delete(elementId);
            }
            contentContainer.innerHTML = `<div class="upload-placeholder">📷 Upload</div>`;
            attachImagePlaceholderHandler(contentContainer);
        });
}

window.handleImageUpload = function handleImageUpload(elementContentContainer) {
    const parentEl = elementContentContainer.closest(".note-element");
    let elementId = parentEl.id;

    // Ensure the element has a temporary ID for tracking if not already saved
    if (!elementId || !elementId.startsWith("temp-")) {
        elementId = "temp-" + Date.now();
        parentEl.id = elementId;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Store the actual File object using the element's ID
        window.newFilesToUpload.set(elementId, file);

        // 2. Read file to generate temporary Data URL for instant display
        const reader = new FileReader();
        reader.onload = (event) => {
            const tempImageUrl = event.target.result;

            // 3. Render the image with the temporary URL and elementId
            renderImgContent(elementContentContainer, tempImageUrl, elementId);
        };
        reader.readAsDataURL(file);
    };

    fileInput.click();
};

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
        // Only allow drag-and-drop on large screens
        if (window.innerWidth > 900) {
            window.draggedEl = null; 
            e.dataTransfer.setData("type", e.target.dataset.type);
            e.dataTransfer.effectAllowed = "copy";
        } else {
            e.preventDefault(); // Prevent drag on mobile
        }
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

    // Voice element
    if (type === "voice") {
        window.setupVoiceRecording(contentContainer);
    }

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
    // Image-text image upload
    if (type === "img-text") {
        // 1. Re-attach image handler if needed (primarily for loading)
        const rowImageContainer = contentContainer.querySelector(".row-image");
        const placeholder = rowImageContainer?.querySelector(".placeholder");

        // Check if the placeholder is visible and needs its click handler attached
        if (placeholder) {
            attachImagePlaceholderHandler(rowImageContainer);
        }

        // 2. Ensure contenteditable fields inside img-text stop drag
        contentContainer
            .querySelectorAll(".row-text [contenteditable]")
            .forEach((ed) => {
                ed.addEventListener("mousedown", (e) => e.stopPropagation());
                ed.addEventListener("dragstart", (e) => e.preventDefault());

                const parentEl = contentContainer.closest(".note-element");

                // Stop parent drag while editing text
                ed.addEventListener("focusin", () => {
                    if (parentEl) parentEl.draggable = false;
                });
                ed.addEventListener("focusout", () => {
                    if (parentEl) parentEl.draggable = true;
                });
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
            contentContainer.innerHTML = `<div class="placeholder">Click here to upload an image</div>`;
            // Attach handler immediately
            setTimeout(() => {
                // This relies on the global attachImagePlaceholderHandler
                attachImagePlaceholderHandler(contentContainer);
            }, 0);
            break;
        case "voice":
            // Initial state: Show a recording button and placeholder duration
            contentContainer.innerHTML = `
                <div class="voice-wrapper">
                    <div class="audio-controls">
                        <button class="record-btn">🔴 Record</button>
                        <span class="audio-duration">00:00</span>
                    </div>
                    <audio controls class="audio-player" style="display:none;"></audio> 
                </div>
            `;
            // We'll attach the media recorder logic below in attachElementLogic
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
            <div class="row-image">
                <div class="placeholder">Click here to upload an image</div>
            </div>
            <div class="row-text">
                <h3 contenteditable="true">Title</h3>
                <p contenteditable="true">Description...</p>
            </div>
        </div>
    `;
            // Attach the image upload handler to the specific row-image container
            // We wrap this in a setTimeout to ensure the HTML is fully rendered first.
            setTimeout(() => {
                const rowImageContainer =
                    contentContainer.querySelector(".row-image");
                if (rowImageContainer) {
                    // Pass the specific container for the image, not the main contentContainer
                    attachImagePlaceholderHandler(rowImageContainer);
                }
            }, 0);
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
