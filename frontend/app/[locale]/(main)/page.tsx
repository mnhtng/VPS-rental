'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Server,
  Shield,
  Clock,
  HeadphonesIcon,
  CheckCircle,
  Rocket,
  Award,
  DollarSign,
  Settings
} from 'lucide-react';
import HeroSection from '@/components/custom/hero/HeroSection';
import { convertUSDToVND, formatPrice } from '@/utils/currency';

const HomePage = () => {
  const t = useTranslations('home');
  const locale = useLocale();

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
      icon: <Clock className="h-8 w-8 text-purple-600" />,
      title: t('features.backup'),
      description: t('features.backup_desc')
    },
    {
      icon: <HeadphonesIcon className="h-8 w-8 text-orange-600" />,
      title: t('features.support'),
      description: t('features.support_desc')
    }
  ];

  const popularPlans = [
    {
      id: 1,
      name: "Starter",
      price: convertUSDToVND(10),
      cpu: 1,
      ram: 2,
      storage: 25,
      storageType: "SSD",
      bandwidth: "1TB",
      popular: false
    },
    {
      id: 2,
      name: "Business",
      price: convertUSDToVND(30),
      cpu: 2,
      ram: 4,
      storage: 50,
      storageType: "NVMe",
      bandwidth: "2TB",
      popular: true
    },
    {
      id: 3,
      name: "Professional",
      price: convertUSDToVND(65),
      cpu: 4,
      ram: 8,
      storage: 100,
      storageType: "NVMe",
      bandwidth: "4TB",
      popular: false
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
            {features.map((feature, index) => (
              <Card key={index} className="text-center border border-accent hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
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
            {popularPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    {t('popular_plans.most_popular')}
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">
                    {plan.name}
                  </CardTitle>
                  <div className="text-3xl md:text-xl lg:text-3xl font-bold text-accent-foreground">
                    {formatPrice(plan.price)}
                    <span className="text-lg font-normal text-muted-foreground">
                      {t('popular_plans.per_month')}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 h-full flex flex-col">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{plan.cpu} {t('popular_plans.cpu_cores')}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{plan.ram} GB {t('popular_plans.memory')}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{plan.storage} GB {plan.storageType} {t('popular_plans.storage')}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{plan.bandwidth} {t('popular_plans.bandwidth')}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{t('features.support')}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{t('features.uptime')}</span>
                    </div>
                  </div>

                  <Button className="w-full mt-auto" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link href={`/${locale}/plans/${plan.id}`}>
                      {t('popular_plans.select_plan')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
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
            {advantages.map((advantage, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-white rounded-lg p-3 shadow-md">
                  {advantage.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-accent-foreground mb-2">
                    {advantage.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {advantage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button size="lg" asChild>
              <Link href={`/${locale}/plans`}>
                {t('advantages.get_started')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
