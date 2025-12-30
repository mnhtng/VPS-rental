"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader, CreditCard, Wallet, Receipt } from "lucide-react"
import { Order } from "@/types/types"
import { formatPrice } from "@/utils/currency"
import { formatDateTime } from "@/utils/string"
import usePayment from "@/hooks/usePayment"
import { toast } from "sonner"

interface RepayDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: Order | null
    userPhone?: string
    userAddress?: string
    onSuccess?: () => void
}

export default function RepayDialog({
    open,
    onOpenChange,
    order,
    userPhone = "",
    userAddress = "",
    onSuccess,
}: RepayDialogProps) {
    const t = useTranslations("repay_dialog")
    const { repayRenewalOrder, checkRenewalCanRepay } = usePayment()

    const [paymentMethod, setPaymentMethod] = useState<"vnpay" | "momo">("vnpay")
    const [phone, setPhone] = useState<string>("")
    const [address, setAddress] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [checkResult, setCheckResult] = useState<{
        can_repay: boolean
        reason?: string
    } | null>(null)

    useEffect(() => {
        setPhone(userPhone)
        setAddress(userAddress)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleOpenChange = async (isOpen: boolean) => {
        if (isOpen && order) {
            setIsLoading(true)

            try {
                const result = await checkRenewalCanRepay(order.id)
                if (result.data) {
                    setCheckResult(result.data)

                    if (!result.data.can_repay) {
                        toast.error(t('cannot_pay'), {
                            description: result.data.reason || t('not_eligible'),
                        })
                    }
                }
            } catch {
                toast.error(t('error_checking'))
            } finally {
                setIsLoading(false)
            }
        } else {
            setCheckResult(null)
        }

        onOpenChange(isOpen)
    }

    const handleRepay = async () => {
        if (!order) return

        if (!phone.trim()) {
            toast.error(t('enter_phone'))
            return
        }

        if (!address.trim()) {
            toast.error(t('enter_address'))
            return
        }

        setIsLoading(true)

        try {
            const returnUrl = `${window.location.origin}/client-dashboard/billing/renewal`

            const result = await repayRenewalOrder(
                order.order_number,
                order.price,
                phone,
                address,
                returnUrl,
                paymentMethod
            )

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                })
            } else {
                // Payment redirect will happen automatically via repayRenewalOrder
                onSuccess?.()
            }
        } catch {
            toast.error(t('failed'), {
                description: t('try_again'),
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (!order) return null

    const canRepay = checkResult?.can_repay !== false

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-blue-600" />
                        {t('title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Order Info */}
                    <div className="rounded-lg border p-4 bg-muted/50">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('order_number')}</p>
                                <p className="font-mono font-semibold">{order.order_number}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">{t('total_amount')}</p>
                                <p className="font-semibold text-primary">{formatPrice(order.price)}</p>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p>{t('created')}: {formatDateTime(new Date(order.created_at))}</p>
                            <p>{t('note')}: {order.note || t('none')}</p>
                        </div>
                    </div>

                    {!canRepay && checkResult?.reason && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                            {checkResult.reason}
                        </div>
                    )}

                    {canRepay && (
                        <>
                            {/* Payment Method */}
                            <div className="space-y-3">
                                <Label>{t('payment_method')}</Label>
                                <RadioGroup
                                    value={paymentMethod}
                                    onValueChange={(v) => setPaymentMethod(v as "vnpay" | "momo")}
                                    className="grid grid-cols-2 gap-3"
                                >
                                    <div>
                                        <RadioGroupItem value="vnpay" id="repay-vnpay" className="peer sr-only" />
                                        <Label
                                            htmlFor="repay-vnpay"
                                            className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            VNPay
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="momo" id="repay-momo" className="peer sr-only" />
                                        <Label
                                            htmlFor="repay-momo"
                                            className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                                        >
                                            <Wallet className="h-4 w-4" />
                                            MoMo
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="repay-phone">{t('phone')}</Label>
                                    <Input
                                        id="repay-phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="0912345678"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="repay-address">{t('address')}</Label>
                                    <Input
                                        id="repay-address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="House number, street, district, city"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleRepay} disabled={isLoading || !canRepay}>
                        {isLoading ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                {t('processing')}
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                {t('pay')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
