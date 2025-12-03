'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Server,
    Cpu,
    HardDrive,
    Zap,
    CheckCircle,
    ShoppingCart,
    ArrowLeft,
    DollarSign,
    Calendar,
    MonitorCog,
    Gauge,
    RefreshCw
} from 'lucide-react';
import { VPSPlan } from '@/types/types';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/currency';
import { Label } from '@radix-ui/react-label';
import useProduct from '@/hooks/useProduct';
import { useLocale } from 'next-intl';
import { PlanItemPlaceholder } from '@/components/custom/placeholder/vps_plan';

const operatingSystemOptions = [
    { value: 'Ubuntu 22.04.5 LTS', label: 'Ubuntu 22.04.5 LTS', template_os: 'linux', template_version: '6.x-2.6' },
    { value: 'Windows 10 Pro 64-bit', label: 'Windows 10 Pro 64-bit', template_os: 'windows', template_version: '10' },
];

const durationOptions = [
    { value: 1, label: '1 Month', discount: 0 },
    { value: 3, label: '3 Months', discount: 5 },
    { value: 6, label: '6 Months', discount: 10 },
    { value: 12, label: '12 Months', discount: 15 },
    { value: 24, label: '24 Months', discount: 20 },
];

const getPlanFeatures = () => [
    'Full Root Access',
    'Free DDoS Protection',
    '24/7 Support',
    '99.9% Uptime',
    'Easy Scalability',
    'Unlimited Bandwidth',
];

const PlanDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const { getPlanItem, addToCart } = useProduct();

    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<VPSPlan | null>(null);
    const [hostname, setHostname] = useState('');
    const [selectedOS, setSelectedOS] = useState<string>(operatingSystemOptions[0].value);
    const [selectedDuration, setSelectedDuration] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    const fetchPlanItem = async () => {
        setLoading(true);

        try {
            const planId = params.id as string;
            const result = await getPlanItem(planId);

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.details,
                });
                setPlan(null);
            } else {
                setPlan(result.data);
            }
        } catch {
            toast.error("Failed to load plan", {
                description: "Please try again later",
            });
            setPlan(null);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeVariant = (category: string) => {
        return category === 'basic' ? 'secondary' : category === 'standard' ? 'default' : 'destructive';
    };

    const getNetworkSpeed = (mbps: number) => {
        if (mbps >= 1000) {
            const gbps = (mbps / 1000).toFixed(1);
            return `${gbps} Gbps`;
        }
        return `${mbps} Mbps`;
    };

    useEffect(() => {
        fetchPlanItem();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <PlanItemPlaceholder />
        );
    }

    if (!plan) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="text-center p-8">
                    <CardContent>
                        <Server className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="text-2xl font-bold mb-2">VPS Plan Not Found</h2>
                        <p className="text-muted-foreground mb-4">The requested VPS plan does not exist.</p>
                        <Button onClick={() => router.push(`/${locale}/plans`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Plans
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const calculatePrice = () => {
        const duration = durationOptions.find(d => d.value === selectedDuration);
        const basePrice = plan.monthly_price * selectedDuration;
        const discount = duration ? (basePrice * duration.discount) / 100 : 0;
        return {
            basePrice,
            discount,
            finalPrice: basePrice - discount,
            monthlyPrice: (basePrice - discount) / selectedDuration
        };
    };
    const pricing = calculatePrice();

    const addItemToCart = async () => {
        setAddingToCart(true);

        try {
            const osSelected = operatingSystemOptions.find(os => os.value === selectedOS);
            const templateOS = osSelected?.template_os;
            const templateVersion = osSelected?.template_version;

            const result = await addToCart({
                planID: plan.id,
                hostname: hostname.trim(),
                os: selectedOS,
                templateOS: templateOS || '',
                templateVersion: templateVersion || '',
                durationMonths: selectedDuration,
                totalPrice: pricing.finalPrice,
            });

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.details,
                });
            } else {
                toast.success("Added to cart successfully");
                router.push(`/${locale}/cart`);
            }
        } catch {
            toast.error("Failed to add to cart", {
                description: "Please try again later",
            });
        } finally {
            setAddingToCart(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Plan Header */}
                        <Card className="border-2 hover:shadow-lg transition-shadow animate-in fade-in slide-in-from-top duration-500">
                            <CardHeader className="text-center pb-6">
                                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                        <Server className="h-12 w-12" />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <Badge variant={getBadgeVariant(plan.category)} className="mb-2">
                                            {plan.category.charAt(0).toUpperCase() + plan.category.slice(1)}
                                        </Badge>
                                        <CardTitle className="text-2xl sm:text-3xl font-bold">{plan.name}</CardTitle>
                                    </div>
                                </div>
                                <CardDescription className="text-base sm:text-lg max-w-2xl mx-auto">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        {/* Specifications */}
                        <Card className="border-2 hover:shadow-lg transition-shadow animate-in fade-in slide-in-from-left duration-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Server Specifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 dark:border dark:border-blue-100/30 hover:scale-105 hover:shadow-md transition-all duration-300 group cursor-pointer">
                                        <Cpu className="h-8 w-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                        <div className="text-2xl font-bold">{plan.vcpu}</div>
                                        <div className="text-sm text-muted-foreground">Cores</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 dark:border dark:border-green-100/30 hover:scale-105 hover:shadow-md transition-all duration-300 group cursor-pointer">
                                        <Zap className="h-8 w-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                        <div className="text-2xl font-bold">{plan.ram_gb} GB</div>
                                        <div className="text-sm text-muted-foreground">RAM</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 dark:border dark:border-purple-100/30 hover:scale-105 hover:shadow-md transition-all duration-300 group cursor-pointer">
                                        <HardDrive className="h-8 w-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                        <div className="text-2xl font-bold">{plan.storage_gb} GB</div>
                                        <div className="text-sm text-muted-foreground">{plan.storage_type}</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 dark:border dark:border-orange-100/30 hover:scale-105 hover:shadow-md transition-all duration-300 group cursor-pointer">
                                        <Gauge className="h-8 w-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                        <div className="text-2xl font-bold">{getNetworkSpeed(plan.bandwidth_mbps)}</div>
                                        <div className="text-sm text-muted-foreground">Network</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Included Features */}
                        <Card className="border-2 hover:shadow-lg transition-shadow animate-in fade-in slide-in-from-left duration-700 delay-150">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    What&apos;s Included
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {getPlanFeatures().map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3 group">
                                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Sidebar */}
                    <div className="space-y-6">
                        <Card className="sticky top-16.5 bg-secondary/50 border border-accent hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-right duration-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    Order Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Hostname */}
                                <div className='space-y-2'>
                                    <Label htmlFor='hostname' className="text-sm font-medium inline-flex items-center gap-2">
                                        <Server className="h-4 w-4 text-purple-500" />
                                        Hostname
                                    </Label>
                                    <input
                                        id="hostname"
                                        name="hostname"
                                        type="text"
                                        value={hostname}
                                        onChange={(e) => setHostname(e.target.value)}
                                        className="w-full px-3 py-2 border border-muted-foreground/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-muted-foreground transition-colors duration-200"
                                        placeholder="e.g., my-vps-server"
                                    />
                                </div>

                                {/* Operating System Selection */}
                                <div className='space-y-2'>
                                    <Label className="text-sm font-medium inline-flex items-center gap-2">
                                        <MonitorCog className="h-4 w-4 text-orange-500" />
                                        Operating System
                                    </Label>
                                    <Select value={selectedOS} onValueChange={setSelectedOS}>
                                        <SelectTrigger className='border-muted-foreground/70'>
                                            <SelectValue />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {operatingSystemOptions.map((os) => (
                                                <SelectItem key={os.value} value={os.value}>
                                                    {os.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Duration Selection */}
                                <div className='space-y-2'>
                                    <Label className="text-sm font-medium inline-flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-cyan-500" />
                                        Billing Period
                                    </Label>
                                    <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
                                        <SelectTrigger className='border-muted-foreground/70'>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {durationOptions.map((duration) => (
                                                <SelectItem key={duration.value} value={duration.value.toString()}>
                                                    <div className="flex justify-between items-center w-full">
                                                        <span>{duration.label}</span>
                                                        {duration.discount > 0 && (
                                                            <Badge variant="secondary" className="ml-2">
                                                                -{duration.discount}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator className='bg-gradient-to-r from-transparent via-accent to-transparent' />

                                {/* Pricing Summary */}
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span>Monthly Price:</span>
                                        <span>{formatPrice(plan.monthly_price)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Duration:</span>
                                        <span>{selectedDuration} month{selectedDuration > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formatPrice(pricing.basePrice)}</span>
                                    </div>
                                    {pricing.discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount:</span>
                                            <span>-{formatPrice(pricing.discount)}</span>
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total:</span>
                                        <span className="text-blue-600">{formatPrice(pricing.finalPrice)}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground text-center">
                                        Effective: {formatPrice(pricing.monthlyPrice)}/month
                                    </div>
                                </div>

                                <Separator className='bg-gradient-to-r from-transparent via-accent to-transparent' />

                                {/* Action Buttons */}
                                <Button
                                    className="w-full group hover:scale-105 transition-all duration-300"
                                    size="lg"
                                    onClick={addItemToCart}
                                    disabled={!hostname.trim() || loading || addingToCart}
                                >
                                    {addingToCart ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Adding to Cart...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                                            Add to Cart
                                        </>
                                    )}
                                </Button>

                                <div className="text-xs text-muted-foreground text-center">
                                    * Setup is usually completed in a few minutes after payment
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default PlanDetailPage;