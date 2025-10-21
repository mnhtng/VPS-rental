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
    QrCode,
    Smartphone,
    Shield,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    User
} from 'lucide-react';
import QRCode from 'react-qr-code';
import Link from 'next/link';
import { formatPrice, convertUSDToVND } from '@/utils/currency';
import { Badge } from '@/components/ui/badge';

interface CartItem {
    planId: number;
    quantity: number;
    planName: string;
    price: number;
}

interface CheckoutFormData {
    // Customer Information
    name: string;
    email: string;
    phone: string;

    // Billing Address
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;

    // Payment Method
    paymentMethod: 'qr' | 'momo' | 'vnpay';

    // Card Details (for VNPay)
    cardNumber: string;
    cardExpiry: string;
    cardCvv: string;
    cardName: string;
}

const CheckoutPage: React.FC = () => {
    const router = useRouter();
    const [step, setStep] = useState<'info' | 'payment' | 'processing' | 'success'>('info');
    const [formData, setFormData] = useState<CheckoutFormData>({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Vietnam',
        paymentMethod: 'qr',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
        cardName: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [qrCodeData, setQrCodeData] = useState<string>('');
    const [orderNumber, setOrderNumber] = useState<string>('');

    // Load cart data on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('vps_cart');
        if (savedCart) {
            try {
                const cartData = JSON.parse(savedCart);
                // Mock cart items loading
                const mockItems = Object.entries(cartData).map(([planId, quantity]) => ({
                    planId: parseInt(planId),
                    quantity: quantity as number,
                    planName: planId === '1' ? 'Starter' : 'Business',
                    price: planId === '1' ? convertUSDToVND(15) : convertUSDToVND(50)
                }));
                setCartItems(mockItems);
            } catch (error) {
                console.error('Error loading cart:', error);
                router.push('/cart');
            }
        } else {
            router.push('/cart');
        }
    }, [router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handlePaymentMethodChange = (value: string) => {
        setFormData(prev => ({ ...prev, paymentMethod: value as 'qr' | 'momo' | 'vnpay' }));
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const validateCustomerInfo = () => {
        if (!formData.name.trim()) throw new Error('Full name is required');
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
            throw new Error('Valid email is required');
        }
        if (!formData.phone.trim()) throw new Error('Phone number is required');
        if (!formData.address.trim()) throw new Error('Address is required');
        if (!formData.city.trim()) throw new Error('City is required');
    };

    const handleCustomerInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            validateCustomerInfo();
            setStep('payment');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Validation failed');
        }
    };

    const generateQRCode = () => {
        const total = calculateTotal();
        const orderNum = `VPS-${Date.now()}`;
        setOrderNumber(orderNum);

        // Generate QR code for bank transfer
        const qrData = {
            bank: 'VCB',
            account: '1234567890',
            amount: total,
            description: `VPS Payment ${orderNum}`,
            beneficiary: 'VPS Rental Company'
        };

        setQrCodeData(`Bank: ${qrData.bank}|Account: ${qrData.account}|Amount: ${formatPrice(qrData.amount)}|Message: ${qrData.description}`);
    };

    const processMoMoPayment = async () => {
        setIsLoading(true);
        try {
            // Mock MoMo payment processing
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Simulate payment success
            setStep('success');
            setOrderNumber(`VPS-${Date.now()}`);
            localStorage.removeItem('vps_cart');
        } catch {
            setError('MoMo payment failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const processVNPayPayment = async () => {
        setIsLoading(true);
        try {
            // Validate card details
            if (!formData.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
                throw new Error('Invalid card number');
            }
            if (!formData.cardExpiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
                throw new Error('Invalid expiry date (MM/YY)');
            }
            if (!formData.cardCvv.match(/^\d{3,4}$/)) {
                throw new Error('Invalid CVV');
            }

            // Mock VNPay payment processing
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Simulate payment success
            setStep('success');
            setOrderNumber(`VPS-${Date.now()}`);
            localStorage.removeItem('vps_cart');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setStep('processing');

        if (formData.paymentMethod === 'qr') {
            generateQRCode();
            // For QR code, we'll show the code and simulate waiting for payment
            setTimeout(() => {
                setStep('success');
                setOrderNumber(`VPS-${Date.now()}`);
                localStorage.removeItem('vps_cart');
            }, 5000);
        } else if (formData.paymentMethod === 'momo') {
            await processMoMoPayment();
        } else if (formData.paymentMethod === 'vnpay') {
            await processVNPayPayment();
        }
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-500 p-4 rounded-full">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-green-500">Payment Successful!</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            Your VPS order has been confirmed and is being processed.
                        </p>
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-sm font-medium">Order Number</p>
                            <p className="text-lg font-mono">{orderNumber}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            You will receive a confirmation email shortly with your VPS access details.
                        </p>
                        <div className="space-y-2">
                            <Button className="w-full" onClick={() => router.push('/plans')}>
                                Continue Shopping
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                                Back to Home
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'processing') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <Card className="max-w-md w-full">
                    <CardContent className="text-center py-12 space-y-6">
                        {formData.paymentMethod === 'qr' && qrCodeData ? (
                            <>
                                <h2 className="text-2xl font-bold">Scan QR Code to Pay</h2>
                                <div className="flex justify-center">
                                    <div className="bg-white p-4 rounded-lg shadow-lg">
                                        <QRCode value={qrCodeData} size={200} />
                                    </div>
                                </div>
                                <div className="text-sm space-y-2">
                                    <p><strong>Bank:</strong> VCB (Vietcombank)</p>
                                    <p><strong>Account:</strong> 1234567890</p>
                                    <p><strong>Amount:</strong> {formatPrice(calculateTotal())}</p>
                                    <p><strong>Message:</strong> VPS Payment {orderNumber}</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Please scan the QR code with your banking app to complete the payment.
                                    This page will automatically update once payment is received.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                                <h2 className="text-2xl font-bold">Processing Payment</h2>
                                <p className="text-muted-foreground">Please wait while we process your payment...</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-10">
                    <Button
                        variant="ghost"
                        className="mb-6"
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
                <div className="mb-12">
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
                            <Card className="bg-secondary backdrop-blur-sm border-0 shadow-2xl">
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
                                                    <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                                                        placeholder="Enter your full name"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                                                        placeholder="your.email@example.com"
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
                                                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                                                    <Input
                                                        id="phone"
                                                        name="phone"
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
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
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="address" className="text-sm font-medium">Street Address *</Label>
                                                    <Input
                                                        id="address"
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                                                        placeholder="Enter your street address"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                                                        <Input
                                                            id="city"
                                                            name="city"
                                                            value={formData.city}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                                                            placeholder="City"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="state" className="text-sm font-medium">State/Province</Label>
                                                        <Input
                                                            id="state"
                                                            name="state"
                                                            value={formData.state}
                                                            onChange={handleInputChange}
                                                            className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                                                            placeholder="State"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="zipCode" className="text-sm font-medium">ZIP/Postal Code</Label>
                                                        <Input
                                                            id="zipCode"
                                                            name="zipCode"
                                                            value={formData.zipCode}
                                                            onChange={handleInputChange}
                                                            className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                                                            placeholder="12345"
                                                        />
                                                    </div>
                                                </div>
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
                            <Card className="bg-secondary backdrop-blur-sm border-0 shadow-2xl">
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
                                                {/* QR Code Payment */}
                                                <Label
                                                    className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${formData.paymentMethod === 'qr'
                                                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-400 dark:to-blue-600 border-2 border-blue-500 shadow-lg'
                                                        : 'border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                                                        } rounded-xl p-6`}
                                                    htmlFor="qr"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <RadioGroupItem value="qr" id="qr" className="bg-white text-blue-600 border-blue-600" />
                                                        <div className="w-full flex items-center space-x-4">
                                                            <div className={`p-3 rounded-full transition-all duration-300 ${formData.paymentMethod === 'qr' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                                                                }`}>
                                                                <QrCode className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="qr" className="text-lg font-semibold cursor-pointer">
                                                                    QR Code Banking
                                                                </Label>
                                                                <p className="text-sm mt-1">
                                                                    Pay instantly via QR code with any banking app
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Label>

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
                                                                    Pay with your MoMo e-wallet
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
                                                                    Pay with credit/debit card via VNPay
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Label>
                                            </RadioGroup>
                                        </div>

                                        <div className="flex justify-end pt-6 border-t border-gray-400 border-dashed">
                                            <Button
                                                type="submit"
                                                size="lg"
                                                disabled={isLoading}
                                                className="px-12 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                                                        Processing Payment...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Shield className="mr-3 h-5 w-5" />
                                                        Complete Payment
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
                        <Card className="sticky top-16.5 backdrop-blur-sm border-2 border-muted-foreground shadow-2xl">
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
                                        <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-300 dark:to-purple-300 rounded-2xl p-6 border border-blue-200">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h3 className="font-bold text-lg text-black">{item.planName}</h3>

                                                    <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200">
                                                        x{item.quantity} VPS
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-black/70 space-y-1">
                                                    <p>• 2 CPU Cores</p>
                                                    <p>• 4GB RAM</p>
                                                    <p>• 50GB NVMe SSD</p>

                                                    <div className="mt-4">
                                                        <div className="text-lg sm:text-2xl font-bold text-purple-700">
                                                            {formatPrice(item.price * item.quantity)}
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
                                        <span>{formatPrice(calculateTotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Setup Fee</span>
                                        <span className="text-green-600 font-medium">FREE</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>First Month Discount</span>
                                        <span className="text-green-600 font-medium">-{formatPrice(0)}</span>
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
