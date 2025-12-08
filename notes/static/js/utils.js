// Utility function to get the current note ID from the URL or global variable
function getCurrentNoteIdFromURL() {
    if (window.currentNoteId && !isNaN(window.currentNoteId)) {
        return window.currentNoteId;
    }
    return null;
}

// Utility function to set cursor at the end of a contenteditable element
window.setEndOfContenteditable = function setEndOfContenteditable(contentEditableElement) {
    let range, selection;
    
    // Check if the element exists and is editable
    if (!contentEditableElement || contentEditableElement.getAttribute('contenteditable') !== 'true') {
        return;
    }

    if (document.createRange) { 
        range = document.createRange();
        range.selectNodeContents(contentEditableElement);
        range.collapse(false); // Collapse range to the end of content
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    } 
    else if (document.selection) { 
        range = document.body.createTextRange();
        range.moveToElementText(contentEditableElement);
        range.collapse(false);
        range.select();
    }
};

// Mobile element drawer toggle functionality
window.toggleElementDrawer = function(open) {
    const elementDrawer = document.getElementById("mobile-element-drawer");
    
    // Check if we are in the mobile breakpoint
    if (window.innerWidth <= 900 && elementDrawer) {
        if (open) {
            elementDrawer.classList.add("open");
        } else {
            elementDrawer.classList.remove("open");
        }
    }
}

// Toolbar dropdown menu toggle functionality
const dropdown = document.querySelector('.toolbar-dropdown');
const toggleBtn = document.getElementById('toolbar-options-btn');

if (toggleBtn && dropdown) {
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}