'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    ArrowRight,
    ArrowLeft,
    Server,
    Cpu,
    HardDrive,
    Zap,
    Tag,
    Rocket,
    BrushCleaning
} from 'lucide-react';
import { VPSPlan } from '@/lib/types';
import { Label } from '@radix-ui/react-label';
import { formatPrice, convertUSDToVND } from '@/utils/currency';

// Mock data - would come from API in production
const mockPlans: VPSPlan[] = [
    {
        id: 1,
        name: "Starter",
        description: "Perfect for small websites and development projects",
        cpu_cores: 1,
        ram_gb: 2,
        storage_type: 'SSD',
        storage_gb: 25,
        bandwidth_gb: 1000,
        monthly_billing: 1,
        monthly_price: convertUSDToVND(15),
        is_active: true,
        created_at: '2024-01-01'
    },
    {
        id: 2,
        name: "Business",
        description: "Great for growing businesses and applications",
        cpu_cores: 2,
        ram_gb: 4,
        storage_type: 'NVMe',
        storage_gb: 50,
        bandwidth_gb: 2000,
        monthly_billing: 6,
        monthly_price: convertUSDToVND(50),
        is_active: true,
        created_at: '2024-01-01'
    }
];

// Available discount codes
const availableDiscounts = [
    { code: 'SAVE20', discount: 20, description: '20% off all plans' },
    { code: 'FIRSTTIME', discount: 15, description: '15% off for new customers' },
    { code: 'STUDENT', discount: 25, description: '25% off for students' },
    { code: 'WELCOME10', discount: 10, description: '10% welcome discount' }
];

interface CartItem {
    plan: VPSPlan;
    quantity: number;
}

const CartPage = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [appliedPromo, setAppliedPromo] = useState<{ code: string, discount: number } | null>(null);
    const [isUpdating, setIsUpdating] = useState<number | null>(null);

    // Load cart from localStorage on mount
    useEffect(() => {
        // Add some mock data for demonstration
        const mockCartItems: CartItem[] = [
            { plan: mockPlans[0], quantity: 2 },
            { plan: mockPlans[1], quantity: 1 }
        ];
        setCartItems(mockCartItems);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        const cartData: { [key: number]: number } = {};
        cartItems.forEach(item => {
            cartData[item.plan.id] = item.quantity;
        });
        localStorage.setItem('vps_cart', JSON.stringify(cartData));
    }, [cartItems]);

    const updateQuantity = (planId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(planId);
            return;
        }

        setIsUpdating(planId);
        setTimeout(() => {
            setCartItems(prev => prev.map(item =>
                item.plan.id === planId
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
            setIsUpdating(null);
        }, 300);
    };

    const removeItem = (planId: number) => {
        setCartItems(prev => prev.filter(item => item.plan.id !== planId));
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('vps_cart');
        setAppliedPromo(null);
    };

    const handleDiscountSelection = (discountCode: string) => {
        // Apply discount directly when selected
        const foundDiscount = availableDiscounts.find(
            discount => discount.code.toUpperCase() === discountCode.toUpperCase()
        );

        if (foundDiscount) {
            setAppliedPromo({ code: foundDiscount.code, discount: foundDiscount.discount });
        }
    }; const removePromoCode = () => {
        setAppliedPromo(null);
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.plan.monthly_price * item.quantity), 0);
    };

    const calculateDiscount = () => {
        if (!appliedPromo) return 0;
        return (calculateSubtotal() * appliedPromo.discount) / 100;
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscount();
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center py-16">
                        <div className="flex justify-center mb-8">
                            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-700 dark:to-purple-700 p-8 rounded-full shadow-xl">
                                <ShoppingCart className="h-16 w-16 text-blue-600 dark:text-primary-foreground" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-primary mb-6">Your cart is empty</h2>
                        <p className="text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                            Discover our powerful VPS hosting solutions and start your cloud journey today.
                            From starter plans to enterprise solutions, we have the perfect server for your needs.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                                <Link href="/plans">
                                    <Server className="mr-2 h-5 w-5" />
                                    Browse VPS Plans
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="border-2" asChild>
                                <Link href="/">
                                    <ArrowLeft className="mr-2 h-5 w-5" />
                                    Back to Home
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
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        Shopping Cart
                    </h1>
                    <p className="text-xl text-muted-foreground">Review your VPS selections and proceed to checkout</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-xl bg-secondary backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center text-xl">
                                    <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3">
                                        <ShoppingCart className="h-5 w-5 text-white" />
                                    </div>
                                    Cart Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearCart}
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all duration-200"
                                >
                                    <BrushCleaning className="mr-0 sm:mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline-block">Clear Cart</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="p-6 space-y-6">
                                {cartItems.map((item) => (
                                    <div key={item.plan.id} className="group rounded-2xl p-6 bg-background hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-full">
                                                <div className="flex items-center mb-3">
                                                    <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mr-3 group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
                                                        <Server className="h-6 w-6 text-blue-600" />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-xl font-bold transition-colors duration-200">
                                                            {item.plan.name}
                                                        </h3>
                                                        <div className="flex flex-col sm:flex-row gap-2 mt-1">
                                                            <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200">
                                                                {formatPrice(item.plan.monthly_price)}/mo
                                                            </Badge>
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                                {item.plan.monthly_billing} Monthly Billing
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-muted-foreground text-base mb-4 leading-relaxed">{item.plan.description}</p>

                                                {/* Plan Specs */}
                                                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div className="flex items-center p-3 dark:border bg-blue-50 dark:bg-blue-900/10 dark:border-blue-700 rounded-lg">
                                                        <Cpu className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                                                        <span className="font-medium text-blue-800 dark:text-blue-400">{item.plan.cpu_cores} CPU</span>
                                                    </div>
                                                    <div className="flex items-center p-3 dark:border bg-green-50 dark:bg-green-900/10 dark:border-green-700 rounded-lg">
                                                        <Zap className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                                                        <span className="font-medium text-green-800 dark:text-green-400">{item.plan.ram_gb} GB RAM</span>
                                                    </div>
                                                    <div className="flex items-center p-3 dark:border bg-purple-50 dark:bg-purple-900/10 dark:border-purple-700 rounded-lg">
                                                        <HardDrive className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                                                        <span className="font-medium text-purple-800 dark:text-purple-400">{item.plan.storage_gb} GB {item.plan.storage_type}</span>
                                                    </div>
                                                    <div className="flex items-center p-3 dark:border bg-orange-50 dark:bg-orange-900/10 dark:border-orange-700 rounded-lg">
                                                        <Rocket className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                                                        <span className="font-medium text-orange-800 dark:text-orange-400">{Math.floor((item.plan.bandwidth_gb || 0) / 1000)} TB</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity Controls & Price */}
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl p-4 border border-dashed border-gray-400">
                                            <div className="flex items-center space-x-2">
                                                <span className="hidden sm:inline-block text-base font-semibold">Quantity:</span>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.plan.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1 || isUpdating === item.plan.id}
                                                        className="h-10 w-10 p-0 hover:bg-red-50 hover:border-red-200 transition-all duration-200"
                                                    >
                                                        {isUpdating === item.plan.id ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600 dark:border-t-blue-400"></div>
                                                        ) : (
                                                            <Minus className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <span className={`w-16 text-center font-bold text-lg border border-gray-200 rounded-lg py-2 transition-all duration-200 ${isUpdating === item.plan.id ? 'scale-105 border-blue-300' : ''}`}>
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.plan.id, item.quantity + 1)}
                                                        disabled={item.quantity >= 10 || isUpdating === item.plan.id}
                                                        className="h-10 w-10 p-0 hover:bg-green-50 hover:border-green-200 transition-all duration-200"
                                                    >
                                                        {isUpdating === item.plan.id ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-green-600 dark:border-t-green-400"></div>
                                                        ) : (
                                                            <Plus className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <div className="text-md sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                        {formatPrice(item.plan.monthly_price * item.quantity)}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeItem(item.plan.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 h-10 w-10 p-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-16.5 shadow-2xl border border-accent bg-secondary backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center text-xl">
                                    <Tag className="mr-3 h-6 w-6 text-amber-500 dark:text-amber-300" />
                                    Order Summary
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-6 space-y-6">
                                {/* Promo Code */}
                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Promo Code</Label>
                                    {appliedPromo ? (
                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 dark:border-green-700 rounded-xl shadow-sm">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                    <Tag className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <span className="text-base font-bold text-green-800">
                                                        {appliedPromo.code}
                                                    </span>
                                                    <p className="text-sm text-green-600">
                                                        {appliedPromo.discount}% discount applied!
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={removePromoCode}
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-full"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                                                Select discount ticket:
                                            </Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {availableDiscounts.map((discount) => (
                                                    <div
                                                        key={discount.code}
                                                        onClick={() => handleDiscountSelection(discount.code)}
                                                        className="relative bg-gradient-to-br from-amber-300 via-amber-400/90 to-amber-500/90 hover:from-yellow-600 hover:to-amber-700 text-white p-2.5 rounded-md cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-yellow-400 hover:border-yellow-300 transform hover:-translate-y-1"
                                                    >
                                                        {/* Ticket perforated edge effect */}
                                                        <div className="absolute bg-secondary left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 w-6 h-6 rounded-full"></div>
                                                        <div className="absolute bg-secondary right-0 top-1/2 transform -translate-y-1/2 translate-x-3 w-6 h-6 rounded-full"></div>

                                                        <div className="text-center space-y-1">
                                                            <div className="font-bold text-sm tracking-wider">
                                                                {discount.code}
                                                            </div>
                                                            <div className="text-xs font-semibold opacity-90">
                                                                {discount.discount}% OFF
                                                            </div>
                                                        </div>

                                                        {/* Shine effect */}
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator className="bg-gradient-to-r from-transparent via-gray-400 to-transparent" />

                                {/* Pricing Breakdown */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-bold text-xl">Subtotal</span>
                                        <span className="font-bold">{formatPrice(calculateSubtotal())}</span>
                                    </div>

                                    {appliedPromo && (
                                        <div className="flex justify-between items-center text-lg">
                                            <span className="font-medium text-green-600 dark:text-green-400">Discount ({appliedPromo.discount}%)</span>
                                            <span className="font-bold text-green-600 dark:text-green-400">-{formatPrice(calculateDiscount())}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-base">
                                        <span className="text-muted-foreground">Setup Fee</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="line-through text-muted-foreground">{formatPrice(convertUSDToVND(25))}</span>
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                                FREE
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-gradient-to-r from-transparent via-gray-400 to-transparent" />

                                <div className="rounded-xl p-4 border-2 border-blue-600 dark:border-blue-400">
                                    <div className="flex flex-col sm:flex-row justify-between items-center">
                                        <div className="text-center sm:text-left">
                                            <span className="text-xl font-bold">Total</span>
                                        </div>
                                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            {formatPrice(calculateTotal())}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl p-4 space-y-2 border border-dashed border-gray-300">
                                    <h4 className="font-semibold mb-3">✨ What&apos;s included:</h4>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p className="flex items-center"><span className="text-green-500 mr-2">✓</span> Billed monthly</p>
                                        <p className="flex items-center"><span className="text-green-500 mr-2">✓</span> No setup fees</p>
                                        <p className="flex items-center"><span className="text-green-500 mr-2">✓</span> 30-day money-back guarantee</p>
                                        <p className="flex items-center"><span className="text-green-500 mr-2">✓</span> Cancel anytime</p>
                                        <p className="flex items-center"><span className="text-green-500 mr-2">✓</span> 24/7 expert support</p>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                                    size="lg"
                                    asChild
                                >
                                    <Link href="/checkout">
                                        <span className="mr-1">🚀</span>
                                        <span className="text-sm md:text-md xl:text-lg">Proceed to Checkout</span>
                                        <ArrowRight className="ml-1 h-5 w-5" />
                                    </Link>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-semibold"
                                    asChild
                                >
                                    <Link href="/plans">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Continue Shopping
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
