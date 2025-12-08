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

// Toolbar dropdown
// Dropdown Toggle Logic
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