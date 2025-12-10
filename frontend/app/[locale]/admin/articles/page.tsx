"use client"

import { Button } from "@/components/ui/button"
import { Bot, PlusIcon, Search } from "lucide-react"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Sheet,
    SheetClose,
    SheetContentCustom,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { useEffect, useState } from "react"
import { toast } from "sonner"
import debounce from "@/utils/performanceUtil/debounce"
import { normalizeString } from "@/utils/string"
import { ArticleDataTable } from "@/components/custom/table/article-data-table"
import Tiptap from "@/components/custom/text-editor/tiptap"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ArticleDataType } from "@/types/data-table-types"

const dataFile = [
    {
        "id": '1123121',
        "title": "Understanding React Hooks",
        "content": "React Hooks are functions that let you use state and other React features without writing a class. They were introduced in React 16.8 and have since become a fundamental part of React development.",
        "createdAt": "2023-10-01T12:00:00Z",
        "updatedAt": "2023-10-02T12:00:00Z",
    },
    {
        "id": '1123122',
        "title": "A Guide to Next.js Routing",
        "content": "Next.js provides a powerful routing system that allows developers to create dynamic and static routes with ease. This guide covers the basics of routing in Next.js, including dynamic routes and API routes.",
        "createdAt": "2023-10-03T12:00:00Z",
        "updatedAt": "2023-10-04T12:00:00Z",
    },
    {
        "id": '1123123',
        "title": "CSS Grid vs Flexbox",
        "content": "CSS Grid and Flexbox are two powerful layout systems in CSS. This article compares the two, discussing their strengths, weaknesses, and when to use each.",
        "createdAt": "2023-10-05T12:00:00Z",
        "updatedAt": "2023-10-06T12:00:00Z",
    },
    {
        "id": '1123124',
        "title": "JavaScript ES6 Features You Should Know",
        "content": "ES6 introduced many new features to JavaScript, including arrow functions, classes, and template literals. This article provides an overview of the most important ES6 features and how to use them.",
        "createdAt": "2023-10-07T12:00:00Z",
        "updatedAt": "2023-10-08T12:00:00Z",
    },
    {
        "id": '1123125',
        "title": "Building RESTful APIs with Express.js",
        "content": "Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for building web and mobile applications. This article covers how to build RESTful APIs using Express.js.",
        "createdAt": "2023-10-09T12:00:00Z",
        "updatedAt": "2023-10-10T12:00:00Z",
    },
]

export default function ArticlePage() {
    const [articles, setArticles] = useState<ArticleDataType[]>([])
    const [action, setAction] = useState({
        loading: false,
        error: null as string | null,
    })
    const [prompt, setPrompt] = useState<string>('')

    const handleAddArticle = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const formData = new FormData(e.currentTarget)
        const title = formData.get('title') as string
        const content = formData.get('content') as string

        try {
            setAction({
                loading: true,
                error: null
            })

            console.log('Adding article:', { title, content })

            toast.success('Article added successfully!')
        } catch {
            toast.error('Failed to add article. Please try again.')
        } finally {
            setAction({
                loading: false,
                error: null
            })
        }
    }

    useEffect(() => {
        if (dataFile) {
            setArticles(dataFile as ArticleDataType[])
        }
    }, [])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = normalizeString(e.target.value)

        if (!query) {
            setArticles(dataFile as ArticleDataType[])
            return
        }

        const filteredData = dataFile.filter(article => {
            return (
                normalizeString(article.title).includes(query) ||
                normalizeString(article.content).includes(query) ||
                normalizeString(article.createdAt).includes(query) ||
                normalizeString(article.updatedAt).includes(query)
            )
        })

        setArticles(filteredData as ArticleDataType[])
    }

    return (
        <>
            <div className="flex flex-row justify-between items-center gap-5 mb-4">
                <div className="relative lg:w-1/2 w-full h-max">
                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />

                    <Input
                        id="search-article"
                        name="search-article"
                        type="search"
                        placeholder="Search articles..."
                        className="md:pr-10 pr-8"
                        onChange={debounce(handleSearch, 500)}
                    />
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="default"
                            size="sm"
                        >
                            <PlusIcon />
                            <span className="hidden lg:inline">Add Article</span>
                        </Button>
                    </SheetTrigger>

                    <SheetContentCustom
                        side="right"
                        size="100vw"
                        onInteractOutside={e => {
                            e.preventDefault()
                        }}
                        className="flex flex-col z-1000 bg-background/0 border-none shadow-none"
                    >
                        <ResizablePanelGroup
                            direction="horizontal"
                            className="h-full w-full overflow-auto"
                        >
                            <ResizablePanel defaultSize={50} />

                            <ResizableHandle withHandle />

                            <ResizablePanel className="flex flex-col bg-background">
                                <SheetHeader className="gap-1">
                                    <SheetTitle>Add Article</SheetTitle>

                                    <SheetDescription>
                                        Fill out the form below to add a new article.
                                    </SheetDescription>
                                </SheetHeader>

                                <Separator />

                                <div className="flex flex-1 flex-col gap-4 overflow-y-auto max-h-fit p-4 text-sm">
                                    <form
                                        onSubmit={handleAddArticle}
                                        className="flex flex-1 h-full overflow-auto"
                                    >
                                        <div className="flex flex-1 flex-col justify-between items-stretch gap-4 overflow-y-auto p-4 text-sm">
                                            <div className="flex flex-col gap-4 flex-1">
                                                <div className="flex flex-col gap-3">
                                                    <Label htmlFor="title">Title</Label>

                                                    <div className="flex gap-3">
                                                        <Input
                                                            id="title"
                                                            name="title"
                                                            type="text"
                                                            placeholder="Article title..."
                                                            onChange={(e) => setPrompt(e.target.value)}
                                                            required
                                                            disabled={action.loading}
                                                        />

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                {prompt.trim() ? (
                                                                    <Button
                                                                        variant="ghost"
                                                                        disabled={action.loading || !prompt.trim()}
                                                                    >
                                                                        <Bot className="size-4" />
                                                                    </Button>
                                                                ) : (
                                                                    <div className="flex justify-center items-center px-3 py-2">
                                                                        <Bot className="size-4 opacity-50" />
                                                                    </div>
                                                                )}
                                                            </TooltipTrigger>

                                                            <TooltipContent className="z-2000">
                                                                <p className="text-xs">
                                                                    Generate Content
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <Label htmlFor="content">Content</Label>
                                                    <Tiptap
                                                        content=""
                                                        onChange={(content) => {
                                                            console.log('Content changed:', content)
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <SheetFooter className="mt-auto flex flex-col gap-4 md:flex-row px-0">
                                                <Button
                                                    type="submit"
                                                    className="flex-1 w-full"
                                                    disabled={action.loading}
                                                >
                                                    Submit
                                                </Button>

                                                <SheetClose asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 w-full"
                                                        disabled={action.loading}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </SheetClose>
                                            </SheetFooter>
                                        </div>
                                    </form>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </SheetContentCustom>
                </Sheet>
            </div >

            <div className="relative mb-4">
                <ArticleDataTable
                    initialData={articles}
                />
            </div>
        </>
    )
} 