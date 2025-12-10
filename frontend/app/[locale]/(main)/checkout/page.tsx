'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
    CreditCard,
    Smartphone,
    Shield,
    ArrowLeft,
    ArrowRight,
    User,
    Building2
} from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/utils/currency';
import { Badge } from '@/components/ui/badge';
import usePayment from '@/hooks/usePayment';
import useProduct from '@/hooks/useProduct';
import { CartItem, CheckoutFormData } from '@/types/types';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { CheckoutPlaceholder } from '@/components/custom/placeholder/checkout';
import { useLocale } from 'next-intl';
import usePromotion from '@/hooks/usePromotion';
import { ValidatePromotion } from '@/types/types';
import { generateOrderNumber } from '@/utils/string';

const CheckoutPage = () => {
    const router = useRouter();
    const locale = useLocale();
    const { getCartItems } = useProduct();
    const { getPromotionCart } = usePromotion();
    const { processPayment } = usePayment();

    const [step, setStep] = useState<'info' | 'payment' | 'processing'>('info');
    const [formData, setFormData] = useState<CheckoutFormData>({
        phone: '',
        address: '',
        paymentMethod: 'momo',
    });
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [appliedPromo, setAppliedPromo] = useState<ValidatePromotion | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);

    const fetchCart = async (signal?: AbortSignal) => {
        try {
            const result = await getCartItems(signal);

            if (signal?.aborted) return;

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });
                router.push(`/${locale}/cart`);
                return;
            }

            if (!result.data || result.data.length === 0) {
                toast.error('Your cart is empty');
                router.push(`/${locale}/cart`);
                return;
            }

            const getPromotion = await getPromotionCart(signal);

            if (signal?.aborted) return;

            if (getPromotion.error) {
                toast.error(getPromotion.message, {
                    description: getPromotion.error.detail,
                });
                router.push(`/${locale}/cart`);
                return;
            }

            setCartItems(result.data);
            setAppliedPromo(getPromotion.data);
            setFormData(prev => ({
                ...prev,
                email: result.data[0].user.email,
                name: result.data[0].user.name,
                phone: result.data[0].user.phone,
                address: result.data[0].user.address,
            }));
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;

            toast.error("Failed to load cart items", {
                description: "Please try again later"
            });
            router.push(`/${locale}/cart`);
        } finally {
            if (!signal?.aborted) {
                setIsPageLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        fetchCart(controller.signal);

        return () => {
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePaymentMethodChange = (value: string) => {
        setFormData(prev => ({ ...prev, paymentMethod: value as 'momo' | 'vnpay' }));
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + item.total_price, 0);
    };

    const calculateDiscount = () => {
        if (!appliedPromo) return 0;
        return appliedPromo.discount_amount;
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscount();
    };

    const handleCustomerInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (!formData.phone || !formData.address) {
                toast.error("Please fill in all required fields");
                return;
            }

            if (formData.phone.length < 10) {
                toast.error('Please enter a valid phone number');
                return;
            }

            setStep('payment');
        } catch {
            toast.error("Please fill in all required fields correctly", {
                description: "Some fields are invalid"
            });
        }
    };

    const handlePaymentMethod = async (method: 'momo' | 'vnpay') => {
        setIsLoading(true);

        try {
            const orderNum = generateOrderNumber();
            const totalAmount = calculateTotal();
            const returnUrl = `${window.location.origin}/checkout/${method}-return`;

            const result = await processPayment(
                orderNum,
                totalAmount,
                formData.phone,
                formData.address,
                returnUrl,
                method
            );

            if (result.error) {
                setStep('payment');
                setIsLoading(false);
                toast.error(result.error.detail);
                return;
            }

            // Redirect to payment URL if available
            // For VNPay, it will be a web URL; for MoMo, it could be a deeplink or web URL
        } catch {
            setStep('payment');
            toast.error('Failed to create payment', {
                description: 'Please try again later'
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');

        await handlePaymentMethod(formData.paymentMethod)
    };

    if (step === 'processing') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <Card className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                    <CardContent className="text-center py-12 space-y-6">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 animate-pulse"></div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold animate-pulse">Processing Payment</h2>
                        <p className="text-muted-foreground">Please wait while we process your payment...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isPageLoading) {
        return (
            <CheckoutPlaceholder />
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-10 animate-in fade-in slide-in-from-top duration-700">
                    <Button
                        variant="ghost"
                        className="mb-6 hover:translate-x-1 transition-transform duration-200"
                    >
                        <Link href="/cart" className='flex items-center'>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Cart
                        </Link>
                    </Button>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        Secure Checkout
                    </h1>
                    <p className="text-xl text-muted-foreground">Complete your VPS purchase safely and securely</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-12 animate-in fade-in zoom-in duration-700 delay-100">
                    <div className="flex items-center justify-center space-x-8">
                        <div
                            className={`flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 space-x-3 transition-all duration-300 ${step === 'info' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-green-600'}`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300 ${step === 'info' ? 'bg-blue-600 text-white ring-4 ring-blue-200' : 'bg-green-600 text-white'}`}
                                style={{ margin: 0 }}
                            >
                                {step === 'payment' ? '✓' : '1'}
                            </div>
                            <span className="font-semibold">Info</span>
                        </div>

                        <div className="flex-1 relative">
                            <div className={`h-2 rounded-full transition-all duration-700 ${step === 'payment' ? 'bg-green-400' : 'bg-gray-300'
                                }`}></div>
                        </div>

                        <div
                            className={`flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 space-x-3 transition-all duration-300 ${step === 'payment' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-400'}`}
                        >
                            <div
                                className={`w-10 h-10 m-0 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300 ${step === 'payment' ? 'bg-blue-600 text-white ring-4 ring-blue-200' : 'bg-gray-300'}`}
                                style={{ margin: 0 }}
                            >
                                2
                            </div>
                            <span className="font-semibold">Payment</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {step === 'info' && (
                            <Card className="bg-secondary backdrop-blur-sm border-0 shadow-2xl animate-in fade-in slide-in-from-left duration-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-2xl">
                                        <User className="mr-3 h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        Customer Information
                                    </CardTitle>
                                    <CardDescription className="text-lg text-muted-foreground">
                                        Please fill in your details to complete the purchase
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-8 p-8">
                                    <form onSubmit={handleCustomerInfoSubmit} className="space-y-6">
                                        {/* Personal Info Section */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
                                                Personal Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Full Name <span className='text-red-400'>*</span></Label>
                                                    <Input
                                                        value={cartItems[0]?.user.name || ''}
                                                        className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
                                                        placeholder="Enter your full name"
                                                        disabled
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Email Address <span className='text-red-400'>*</span></Label>
                                                    <Input
                                                        value={cartItems[0]?.user.email || ''}
                                                        className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
                                                        placeholder="your.email@example.com"
                                                        disabled
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Info Section */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
                                                Contact Information
                                            </h3>
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number <span className='text-red-400'>*</span></Label>
                                                    <Input
                                                        id="phone"
                                                        name="phone"
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
                                                        placeholder="+1 (555) 123-4567"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address Section */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
                                                Address Information
                                            </h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="address" className="text-sm font-medium">Street Address <span className='text-red-400'>*</span></Label>
                                                <Textarea
                                                    id="address"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    rows={3}
                                                    required
                                                    className="text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
                                                    placeholder="Enter your street address"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-6 border-t border-dashed border-gray-400">
                                            <Button
                                                type="submit"
                                                size="lg"
                                                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                            >
                                                Continue to Payment
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {step === 'payment' && (
                            <Card className="bg-secondary backdrop-blur-sm border-0 shadow-2xl animate-in fade-in slide-in-from-left duration-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-2xl">
                                        <CreditCard className="mr-3 h-6 w-6 text-green-600" />
                                        Payment Method
                                    </CardTitle>
                                    <CardDescription className="text-lg text-muted-foreground">
                                        Choose your preferred payment method
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-8 p-8">
                                    <form onSubmit={handlePaymentSubmit} className="space-y-8">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-6 flex items-center">
                                                <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-3"></div>
                                                Select Payment Method
                                            </h3>
                                            <RadioGroup
                                                value={formData.paymentMethod}
                                                onValueChange={handlePaymentMethodChange}
                                                className="space-y-4"
                                            >
                                                {/* MoMo Payment */}
                                                <Label
                                                    className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${formData.paymentMethod === 'momo'
                                                        ? 'bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-300 dark:to-pink-500 border-2 border-pink-500 shadow-lg'
                                                        : 'border-2 border-gray-200 hover:border-pink-300 hover:shadow-md'
                                                        } rounded-xl p-6`}
                                                    htmlFor="momo"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <RadioGroupItem value="momo" id="momo" className="text-pink-600 border-pink-600" />
                                                        <div className="flex-1 flex items-center space-x-4">
                                                            <div className={`p-3 rounded-full transition-all duration-300 ${formData.paymentMethod === 'momo' ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-600'
                                                                }`}>
                                                                <Smartphone className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="momo" className="text-lg font-semibold cursor-pointer">
                                                                    MoMo Wallet
                                                                </Label>
                                                                <p className="text-sm mt-1">
                                                                    Pay securely via MoMo e-wallet
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Label>

                                                {/* VNPay */}
                                                <Label
                                                    className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${formData.paymentMethod === 'vnpay'
                                                        ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-300/80 dark:to-green-500 border-2 border-green-500 shadow-lg'
                                                        : 'border-2 border-gray-200 hover:border-green-300 hover:shadow-md'
                                                        } rounded-xl p-6`}
                                                    htmlFor="vnpay"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <RadioGroupItem value="vnpay" id="vnpay" className="text-green-600 border-green-600" />
                                                        <div className="flex-1 flex items-center space-x-4">
                                                            <div className={`p-3 rounded-full transition-all duration-300 ${formData.paymentMethod === 'vnpay' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
                                                                }`}>
                                                                <CreditCard className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="vnpay" className="text-lg font-semibold cursor-pointer">
                                                                    VNPay
                                                                </Label>
                                                                <p className="text-sm mt-1">
                                                                    Pay securely via VNPay gateway
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Label>
                                            </RadioGroup>
                                        </div>

                                        {/* VNPay Bank Selection */}
                                        {formData.paymentMethod === 'vnpay' && (
                                            <div className="space-y-4 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-300 dark:border-green-800">
                                                <h3 className="text-lg font-semibold flex items-center text-green-700 dark:text-green-400">
                                                    <Building2 className="mr-2 h-5 w-5" />
                                                    Payment via VNPay
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    You will be redirected to the VNPay payment gateway to complete your transaction.
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                                    <Shield className="h-4 w-4" />
                                                    <span>Transactions are secured by VNPay</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* MoMo Info */}
                                        {formData.paymentMethod === 'momo' && (
                                            <div className="space-y-4 p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-300 dark:border-pink-800">
                                                <h3 className="text-lg font-semibold flex items-center text-pink-700 dark:text-pink-400">
                                                    <Smartphone className="mr-2 h-5 w-5" />
                                                    Payment via MoMo
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    You will be redirected to the MoMo payment gateway to complete your transaction.
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400">
                                                    <Shield className="h-4 w-4" />
                                                    <span>Transactions are secured by MoMo</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between gap-4 pt-6 border-t border-gray-400 border-dashed">
                                            <Button
                                                variant={'outline'}
                                                size="lg"
                                                onClick={() => setStep('info')}
                                            >
                                                <ArrowLeft className="mr-0 sm:mr-2 h-5 w-5" />
                                                <span className='hidden sm:inline'>Back to Info</span>
                                            </Button>

                                            <Button
                                                type="submit"
                                                size="lg"
                                                disabled={isLoading}
                                                className="px-12 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Shield className="mr-3 h-5 w-5" />
                                                        {formData.paymentMethod === 'vnpay' ? 'Pay with VNPay' :
                                                            'Pay with MoMo'}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-16.5 backdrop-blur-sm border-2 border-muted-foreground shadow-2xl animate-in fade-in slide-in-from-right duration-700">
                            <CardHeader>
                                <CardTitle className="text-2xl flex items-center">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-3">
                                        <CreditCard className="h-4 w-4 text-white" />
                                    </div>
                                    Order Summary
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-6 p-8">
                                {/* VPS Items */}
                                <div className="space-y-4">
                                    {cartItems.map((item, index) => (
                                        <div
                                            key={index}
                                            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-300 dark:to-purple-300 rounded-2xl p-6 border border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom"
                                            style={{ animationDelay: `${index * 100}ms`, animationDuration: '500ms' }}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h3 className="font-bold text-lg text-black">{item.vps_plan.name}</h3>

                                                    <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200">
                                                        {item.duration_months} month(s)
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-black/70 space-y-1">
                                                    <p>• Hostname: {item.hostname}</p>
                                                    <p>• OS: {item.os}</p>

                                                    <div className="mt-4">
                                                        <div className="text-lg sm:text-2xl font-bold text-purple-700">
                                                            {formatPrice(item.total_price)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="bg-gradient-to-r from-transparent via-pink-400 to-transparent h-0.5" />

                                {/* Pricing Breakdown */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(calculateSubtotal())}</span>
                                    </div>
                                    {appliedPromo && (
                                        <div className="flex justify-between text-green-600 font-medium">
                                            <span>Discount ({appliedPromo.promotion.code})</span>
                                            <span>-{formatPrice(calculateDiscount())}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Setup Fee</span>
                                        <span className="text-green-600 font-medium">FREE</span>
                                    </div>
                                </div>

                                <Separator className="bg-gradient-to-r from-transparent via-pink-400 to-transparent h-0.5" />

                                {/* Total */}
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6">
                                    <div className="flex flex-col justify-between items-center gap-3">
                                        <div className="text-2xl font-semibold">Total</div>
                                        <span className="text-3xl font-bold">{formatPrice(calculateTotal())}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
