'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
    Server,
    Cpu,
    HardDrive,
    Zap,
    Shield,
    Clock,
    CheckCircle,
    Search,
    X,
    RotateCcw,
    SlidersHorizontal,
    DollarSign,
    Eye,
    Gauge,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import { VPSPlan } from '@/types/types';
import { useTranslations } from 'next-intl';
import { formatPrice, convertUSDToVND, formatPriceNumber } from '@/utils/currency';
import { toast } from 'sonner';
import useProduct from '@/hooks/useProduct';
import {
    PlansFeaturePlaceholder,
    PlansFilterPlaceholder,
    PlansHeaderPlaceholder,
    PlansListPlaceholder,
} from '@/components/custom/placeholder/vps_plan';

const PlansPage = () => {
    const t = useTranslations('plans');
    const router = useRouter();
    const { getPlans } = useProduct();

    const [plans, setPlans] = useState<VPSPlan[]>([]);
    const [filteredPlans, setFilteredPlans] = useState<VPSPlan[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [memoryFilter, setMemoryFilter] = useState<string>('all');
    const [priceRange, setPriceRange] = useState<number[]>([0, convertUSDToVND(100)]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    const minPrice = plans.length > 0 ? Math.min(...plans.map(plan => plan.monthly_price)) : 0;
    const maxPrice = plans.length > 0 ? Math.max(...plans.map(plan => plan.monthly_price)) : convertUSDToVND(100);
    const hasActiveFilters = selectedCategory !== 'all' ||
        priceRange[0] !== minPrice || priceRange[1] !== maxPrice ||
        memoryFilter !== 'all';

    const resetFilters = () => {
        setSelectedCategory('all');
        setPriceRange([minPrice, maxPrice]);
        setMemoryFilter('all');
    };

    const fetchPlans = async (signal?: AbortSignal) => {
        setIsLoading(true);

        try {
            const result = await getPlans(signal);

            if (signal?.aborted) return;

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });

                setPlans([]);
                setFilteredPlans([]);
            } else {
                const plansData = Array.isArray(result.data) ? result.data : [];

                setPlans(plansData);
                setFilteredPlans(plansData);

                if (plansData.length > 0) {
                    const min = Math.min(...plansData.map(p => p.monthly_price));
                    const max = Math.max(...plansData.map(p => p.monthly_price));
                    setPriceRange([min, max]);
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;

            toast.error("Failed to load plans", {
                description: "Please try again later",
            });

            setPlans([]);
            setFilteredPlans([]);
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        fetchPlans(controller.signal);

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        if (!plans || plans.length === 0) {
            setFilteredPlans([]);
            return;
        }

        let filtered = [...plans];

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(plan => {
                if (selectedCategory === 'basic') return plan.category === 'basic';
                if (selectedCategory === 'standard') return plan.category === 'standard';
                if (selectedCategory === 'premium') return plan.category === 'premium';
                return true;
            });
        }

        // Filter by memory (RAM)
        if (memoryFilter !== 'all') {
            if (memoryFilter === 'low') {
                filtered = filtered.filter(plan => plan.ram_gb <= 2);
            } else if (memoryFilter === 'medium') {
                filtered = filtered.filter(plan => plan.ram_gb > 2 && plan.ram_gb <= 8);
            } else if (memoryFilter === 'high') {
                filtered = filtered.filter(plan => plan.ram_gb > 8);
            }
        }

        // Filter by price range
        filtered = filtered.filter(plan =>
            plan.monthly_price >= priceRange[0] && plan.monthly_price <= priceRange[1]
        );

        setFilteredPlans(filtered);
    }, [plans, selectedCategory, priceRange, memoryFilter]);

    const handleShowDetails = (planId: string) => {
        setSelectedPlanId(planId);
        router.push(`/plans/${planId}`);
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

    const getMemoryFilterLabel = (filter: string) => {
        switch (filter) {
            case 'low': return 'Low Memory (≤4GB)';
            case 'medium': return 'Medium Memory (5-8GB)';
            case 'high': return 'High Memory (9GB+)';
            default: return filter;
        }
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    {isLoading ? (
                        <PlansHeaderPlaceholder />
                    ) : (
                        <div className="animate-in fade-in slide-in-from-top duration-700">
                            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                                {t('title')}
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                                {t('subtitle')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Filter Section */}
                <div className="mb-8 space-y-4">
                    {isLoading ? (
                        <PlansFilterPlaceholder />
                    ) : (
                        <>
                            {/* Main Filter Bar */}
                            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-4 md:p-5 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20 transition-shadow hover:shadow-xl hover:shadow-gray-200/30 dark:hover:shadow-gray-900/30 animate-in fade-in slide-in-from-top duration-700">
                                <div className="space-y-5">
                                    {/* Header Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
                                                <SlidersHorizontal className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm md:text-base font-semibold">
                                                    {t('filter.title')}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {t('filter.show', { count: filteredPlans.length, total: plans.length })}
                                                </span>
                                            </div>
                                        </div>

                                        {hasActiveFilters && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={resetFilters}
                                                className="h-9 px-3 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                {t('filter.reset')}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="relative flex justify-between gap-6 flex-col lg:flex-row">
                                        <div className='flex justify-between items-center gap-6 lg:w-[50%]'>
                                            {/* Category Filter */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    Plan Category
                                                </label>

                                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                                    <SelectTrigger className={`h-10 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 ${selectedCategory !== 'all' ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-400 shadow-sm' : 'bg-white dark:bg-gray-800'}`}>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="all">All Plans</SelectItem>
                                                        <SelectItem value="basic">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            </div>
                                                            Basic
                                                        </SelectItem>
                                                        <SelectItem value="standard">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                            </div>
                                                            Standard
                                                        </SelectItem>
                                                        <SelectItem value="premium">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                            </div>
                                                            Premium
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Memory Filter */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                    Memory
                                                </label>
                                                <Select value={memoryFilter} onValueChange={setMemoryFilter}>
                                                    <SelectTrigger className={`h-10 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 ${memoryFilter !== 'all' ? 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-900/30 border-orange-400 shadow-sm' : 'bg-white dark:bg-gray-800'}`}>
                                                        <SelectValue placeholder="Select memory" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Memory</SelectItem>
                                                        <SelectItem value="low">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            </div>
                                                            Low (≤2GB RAM)
                                                        </SelectItem>
                                                        <SelectItem value="medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                            </div>
                                                            Medium (3-8GB RAM)
                                                        </SelectItem>
                                                        <SelectItem value="high">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                            </div>
                                                            High (9GB+ RAM)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Price Range Filter */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                                            </label>

                                            <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50">
                                                <div className="px-2">
                                                    <Slider
                                                        value={priceRange}
                                                        onValueChange={setPriceRange}
                                                        max={maxPrice}
                                                        min={minPrice}
                                                        step={1000}
                                                        className="w-full"
                                                    />
                                                </div>

                                                <div className="flex justify-between text-xs px-2 mt-2">
                                                    <span>{formatPriceNumber(minPrice)}</span>
                                                    <span>{formatPriceNumber(maxPrice)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Filters Chips */}
                            {hasActiveFilters && (
                                <div className="flex flex-wrap gap-2 animate-in fade-in duration-200 border border-dashed border-muted-foreground/50 rounded-lg px-4 py-3">
                                    <span className="text-sm text-muted-foreground self-center font-medium">
                                        Active filters:
                                    </span>
                                    {selectedCategory !== 'all' && (
                                        <Badge variant="secondary" className="px-3 py-1.5 flex items-center gap-2 text-sm bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 transition-all hover:shadow-md">
                                            <span className="capitalize font-medium">{selectedCategory}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedCategory('all')}
                                                className="h-4 w-4 p-0 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-all duration-200"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    )}
                                    {memoryFilter !== 'all' && (
                                        <Badge variant="secondary" className="px-3 py-1.5 flex items-center gap-2 text-sm bg-gradient-to-r from-orange-50 to-yellow-100 dark:from-orange-950/30 dark:to-yellow-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 transition-all hover:shadow-md">
                                            <span className="font-medium">{getMemoryFilterLabel(memoryFilter)}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setMemoryFilter('all')}
                                                className="h-4 w-4 p-0 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full transition-all duration-200"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    )}
                                    {(priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
                                        <Badge variant="secondary" className="px-3 py-1.5 flex items-center gap-2 text-sm bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 transition-all hover:shadow-md">
                                            <span className="font-medium">{formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPriceRange([minPrice, maxPrice])}
                                                className="h-4 w-4 p-0 hover:bg-green-200 dark:hover:bg-green-800 rounded-full transition-all duration-200"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <PlansListPlaceholder />
                )}

                {/* Plans */}
                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {filteredPlans.map((plan, index) => (
                            <Card
                                key={plan.id}
                                className="relative hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2 hover:border-blue-400 group animate-in fade-in slide-in-from-bottom"
                                style={{ animationDelay: `${index * 100}ms`, animationDuration: '500ms' }}
                            >
                                <Badge
                                    variant={getBadgeVariant(plan.category)}
                                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 group-hover:scale-110 transition-transform duration-200"
                                >
                                    {plan.category.charAt(0).toUpperCase() + plan.category.slice(1)}
                                </Badge>

                                <CardHeader className="text-center pb-4">
                                    <div className="flex justify-center mb-4">
                                        <Server className="h-12 w-12 text-accent group-hover:scale-110 group-hover:text-blue-500 transition-all duration-300" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        {plan.description}
                                    </CardDescription>
                                    <div className="text-center py-4">
                                        <div className="group-hover:scale-110 transition-transform duration-300">
                                            <span className="text-3xl xl:text-4xl font-bold text-blue-600 dark:text-blue-400">
                                                {formatPrice(plan.monthly_price)}
                                            </span>
                                            <span className="text-lg font-normal">/month</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">Billed monthly</p>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex flex-col justify-between items-center gap-4 space-y-4 w-full h-full">
                                    <div className="flex-grow">
                                        {/* Specs */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="flex items-center group/spec hover:translate-x-1 transition-transform duration-200">
                                                <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 group-hover/spec:scale-110 transition-transform" />
                                                <span className="text-sm">{plan.vcpu} vCPU</span>
                                            </div>
                                            <div className="flex items-center group/spec hover:translate-x-1 transition-transform duration-200">
                                                <Zap className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 group-hover/spec:scale-110 transition-transform" />
                                                <span className="text-sm">{plan.ram_gb} GB RAM</span>
                                            </div>
                                            <div className="flex items-center group/spec hover:translate-x-1 transition-transform duration-200">
                                                <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2 group-hover/spec:scale-110 transition-transform" />
                                                <span className="text-sm">{plan.storage_gb} GB {plan.storage_type}</span>
                                            </div>
                                            <div className="flex items-center group/spec hover:translate-x-1 transition-transform duration-200">
                                                <Gauge className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-2 group-hover/spec:scale-110 transition-transform" />
                                                <span className="text-sm">{getNetworkSpeed(plan.bandwidth_mbps)}</span>
                                            </div>
                                        </div>

                                        {/* Features List */}
                                        <div className="space-y-2">
                                            {plan.use_case.map((useCase, index) => (
                                                <div key={index} className="flex items-center group/feature hover:translate-x-1 transition-transform duration-200">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0 group-hover/feature:scale-110 transition-transform" />
                                                    <span className="text-sm">{useCase}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <Button
                                        className="w-full group/btn hover:scale-105 transition-all duration-200"
                                        size="lg"
                                        onClick={() => handleShowDetails(plan.id)}
                                        disabled={selectedPlanId !== null}
                                    >
                                        {selectedPlanId === plan.id ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Loading Details...
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                                View Details
                                                <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-200" />
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {!isLoading && filteredPlans.length === 0 && (
                    <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-dashed">
                        <CardContent className="space-y-6">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 flex items-center justify-center">
                                    <Search className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-foreground">No plans found</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    We couldn&apos;t find any VPS plans matching your current filter criteria.
                                    Try adjusting your filters or browse all available plans.
                                </p>
                            </div>
                            <div className="flex gap-3 justify-center items-center">
                                <Button
                                    onClick={resetFilters}
                                    className="flex items-center space-x-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    <span>Reset All Filters</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Features Comparison */}
                {isLoading ? (
                    <PlansFeaturePlaceholder />
                ) : (
                    <Card className="mt-12 hover:shadow-lg transition-shadow animate-in fade-in slide-in-from-bottom duration-700">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center">What&apos;s Included in All Plans</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="text-center group hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <h4 className="font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Security</h4>
                                    <p className="text-sm text-muted-foreground">DDoS protection, firewall, and security monitoring</p>
                                </div>
                                <div className="text-center group hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <Clock className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <h4 className="font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">24/7 Support</h4>
                                    <p className="text-sm text-muted-foreground">Expert technical support available anytime</p>
                                </div>
                                <div className="text-center group hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <Server className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <h4 className="font-semibold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Full Root Access</h4>
                                    <p className="text-sm text-muted-foreground">Complete control over your server environment</p>
                                </div>
                                <div className="text-center group hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <CheckCircle className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <h4 className="font-semibold mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">99.9% Uptime</h4>
                                    <p className="text-sm text-muted-foreground">Guaranteed uptime with SLA backing</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div >
    );
};

export default PlansPage;
