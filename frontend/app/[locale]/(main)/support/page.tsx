'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
    RefreshCw
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
        answer: 'We accept QR code banking, MoMo wallet, and VNPay (credit/debit cards). All payments are processed securely.',
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
    'support': 'Our support team is available 24/7 via live chat, email (support@vpsrental.com), and phone (+1-234-567-8900). What specific issue can I help you with?',
    'backup': 'We provide automated daily backups for all plans. You can also create manual backups from your dashboard. Backups are stored securely and can be restored with one click.',
    'setup': 'VPS setup typically takes 5-10 minutes after payment. You\'ll receive login credentials via email. Need help with initial server configuration?',
    'payment': 'We accept QR code banking, MoMo wallet, and VNPay. All payments are secure and processed instantly.',
    'refund': 'We offer a 30-day money-back guarantee for new customers. Contact support to process your refund request.',
    'upgrade': 'You can upgrade your VPS plan anytime from your dashboard. Upgrades are processed immediately with prorated billing.',
    'default': 'I\'m not sure about that specific question. Let me connect you with our human support team who can provide detailed assistance. You can also browse our FAQ section below.'
};

const SupportPage = () => {
    const [activeTab, setActiveTab] = useState('chat');
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
        email: '',
        phone: '',
        category: '',
        priority: 'medium',
        description: ''
    });
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
        setSubmitStatus('loading');

        // Mock form submission
        await new Promise(resolve => setTimeout(resolve, 2000));

        setSubmitStatus('success');
        setTicketForm({ subject: '', email: '', phone: '', category: '', priority: 'medium', description: '' });

        setTimeout(() => setSubmitStatus('idle'), 3000);
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
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                        Support Center
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Get help with your VPS hosting needs
                    </p>
                </div>

                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card>
                        <CardContent className="text-center p-6">
                            <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                            <h3 className="font-semibold mb-2">Live Chat</h3>
                            <p className="text-sm text-muted-foreground mb-3">Chat with our AI assistant or human support agents</p>
                            <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">Available 24/7</Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="text-center p-6">
                            <Mail className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                            <h3 className="font-semibold mb-2">Email Support</h3>
                            <p className="text-sm text-muted-foreground mb-3">support@vpsrental.com</p>
                            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">Response within 2 hours</Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="text-center p-6">
                            <Phone className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                            <h3 className="font-semibold mb-2">Phone Support</h3>
                            <p className="text-sm text-muted-foreground mb-3">+1 (234) 567-8900</p>
                            <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">24/7 Emergency</Badge>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="chat">AI Chat Support</TabsTrigger>
                        <TabsTrigger value="ticket">Submit Ticket</TabsTrigger>
                        <TabsTrigger value="faq">FAQ</TabsTrigger>
                    </TabsList>

                    {/* AI Chat Tab */}
                    <TabsContent value="chat">
                        <Card>
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
                                                className="text-xs"
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
                                <div className="flex items-center space-x-2">
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
                                        className="border border-dashed focus:border-none border-gray-300 resize-none max-h-50 h-5"
                                    />
                                    <Button
                                        variant="ghost"
                                        onClick={handleSendMessage}
                                        disabled={!currentMessage.trim()}
                                        className="aspect-square h-16 p-0 flex items-center justify-center rounded-2xl"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Support Ticket Tab */}
                    <TabsContent value="ticket">
                        <Card>
                            <CardHeader>
                                <CardTitle>Submit Support Ticket</CardTitle>
                                <CardDescription>
                                    Need personalized help? Submit a ticket and our expert support team will respond within 2 hours.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {submitStatus === 'success' && (
                                    <Alert className="mb-6">
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Your support ticket has been submitted successfully! We&apos;ll respond via email within 2 hours.
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
                                            className='border border-dashed border-gray-400/50 rounded-md focus:outline-none'
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className='space-y-2'>
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={ticketForm.email}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="your@email.com"
                                                className='border border-dashed border-gray-400/50 rounded-md focus:outline-none'
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
                                            className='w-full border border-dashed border-gray-400/50 rounded-md focus:outline-none resize-y min-h-21 max-h-60'
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={submitStatus === 'loading'}
                                    >
                                        {submitStatus === 'loading' ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Frequently Asked Questions</CardTitle>
                                <CardDescription>
                                    Find quick answers to common questions about our VPS hosting services.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
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
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default SupportPage;
