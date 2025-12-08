from django import template
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter
def render_note_json(data_dict):
    """
    Renders only 'heading' and 'text' blocks from the note data dictionary.
    """
    if not data_dict:
        return ""

    # Extract the elements array directly from the Python dictionary
    content_blocks = data_dict.get('elements', [])

    html_output = ""

    if isinstance(content_blocks, list):
        for block in content_blocks:
            block_type = block.get('type')
            block_content = block.get('content', '')

            # --- HEADING ---
            if block_type == 'heading':
                # Assuming H2 for simplicity
                html_output += f"<h2>{block_content}</h2>"

            # --- TEXT ---
            elif block_type == 'text':
                html_output += f"<p>{block_content}</p>"

            # All other block types are skipped in this iteration

    return mark_safe(html_output)
