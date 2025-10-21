"use client"

import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    AlignVerticalJustifyCenter,
    AlignVerticalSpaceAround,
    ArrowBigDownDash,
    BetweenHorizonalEnd,
    BetweenHorizonalStart,
    BetweenVerticalEnd,
    BetweenVerticalStart,
    Bold,
    ChevronDown,
    ChevronRight,
    CodeXml,
    Columns2,
    Eraser,
    Heading,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Highlighter,
    Images,
    Italic,
    Link,
    List,
    ListOrdered,
    ListTodo,
    Quote,
    Redo2,
    Rows2,
    SquareTerminal,
    SquareX,
    Strikethrough,
    Subscript,
    Superscript,
    Table,
    TableCellsMerge,
    Underline,
    Undo2,
} from "lucide-react";
import { Editor } from "@tiptap/react";
import { Toggle } from "@radix-ui/react-toggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { colors } from "@/utils/color";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DropdownMenuGroup } from "@radix-ui/react-dropdown-menu";
import "@/styles/tiptap-bar.scss";
import "@/styles/scrollbar.scss";

export interface DropdownProps {
    parent: string
    children: string
    icon: React.ReactNode
}

type OptionGroupItem = {
    title: string;
    icon?: React.ReactNode;
    defaultIcon?: React.ReactNode;
    onClick?: () => void;
    preesed?: boolean;
    group?: OptionGroupItem[];
};

type Option = {
    tooltip: string;
    icon?: React.ReactNode;
    defaultIcon?: React.ReactNode;
    onClick?: () => void;
    preesed?: boolean;
    separator?: boolean;
    group?: OptionGroupItem[];
};

const TipTapBar = ({
    editor
}: {
    editor: Editor | null
}) => {
    const [open, setOpen] = useState(0)

    if (!editor) return null

    const Options = [
        {
            tooltip: "Undo",
            icon: <Undo2 />,
            onClick: () => editor.chain().focus().undo().run(),
            preesed: editor.can().undo(),
        },
        {
            tooltip: "Redo",
            icon: <Redo2 />,
            onClick: () => editor.chain().focus().redo().run(),
            preesed: editor.can().redo(),
        },
        {
            separator: true,
            tooltip: "Heading",
            defaultIcon: <Heading />,
            group: [
                {
                    title: "Heading 1",
                    icon: <Heading1 />,
                    onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
                    preesed: editor.isActive("heading", { level: 1 }),
                },
                {
                    title: "Heading 2",
                    icon: <Heading2 />,
                    onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                    preesed: editor.isActive("heading", { level: 2 }),
                },
                {
                    title: "Heading 3",
                    icon: <Heading3 />,
                    onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
                    preesed: editor.isActive("heading", { level: 3 }),
                },
                {
                    title: "Heading 4",
                    icon: <Heading4 />,
                    onClick: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
                    preesed: editor.isActive("heading", { level: 4 }),
                }
            ]
        },
        {
            tooltip: "List",
            defaultIcon: <List />,
            group: [
                {
                    title: "Bullet List",
                    icon: <List />,
                    onClick: () => editor.chain().focus().toggleBulletList().run(),
                    preesed: editor.isActive("bulletList"),
                },
                {
                    title: "Ordered List",
                    icon: <ListOrdered />,
                    onClick: () => editor.chain().focus().toggleOrderedList().run(),
                    preesed: editor.isActive("orderedList"),
                },
                {
                    title: "Task List",
                    icon: <ListTodo />,
                    onClick: () => editor.chain().focus().toggleTaskList().run(),
                    preesed: editor.isActive("taskList"),
                },
            ]
        },
        {
            tooltip: "Blockquote",
            icon: <Quote />,
            onClick: () => editor.chain().focus().toggleBlockquote().run(),
            preesed: editor.isActive("blockquote"),
        },
        {
            tooltip: "Code Block",
            icon: <SquareTerminal />,
            onClick: () => editor.chain().focus().toggleCodeBlock().run(),
            preesed: editor.isActive("codeBlock"),
        },
        {
            separator: true,
            tooltip: "Bold",
            icon: <Bold />,
            onClick: () => editor.chain().focus().toggleBold().run(),
            preesed: editor.isActive("bold"),
        },
        {
            tooltip: "Italic",
            icon: <Italic />,
            onClick: () => editor.chain().focus().toggleItalic().run(),
            preesed: editor.isActive("italic"),
        },
        {
            tooltip: "Strikethrough",
            icon: <Strikethrough />,
            onClick: () => editor.chain().focus().toggleStrike().run(),
            preesed: editor.isActive("strike"),
        },
        {
            tooltip: "Underline",
            icon: <Underline />,
            onClick: () => editor.chain().focus().toggleUnderline().run(),
            preesed: editor.isActive("underline"),
        },
        {
            tooltip: "Code",
            icon: <CodeXml />,
            onClick: () => editor.chain().focus().toggleCode().run(),
            preesed: editor.isActive("code"),
        },
        {
            tooltip: "Superscript",
            icon: <Superscript />,
            onClick: () => editor.chain().focus().toggleSuperscript().run(),
            preesed: editor.isActive("superscript"),
        },
        {
            tooltip: "Subscript",
            icon: <Subscript />,
            onClick: () => editor.chain().focus().toggleSubscript().run(),
            preesed: editor.isActive("subscript"),
        },
        {
            separator: true,
            tooltip: "Attach Link",
            icon: <Link />,
            onClick: () => {
                const url = window.prompt("Please enter the URL for the link:")
                if (url) {
                    editor.chain().focus().setLink({ href: url }).run()
                }
            },
            preesed: editor.isActive("link"),
        },
        {
            tooltip: "Align Text",
            defaultIcon: <AlignVerticalSpaceAround />,
            group: [
                {
                    title: "Left Align",
                    icon: <AlignLeft />,
                    onClick: () => editor.chain().focus().setTextAlign("left").run(),
                    preesed: editor.isActive({ textAlign: "left" }),
                },
                {
                    title: "Center Align",
                    icon: <AlignCenter />,
                    onClick: () => editor.chain().focus().setTextAlign("center").run(),
                    preesed: editor.isActive({ textAlign: "center" }),
                },
                {
                    title: "Right Align",
                    icon: <AlignRight />,
                    onClick: () => editor.chain().focus().setTextAlign("right").run(),
                    preesed: editor.isActive({ textAlign: "right" }),
                },
                {
                    title: "Justify Align",
                    icon: <AlignJustify />,
                    onClick: () => editor.chain().focus().setTextAlign("justify").run(),
                    preesed: editor.isActive({ textAlign: "justify" }),
                },
            ]
        },
        {
            tooltip: "Table",
            defaultIcon: <Table />,
            group: [
                {
                    title: "Table",
                    defaultIcon: <Table />,
                    group: [
                        {
                            title: "Insert Table",
                            icon: <Table />,
                            onClick: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
                            preesed: !editor.can().insertTable(),
                        },
                        {
                            title: "Delete Table",
                            icon: <SquareX />,
                            onClick: () => editor.chain().focus().deleteTable().run(),
                            preesed: !editor.can().deleteTable(),
                        },
                    ],
                },
                {
                    title: "Row",
                    defaultIcon: <Rows2 />,
                    group: [
                        {
                            title: "Add Row Before",
                            icon: <BetweenHorizonalStart />,
                            onClick: () => editor.chain().focus().addRowBefore().run(),
                            preesed: !editor.can().addRowBefore(),
                        },
                        {
                            title: "Add Row After",
                            icon: <BetweenHorizonalEnd />,
                            onClick: () => editor.chain().focus().addRowAfter().run(),
                            preesed: !editor.can().addRowAfter(),
                        },
                        {
                            title: "Delete Row",
                            icon: <SquareX />,
                            onClick: () => editor.chain().focus().deleteRow().run(),
                            preesed: !editor.can().deleteRow(),
                        },
                    ]
                },
                {
                    title: "Column",
                    defaultIcon: <Columns2 />,
                    group: [
                        {
                            title: "Add Column Before",
                            icon: <BetweenVerticalStart />,
                            onClick: () => editor.chain().focus().addColumnBefore().run(),
                            preesed: !editor.can().addColumnBefore(),
                        },
                        {
                            title: "Add Column After",
                            icon: <BetweenVerticalEnd />,
                            onClick: () => editor.chain().focus().addColumnAfter().run(),
                            preesed: !editor.can().addColumnAfter(),
                        },
                        {
                            title: "Delete Column",
                            icon: <SquareX />,
                            onClick: () => editor.chain().focus().deleteColumn().run(),
                            preesed: !editor.can().deleteColumn(),
                        },
                    ],
                },
                {
                    title: "Merge or Split Cells",
                    icon: <TableCellsMerge />,
                    onClick: () => editor.chain().focus().mergeOrSplit().run(),
                    preesed: editor.can().mergeOrSplit(),
                },
            ]
        },
        {
            tooltip: "Add Image",
            icon: <Images />,
            onClick: () => {
                const url = window.prompt("Please enter the image URL:");
                if (url) {
                    editor.chain().focus().setImage({ src: url }).run()
                }
            },
            preesed: !editor.can().setImage({ src: "" }),
        },
        {
            tooltip: "Separator",
            separator: true,
            icon: <AlignVerticalJustifyCenter />,
            onClick: () => editor.chain().focus().setHorizontalRule().run(),
            preesed: !editor.can().setHorizontalRule(),
        },
        {
            tooltip: "Highlight",
            icon: <Highlighter />,
            onClick: () => editor.chain().focus().toggleHighlight().run(),
            preesed: editor.isActive("highlight"),
        },
        {
            icon: <ArrowBigDownDash />,
            tooltip: "Hard Break",
            onClick: () => editor.chain().focus().setHardBreak().run(),
            preesed: !editor.can().setHardBreak(),
        },
        {
            tooltip: "Clear Formatting",
            icon: <Eraser />,
            onClick: () => editor.chain().focus().unsetAllMarks().run(),
            preesed: !editor.can().unsetAllMarks(),
        },
    ] as Option[]

    return (
        <div className="sticky top-0 z-100 scrollbar-thin w-full mb-3 border-b-2 bg-background rounded-md shadow-sm overflow-x-auto">
            <div className="flex gap-2 w-fit mx-auto p-1.5">
                {Options.map((option, index) => (
                    <div key={index} className="relative flex items-center gap-2">
                        {option.separator && <Separator orientation="vertical" />}

                        {option.group ? (
                            <DropdownMenu open={open === index} onOpenChange={(isOpen) => setOpen(isOpen ? index : 0)}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            {(() => {
                                                const isAnyChildPressed = option.group?.some(
                                                    (groupItem) => groupItem.preesed
                                                )
                                                const isActive = option.preesed || isAnyChildPressed

                                                return (
                                                    <Toggle
                                                        pressed={isActive}
                                                        onPressedChange={option.onClick}
                                                        className={cn(
                                                            "flex items-center gap-1 rounded-md disabled:opacity-50 disabled:pointer-events-none p-1",
                                                            isActive ? colors.teal.active : "bg-muted text-muted-foreground",
                                                            colors.teal.hover,
                                                        )}
                                                    >
                                                        {option.defaultIcon}
                                                        <ChevronDown className="ml-auto size-4" />
                                                    </Toggle>
                                                )
                                            })()}
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>

                                    <TooltipContent
                                        side="bottom"
                                        className="z-2000"
                                    >
                                        <p>{option.tooltip}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <DropdownMenuContent
                                    side="bottom"
                                    align="start"
                                    className="min-w-[160px] mt-2 z-2000"
                                >
                                    {option.group.map((groupItem, groupIndex) => (
                                        ("group" in groupItem && Array.isArray(groupItem.group) && groupItem.group.length > 0) ? (
                                            <DropdownMenuGroup key={groupIndex} className="w-full">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        className={cn(
                                                            "w-full flex items-center gap-1 rounded-md disabled:opacity-50 disabled:pointer-events-none p-1",
                                                            option.preesed ? colors.teal.active : "bg-muted text-muted-foreground",
                                                            option?.group && groupIndex !== option.group.length - 1 ? "mb-1" : "",
                                                            colors.teal.hover,
                                                        )}
                                                    >
                                                        {groupItem.icon || groupItem.defaultIcon}
                                                        <span>{groupItem.title}</span>
                                                        {groupItem.group.length > 0 && <ChevronRight className="ml-auto size-4" />}
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent
                                                        side="right"
                                                        className="z-2000"
                                                    >
                                                        {groupItem.group.map((subItem, subIndex) => (
                                                            <DropdownMenuItem
                                                                key={subIndex}
                                                                className="p-0"
                                                            >
                                                                <Toggle
                                                                    pressed={subItem.preesed}
                                                                    onPressedChange={subItem.onClick}
                                                                    className={cn(
                                                                        "w-full rounded-md disabled:opacity-50 disabled:pointer-events-none p-2",
                                                                        subItem.preesed ? colors.teal.active : "bg-muted text-muted-foreground",
                                                                        option?.group && groupIndex !== option.group.length - 1 ? "mb-1" : "",
                                                                        colors.teal.hover,
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {subItem.icon || subItem.defaultIcon}
                                                                        <span>{subItem.title}</span>
                                                                    </div>
                                                                </Toggle>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </DropdownMenuGroup>
                                        ) : (
                                            <DropdownMenuItem
                                                key={groupIndex}
                                                className={cn(
                                                    "p-0",
                                                    option?.group && groupIndex !== option.group.length - 1 && "mb-1"
                                                )}
                                            >
                                                <Toggle
                                                    pressed={groupItem.preesed}
                                                    onPressedChange={groupItem.onClick}
                                                    className={cn(
                                                        "w-full rounded-md disabled:opacity-50 disabled:pointer-events-none p-2",
                                                        groupItem.preesed ? colors.teal.active : "bg-muted text-muted-foreground",
                                                        colors.teal.hover,
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {groupItem.icon || groupItem.defaultIcon}
                                                        <span>{groupItem.title}</span>
                                                    </div>
                                                </Toggle>
                                            </DropdownMenuItem>
                                        )
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Toggle
                                        key={index}
                                        pressed={option.preesed}
                                        onPressedChange={option.onClick as () => void}
                                        className={cn(
                                            "rounded-md disabled:opacity-50 disabled:pointer-events-none p-1",
                                            option.preesed ? colors.teal.active : "bg-muted text-muted-foreground",
                                            colors.teal.hover,
                                        )}
                                    >
                                        {option.icon}
                                    </Toggle>
                                </TooltipTrigger>

                                <TooltipContent
                                    side="bottom"
                                    className="z-2000"
                                >
                                    <p>{option.tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                ))}
            </div >
        </div>
    );
}

export default TipTapBar