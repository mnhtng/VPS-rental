"use client"

import { ShoppingCart, Eye, Package, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
    SheetClose,
} from '@/components/ui/sheet'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminOrder } from "@/types/types"
import { formatDate } from "@/utils/string"
import { formatPrice } from "@/utils/currency"

export const OrderDetailSheet = ({
    order
}: {
    order: AdminOrder
}) => {
    const getStatusBadge = (status: AdminOrder['status']) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">Paid</Badge>
            case 'pending':
                return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-0">Pending</Badge>
            case 'cancelled':
                return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-0">Cancelled</Badge>
        }
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <Eye className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
                {/* Header with gradient based on status */}
                <div className={`p-6 pb-8 ${order.status === 'paid'
                    ? 'bg-linear-to-br from-green-500/20 via-green-500/10 to-background'
                    : order.status === 'pending'
                        ? 'bg-linear-to-br from-yellow-500/20 via-yellow-500/10 to-background'
                        : 'bg-linear-to-br from-red-500/20 via-red-500/10 to-background'
                    }`}>
                    <SheetHeader className="text-left">
                        <div className="flex items-center gap-3">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${order.status === 'paid'
                                ? 'bg-green-500/20'
                                : order.status === 'pending'
                                    ? 'bg-yellow-500/20'
                                    : 'bg-red-500/20'
                                }`}>
                                <ShoppingCart className={`h-6 w-6 ${order.status === 'paid'
                                    ? 'text-green-600'
                                    : order.status === 'pending'
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                    }`} />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-mono">{order.order_number}</SheetTitle>
                                <SheetDescription>
                                    {formatDate(new Date(order.created_at))}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                {/* Status card overlapping header */}
                <div className="px-6 -mt-4">
                    <div className="bg-card border rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between">
                            {getStatusBadge(order.status)}
                            {order.payment_method && (
                                <Badge variant="outline" className="bg-background">
                                    {order.payment_method}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '50ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Customer</h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <p className="text-sm"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{order.user?.name || 'N/A'}</span></p>
                            <p className="text-sm"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{order.user?.email || 'N/A'}</span></p>
                        </div>
                    </div>

                    {/* Order Note */}
                    {order.note && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms' }}>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Note</h4>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <p className="text-sm">
                                    <span className="font-medium">{order.note || 'N/A'}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Products ({order.order_items?.length || 0})
                        </h4>
                        <div className="space-y-3">
                            {order.order_items?.map((item, index) => (
                                <Card
                                    key={index}
                                    className="bg-linear-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20 hover:shadow-lg transition-all animate-in fade-in slide-in-from-left-4"
                                    style={{ animationDelay: `${(index + 1) * 50}ms` }}
                                >
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Package className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <p className="font-medium truncate">{item.hostname}</p>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 ml-10">{item.os}</p>
                                                <div className="flex flex-wrap gap-2 mt-2 ml-10">
                                                    <Badge variant="outline" className="bg-background">{item.configuration?.plan_name || 'VPS'}</Badge>
                                                    <Badge variant="secondary">{item.duration_months} months</Badge>
                                                </div>
                                            </div>
                                            <p className="font-bold text-green-600 shrink-0">
                                                {formatPrice(item.total_price)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '150ms' }}>
                        <Card className="bg-linear-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <DollarSign className="h-5 w-5 text-green-600" />
                                        </div>
                                        <span className="text-lg font-semibold">Total</span>
                                    </div>
                                    <span className="text-2xl font-bold text-green-600">{formatPrice(order.price)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <SheetFooter className="px-6 pb-6">
                    <SheetClose asChild>
                        <Button variant="outline" className="w-full">Close</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
