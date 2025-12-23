'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    MessageCircle,
    Send,
    Bot,
    User,
    HelpCircle,
    Phone,
    Mail,
    CheckCircle,
    Loader,
    Ticket as TicketIcon,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { ChatMessage } from '@/types/types';
import { formatPrice, convertUSDToVND } from '@/utils/currency';
import { toast } from 'sonner';
import useSupport from '@/hooks/useSupport';
import useMember from '@/hooks/useMember';

// Mock FAQ data
const faqs = [
    {
        id: 1,
        question: 'What VPS plan should I choose?',
        answer: 'Choose based on your needs: Starter for small websites, Business for growing applications, Professional for high-traffic sites, and Enterprise for resource-intensive applications.',
        category: 'Plans'
    },
    {
        id: 2,
        question: 'How long does VPS deployment take?',
        answer: 'Most VPS instances are deployed within 5-10 minutes after successful payment confirmation. You will receive setup details via email.',
        category: 'Setup'
    },
    {
        id: 3,
        question: 'Can I upgrade or downgrade my plan?',
        answer: 'Yes, you can upgrade your plan anytime from your dashboard. Downgrades are processed at the end of your billing cycle.',
        category: 'Plans'
    },
    {
        id: 4,
        question: 'What payment methods do you accept?',
        answer: 'We accept MoMo wallet and VNPay (credit/debit cards). All payments are processed securely.',
        category: 'Billing'
    },
    {
        id: 5,
        question: 'Do you provide backup services?',
        answer: 'Yes, we offer automated daily backups for all VPS plans. You can also create manual backups from your control panel.',
        category: 'Technical'
    },
    {
        id: 6,
        question: 'What level of support do you provide?',
        answer: 'We provide 24/7 technical support via live chat, email, and phone. Our expert team can help with server configuration, troubleshooting, and optimization.',
        category: 'Support'
    }
];

// Mock chatbot responses
const chatbotResponses: { [key: string]: string } = {
    'hello': 'Hi! Welcome to VPS Rental support. How can I help you today?',
    'hi': 'Hello! I\'m here to help you with any VPS-related questions.',
    'pricing': `Our VPS plans start from ${formatPrice(convertUSDToVND(15))}/month for the Starter plan. We also have Business (${formatPrice(convertUSDToVND(35))}/mo), Professional (${formatPrice(convertUSDToVND(65))}/mo), and Enterprise (${formatPrice(convertUSDToVND(125))}/mo) plans. Would you like me to recommend a plan based on your needs?`,
    'plan': 'I can help you choose the right VPS plan! What will you be using the server for? (e.g., website hosting, application development, database server)',
    'website': `For website hosting, I recommend: Small personal sites - Starter plan (${formatPrice(convertUSDToVND(15))}/mo), Business websites - Business plan (${formatPrice(convertUSDToVND(35))}/mo), High-traffic sites - Professional plan (${formatPrice(convertUSDToVND(65))}/mo).`,
    'development': `For development work, the Business plan (${formatPrice(convertUSDToVND(35))}/mo) with 2 CPU cores and 4GB RAM is perfect for most development environments.`,
    'database': `For databases, consider our Professional plan (${formatPrice(convertUSDToVND(65))}/mo) with 4 CPU cores and 8GB RAM, or the High Memory plan for memory-intensive databases.`,
    'support': 'Our support team is available 24/7 via live chat, email (support@pcloud.com), and phone (+1-234-567-8900). What specific issue can I help you with?',
    'backup': 'We provide automated daily backups for all plans. You can also create manual backups from your dashboard. Backups are stored securely and can be restored with one click.',
    'setup': 'VPS setup typically takes 5-10 minutes after payment. You\'ll receive login credentials via email. Need help with initial server configuration?',
    'payment': 'We accept MoMo wallet and VNPay. All payments are secure and processed instantly.',
    'refund': 'We offer a 30-day money-back guarantee for new customers. Contact support to process your refund request.',
    'upgrade': 'You can upgrade your VPS plan anytime from your dashboard. Upgrades are processed immediately with prorated billing.',
    'default': 'I\'m not sure about that specific question. Let me connect you with our human support team who can provide detailed assistance. You can also browse our FAQ section below.'
};

const SupportPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const locale = useLocale();
    const { getProfile } = useMember();
    const { createTicket } = useSupport();

    const [activeTab, setActiveTab] = useState('chat');
    const [isLoading, setIsLoading] = useState(true);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            message: 'Hello! I\'m your VPS assistant. I can help you choose plans, answer technical questions, and provide support. How can I help you today?',
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [ticketForm, setTicketForm] = useState({
        subject: '',
        phone: '',
        category: '',
        priority: 'medium',
        description: ''
    });
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const fetchUserProfile = async (signal?: AbortSignal) => {
        try {
            setIsLoading(true);

            if (status === 'authenticated') {
                const result = await getProfile(signal);

                if (signal?.aborted) return;

                if (result.error) {
                    toast.error(result.message, {
                        description: result.error.detail
                    });
                } else {
                    setTicketForm(prev => ({
                        ...prev,
                        phone: result.data?.phone || ''
                    }));
                }
            } else {
                setTicketForm(prev => ({
                    ...prev,
                    phone: ''
                }));

                toast.info('Please login to access full support features', {
                    description: 'You can still use the AI chat and browse FAQs'
                });
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;

            toast.error('Failed to load user profile', {
                description: 'Please try again later'
            });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const controller = new AbortController();

        fetchUserProfile(controller.signal)

        return () => {
            controller.abort();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const generateChatbotResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase();

        // Check for keywords in the message
        for (const [keyword, response] of Object.entries(chatbotResponses)) {
            if (lowerMessage.includes(keyword)) {
                return response;
            }
        }

        return chatbotResponses.default;
    };

    const handleSendMessage = () => {
        if (!currentMessage.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            message: currentMessage,
            isUser: true,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        setCurrentMessage('');
        setIsTyping(true);

        // Simulate bot response delay
        setTimeout(() => {
            const botResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                message: generateChatbotResponse(currentMessage),
                isUser: false,
                timestamp: new Date()
            };

            setChatMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 1500);
    };

    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (status !== 'authenticated' || !session?.user?.email) {
            toast.error('Please login to submit a ticket');
            router.push(`/${locale}/login`);
            return;
        }

        if (!ticketForm.subject || !ticketForm.description || !ticketForm.phone || !ticketForm.category || !ticketForm.priority) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitStatus('loading');

        try {
            const categoryMap: { [key: string]: string } = {
                'technical': 'technical_support',
                'billing': 'payment',
                'setup': 'server_issue',
                'performance': 'performance',
                'security': 'security',
                'other': 'other',
            };

            const result = await createTicket({
                subject: ticketForm.subject,
                description: ticketForm.description,
                category: categoryMap[ticketForm.category] || 'other',
                priority: ticketForm.priority,
                phone: ticketForm.phone.replace(/\D/g, ''), // Remove non-digits
            });

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail
                });
            } else {
                setSubmitStatus('success');
                setTicketForm({ subject: '', phone: '', category: '', priority: 'medium', description: '' });
                toast.success('Ticket submitted successfully!');
            }

            setTimeout(() => setSubmitStatus('idle'), 3000);
        } catch {
            setSubmitStatus('error');
            toast.error('Failed to submit ticket', {
                description: 'Please try again later'
            });
            setTimeout(() => setSubmitStatus('idle'), 3000);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTicketForm(prev => ({ ...prev, [name]: value }));
    };

    const suggestedQuestions = [
        'What VPS plan should I choose?',
        'How long does setup take?',
        'What payment methods do you accept?',
        'Do you provide backups?',
        'Can I upgrade my plan later?'
    ];

    return (
        <div className="min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12 animate-in fade-in zoom-in-95" style={{ animationDelay: '100ms' }}>
                    <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
                        Support Center
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Get help with your VPS hosting needs
                    </p>
                </div>

                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {isLoading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                                    <CardContent className="text-center p-6">
                                        <Skeleton className="h-8 w-8 rounded mx-auto mb-3" />
                                        <Skeleton className="h-5 w-24 mx-auto mb-2" />
                                        <Skeleton className="h-4 w-full mb-3" />
                                        <Skeleton className="h-6 w-28 mx-auto rounded-full" />
                                    </CardContent>
                                </Card>
                            ))}
                        </>
                    ) : (
                        <>
                            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0ms' }}>
                                <CardContent className="text-center p-6">
                                    <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-semibold mb-2">Live Chat</h3>
                                    <p className="text-sm text-muted-foreground mb-3">Chat with our AI assistant or human support agents</p>
                                    <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">Available 24/7</Badge>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '50ms' }}>
                                <CardContent className="text-center p-6">
                                    <Mail className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-semibold mb-2">Email Support</h3>
                                    <p className="text-sm text-muted-foreground mb-3">support@pcloud.com</p>
                                    <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">Response within 2 hours</Badge>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
                                <CardContent className="text-center p-6">
                                    <Phone className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-semibold mb-2">Phone Support</h3>
                                    <p className="text-sm text-muted-foreground mb-3">+1 (234) 567-8900</p>
                                    <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">24/7 Emergency</Badge>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 animate-in fade-in slide-in-from-top-4" style={{ animationDelay: '200ms' }}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="chat" className="hover:scale-105 transition-all">AI Chat Support</TabsTrigger>
                        <TabsTrigger value="ticket" className="hover:scale-105 transition-all">Submit Ticket</TabsTrigger>
                        <TabsTrigger value="faq" className="hover:scale-105 transition-all">FAQ</TabsTrigger>
                    </TabsList>

                    {/* AI Chat Tab */}
                    <TabsContent value="chat">
                        <Card className="animate-in fade-in zoom-in-95 duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Bot className="mr-2 h-5 w-5" />
                                    AI Support Assistant
                                </CardTitle>
                                <CardDescription>
                                    Get instant answers to your VPS questions. Our AI can help with plan recommendations, setup guidance, and technical support.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {isLoading ? (
                                    <>
                                        {/* Loading skeleton for chat */}
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32 mb-2" />
                                            <div className="flex gap-2">
                                                {[1, 2, 3].map((i) => (
                                                    <Skeleton key={i} className="h-8 w-24" />
                                                ))}
                                            </div>
                                        </div>
                                        <Skeleton className="h-96 w-full rounded-lg" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-16 flex-1" />
                                            <Skeleton className="h-16 w-16" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Suggested Questions */}
                                        <div className="space-y-2">
                                            <Label>Quick Questions:</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {suggestedQuestions.map((question, index) => (
                                                    <Button
                                                        key={index}
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentMessage(question)}
                                                        className="text-xs hover:scale-105 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600 transition-all"
                                                    >
                                                        {question}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Chat Messages */}
                                        <div className="border rounded-lg h-96 overflow-y-auto p-4 bg-muted">
                                            <div className="space-y-4">
                                                {chatMessages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div className={`flex max-w-[80%] space-x-2 ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                            <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${message.isUser ? 'bg-blue-600' : 'bg-gray-600'
                                                                }`}>
                                                                {message.isUser ? (
                                                                    <User className="h-4 w-4 text-white" />
                                                                ) : (
                                                                    <Bot className="h-4 w-4 text-white" />
                                                                )}
                                                            </div>
                                                            <div className={`rounded-lg p-3 ${message.isUser
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 text-gray-900'
                                                                }`}>
                                                                <p className="text-sm">{message.message}</p>
                                                                <p className="text-xs mt-1 opacity-70">
                                                                    {message.timestamp.toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {isTyping && (
                                                    <div className="flex justify-start">
                                                        <div className="flex max-w-[80%] space-x-2">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-600">
                                                                <Bot className="h-4 w-4 text-white" />
                                                            </div>
                                                            <div className="rounded-lg p-3 bg-gray-100">
                                                                <div className="flex space-x-1">
                                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Message Input */}
                                        <div className="flex items-center space-x-4">
                                            <Textarea
                                                name='chatInput'
                                                value={currentMessage}
                                                rows={1}
                                                onChange={(e) => setCurrentMessage(e.target.value)}
                                                onKeyDownCapture={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                                placeholder="Type your message..."
                                                className="border border-dashed focus:border-none border-gray-300 resize-none max-h-50 h-5 transition-all"
                                            />
                                            <Button
                                                variant="ghost"
                                                onClick={handleSendMessage}
                                                disabled={!currentMessage.trim()}
                                                className="aspect-square h-16 p-0 flex items-center justify-center rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-200 hover:text-blue-600 hover:scale-110 transition-all"
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Support Ticket Tab */}
                    <TabsContent value="ticket">
                        <Card className="animate-in fade-in zoom-in-95 duration-300">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Submit Support Ticket</CardTitle>
                                        <CardDescription>
                                            Need personalized help? Submit a ticket and our expert support team will respond within 2 hours.
                                        </CardDescription>
                                    </div>
                                    {status === 'authenticated' && (
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/${locale}/my-tickets`)}
                                            className="gap-2"
                                        >
                                            <TicketIcon className="h-4 w-4" />
                                            View My Tickets
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent>
                                {submitStatus === 'success' && (
                                    <Alert className="mb-6 border-green-500/50 bg-green-500/10">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <AlertDescription>
                                            Your support ticket has been submitted successfully! We&apos;ll respond via email within 2 hours.
                                            You can track your ticket status in{' '}
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto"
                                                onClick={() => router.push(`/${locale}/my-tickets`)}
                                            >
                                                My Tickets
                                            </Button>
                                            .
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <form onSubmit={handleTicketSubmit} className="space-y-4">
                                    <div className='space-y-2'>
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            value={ticketForm.subject}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Brief description of your issue"
                                            className='border border-dashed border-gray-400/50 rounded-md focus:outline-none transition-all'
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className='space-y-2'>
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={session?.user?.email || ''}
                                                placeholder="your@email.com"
                                                className='border border-dashed border-gray-400/50 rounded-md focus:outline-none'
                                                disabled
                                            />
                                        </div>

                                        <div className='space-y-2'>
                                            <Label htmlFor="phone">Phone Number *</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={ticketForm.phone}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="+84 912 345 678"
                                                className='border border-dashed border-gray-400/50 rounded-md focus:outline-none'
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className='space-y-2'>
                                            <Label htmlFor="category">Category *</Label>
                                            <Select
                                                name='category'
                                                value={ticketForm.category}
                                                onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}
                                                required
                                            >
                                                <SelectTrigger className="w-full h-10 px-3 py-2 text-foreground bg-background border border-dashed border-gray-400/50 rounded-md focus:outline-none">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="technical">Technical Support</SelectItem>
                                                    <SelectItem value="billing">Billing & Payment</SelectItem>
                                                    <SelectItem value="setup">Server Setup</SelectItem>
                                                    <SelectItem value="performance">Performance Issues</SelectItem>
                                                    <SelectItem value="security">Security Concerns</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className='space-y-2'>
                                            <Label htmlFor="priority">Priority</Label>
                                            <Select
                                                name='priority'
                                                value={ticketForm.priority}
                                                onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}
                                            >
                                                <SelectTrigger className="w-full h-10 px-3 py-2 text-foreground bg-background border border-dashed border-gray-400/50 rounded-md focus:outline-none">
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="urgent">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <Label htmlFor="description">Description *</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={ticketForm.description}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Please provide detailed information about your issue, including any error messages, steps to reproduce, and what you've already tried..."
                                            className='w-full border border-dashed border-gray-400/50 rounded-md focus:outline-none resize-y min-h-21 max-h-60 transition-all'
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-linear-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 hover:scale-101 transition-all"
                                        size="lg"
                                        disabled={submitStatus === 'loading'}
                                    >
                                        {submitStatus === 'loading' ? (
                                            <>
                                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Ticket'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* FAQ Tab */}
                    <TabsContent value="faq">
                        <Card className="animate-in fade-in zoom-in-95 duration-300">
                            <CardHeader>
                                <CardTitle>Frequently Asked Questions</CardTitle>
                                <CardDescription>
                                    Find quick answers to common questions about our VPS hosting services.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="border rounded-lg p-4">
                                                <Skeleton className="h-5 w-3/4 mb-2" />
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-5/6" />
                                            </div>
                                        ))}
                                        <div className="mt-8 p-6 bg-secondary rounded-lg">
                                            <Skeleton className="h-6 w-48 mb-2" />
                                            <Skeleton className="h-4 w-full mb-2" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Accordion type="single" collapsible className="w-full">
                                            {faqs.map((faq) => (
                                                <AccordionItem key={faq.id} value={`item-${faq.id}`}>
                                                    <AccordionTrigger className="text-left">
                                                        <div className="flex items-center space-x-2">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {faq.category}
                                                            </Badge>
                                                            <span>{faq.question}</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="text-sm text-muted-foreground">
                                                        {faq.answer}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>

                                        <div className="mt-8 p-6 bg-secondary rounded-lg">
                                            <h3 className="font-semibold mb-2">Still need help?</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                                            </p>
                                            <div className="flex space-x-2">
                                                <Button onClick={() => setActiveTab('chat')}>
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    Chat with AI
                                                </Button>
                                                <Button variant="outline" onClick={() => setActiveTab('ticket')}>
                                                    <HelpCircle className="mr-2 h-4 w-4" />
                                                    Submit Ticket
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default SupportPage;
