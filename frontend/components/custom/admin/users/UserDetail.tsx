"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, Mail, Phone, Shield, UserPlus, Users, Loader, Lock, Pencil, Calendar, MapPinHouse, CheckCircle2 } from "lucide-react"
import { Input } from '@/components/ui/input'
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { formatDate } from "@/utils/string"
import { User, AdminUserCreate, AdminUserUpdate } from "@/types/types"
import { useTranslations } from "next-intl"

interface UserDetailSheetProps {
    user: User
    onUpdate: (userId: string, data: AdminUserUpdate) => Promise<void>
    isUpdating: boolean
}

interface CreateUserSheetProps {
    onCreate: (data: AdminUserCreate) => Promise<void>
    isCreating: boolean
}

export const UserDetailSheet = ({
    user, onUpdate, isUpdating
}: UserDetailSheetProps) => {
    const t = useTranslations('admin.components.user_detail')
    const tCommon = useTranslations('admin.components.common')
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<AdminUserUpdate>({
        name: user.name || '',
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        role: user.role,
    })

    const getProviderBadge = (provider?: string) => {
        switch (provider) {
            case 'google':
                return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Google</Badge>
            case 'github':
                return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30">GitHub</Badge>
            default:
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Email</Badge>
        }
    }

    const handleSave = async () => {
        if (!editForm)
            return

        if (editForm.name && (editForm.name.trim() === '' || editForm.name.length < 2)) {
            toast.error(t('validation.name_min'));
        }

        if (editForm.email && !/\S+@\S+\.\S+/.test(editForm.email)) {
            toast.error(t('validation.email_invalid'));
            return;
        }

        if (editForm.phone && editForm.phone.length < 10) {
            toast.error(t('validation.phone_invalid'));
            return;
        }

        await onUpdate(user.id, editForm)
        setIsEditing(false)
    }

    useEffect(() => {
        setEditForm({
            name: user.name || '',
            email: user.email,
            phone: user.phone || '',
            address: user.address || '',
            role: user.role,
            verify_email: undefined,
        })
    }, [user])

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="link" className="p-0 h-auto font-medium text-foreground hover:text-primary transition-colors">
                    {user.name || tCommon('na')}
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                onInteractOutside={e => {
                    e.preventDefault()
                }}
                className="w-full sm:max-w-lg overflow-y-auto p-0"
            >
                {/* Header */}
                <div className="bg-linear-to-br from-primary/20 via-primary/10 to-background p-6 pb-8">
                    <SheetHeader className="text-left">
                        <SheetTitle className="text-xl">{t('title')}</SheetTitle>
                        <SheetDescription>
                            {t('description')}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* Avatar card overlapping header */}
                <div className="px-6 -mt-6">
                    <div className="bg-card border rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-md">
                                <span className="text-2xl font-bold text-primary-foreground">
                                    {(user.name || user.email).charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-semibold truncate">{user.name || tCommon('na')}</h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                        {user.role === 'ADMIN' ? t('admin') : t('user')}
                                    </Badge>
                                    {getProviderBadge(user.account?.provider)}
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
                    {/* Contact Info / Edit Form */}
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '50ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {isEditing ? t('edit_info') : t('contact_info')}
                        </h4>
                        <div className="grid gap-3 bg-muted/50 rounded-lg p-4">
                            {isEditing ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name">{t('name')}</Label>
                                        <Input
                                            id="edit-name"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                            className="bg-background border dark:border-accent/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-email">{t('email')}</Label>
                                        <Input
                                            id="edit-email"
                                            type="email"
                                            value={editForm.email}
                                            placeholder="Enter email..."
                                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="bg-background border dark:border-accent/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-phone">{t('phone')}</Label>
                                        <Input
                                            id="edit-phone"
                                            value={editForm.phone}
                                            placeholder="Enter phone..."
                                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                            className="bg-background border dark:border-accent/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-address">{t('address')}</Label>
                                        <Input
                                            id="edit-address"
                                            value={editForm.address}
                                            placeholder="Enter address..."
                                            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                            className="bg-background border dark:border-accent/50"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-2 space-y-2 pt-2">
                                        <Label htmlFor="edit-role">{t('role')}</Label>
                                        <Select
                                            value={editForm.role}
                                            onValueChange={(value: 'USER' | 'ADMIN') => setEditForm(prev => ({ ...prev, role: value }))}
                                        >
                                            <SelectTrigger className="bg-background border dark:border-accent/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USER">{t('user')}</SelectItem>
                                                <SelectItem value="ADMIN">{t('admin')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <Label htmlFor="edit-verify-email" className="flex items-center gap-2 cursor-pointer">
                                            <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                            </div>
                                            {user.email_verified ? t('email_verified') : t('verify_email')}
                                        </Label>
                                        <Switch
                                            id="edit-verify-email"
                                            checked={editForm.verify_email === undefined ? !!user.email_verified : editForm.verify_email}
                                            onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, verify_email: checked }))}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <Mail className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate">{user.email}</p>
                                        </div>
                                        {user.email_verified && (
                                            <Badge className="bg-green-500/10 text-green-600 border-0 shrink-0">
                                                ✓ {tCommon('verified')}
                                            </Badge>
                                        )}
                                    </div>
                                    {user.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                                <Phone className="h-4 w-4 text-green-500" />
                                            </div>
                                            <span>{user.phone}</span>
                                        </div>
                                    )}
                                    {user.address && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                                                <MapPinHouse className="h-4 w-4 text-purple-500" />
                                            </div>
                                            <span>{user.address}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                                            <Calendar className="h-4 w-4 text-orange-500" />
                                        </div>
                                        <span>{formatDate(new Date(user.created_at))}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <SheetFooter className="px-6 pb-6 gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                                {tCommon('cancel')}
                            </Button>
                            <Button onClick={handleSave} disabled={isUpdating} className="flex-1">
                                {isUpdating ? (
                                    <>
                                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                                        {tCommon('saving')}
                                    </>
                                ) : (
                                    tCommon('save')
                                )}
                            </Button>
                        </>
                    ) : (
                        <SheetClose asChild>
                            <Button variant="outline" className="w-full">{tCommon('close')}</Button>
                        </SheetClose>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

export const CreateUserSheet = ({
    onCreate, isCreating
}: CreateUserSheetProps) => {
    const t = useTranslations('admin.components.user_detail')
    const tCommon = useTranslations('admin.components.common')
    const [isOpen, setIsOpen] = useState(false)
    const [formData, setFormData] = useState<AdminUserCreate>({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'USER',
        verify_email: false,
    })

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            toast.error(t('validation.required_fields'))
            return
        }

        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            toast.error(t('validation.email_invalid'));
            return;
        }

        if (formData.phone && formData.phone.length < 10) {
            toast.error(t('validation.phone_invalid'));
            return;
        }

        if (formData.password.length < 6) {
            toast.error(t('validation.password_min'));
            return;
        } else if (!/[A-Z]/.test(formData.password)) {
            toast.error(t('validation.password_uppercase'));
            return;
        } else if (!/[a-z]/.test(formData.password)) {
            toast.error(t('validation.password_lowercase'));
            return;
        } else if (!/[0-9]/.test(formData.password)) {
            toast.error(t('validation.password_number'));
            return;
        }

        await onCreate(formData)
        setFormData({ name: '', email: '', password: '', phone: '', role: 'USER', verify_email: false })
        setIsOpen(false)
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button className="shrink-0">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{t('add_user')}</span>
                    <span className="sm:hidden">{tCommon('create')}</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                onInteractOutside={e => {
                    e.preventDefault()
                }}
                className="w-full sm:max-w-lg overflow-y-auto p-0"
            >
                {/* Header with gradient */}
                <div className="bg-linear-to-br from-primary/20 via-primary/10 to-background p-6 pb-8">
                    <SheetHeader className="text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <UserPlus className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-xl">{t('add_new_user')}</SheetTitle>
                                <SheetDescription>
                                    {t('fill_details')}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Form Fields */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('basic_info')}</h4>

                        <div className="space-y-4 bg-muted/50 rounded-lg p-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Users className="h-3 w-3 text-blue-500" />
                                    </div>
                                    {t('full_name')} *
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Enter full name..."
                                    className="bg-background border dark:border-accent/50"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <Mail className="h-3 w-3 text-green-500" />
                                    </div>
                                    {t('email')} *
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter email..."
                                    className="bg-background border dark:border-accent/50"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <Lock className="h-3 w-3 text-red-500" />
                                    </div>
                                    {t('password')} *
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter password..."
                                    className="bg-background border dark:border-accent/50"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <Phone className="h-3 w-3 text-purple-500" />
                                    </div>
                                    {t('phone_number')}
                                </Label>
                                <Input
                                    id="phone"
                                    placeholder="Enter phone number..."
                                    className="bg-background border dark:border-accent/50"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '50ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('account_info')}</h4>

                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center justify-between gap-2 space-y-2">
                                <Label htmlFor="role" className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                                        <Shield className="h-3 w-3 text-orange-500" />
                                    </div>
                                    {t('role')}
                                </Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value: 'USER' | 'ADMIN') => setFormData(prev => ({ ...prev, role: value }))}
                                >
                                    <SelectTrigger className="bg-background border dark:border-accent/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">
                                            <span className="flex items-center gap-2">{t('user')}</span>
                                        </SelectItem>
                                        <SelectItem value="ADMIN">
                                            <span className="flex items-center gap-2">{t('admin')}</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <Label htmlFor="verify-email" className="flex items-center gap-2 cursor-pointer">
                                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    </div>
                                    {t('verify_email')}
                                </Label>
                                <Switch
                                    id="verify-email"
                                    checked={formData.verify_email}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, verify_email: checked }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="px-6 pb-6 gap-2">
                    <SheetClose asChild>
                        <Button variant="outline" className="flex-1">{tCommon('cancel')}</Button>
                    </SheetClose>
                    <Button onClick={handleSubmit} disabled={isCreating} className="flex-1">
                        {isCreating ? (
                            <>
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                                {tCommon('creating')}
                            </>
                        ) : (
                            <>
                                <PlusIcon className="h-4 w-4 mr-2" />
                                {t('create_account')}
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
