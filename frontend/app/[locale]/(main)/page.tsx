'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Server,
  Shield,
  HeadphonesIcon,
  CheckCircle,
  Rocket,
  Award,
  DollarSign,
  Settings,
  ArrowRight,
  Scale
} from 'lucide-react';
import HeroSection from '@/components/custom/hero/HeroSection';
import { formatPrice } from '@/utils/currency';
import { FeaturesSectionPlaceholder, PopularSectionPlaceholder, WhyChooseUsPlaceholder } from '@/components/custom/placeholder/home';
import { useSession } from 'next-auth/react';
import { VPSPlan } from '@/types/types';
import { toast } from 'sonner';
import useProduct from '@/hooks/useProduct';

const HomePage = () => {
  const locale = useLocale();
  const t = useTranslations('home');
  const { status } = useSession();
  const { getPlans } = useProduct();

  const [isLoading, setIsLoading] = useState(true);
  const [popularPlans, setPopularPlans] = useState<VPSPlan[]>([]);

  const getNetworkSpeed = (mbps: number) => {
    if (mbps >= 1000) {
      const gbps = (mbps / 1000).toFixed(1);
      return `${gbps} Gbps`;
    }
    return `${mbps} Mbps`;
  };

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [status]);

  const fetchPopularPlans = async () => {
    try {
      const result = await getPlans();

      if (result.error) {
        toast.error(result.message, {
          description: result.error.details,
        });

        setPopularPlans([]);
      } else {
        const plansData = Array.isArray(result.data) ? [
          result.data[0],
          result.data[2],
          result.data[5],
        ] : [];
        setPopularPlans(plansData);
      }
    } catch {
      toast.error("Failed to load popular plans", {
        description: "Please try again later",
      });

      setPopularPlans([]);
    }
  };

  useEffect(() => {
    fetchPopularPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const features = [
    {
      icon: <Server className="h-8 w-8 text-blue-600" />,
      title: t('features.uptime'),
      description: t('features.uptime_desc')
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: t('features.security'),
      description: t('features.security_desc')
    },
    {
      icon: <Scale className="h-8 w-8 text-purple-600" />,
      title: t('features.scalability'),
      description: t('features.scalability_desc')
    },
    {
      icon: <HeadphonesIcon className="h-8 w-8 text-orange-600" />,
      title: t('features.support'),
      description: t('features.support_desc')
    }
  ];

  const advantages = [
    {
      icon: <Rocket className="h-12 w-12 text-blue-600" />,
      title: t('advantages.items.0.title'),
      description: t('advantages.items.0.description')
    },
    {
      icon: <Award className="h-12 w-12 text-green-600" />,
      title: t('advantages.items.1.title'),
      description: t('advantages.items.1.description')
    },
    {
      icon: <DollarSign className="h-12 w-12 text-purple-600" />,
      title: t('advantages.items.2.title'),
      description: t('advantages.items.2.description')
    },
    {
      icon: <Settings className="h-12 w-12 text-orange-600" />,
      title: t('advantages.items.3.title'),
      description: t('advantages.items.3.description')
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection locale={locale} t={t} />

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('features.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoading ? (
              <FeaturesSectionPlaceholder />
            ) : (
              features.map((feature, index) => (
                <Card
                  key={index}
                  className="text-center border border-accent hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Popular Plans Section */}
      <section className="py-20 bg-gray-50 dark:bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              {t('popular_plans.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('popular_plans.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              <PopularSectionPlaceholder />
            ) : (
              popularPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${index === 1 ? 'border-blue-500 border-2 scale-105' : 'hover:border-primary/50'
                    }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {index === 1 && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-background text-primary border border-primary px-3 py-1 rounded-full shadow-md">
                      {t('popular_plans.most_popular')}
                    </Badge>
                  )}

                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl hover:text-primary transition-colors duration-300">
                      {plan.name}
                    </CardTitle>
                    <div className="text-3xl md:text-xl lg:text-3xl font-bold text-accent-foreground">
                      {formatPrice(plan.monthly_price)}{' '}
                      <span className="text-lg font-normal text-muted-foreground">
                        {t('popular_plans.per_month')}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 h-full flex flex-col">
                    <div className="space-y-3">
                      <div className="flex items-center group/item hover:translate-x-1 transition-transform duration-200">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 group-hover/item:scale-110 transition-transform" />
                        <span>{plan.vcpu} {t('popular_plans.cpu_cores')}</span>
                      </div>
                      <div className="flex items-center group/item hover:translate-x-1 transition-transform duration-200">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 group-hover/item:scale-110 transition-transform" />
                        <span>{plan.ram_gb} GB {t('popular_plans.memory')}</span>
                      </div>
                      <div className="flex items-center group/item hover:translate-x-1 transition-transform duration-200">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 group-hover/item:scale-110 transition-transform" />
                        <span>{plan.storage_gb} GB {plan.storage_type} {t('popular_plans.storage')}</span>
                      </div>
                      <div className="flex items-center group/item hover:translate-x-1 transition-transform duration-200">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 group-hover/item:scale-110 transition-transform" />
                        <span>{getNetworkSpeed(plan.bandwidth_mbps)} {t('popular_plans.network_speed')}</span>
                      </div>
                      <div className="flex items-center group/item hover:translate-x-1 transition-transform duration-200">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 group-hover/item:scale-110 transition-transform" />
                        <span>{t('features.support')}</span>
                      </div>
                      <div className="flex items-center group/item hover:translate-x-1 transition-transform duration-200">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 group-hover/item:scale-110 transition-transform" />
                        <span>{t('features.uptime')}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-auto group/btn hover:scale-105 transition-all duration-200"
                      variant={index === 1 ? "default" : "outline"}
                      asChild
                    >
                      <Link href={`/${locale}/plans/${plan.id}`} className="flex items-center justify-center">
                        {t('popular_plans.select_plan')}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('advantages.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('advantages.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {isLoading ? (
              <WhyChooseUsPlaceholder />
            ) : (
              advantages.map((advantage, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 group hover:translate-x-2 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0 bg-white dark:bg-card rounded-lg p-3 shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    {advantage.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-accent-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                      {advantage.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {advantage.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-16 text-center">
            <Button size="lg" className="group hover:scale-105 transition-all duration-300" asChild>
              <Link href={`/${locale}/plans`} className="flex items-center">
                {t('advantages.get_started')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
