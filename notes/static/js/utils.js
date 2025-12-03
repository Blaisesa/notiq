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