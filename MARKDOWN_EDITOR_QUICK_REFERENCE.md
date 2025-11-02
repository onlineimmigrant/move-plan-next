# Markdown Editor Quick Reference

## Switching Between Editor Modes

Click the mode buttons in the toolbar:
- **Visual**: WYSIWYG editor
- **Markdown**: Markdown editor with live preview
- **HTML**: Raw HTML source editor

## Markdown Syntax Quick Guide

### Headers
```markdown
# H1 Heading
## H2 Heading
### H3 Heading
```

### Text Formatting
```markdown
**bold text**
*italic text*
~~strikethrough~~
`inline code`
```

### Lists
```markdown
- Bullet item 1
- Bullet item 2

1. Numbered item 1
2. Numbered item 2

- [ ] Task item (unchecked)
- [x] Task item (checked)
```

### Links & Images
```markdown
[Link text](https://example.com)
![Image alt text](https://example.com/image.jpg)
```

### Code Blocks
````markdown
```javascript
function hello() {
  console.log("Hello World!");
}
```
````

### Tables
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
```

### Blockquotes
```markdown
> This is a blockquote
> It can span multiple lines
```

### Horizontal Rule
```markdown
---
```

## Toolbar Buttons

| Button | Action | Keyboard |
|--------|--------|----------|
| H1/H2/H3 | Insert heading | - |
| **B** | Bold | - |
| *I* | Italic | - |
| ~~S~~ | Strikethrough | - |
| `</>` | Inline code | - |
| 🔗 | Insert link | - |
| 🖼️ | Insert image | - |
| `{ }` | Code block | - |
| 📋 | Insert table | - |
| 💬 | Blockquote | - |
| — | Horizontal rule | - |

## View Modes

1. **Editor Only**: Full-width editor
2. **Split View**: Editor + Preview side-by-side
3. **Preview Only**: Full-width preview

## Image Upload

1. Click the image button in toolbar
2. Select image from gallery
3. Markdown syntax auto-inserted: `![filename](url)`

## Tips

- Preview updates live as you type
- Use Split View to see formatting immediately
- Switch to Preview Only to read final output
- Character count shown in toolbar
- Content auto-saves based on editor mode

## Saving Content

- **Markdown Mode**: Saves as `content_type='markdown'`
- **Visual/HTML Modes**: Saves as `content_type='html'`

## Conversion Notes

- Visual → Markdown: Converts HTML to Markdown
- Markdown → Visual: Loads as-is (may need adjustment)
- HTML → Markdown: Converts HTML to Markdown
- Some complex HTML may not convert perfectly

## GitHub Flavored Markdown (GFM) Support

✅ Tables
✅ Task lists
✅ Strikethrough
✅ Autolinks
✅ Code blocks with syntax highlighting

## Common Issues

**Q: Content looks different after switching modes?**
A: Some HTML/Markdown conversions aren't perfect. Use the mode that best preserves your content.

**Q: How do I add syntax highlighting to code blocks?**
A: Specify language after opening backticks:
````markdown
```python
def hello():
    print("Hello")
```
````

**Q: Can I use HTML in Markdown?**
A: Yes! HTML is supported and will be sanitized for security.

**Q: How do I insert images from my gallery?**
A: Click the image button (🖼️) in the toolbar to open the image gallery.
