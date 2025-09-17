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
    MonitorCog
} from 'lucide-react';
import { VPSPlan } from '@/lib/types';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/currency';
import { Label } from '@radix-ui/react-label';

// Mock data - Static data for VPS plans
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
        monthly_price: 150000,
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
        monthly_price: 350000,
        is_active: true,
        created_at: '2024-01-01'
    },
    {
        id: 3,
        name: "Professional",
        description: "High-performance hosting for demanding applications",
        cpu_cores: 4,
        ram_gb: 8,
        storage_type: 'NVMe',
        storage_gb: 100,
        bandwidth_gb: 4000,
        monthly_price: 750000,
        is_active: true,
        created_at: '2024-01-01'
    },
    {
        id: 4,
        name: "Enterprise",
        description: "For large-scale applications and enterprise solutions",
        cpu_cores: 8,
        ram_gb: 16,
        storage_type: 'NVMe',
        storage_gb: 200,
        bandwidth_gb: 8000,
        monthly_price: 1500000,
        is_active: true,
        created_at: '2024-01-01'
    },
    {
        id: 5,
        name: "Developer",
        description: "Affordable VPS for developers and testing",
        cpu_cores: 2,
        ram_gb: 2,
        storage_type: 'SSD',
        storage_gb: 40,
        bandwidth_gb: 1500,
        monthly_price: 250000,
        is_active: true,
        created_at: '2024-01-01'
    }
];

const operatingSystemOptions = [
    { value: 'ubuntu-22.04', label: 'Ubuntu 22.04 LTS' },
    { value: 'centos-8', label: 'CentOS 8' },
    { value: 'debian-11', label: 'Debian 11' },
    { value: 'windows-2019', label: 'Windows Server 2019' },
    { value: 'windows-2022', label: 'Windows Server 2022' }
];

const durationOptions = [
    { value: 1, label: '1 Month', discount: 0 },
    { value: 3, label: '3 Months', discount: 5 },
    { value: 6, label: '6 Months', discount: 10 },
    { value: 12, label: '12 Months', discount: 15 },
    { value: 24, label: '24 Months', discount: 20 },
];

const PlanDetailPage = () => {
    const params = useParams();
    const router = useRouter();

    const [plan, setPlan] = useState<VPSPlan | null>(null);
    const [selectedOS, setSelectedOS] = useState('ubuntu-22.04');
    const [selectedDuration, setSelectedDuration] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use static data only
        const fetchPlan = () => {
            setLoading(true);
            const planId = parseInt(params.id as string);
            const foundPlan = mockPlans.find(p => p.id === planId);
            setPlan(foundPlan || null);
            setLoading(false);
        };

        fetchPlan();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-4">
                    <Server className="h-8 w-8 animate-pulse text-blue-600" />
                    <div className="text-lg">Loading plan details...</div>
                </div>
            </div>
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
                        <Button onClick={() => router.push('/plans')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Plans
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getPlanFeatures = () => [
        'Full Root Access',
        'Free DDoS Protection',
        '24/7 Support',
        'Free SSL Certificate',
        'Daily Backups',
        '1-Click App Installation',
        'Easy Control Panel',
        '99.9% Uptime'
    ];

    const getBadgeVariant = (price: number) => {
        if (price <= 300000) return 'secondary';
        if (price <= 800000) return 'default';
        return 'destructive';
    };

    const getBadgeText = (price: number) => {
        if (price <= 300000) return 'Basic';
        if (price <= 800000) return 'Popular';
        return 'Premium';
    };

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

    const addToCart = () => {
        console.log('Add to cart:', {
            planId: plan.id,
            os: selectedOS,
            duration: selectedDuration,
            totalPrice: pricing.finalPrice
        });
        toast.success(`Added ${plan.name} plan to cart!`);
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Plan Header */}
                        <Card className="border-2">
                            <CardHeader className="text-center pb-6">
                                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                        <Server className="h-12 w-12" />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <Badge variant={getBadgeVariant(plan.monthly_price)} className="mb-2">
                                            {getBadgeText(plan.monthly_price)}
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
                        <Card className='border-2'>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="h-5 w-5 text-blue-600" />
                                    Server Specifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
                                        <Cpu className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold">{plan.cpu_cores}</div>
                                        <div className="text-sm text-muted-foreground">CPU Cores</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
                                        <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold">{plan.ram_gb} GB</div>
                                        <div className="text-sm text-muted-foreground">RAM</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
                                        <HardDrive className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold">{plan.storage_gb} GB</div>
                                        <div className="text-sm text-muted-foreground">{plan.storage_type}</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30">
                                        <Server className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold">{plan.bandwidth_gb ? Math.floor(plan.bandwidth_gb / 1000) : '∞'} TB</div>
                                        <div className="text-sm text-muted-foreground">Bandwidth</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Included Features */}
                        <Card className='border-2'>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    What&apos;s Included
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {getPlanFeatures().map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3">
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
                        <Card className="sticky top-16.5 bg-secondary/50 border border-accent">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    Order Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Operating System Selection */}
                                <div className='space-y-2'>
                                    <Label className="text-sm font-medium inline-flex items-center gap-2">
                                        <MonitorCog className="h-4 w-4 text-orange-500" />
                                        Operating System
                                    </Label>
                                    <Select value={selectedOS} onValueChange={setSelectedOS}>
                                        <SelectTrigger>
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
                                        <SelectTrigger>
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
                                    className="w-full"
                                    size="lg"
                                    onClick={addToCart}
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Add to Cart
                                </Button>

                                <div className="text-xs text-muted-foreground text-center">
                                    * Setup is usually completed within 5-10 minutes
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanDetailPage;