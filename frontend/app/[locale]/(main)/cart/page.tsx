'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    ShoppingCart,
    Trash2,
    ArrowRight,
    ArrowLeft,
    Server,
    Cpu,
    HardDrive,
    Zap,
    Tag,
    Rocket,
    Package,
    Monitor,
    BrushCleaning,
    Loader
} from 'lucide-react';
import { CartItem, Promotion, ValidatePromotion } from '@/types/types';
import { Label } from '@radix-ui/react-label';
import { formatPrice } from '@/utils/currency';
import useProduct from '@/hooks/useProduct';
import usePromotion from '@/hooks/usePromotion';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import CartPlaceholder from '@/components/custom/placeholder/cart';
import { useCart } from '@/contexts/CartContext';
import usePayment from '@/hooks/usePayment';
import { useRouter } from 'next/navigation';
import { getDiskSize, getNetworkSpeed } from '@/utils/string';

const CartPage = () => {
    const t = useTranslations('cart');
    const router = useRouter();
    const locale = useLocale();
    const { getCartItems, removeCartItem, clearCart } = useProduct();
    const { getAvailablePromotions, validatePromotion } = usePromotion();
    const { proceedToCheckout } = usePayment();
    const { setCartAmount, decrementCart } = useCart();

    const [cartItem, setCartItem] = useState<CartItem[] | null>(null);
    const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
    const [appliedPromo, setAppliedPromo] = useState<ValidatePromotion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingPromotions, setIsLoadingPromotions] = useState(true);
    const [isProceedCheckoutLoading, setIsProceedCheckoutLoading] = useState(false);

    const fetchCart = async (signal?: AbortSignal) => {
        try {
            const result = await getCartItems(signal);

            if (signal?.aborted) return;

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });
            } else {
                setCartItem(result.data);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;

            toast.error(t('toast.fetch_cart_error'), {
                description: t('toast.try_again'),
            });
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    };

    const fetchAvailablePromotions = async (signal?: AbortSignal) => {
        try {
            const result = await getAvailablePromotions(signal);

            if (signal?.aborted) return;

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });
            } else {
                setAvailablePromotions(result.data || []);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;

            toast.error(t('toast.fetch_promos_error'), {
                description: t('toast.try_again'),
            });
        } finally {
            if (!signal?.aborted) {
                setIsLoadingPromotions(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        fetchCart(controller.signal);
        fetchAvailablePromotions(controller.signal);

        return () => {
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClearCart = async () => {
        try {
            const result = await clearCart();

            if (result && result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });
            } else {
                setCartItem(null);
                setAppliedPromo(null);
                setCartAmount(0);
                toast.success(result.message);
            }
        } catch {
            toast.error(t('toast.clear_cart_error'), {
                description: t('toast.try_again'),
            });
        }
    };

    const handleRemoveCartItem = async (itemId: string) => {
        try {
            const result = await removeCartItem(itemId);

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });
            } else {
                setCartItem(prevItems => prevItems ? prevItems.filter(item => item.id !== itemId) : null);
                decrementCart();
                toast.success(result.message);
            }
        } catch {
            toast.error(t('toast.remove_item_error'), {
                description: t('toast.try_again'),
            });
        }
    }

    const handleDiscountSelection = async (promotionCode: string) => {
        try {
            setIsLoadingPromotions(true);

            const cartTotalAmount = calculateSubtotal();

            const result = await validatePromotion({
                code: promotionCode,
                cartTotalAmount,
            });

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });
            } else {
                setAppliedPromo(result.data || null);
            }
        } catch {
            toast.error(t('toast.apply_promo_error'), {
                description: t('toast.try_again'),
            });
        } finally {
            setIsLoadingPromotions(false);
        }
    };

    const handleProceedToCheckout = async () => {
        try {
            setIsProceedCheckoutLoading(true);

            const result = await proceedToCheckout(appliedPromo?.promotion.code);

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });
            } else {
                router.push(`/checkout`);
            }
        } catch {
            toast.error(t('toast.checkout_error'), {
                description: t('toast.try_again'),
            });
            setIsProceedCheckoutLoading(false);
        }
    }

    const calculateSubtotal = () => {
        if (!cartItem) return 0;
        return cartItem.reduce((total, item) => total + item.total_price, 0);
    };

    const calculateDiscount = () => {
        if (!appliedPromo) return 0;
        return appliedPromo.discount_amount;
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscount();
    };

    const calculateSetupFee = () => {
        if (!cartItem) return 0;
        return cartItem.reduce((total, item) => total + item.template.setup_fee, 0);
    };

    if (isLoading) {
        return (
            <CartPlaceholder />
        );
    }

    if (!cartItem || cartItem.length === 0) {
        return (
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center py-16 animate-in fade-in zoom-in duration-700">
                        <div className="flex justify-center mb-8 animate-in slide-in-from-top duration-500">
                            <div className="bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-700 dark:to-purple-700 p-8 rounded-full shadow-xl hover:scale-110 transition-transform duration-300">
                                <ShoppingCart className="h-16 w-16 text-blue-600 dark:text-primary-foreground" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-primary mb-6 animate-in slide-in-from-top duration-700 delay-100">{t('empty.title')}</h2>
                        <p className="text-xl mb-12 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-top duration-700 delay-200">
                            {t('empty.description')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom duration-700 delay-300">
                            <Button size="lg" className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                                <Link href={`/${locale}/plans`}>
                                    <Server className="mr-2 h-5 w-5" />
                                    {t('empty.browse_plans')}
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="border-2" asChild>
                                <Link href={`/${locale}/`}>
                                    <ArrowLeft className="mr-2 h-5 w-5" />
                                    {t('empty.back_home')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8 animate-in fade-in slide-in-from-top duration-700">
                    <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        {t('title')}
                    </h1>
                    <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Item */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-xl bg-secondary backdrop-blur-sm animate-in fade-in slide-in-from-left duration-700">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center text-xl">
                                    <div className="p-2 bg-linear-to-r from-blue-600 to-purple-600 rounded-lg mr-3">
                                        <ShoppingCart className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="hidden sm:inline">{t('header.title')}</span>
                                    <span className="sm:hidden">{t('header.title_short')}</span>
                                </CardTitle>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 dark:text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-800 h-8 px-2 md:px-3"
                                        >
                                            <BrushCleaning className="h-3.5 w-3.5 md:mr-1" />
                                            <span className="hidden md:inline">{t('header.clear_cart')}</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className='border border-red-300 dark:border-red-800'>
                                        <DialogHeader>
                                            <DialogTitle className="text-lg font-bold">{t('dialog.clear_title')}</DialogTitle>
                                        </DialogHeader>
                                        <DialogDescription className="mb-4">
                                            {t('dialog.clear_description')}
                                        </DialogDescription>
                                        <DialogFooter>
                                            <DialogClose>{t('dialog.cancel')}</DialogClose>
                                            <Button variant="destructive" onClick={handleClearCart}>{t('header.clear_cart')}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>

                            <CardContent className="p-3 md:p-4 space-y-6">
                                {cartItem && cartItem.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="group rounded-xl p-3 md:p-4 bg-background border hover:shadow-lg hover:border-blue-300 transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                                        style={{ animationDelay: `${index * 100}ms`, animationDuration: '500ms' }}
                                    >
                                        {/* Plan Header */}
                                        <div className="flex items-center gap-2 mb-3 md:mb-4">
                                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 md:gap-4 flex-1 min-w-0 transition-all duration-300 group-hover:mr-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base md:text-lg font-bold mb-0.5 truncate">{item.vps_plan.name}</h3>
                                                </div>
                                                <Badge variant="secondary" className="bg-linear-to-r from-green-100 to-emerald-100 dark:from-green-900/60 dark:to-emerald-900/60 text-green-700 dark:text-green-200 border-green-200 shrink-0">
                                                    {formatPrice(item.vps_plan.monthly_price)}/mo
                                                </Badge>
                                            </div>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all duration-300 ease-in-out h-8 w-8 p-0 -ml-8 group-hover:ml-0 shrink-0"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className='border border-red-300 dark:border-red-800'>
                                                    <DialogHeader>
                                                        <DialogTitle className="text-lg font-bold">{t('dialog.remove_title')}</DialogTitle>
                                                    </DialogHeader>
                                                    <DialogDescription className="mb-4">
                                                        {t('dialog.remove_description', { planName: item.vps_plan.name, hostname: item.hostname })}
                                                    </DialogDescription>
                                                    <DialogFooter>
                                                        <DialogClose>{t('dialog.cancel')}</DialogClose>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={() => handleRemoveCartItem(item.id)}
                                                        >
                                                            {t('dialog.remove')}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        <Separator className="my-3 md:my-4 bg-linear-to-r from-transparent via-foreground to-transparent" />

                                        {/* Plan Specs */}
                                        <div className="mb-3 md:mb-8">
                                            <h4 className="text-xs md:text-sm font-semibold text-muted-foreground mb-2 flex items-center">
                                                <Package className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
                                                {t('specs.title')}
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                                                <div className="flex flex-col items-center p-2 md:p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 rounded-lg hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer">
                                                    <Cpu className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                                                    <span className="font-bold text-sm md:text-base">{item.vps_plan.vcpu}</span>
                                                    <span className="text-[10px] md:text-xs text-muted-foreground">{t('specs.vcpu')}</span>
                                                </div>
                                                <div className="flex flex-col items-center p-2 md:p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700 rounded-lg hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer">
                                                    <Zap className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400 mb-1 group-hover:scale-110 transition-transform" />
                                                    <span className="font-bold text-sm md:text-base">{item.vps_plan.ram_gb} GB</span>
                                                    <span className="text-[10px] md:text-xs text-muted-foreground">{t('specs.ram')}</span>
                                                </div>
                                                <div className="flex flex-col items-center p-2 md:p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-700 rounded-lg hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer">
                                                    <HardDrive className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                                                    <span className="font-bold text-sm md:text-base">{getDiskSize(item.vps_plan.storage_gb)}</span>
                                                    <span className="text-[10px] md:text-xs text-muted-foreground">{item.vps_plan.storage_type}</span>
                                                </div>
                                                <div className="flex flex-col items-center p-2 md:p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700 rounded-lg hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer">
                                                    <Rocket className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
                                                    <span className="font-bold text-sm md:text-base">{getNetworkSpeed(item.vps_plan.bandwidth_mbps)}</span>
                                                    <span className="text-[10px] md:text-xs text-muted-foreground text-center">{t('specs.network')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Configuration Details */}
                                        <div>
                                            <h4 className="text-xs md:text-sm font-semibold text-muted-foreground mb-2 flex items-center">
                                                <Monitor className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
                                                {t('config.title')}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                                                <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                    <span className="text-[10px] md:text-xs text-muted-foreground block mb-0.5">{t('config.hostname')}</span>
                                                    <span className="font-semibold text-xs md:text-sm truncate block">{item.hostname}</span>
                                                </div>
                                                <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                    <span className="text-[10px] md:text-xs text-muted-foreground block mb-0.5">{t('config.os')}</span>
                                                    <span className="font-semibold text-xs md:text-sm capitalize">{item.os}</span>
                                                </div>
                                                <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                    <span className="text-[10px] md:text-xs text-muted-foreground block mb-0.5">
                                                        {t('config.duration')}
                                                    </span>
                                                    <span className="font-semibold text-xs md:text-sm">{item.duration_months} {item.duration_months > 1 ? t('config.months') : t('config.month')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-16.5 shadow-2xl border border-accent bg-secondary backdrop-blur-sm animate-in fade-in slide-in-from-right duration-700">
                            <CardHeader>
                                <CardTitle className="flex items-center text-xl">
                                    <Tag className="mr-3 h-6 w-6 text-amber-500 dark:text-amber-300" />
                                    {t('summary.title')}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-6 space-y-6">
                                {/* Promo Code */}
                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">{t('summary.promo_code')}</Label>
                                    {appliedPromo ? (
                                        <div className="flex items-center justify-between p-4 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200 dark:border-green-700 rounded-xl shadow-sm animate-in fade-in zoom-in duration-300">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                                                    <Tag className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <span className="text-base font-bold text-green-800">
                                                        {appliedPromo.promotion.code}
                                                    </span>
                                                    <p className="text-sm text-green-600">
                                                        {appliedPromo.promotion.description ||
                                                            `${appliedPromo.promotion.discount_type === 'percentage'
                                                                ? `${appliedPromo.promotion.discount_value}% off`
                                                                : `${formatPrice(appliedPromo.promotion.discount_value)} off`
                                                            }`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setAppliedPromo(null)}
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-full"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                                                {isLoadingPromotions ? t('summary.loading_promos') : t('summary.select_discount')}
                                            </Label>
                                            {availablePromotions.length === 0 && !isLoadingPromotions ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    {t('summary.no_promos')}
                                                </p>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {availablePromotions.map((promotion, index) => (
                                                        <div
                                                            key={promotion.id}
                                                            onClick={() => handleDiscountSelection(promotion.code)}
                                                            className="relative bg-linear-to-br from-amber-300 via-amber-400/90 to-amber-500/90 hover:from-yellow-600 hover:to-amber-700 text-white p-2.5 rounded-md cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-yellow-400 hover:border-yellow-300 transform hover:-translate-y-1 animate-in fade-in zoom-in"
                                                            style={{ animationDelay: `${index * 100}ms`, animationDuration: '400ms' }}
                                                        >
                                                            {/* Ticket perforated edge effect */}
                                                            <div className="absolute bg-secondary left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 w-6 h-6 rounded-full"></div>
                                                            <div className="absolute bg-secondary right-0 top-1/2 transform -translate-y-1/2 translate-x-3 w-6 h-6 rounded-full"></div>

                                                            <div className="text-center space-y-1">
                                                                <div className="font-bold text-sm tracking-wider">
                                                                    {promotion.code}
                                                                </div>
                                                                <div className="text-xs font-semibold opacity-90">
                                                                    {promotion.discount_type === 'percentage'
                                                                        ? `${promotion.discount_value}% OFF`
                                                                        : `₫${promotion.discount_value.toLocaleString()} OFF`
                                                                    }
                                                                </div>
                                                            </div>

                                                            {/* Shine effect */}
                                                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Separator className="bg-linear-to-r from-transparent via-gray-400 to-transparent" />

                                {/* Pricing Breakdown */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-lg pt-2 border-t">
                                        <span className="font-bold">{t('summary.subtotal')}</span>
                                        <span className="font-bold">{formatPrice(calculateSubtotal())}</span>
                                    </div>

                                    {appliedPromo && (
                                        <div className="flex justify-between items-center text-lg">
                                            <span className="font-medium text-green-600 dark:text-green-400">{t('summary.discount')}</span>
                                            <span className="font-bold text-green-600 dark:text-green-400">-{formatPrice(calculateDiscount())}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-base">
                                        <span className="text-muted-foreground">{t('summary.setup_fee')}</span>
                                        <div className="flex items-center space-x-2">
                                            {calculateSetupFee() === 0 ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs border-green-700">
                                                    {t('summary.free')}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">{formatPrice(calculateSetupFee())}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-linear-to-r from-transparent via-gray-400 to-transparent" />

                                <div className="rounded-xl p-4 border-2 border-blue-600 dark:border-blue-400">
                                    <div className="flex flex-col sm:flex-row justify-between items-center">
                                        <div className="text-center sm:text-left">
                                            <span className="text-xl font-bold">{t('summary.total')}</span>
                                        </div>
                                        <span className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            {formatPrice(calculateTotal())}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl p-4 space-y-2 border border-dashed border-gray-300">
                                    <h4 className="font-semibold mb-3">{t('included.title')}</h4>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p className="flex items-center"><span className="text-green-500 mr-2">✓</span> {t('included.root_access')}</p>
                                        <p className="flex items-center"><span className="text-green-500 mr-2">✓</span> {t('included.no_setup_fee')}</p>
                                        <p className="flex items-center"><span className="text-green-500 mr-2">✓</span> {t('included.instant_deploy')}</p>
                                        <p className="flex items-center"><span className="text-green-500 mr-2">✓</span> {t('included.support')}</p>
                                        <p className="flex items-center"><span className="text-green-500 mr-2">✓</span> {t('included.uptime')}</p>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 text-lg font-bold bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl hover:scale-105"
                                    size="lg"
                                    onClick={handleProceedToCheckout}
                                    disabled={isProceedCheckoutLoading}
                                >
                                    {isProceedCheckoutLoading ? (
                                        <>
                                            <Loader className="mr-2 h-5 w-5 animate-spin" />
                                            <span className="text-sm md:text-md xl:text-lg">{t('buttons.checkout')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm md:text-md xl:text-lg">{t('buttons.checkout')}</span>
                                            <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-semibold"
                                    disabled={isProceedCheckoutLoading}
                                    asChild
                                >
                                    <Link href={`/${locale}/plans`}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        {t('buttons.continue')}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
