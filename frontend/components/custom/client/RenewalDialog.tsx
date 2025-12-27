"use client"

import { useEffect, useState } from "react"
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
import { Loader, RefreshCw, CreditCard, Wallet } from "lucide-react"
import { VPSInstance, VPSPlan } from "@/types/types"
import { formatPrice } from "@/utils/currency"
import { formatDateTime } from "@/utils/string"
import usePayment from "@/hooks/usePayment"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RenewalDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vpsInstance: VPSInstance | null
    userPhone?: string
    userAddress?: string
    onSuccess?: () => void
}

const DURATION_OPTIONS = [
    { months: 1, label: "1 month", discount: 0 },
    { months: 3, label: "3 months", discount: 5 },
    { months: 6, label: "6 months", discount: 10 },
    { months: 12, label: "12 months", discount: 15 },
]

export default function RenewalDialog({
    open,
    onOpenChange,
    vpsInstance,
    userPhone = "",
    userAddress = "",
    onSuccess,
}: RenewalDialogProps) {
    const { renewVps } = usePayment()

    const [durationMonths, setDurationMonths] = useState(1)
    const [paymentMethod, setPaymentMethod] = useState<"vnpay" | "momo">("vnpay")
    const [phone, setPhone] = useState<string>("")
    const [address, setAddress] = useState<string>("")

    const [isLoading, setIsLoading] = useState<boolean>(false)

    const plan = vpsInstance?.vps_plan as VPSPlan | undefined
    const monthlyPrice = plan?.monthly_price || 0
    const selectedOption = DURATION_OPTIONS.find(o => o.months === durationMonths)
    const discount = selectedOption?.discount || 0
    const subtotal = monthlyPrice * durationMonths
    const discountAmount = subtotal * (discount / 100)
    const total = subtotal - discountAmount

    useEffect(() => {
        setPhone(userPhone)
        setAddress(userAddress)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const daysUntilExpiry = vpsInstance?.expires_at
        ? Math.ceil((new Date(vpsInstance.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0

    const expiryStatusColor = daysUntilExpiry <= 3 ? "text-red-600"
        : daysUntilExpiry <= 7 ? "text-yellow-600"
            : "text-green-600"

    const handleRenewal = async () => {
        if (!vpsInstance) return

        if (!phone.trim()) {
            toast.error("Please enter phone number")
            return
        }

        if (!address.trim()) {
            toast.error("Please enter address")
            return
        }

        setIsLoading(true)

        try {
            const returnUrl = `${window.location.origin}/client-dashboard/billing/renewal`

            const result = await renewVps(
                vpsInstance.id,
                durationMonths,
                total,
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
                // Payment redirect will happen automatically via renewVps
                onSuccess?.()
            }
        } catch {
            toast.error("Failed to renew VPS", {
                description: "Please try again later",
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (!vpsInstance) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] py-8 flex overflow-hidden">
                <ScrollArea className="flex-1 px-3 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-blue-600" />
                            Renew VPS
                        </DialogTitle>
                        <DialogDescription>
                            Renew VPS service to continue using
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4 px-1">
                        {/* VPS Info */}
                        <div className="rounded-lg border p-4 bg-muted/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold">{vpsInstance.vm?.hostname || "VPS"}</h4>
                                    <p className="text-sm text-muted-foreground">{plan?.name || "Plan"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Expires</p>
                                    <p className={`font-semibold ${expiryStatusColor}`}>
                                        {vpsInstance.expires_at ? formatDateTime(new Date(vpsInstance.expires_at)) : "N/A"}
                                    </p>
                                    <p className={`text-xs ${expiryStatusColor}`}>
                                        ({daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : "Expired"})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Duration Selection */}
                        <div className="space-y-3">
                            <Label>Renewal Duration</Label>
                            <RadioGroup
                                value={durationMonths.toString()}
                                onValueChange={(v) => setDurationMonths(parseInt(v))}
                                className="grid grid-cols-2 gap-3"
                            >
                                {DURATION_OPTIONS.map((option) => (
                                    <div key={option.months} className="relative">
                                        <RadioGroupItem
                                            value={option.months.toString()}
                                            id={`duration-${option.months}`}
                                            className="peer sr-only"
                                        />
                                        <Label
                                            htmlFor={`duration-${option.months}`}
                                            className="flex flex-col items-center justify-center w-full h-full rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                                        >
                                            <span className="font-semibold">{option.label}</span>
                                            {option.discount > 0 && (
                                                <span className="text-xs text-green-600">-{option.discount}%</span>
                                            )}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <Label>Payment Method</Label>
                            <RadioGroup
                                value={paymentMethod}
                                onValueChange={(v) => setPaymentMethod(v as "vnpay" | "momo")}
                                className="grid grid-cols-2 gap-3"
                            >
                                <div>
                                    <RadioGroupItem value="vnpay" id="pay-vnpay" className="peer sr-only" />
                                    <Label
                                        htmlFor="pay-vnpay"
                                        className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        VNPay
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="momo" id="pay-momo" className="peer sr-only" />
                                    <Label
                                        htmlFor="pay-momo"
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
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0912345678"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="House number, street, district, city"
                                />
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div className="rounded-lg border p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Original Price ({durationMonths} months)</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount ({discount}%)</span>
                                    <span>-{formatPrice(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                <span>Total</span>
                                <span className="text-primary">{formatPrice(total)}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleRenewal} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Renew Now
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
