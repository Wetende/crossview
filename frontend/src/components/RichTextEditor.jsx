import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { Box, Paper, IconButton, Divider, Tooltip } from '@mui/material';
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    StrikethroughS,
    FormatListBulleted,
    FormatListNumbered,
    FormatQuote,
    Code as CodeIcon,
    InsertLink,
    InsertPhoto,
    Undo,
    Redo
} from '@mui/icons-material';

const MenuButton = ({ onClick, active, disabled, icon, title }) => (
    <Tooltip title={title} arrow>
        <span>
            <IconButton
                size="small"
                onClick={onClick}
                disabled={disabled}
                sx={{
                    color: active ? 'primary.main' : 'text.secondary',
                    bgcolor: active ? 'primary.lighter' : 'transparent',
                    '&:hover': { bgcolor: active ? 'primary.lighter' : 'action.hover' },
                    borderRadius: 1,
                    p: 0.5
                }}
            >
                {icon}
            </IconButton>
        </span>
    </Tooltip>
);

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 150 }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-link' },
            }),
            Image,
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getHTML());
            }
        },
        editorProps: {
            attributes: {
                class: 'rich-text-editor-content',
                style: `min-height: ${minHeight}px; outline: none; padding: 16px;`,
            },
        },
    });

    // Update editor content if value changes from outside
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const addLink = () => {
        const url = window.prompt('Enter URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        const url = window.prompt('Enter image URL:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 1, overflow: 'hidden' }}>
            {/* Toolbar */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 0.5,
                    p: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'grey.50'
                }}
            >
                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    icon={<Undo fontSize="small" />}
                    title="Undo"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    icon={<Redo fontSize="small" />}
                    title="Redo"
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    icon={<FormatBold fontSize="small" />}
                    title="Bold (Ctrl+B)"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    icon={<FormatItalic fontSize="small" />}
                    title="Italic (Ctrl+I)"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    icon={<FormatUnderlined fontSize="small" />}
                    title="Underline (Ctrl+U)"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={editor.isActive('strike')}
                    icon={<StrikethroughS fontSize="small" />}
                    title="Strikethrough"
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    icon={<FormatListBulleted fontSize="small" />}
                    title="Bullet List"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    icon={<FormatListNumbered fontSize="small" />}
                    title="Numbered List"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    icon={<FormatQuote fontSize="small" />}
                    title="Quote"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    active={editor.isActive('codeBlock')}
                    icon={<CodeIcon fontSize="small" />}
                    title="Code Block"
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                <MenuButton
                    onClick={addLink}
                    active={editor.isActive('link')}
                    icon={<InsertLink fontSize="small" />}
                    title="Insert Link"
                />
                <MenuButton
                    onClick={addImage}
                    icon={<InsertPhoto fontSize="small" />}
                    title="Insert Image"
                />
            </Box>

            {/* Editor Content */}
            <Box
                sx={{
                    bgcolor: '#fff',
                    '& .ProseMirror': {
                        minHeight,
                        '&:focus': { outline: 'none' },
                        '& p': { margin: 0, marginBottom: '0.5em' },
                        '& h1, & h2, & h3': { marginTop: '1em', marginBottom: '0.5em' },
                        '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.5em' },
                        '& blockquote': { 
                            borderLeft: '3px solid #ddd', 
                            marginLeft: 0, 
                            paddingLeft: '1em',
                            color: 'text.secondary'
                        },
                        '& pre': {
                            bgcolor: '#f5f5f5',
                            padding: '0.5em',
                            borderRadius: 1,
                            overflow: 'auto'
                        },
                        '& code': {
                            bgcolor: '#f5f5f5',
                            padding: '0.1em 0.3em',
                            borderRadius: '3px',
                            fontFamily: 'monospace'
                        },
                        '& a': { color: 'primary.main' },
                        '& img': { maxWidth: '100%', height: 'auto' },
                    },
                    '& .ProseMirror p.is-editor-empty:first-child::before': {
                        content: `"${placeholder || 'Start typing...'}"`,
                        color: 'text.disabled',
                        float: 'left',
                        pointerEvents: 'none',
                        height: 0
                    }
                }}
            >
                <EditorContent editor={editor} />
            </Box>
        </Paper>
    );
}
