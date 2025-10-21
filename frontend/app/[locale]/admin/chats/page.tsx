"use client"

import React, { useState, useRef } from 'react'
import { MessageCircle, User, Clock, ChevronRight, Users, MessagesSquare, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import Stepper, { Step, StepperRef } from '@/components/ui/stepper';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { AnimatedScrollList } from '@/components/ui/animate-list';
import { cn } from '@/lib/utils';

// Types
interface ChatUser {
    id: string;
    name: string;
    avatar?: string;
    lastSeen?: Date;
    isOnline?: boolean;
}

interface ChatConversation {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    unreadCount?: number;
    messages: ChatMessage[];
}

interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
}

const ChatPage = () => {

    const { resolvedTheme } = useTheme();

    const stepperRef = useRef<StepperRef>(null);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);

    // Mock data
    const users: ChatUser[] = [
        { id: '1', name: 'Alice Johnson h hdfshdkfh skdhfk sjhdfk hsdkfh skdhfk sjhdfkjhs kdfhkshdfk hsdhfwioueyhro', isOnline: true, lastSeen: new Date() },
        { id: '2', name: 'Bob Smith', isOnline: false, lastSeen: new Date(Date.now() - 3600000) },
        { id: '3', name: 'Charlie Brown', isOnline: true, lastSeen: new Date() },
        { id: '4', name: 'Diana Prince', isOnline: false, lastSeen: new Date(Date.now() - 2938749827300) },
    ];

    const conversations: Record<string, ChatConversation[]> = {
        '1': [
            {
                id: 'conv1',
                title: 'Project Discussion about the project and the team of the project sdafhsdkfh shdfk jshkdfh kshdfk hsdf',
                lastMessage: 'Thanks for the update! I am going to the gym now. I will be back in 2 hours. The ball is jh asljdl jasd oqaujoei qoweo iqowe opqowepoiqpwioepq oiwepoiq pwiepqiwep',
                timestamp: new Date(Date.now() - 1800000),
                unreadCount: 2,
                messages: [
                    { id: 'msg1', content: 'Hi, how is the project going?', sender: 'user', timestamp: new Date(Date.now() - 3600000) },
                    { id: 'msg2', content: 'Going well! Almost finished with the first milestone.', sender: 'assistant', timestamp: new Date(Date.now() - 3000000) },
                    { id: 'msg3', content: 'That&apos;s great to hear!', sender: 'user', timestamp: new Date(Date.now() - 2400000) },
                    { id: 'msg4', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg5', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg6', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg7', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg8', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg9', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg10', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg11', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg12', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg13', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg14', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg15', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg16', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                    { id: 'msg17', content: 'Thanks for the update!', sender: 'user', timestamp: new Date(Date.now() - 1800000) },
                ]
            },
            {
                id: 'conv2',
                title: 'General Chat',
                lastMessage: 'See you tomorrow!',
                timestamp: new Date(Date.now() - 86400000),
                messages: [
                    { id: 'msg5', content: 'How was your weekend?', sender: 'assistant', timestamp: new Date(Date.now() - 172800000) },
                    { id: 'msg6', content: 'It was great, thanks for asking!', sender: 'user', timestamp: new Date(Date.now() - 86400000) },
                ]
            }
        ],
        '2': [
            {
                id: 'conv3',
                title: 'Technical Support',
                lastMessage: 'Issue resolved',
                timestamp: new Date(Date.now() - 7200000),
                messages: [
                    { id: 'msg7', content: 'I&apos;m having trouble with the login', sender: 'user', timestamp: new Date(Date.now() - 10800000) },
                    { id: 'msg8', content: 'Let me help you with that', sender: 'assistant', timestamp: new Date(Date.now() - 9000000) },
                    { id: 'msg9', content: 'Issue resolved', sender: 'assistant', timestamp: new Date(Date.now() - 7200000) },
                ]
            }
        ],
        '3': [
            {
                id: 'conv4',
                title: 'Feedback Session',
                lastMessage: 'Thank you for your feedback',
                timestamp: new Date(Date.now() - 172800000),
                messages: [
                    { id: 'msg10', content: 'The new feature looks great!', sender: 'user', timestamp: new Date(Date.now() - 259200000) },
                    { id: 'msg11', content: 'Thank you for your feedback', sender: 'assistant', timestamp: new Date(Date.now() - 172800000) },
                ]
            }
        ],
        '4': []
    };

    const formatTime = (date: Date): string => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const handleUserClick = (user: ChatUser) => {
        setSelectedUser(user);
        setSelectedConversation(null); // Reset conversation when selecting new user
        // Automatically go to step 2
        stepperRef.current?.goToStep(2);
    };

    const handleConversationClick = (conversation: ChatConversation) => {
        setSelectedConversation(conversation);
        // Automatically go to step 3
        stepperRef.current?.goToStep(3);
    };

    const handleStepChange = (step: number) => {
        // Reset states when going back to previous steps
        if (step === 1) {
            setSelectedUser(null);
            setSelectedConversation(null);
        } else if (step === 2) {
            setSelectedConversation(null);
        }
    };

    const handleFinalStepCompleted = () => {
        setSelectedUser(null);
        setSelectedConversation(null);
        stepperRef.current?.goToStep(1);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-1 sm:px-2 md:px-4" >
            <Stepper
                ref={stepperRef}
                onStepChange={handleStepChange}
                onFinalStepCompleted={handleFinalStepCompleted}
                containerClassName="p-2 sm:p-3 md:p-6 lg:p-8"
                contentClassName="min-h-[400px] sm:min-h-[500px]"
                hideNavigationButtons={true}
                disableStepClick={false}
            >
                {/* Step 1: Users List */}
                <Step className="space-y-6">
                    {users.length > 0 ? (
                        <>
                            <div className="text-center mb-4 sm:mb-6 md:mb-8">
                                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-2 sm:mb-4">
                                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                                </div>

                                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Choose a User</h3>
                                <p className="text-sm sm:text-base text-muted-foreground px-2">Click on a user to view their conversations and chat history</p>
                            </div>

                            <div className="grid gap-1 sm:gap-2 md:gap-3 lg:gap-4 max-w-4xl mx-auto w-full">
                                {users.map((user, index) => (
                                    <motion.div
                                        key={user.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                        onClick={() => handleUserClick(user)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 p-2 sm:p-3 md:p-4 lg:p-6 rounded-lg sm:rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] w-full min-w-0">
                                            <div className="relative shrink-0">
                                                <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                                                    <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600" />
                                                </div>

                                                {user.isOnline && (
                                                    <div className="absolute bottom-0 -right-0 h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 rounded-full bg-green-500 border-2 border-background"></div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm sm:text-base md:text-lg mb-1 truncate block max-w-30 sm:max-w-[200px] lg:max-w-sm">{user.name}</h4>

                                                <div className="text-xs text-muted-foreground">
                                                    {user.isOnline ? (
                                                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>

                                                            <span className="hidden sm:inline">Online now</span>
                                                            <span className="sm:hidden">Online</span>
                                                        </span>
                                                    ) : (
                                                        <span className="truncate block max-w-30 text-xs">{`Last seen ${formatTime(user.lastSeen || new Date())}`}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-600 mb-1">
                                                    {conversations[user.id]?.length || 0}
                                                </div>

                                                <div className="text-xs text-muted-foreground hidden sm:block">conversations</div>
                                                <div className="text-xs text-muted-foreground sm:hidden">chats</div>
                                            </div>

                                            <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 sm:py-12 md:py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4 sm:mb-6">
                                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                            </div>

                            <h4 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 px-4">No users found</h4>
                            <p className="text-sm sm:text-base text-muted-foreground px-4">Please create an account to start chatting.</p>
                        </div>
                    )}
                </Step>

                {/* Step 2: Conversations List */}
                <Step className="space-y-6">
                    {selectedUser ? (
                        <>
                            {conversations[selectedUser.id]?.length > 0 ? (
                                <>
                                    <div className="text-center mb-4 sm:mb-6 md:mb-8">
                                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full mb-2 sm:mb-4">
                                            <MessagesSquare className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                                        </div>

                                        <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
                                            Conversations with {selectedUser.name}
                                        </h3>
                                        <p className="text-sm sm:text-base text-muted-foreground px-2">Click on a conversation to view detailed messages</p>
                                    </div>

                                    <div className="grid gap-1 sm:gap-2 md:gap-3 lg:gap-4 max-w-4xl mx-auto w-full">
                                        {conversations[selectedUser.id].map((conversation, index) => (
                                            <motion.div
                                                key={conversation.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                                onClick={() => handleConversationClick(conversation)}
                                                className="group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 p-2 sm:p-3 md:p-4 lg:p-6 rounded-lg sm:rounded-xl border-2 border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] w-full min-w-0">
                                                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300 shrink-0">
                                                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-purple-600" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-start gap-1 sm:gap-2 md:gap-3 mb-1 sm:mb-2 md:mb-3 min-w-0">
                                                            <h4 className="font-semibold text-sm sm:text-base md:text-lg truncate block max-w-30 sm:max-w-[250px] lg:max-w-md flex-1 min-w-0">{conversation.title}</h4>

                                                            {conversation.unreadCount && conversation.unreadCount > 0 && (
                                                                <Badge className="rounded-full bg-red-500 text-xs font-bold text-white animate-pulse shrink-0">
                                                                    {conversation.unreadCount}
                                                                    <span className="hidden sm:inline">new</span>
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <p className="truncate block max-w-40 sm:max-w-[300px] lg:max-w-md text-muted-foreground mb-1 sm:mb-2md:mb-3 text-xs sm:text-sm md:text-base">{conversation.lastMessage}</p>

                                                        <div className="flex items-center justify-start gap-1 sm:gap-2 md:gap-4 text-xs text-muted-foreground min-w-0">
                                                            <div className="flex items-center gap-1 min-w-0">
                                                                <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400 shrink-0" />
                                                                <span className="truncate block max-w-30 text-xs">{formatTime(conversation.timestamp)}</span>
                                                            </div>

                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <MessageCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                                <span className="hidden sm:inline text-xs">{conversation.messages.length} messages</span>
                                                                <span className="sm:hidden text-xs">{conversation.messages.length}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                        <ChevronRight className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 sm:py-12 md:py-16">
                                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4 sm:mb-6">
                                        <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                                    </div>

                                    <h4 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 px-4">No conversations yet</h4>
                                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
                                        {selectedUser.name} hasn&apos;t started any conversations.
                                        Check back later or invite them to chat!
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 sm:py-12 md:py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4 sm:mb-6">
                                <User className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 px-4">No user selected</h4>
                            <p className="text-sm sm:text-base text-muted-foreground px-4">Please go back and select a user first.</p>
                        </div>
                    )}
                </Step>

                {/* Step 3: Message Details */}
                <Step className="space-y-6">
                    {selectedConversation ? (
                        <>
                            <div className="text-center mb-4 sm:mb-6 md:mb-8">
                                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-2 sm:mb-4">
                                    <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                                </div>

                                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 px-2">
                                    {selectedConversation.title}
                                </h3>
                                <p className="text-sm sm:text-base text-muted-foreground px-2">
                                    <span className="font-bold text-lg">
                                        {selectedConversation.messages.length}
                                    </span>
                                    {" "}
                                    messages in this conversation of
                                    {" "}
                                    <span className="font-bold text-lg">
                                        {selectedUser?.name}
                                    </span>
                                </p>
                            </div>

                            <AnimatedScrollList
                                showGradients={true}
                                showScrollbar={false}
                                maxHeight="max-h-80 sm:max-h-96 md:max-h-[70vh]"
                            >
                                {selectedConversation.messages.map((message, index) => (
                                    <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} w-full min-w-0 mb-2 sm:mb-3 md:mb-4`}>
                                        <div
                                            className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] min-w-0 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 ${message.sender === 'user'
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                                                : 'bg-foreground text-background shadow-lg shadow-foreground/25'
                                                }`}
                                        >
                                            <div className="mb-1 sm:mb-2 flex items-center justify-between gap-1 sm:gap-2 text-xs opacity-75 min-w-0">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    {message.sender === 'user' ? (
                                                        <User className="size-3 sm:size-4 shrink-0" />
                                                    ) : (
                                                        <Bot className="size-3 sm:size-4 shrink-0" />
                                                    )}

                                                    <span className="capitalize font-medium text-xs">{message.sender}</span>
                                                </div>

                                                <span className={cn(
                                                    "text-xs shrink-0",
                                                    message.sender === 'user' ? 'text-[#28ff37]' : resolvedTheme === 'dark' ? 'text-[#ff0000]' : 'text-[#ffa2a2]'
                                                )}>
                                                    {formatTime(message.timestamp)}
                                                </span>
                                            </div>

                                            <div className="text-xs sm:text-sm leading-relaxed break-words">{message.content}</div>
                                        </div>
                                    </div>
                                ))}
                            </AnimatedScrollList>

                            {/* Completion Action */}
                            <div className="text-center mt-4 sm:mt-6 md:mt-8">
                                <motion.button
                                    onClick={handleFinalStepCompleted}
                                    className="px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 text-sm sm:text-base"
                                    whileHover={{ y: -2, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="hidden sm:inline">🎉 Complete Chat Review</span>
                                    <span className="sm:hidden">🎉 Complete</span>
                                </motion.button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 sm:py-12 md:py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4 sm:mb-6">
                                <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                            </div>

                            <h4 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 px-4">No conversation selected</h4>
                            <p className="text-sm sm:text-base text-muted-foreground px-4">Please go back and select a conversation first.</p>
                        </div>
                    )}
                </Step>
            </Stepper>
        </div >
    )
};

export default ChatPage;
