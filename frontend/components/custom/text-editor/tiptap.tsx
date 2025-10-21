"use client"

import { useState } from 'react'
import TipTapBar from '@/components/custom/text-editor/tiptap-bar'
import { useEditor, EditorContent } from '@tiptap/react'
import Heading from '@tiptap/extension-heading'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import TextAlign from '@tiptap/extension-text-align'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import Highlight from '@tiptap/extension-highlight'
import ListItem from '@tiptap/extension-list-item'
import History from '@tiptap/extension-history'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Blockquote from '@tiptap/extension-blockquote'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Code from '@tiptap/extension-code'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Link from '@tiptap/extension-link'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Image from '@tiptap/extension-image'
import HardBreak from '@tiptap/extension-hard-break'
import { colors, colorsHex } from '@/utils/color'
import "@/styles/scrollbar.scss"
import '@/styles/globals.css'

import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'
import { cn } from '@/lib/utils'

// create a lowlight instance with all languages loaded
const lowlight = createLowlight(all)

// This is only an example, all supported languages are already loaded above
// but you can also register only specific languages to reduce bundle-size
lowlight.register('html', html)
lowlight.register('css', css)
lowlight.register('js', js)
lowlight.register('ts', ts)

export interface TipTapProps {
    content: string
    onChange: (content: string) => void
}

const limit = 5000

const Tiptap = ({
    content,
    onChange
}: TipTapProps) => {
    const [characterCount, setCharacterCount] = useState(0)
    const [wordCount, setWordCount] = useState(0)

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            Document,
            Paragraph,
            Text,
            Heading.configure({
                levels: [1, 2, 3, 4],
            }),
            Bold,
            Italic,
            Strike,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            BulletList,
            OrderedList,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Highlight.configure({
                multicolor: true,
            }),
            ListItem,
            History,
            Blockquote,
            CodeBlockLowlight.configure({
                lowlight,
            }),
            CharacterCount.configure({
                limit,
            }),
            Placeholder.configure({
                placeholder: 'Type something...',
            }),
            Underline,
            Code,
            Superscript,
            Subscript,
            Link.configure({
                openOnClick: true,
                autolink: true,
                defaultProtocol: 'https',
                protocols: ['http', 'https'],
                isAllowedUri: (url, ctx) => {
                    try {
                        // construct URL
                        const parsedUrl = url.includes(':') ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`)

                        // use default validation
                        if (!ctx.defaultValidate(parsedUrl.href)) {
                            return false
                        }

                        // disallowed protocols
                        const disallowedProtocols = ['ftp', 'file', 'mailto']
                        const protocol = parsedUrl.protocol.replace(':', '')

                        if (disallowedProtocols.includes(protocol)) {
                            return false
                        }

                        // only allow protocols specified in ctx.protocols
                        const allowedProtocols = ctx.protocols.map(p => (typeof p === 'string' ? p : p.scheme))

                        if (!allowedProtocols.includes(protocol)) {
                            return false
                        }

                        // disallowed domains
                        const disallowedDomains = ['example-phishing.com', 'malicious-site.net']
                        const domain = parsedUrl.hostname

                        if (disallowedDomains.includes(domain)) {
                            return false
                        }

                        // all checks have passed
                        return true
                    } catch {
                        return false
                    }
                },
                shouldAutoLink: url => {
                    try {
                        // construct URL
                        const parsedUrl = url.includes(':') ? new URL(url) : new URL(`https://${url}`)

                        // only auto-link if the domain is not in the disallowed list
                        const disallowedDomains = ['example-no-autolink.com', 'another-no-autolink.com']
                        const domain = parsedUrl.hostname

                        return !disallowedDomains.includes(domain)
                    } catch {
                        return false
                    }
                },
            }),
            HorizontalRule,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Image.configure({
                allowBase64: true,
                HTMLAttributes: {
                    class: 'max-w-full h-auto',
                },
            }),
            HardBreak,
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm prose-slate max-w-none focus:outline-none focus:ring-0 focus:border-0 min-h-[156px] p-2 text-slate-900 dark:text-slate-100 text-sm',
            },
            handleKeyDown(view, event) {
                if (event.key === "Tab") {
                    event.preventDefault();

                    view.dispatch(
                        view.state.tr.insertText("    ")
                    );
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
            setCharacterCount(editor.storage.characterCount.characters())
            setWordCount(editor.storage.characterCount.words())
        },
    })

    const percentage = editor
        ? Math.round((100 / limit) * characterCount)
        : 0

    return (
        <>
            <div className={`relative border rounded-md mb-1 p-2 ${colors.slate.active}`}>
                <TipTapBar editor={editor} />

                <EditorContent editor={editor} className='max-h-[50vh] overflow-y-auto scrollbar-hidden mb-10' />

                {editor && (
                    <div className={`flex items-center gap-2 ${characterCount === limit ? 'character-count--warning' : ''}`}>
                        <svg
                            height="20"
                            width="20"
                            viewBox="0 0 20 20"
                        >
                            <circle
                                r="10"
                                cx="10"
                                cy="10"
                                fill="var(--border)"
                            />
                            <circle
                                r="5"
                                cx="10"
                                cy="10"
                                fill="transparent"
                                stroke={`rgb(${characterCount === limit ? colorsHex.red : colorsHex.purple})`}
                                strokeWidth="10"
                                strokeDasharray={`calc(${percentage} * 31.4 / 100) 31.4`}
                                transform="rotate(-90) translate(-20)"
                            />
                            <circle
                                r="6"
                                cx="10"
                                cy="10"
                                fill="var(--background)"
                            />
                        </svg>

                        <div className={cn(
                            "flex flex-col justify-start gap-0.5 text-xs",
                            characterCount === limit ? colors.yellow.active : colors.teal.active
                        )}>
                            <span>
                                {characterCount} / {limit} characters
                            </span>

                            <span>
                                {wordCount} words
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default Tiptap
