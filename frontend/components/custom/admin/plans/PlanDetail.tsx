"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, Layers, Cpu, MemoryStick, HardDrive, Gauge, DollarSign, Pencil, X, CheckCircle, ListChecks, Sparkles, Camera, Globe } from "lucide-react"
import { VPSPlan, VPSPlanCreate, VPSPlanUpdate } from "@/types/types"
import { formatPrice } from "@/utils/currency"
import { Badge } from "@/components/ui/badge"
import { getDiskSize, getNetworkSpeed } from "@/utils/string"
import { useTranslations } from "next-intl"

interface CreatePlanSheetProps {
    onCreate: (data: VPSPlanCreate) => Promise<void>
    isCreating: boolean
}

export const CreatePlanSheet = ({
    onCreate,
    isCreating
}: CreatePlanSheetProps) => {
    const t = useTranslations('admin.components.plan_detail')
    const tCommon = useTranslations('admin.components.common')
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState<VPSPlanCreate>({
        name: "",
        description: "",
        category: "basic",
        use_case: [],
        vcpu: 1,
        ram_gb: 1,
        storage_type: "SSD",
        storage_gb: 20,
        bandwidth_mbps: 100,
        monthly_price: 0,
        currency: "VND",
        max_snapshots: 1,
        max_ip_addresses: 1,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        await onCreate(formData)

        setOpen(false)
        setFormData({
            name: "",
            description: "",
            category: "basic",
            use_case: [],
            vcpu: 1,
            ram_gb: 1,
            storage_type: "SSD",
            storage_gb: 20,
            bandwidth_mbps: 100,
            monthly_price: 0,
            currency: "VND",
            max_snapshots: 1,
            max_ip_addresses: 1,
        })
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{t('add_plan')}</span>
                    <span className="sm:hidden">{tCommon('create')}</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                onInteractOutside={e => e.preventDefault()}
                className="w-full sm:max-w-lg overflow-y-auto p-0"
            >
                {/* Header with gradient */}
                <div className="bg-linear-to-br from-indigo-500/20 via-purple-500/10 to-background p-6 pb-8">
                    <SheetHeader className="text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <Layers className="h-6 w-6 text-indigo-500" />
                            </div>
                            <div>
                                <SheetTitle className="text-xl">{t('add_new_plan')}</SheetTitle>
                                <SheetDescription>
                                    {t('create_plan_desc')}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('basic_info')}
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                        <Layers className="h-3 w-3 text-indigo-500" />
                                    </div>
                                    {t('plan_name')} *
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. VPS Basic 1"
                                    className="bg-background border dark:border-accent/50"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <Sparkles className="h-3 w-3 text-purple-500" />
                                    </div>
                                    {t('description_field')}
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Plan description..."
                                    rows={2}
                                    className="bg-background border dark:border-accent/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('category')} *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value: 'basic' | 'standard' | 'premium') =>
                                            setFormData({
                                                ...formData,
                                                category: value,
                                                max_snapshots: value === 'premium' ? 3 : 1
                                            })
                                        }
                                    >
                                        <SelectTrigger className="bg-background border dark:border-accent/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">
                                                <span className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    Basic
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="standard">
                                                <span className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                    Standard
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="premium">
                                                <span className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                    Premium
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('storage_type')} *</Label>
                                    <Select
                                        value={formData.storage_type}
                                        onValueChange={(value: 'SSD' | 'NVMe') =>
                                            setFormData({ ...formData, storage_type: value })
                                        }
                                    >
                                        <SelectTrigger className="bg-background border dark:border-accent/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SSD">SSD</SelectItem>
                                            <SelectItem value="NVMe">NVMe</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hardware Specs */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '50ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('specs')}
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <Cpu className="h-3 w-3 text-blue-500" />
                                        </div>
                                        vCPU *
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.vcpu}
                                        onChange={(e) => setFormData({ ...formData, vcpu: parseInt(e.target.value) || 1 })}
                                        className="bg-background border dark:border-accent/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <MemoryStick className="h-3 w-3 text-green-500" />
                                        </div>
                                        {t('ram')} *
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.ram_gb}
                                        onChange={(e) => setFormData({ ...formData, ram_gb: parseInt(e.target.value) || 1 })}
                                        className="bg-background border dark:border-accent/50"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                                            <HardDrive className="h-3 w-3 text-purple-500" />
                                        </div>
                                        {t('storage')} *
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.storage_gb}
                                        onChange={(e) => setFormData({ ...formData, storage_gb: parseInt(e.target.value) || 1 })}
                                        className="bg-background border dark:border-accent/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                                            <Gauge className="h-3 w-3 text-orange-500" />
                                        </div>
                                        {t('bandwidth')} *
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.bandwidth_mbps}
                                        onChange={(e) => setFormData({ ...formData, bandwidth_mbps: parseInt(e.target.value) || 1 })}
                                        className="bg-background border dark:border-accent/50"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Pricing
                        </h4>
                        <div className="bg-linear-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <DollarSign className="h-3 w-3 text-green-500" />
                                        </div>
                                        {t('monthly_price')} *
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.monthly_price}
                                        onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })}
                                        className="bg-background border dark:border-accent/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Currency</Label>
                                    <Select
                                        value={formData.currency}
                                        onValueChange={(value: 'USD' | 'VND') =>
                                            setFormData({ ...formData, currency: value })
                                        }
                                    >
                                        <SelectTrigger className="bg-background border dark:border-accent/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="VND">VND</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Use Cases */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '150ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Use Cases
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {(formData.use_case || []).map((useCase, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1 py-1.5">
                                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                        {useCase}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 ml-1 hover:bg-red-500/20 rounded-full"
                                            onClick={() => {
                                                const newUseCases = [...(formData.use_case || [])]
                                                newUseCases.splice(index, 1)
                                                setFormData({ ...formData, use_case: newUseCases })
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a use case and press Enter..."
                                    className="bg-background border dark:border-accent/50"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            const input = e.target as HTMLInputElement
                                            if (input.value.trim()) {
                                                setFormData({
                                                    ...formData,
                                                    use_case: [...(formData.use_case || []), input.value.trim()]
                                                })
                                                input.value = ''
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Limits */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '200ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Additional Limits
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-cyan-500/10 flex items-center justify-center">
                                            <Camera className="h-3 w-3 text-cyan-500" />
                                        </div>
                                        Max Snapshots
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.max_snapshots || 1}
                                        onChange={(e) => setFormData({ ...formData, max_snapshots: parseInt(e.target.value) || 1 })}
                                        className="bg-background border dark:border-accent/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-pink-500/10 flex items-center justify-center">
                                            <Globe className="h-3 w-3 text-pink-500" />
                                        </div>
                                        Max IP Addresses
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.max_ip_addresses || 1}
                                        onChange={(e) => setFormData({ ...formData, max_ip_addresses: parseInt(e.target.value) || 1 })}
                                        className="bg-background border dark:border-accent/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="gap-2 pt-2">
                        <SheetClose asChild>
                            <Button type="button" variant="outline" className="flex-1">{tCommon('cancel')}</Button>
                        </SheetClose>
                        <Button type="submit" disabled={isCreating} className="flex-1">
                            {isCreating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {tCommon('creating')}
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('create_plan')}
                                </>
                            )}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

interface PlanDetailSheetProps {
    plan: VPSPlan
    onUpdate: (planId: string, data: VPSPlanUpdate) => Promise<void>
    isUpdating: boolean
}

export const PlanDetailSheet = ({
    plan,
    onUpdate,
    isUpdating
}: PlanDetailSheetProps) => {
    const t = useTranslations('admin.components.plan_detail')
    const tCommon = useTranslations('admin.components.common')
    const [open, setOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<VPSPlanUpdate>({
        name: plan.name,
        description: plan.description,
        category: plan.category as 'basic' | 'standard' | 'premium',
        use_case: plan.use_case || [],
        vcpu: plan.vcpu,
        ram_gb: plan.ram_gb,
        storage_type: plan.storage_type,
        storage_gb: plan.storage_gb,
        bandwidth_mbps: plan.bandwidth_mbps,
        monthly_price: plan.monthly_price,
        currency: plan.currency,
        max_snapshots: plan.max_snapshots,
        max_ip_addresses: plan.max_ip_addresses,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onUpdate(plan.id, formData)
        setIsEditing(false)
    }

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'basic':
                return 'from-blue-500/20 via-blue-500/10'
            case 'standard':
                return 'from-purple-500/20 via-purple-500/10'
            case 'premium':
                return 'from-amber-500/20 via-amber-500/10'
            default:
                return 'from-gray-500/20 via-gray-500/10'
        }
    }

    const getCategoryBadgeColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'basic':
                return 'bg-blue-500/10 text-blue-600 border-blue-500/30'
            case 'standard':
                return 'bg-purple-500/10 text-purple-600 border-purple-500/30'
            case 'premium':
                return 'bg-amber-500/10 text-amber-600 border-amber-500/30'
            default:
                return ''
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="link" className="p-0 h-auto font-medium text-foreground hover:text-primary transition-colors">
                    {plan.name}
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                onInteractOutside={e => e.preventDefault()}
                className="w-full sm:max-w-lg overflow-y-auto p-0"
            >
                {/* Header with gradient */}
                <div className={`bg-linear-to-br ${getCategoryColor(plan.category)} to-background p-6 pb-8`}>
                    <SheetHeader className="text-left">
                        <SheetTitle className="text-xl">{t('title')}</SheetTitle>
                        <SheetDescription>
                            {t('description')}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* Plan card overlapping header */}
                <div className="px-6 -mt-6">
                    <div className="bg-card border rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                                <Layers className="h-8 w-8 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-semibold truncate">{plan.name}</h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge variant="outline" className={getCategoryBadgeColor(plan.category)}>
                                        {plan.category.charAt(0).toUpperCase() + plan.category.slice(1)}
                                    </Badge>
                                    <Badge variant="outline" className="bg-gray-500/10">
                                        {plan.storage_type}
                                    </Badge>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsEditing(!isEditing)}
                                className="shrink-0"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Edit Form */}
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    Edit Information
                                </h4>
                                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Plan Name</Label>
                                        <Input
                                            value={formData.name || ""}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="bg-background border dark:border-accent/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={formData.description || ""}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={2}
                                            className="bg-background border dark:border-accent/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value: 'basic' | 'standard' | 'premium') =>
                                                    setFormData({
                                                        ...formData,
                                                        category: value,
                                                        max_snapshots: value === 'premium' ? 3 : 1
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="bg-background border dark:border-accent/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="basic">Basic</SelectItem>
                                                    <SelectItem value="standard">Standard</SelectItem>
                                                    <SelectItem value="premium">Premium</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Storage Type</Label>
                                            <Select
                                                value={formData.storage_type}
                                                onValueChange={(value: 'SSD' | 'NVMe') =>
                                                    setFormData({ ...formData, storage_type: value })
                                                }
                                            >
                                                <SelectTrigger className="bg-background border dark:border-accent/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="SSD">SSD</SelectItem>
                                                    <SelectItem value="NVMe">NVMe</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '50ms' }}>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    Hardware Specifications
                                </h4>
                                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Cpu className="h-3 w-3 text-blue-500" /> vCPU
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={formData.vcpu || ""}
                                                onChange={(e) => setFormData({ ...formData, vcpu: parseInt(e.target.value) })}
                                                className="bg-background border dark:border-accent/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <MemoryStick className="h-3 w-3 text-green-500" /> RAM (GB)
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={formData.ram_gb || ""}
                                                onChange={(e) => setFormData({ ...formData, ram_gb: parseInt(e.target.value) })}
                                                className="bg-background border dark:border-accent/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <HardDrive className="h-3 w-3 text-purple-500" /> Storage (GB)
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={formData.storage_gb || ""}
                                                onChange={(e) => setFormData({ ...formData, storage_gb: parseInt(e.target.value) })}
                                                className="bg-background border dark:border-accent/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Gauge className="h-3 w-3 text-orange-500" /> Bandwidth (Mbps)
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={formData.bandwidth_mbps || ""}
                                                onChange={(e) => setFormData({ ...formData, bandwidth_mbps: parseInt(e.target.value) })}
                                                className="bg-background border dark:border-accent/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms' }}>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    Pricing
                                </h4>
                                <div className="bg-linear-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <DollarSign className="h-3 w-3 text-green-500" /> Monthly Price
                                            </Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={formData.monthly_price || ""}
                                                onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) })}
                                                className="bg-background border dark:border-accent/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Currency</Label>
                                            <Select
                                                value={formData.currency}
                                                onValueChange={(value: 'USD' | 'VND') =>
                                                    setFormData({ ...formData, currency: value })
                                                }
                                            >
                                                <SelectTrigger className="bg-background border dark:border-accent/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="VND">VND</SelectItem>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '150ms' }}>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    Use Cases
                                </h4>
                                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {(formData.use_case || []).map((useCase, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1 py-1.5">
                                                <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                                {useCase}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-4 w-4 p-0 ml-1 hover:bg-red-500/20 rounded-full"
                                                    onClick={() => {
                                                        const newUseCases = [...(formData.use_case || [])]
                                                        newUseCases.splice(index, 1)
                                                        setFormData({ ...formData, use_case: newUseCases })
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <Input
                                        placeholder="Type a use case and press Enter..."
                                        className="bg-background border dark:border-accent/50"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                const input = e.target as HTMLInputElement
                                                if (input.value.trim()) {
                                                    setFormData({
                                                        ...formData,
                                                        use_case: [...(formData.use_case || []), input.value.trim()]
                                                    })
                                                    input.value = ''
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Additional Limits */}
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '200ms' }}>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    Additional Limits
                                </h4>
                                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Camera className="h-3 w-3 text-cyan-500" /> Max Snapshots
                                            </Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={formData.max_snapshots || 1}
                                                onChange={(e) => setFormData({ ...formData, max_snapshots: parseInt(e.target.value) || 1 })}
                                                className="bg-background border dark:border-accent/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Globe className="h-3 w-3 text-pink-500" /> Max IP Addresses
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={formData.max_ip_addresses || 1}
                                                onChange={(e) => setFormData({ ...formData, max_ip_addresses: parseInt(e.target.value) || 1 })}
                                                className="bg-background border dark:border-accent/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <SheetFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                                    {tCommon('cancel')}
                                </Button>
                                <Button type="submit" disabled={isUpdating} className="flex-1">
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {tCommon('saving')}
                                        </>
                                    ) : (
                                        tCommon('save')
                                    )}
                                </Button>
                            </SheetFooter>
                        </form>
                    ) : (
                        <>
                            {/* View Mode */}
                            {plan.description && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                </div>
                            )}

                            {/* Hardware Specs */}
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '50ms' }}>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    Hardware Specifications
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <Cpu className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">vCPU</p>
                                            <p className="font-semibold">{plan.vcpu} Cores</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                            <MemoryStick className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">RAM</p>
                                            <p className="font-semibold">{plan.ram_gb} GB</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                                            <HardDrive className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Storage</p>
                                            <p className="font-semibold">{getDiskSize(plan.storage_gb, plan.storage_type)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                                        <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                                            <Gauge className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Bandwidth</p>
                                            <p className="font-semibold">{getNetworkSpeed(plan.bandwidth_mbps)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms' }}>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    Pricing
                                </h4>
                                <div className="p-4 rounded-lg bg-linear-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                            <DollarSign className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Monthly Price</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {formatPrice(plan.monthly_price)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Use Cases */}
                            {plan.use_case && plan.use_case.length > 0 && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '150ms' }}>
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <ListChecks className="h-4 w-4" /> Use Cases
                                    </h4>
                                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                        {plan.use_case.map((useCase, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                                                <span className="text-sm">{useCase}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Additional Limits */}
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '200ms' }}>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    Additional Limits
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                                        <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                                            <Camera className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Max Snapshots</p>
                                            <p className="font-semibold">{plan.max_snapshots || 1}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                                        <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                                            <Globe className="h-5 w-5 text-pink-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Max IP Addresses</p>
                                            <p className="font-semibold">{plan.max_ip_addresses || 1}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <SheetFooter className="pt-2">
                                <SheetClose asChild>
                                    <Button variant="outline" className="w-full">{tCommon('close')}</Button>
                                </SheetClose>
                            </SheetFooter>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
