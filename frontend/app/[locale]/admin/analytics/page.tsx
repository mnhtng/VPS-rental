import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2 } from 'lucide-react'

// Mock data - sẽ được thay thế bằng API call
const articles = [
    {
        id: 1,
        title: 'Getting Started with Chatbot',
        category: 'Tutorial',
        status: 'Published',
        createdAt: '2024-03-20'
    },
    // Thêm mock data khác...
]

export default function ArticlesPage() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Articles Management</h1>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Article
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {articles.map((article) => (
                            <TableRow key={article.id}>
                                <TableCell>{article.title}</TableCell>
                                <TableCell>{article.category}</TableCell>
                                <TableCell>{article.status}</TableCell>
                                <TableCell>{article.createdAt}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
} 