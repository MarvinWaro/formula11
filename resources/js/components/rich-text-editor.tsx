import { Link as LinkExtension } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import {
    Bold,
    Heading2,
    Heading3,
    Italic,
    Link2,
    List,
    ListOrdered,
    Quote,
    Redo2,
    Strikethrough,
    Undo2,
} from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
};

export default function RichTextEditor({
    value,
    onChange,
    placeholder,
    className,
}: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            LinkExtension.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline underline-offset-4',
                },
            }),
            Placeholder.configure({
                placeholder:
                    placeholder ?? 'Format, prizes, rules, contact details…',
                emptyEditorClass:
                    'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none',
            }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html === '<p></p>' ? '' : html);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none min-h-32 p-3 focus:outline-none',
            },
        },
    });

    // Keep editor in sync if the value is reset externally (e.g. modal open/close).
    useEffect(() => {
        if (!editor) return;
        const current = editor.getHTML();
        if ((value || '') !== current && current !== '<p></p>') {
            editor.commands.setContent(value || '', { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div
            className={cn(
                'overflow-hidden rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
                className,
            )}
        >
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}

function Toolbar({ editor }: { editor: Editor }) {
    const promptForLink = () => {
        const previous = editor.getAttributes('link').href ?? '';
        const url = window.prompt('Link URL', previous);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();
    };

    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1 py-1">
            <ToolbarButton
                title="Bold"
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive('bold')}
            >
                <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                title="Italic"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive('italic')}
            >
                <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                title="Strikethrough"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={editor.isActive('strike')}
            >
                <Strikethrough className="h-3.5 w-3.5" />
            </ToolbarButton>
            <Divider />
            <ToolbarButton
                title="Heading 2"
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                active={editor.isActive('heading', { level: 2 })}
            >
                <Heading2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                title="Heading 3"
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                active={editor.isActive('heading', { level: 3 })}
            >
                <Heading3 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <Divider />
            <ToolbarButton
                title="Bullet list"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive('bulletList')}
            >
                <List className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                title="Numbered list"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive('orderedList')}
            >
                <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                title="Quote"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive('blockquote')}
            >
                <Quote className="h-3.5 w-3.5" />
            </ToolbarButton>
            <Divider />
            <ToolbarButton
                title="Link"
                onClick={promptForLink}
                active={editor.isActive('link')}
            >
                <Link2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <Divider />
            <ToolbarButton
                title="Undo"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
            >
                <Undo2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                title="Redo"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
            >
                <Redo2 className="h-3.5 w-3.5" />
            </ToolbarButton>
        </div>
    );
}

function ToolbarButton({
    children,
    onClick,
    active,
    disabled,
    title,
}: {
    children: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={title}
            className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40',
                active && 'bg-primary/10 text-primary',
            )}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />;
}
