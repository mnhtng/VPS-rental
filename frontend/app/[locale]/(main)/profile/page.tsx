'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
    User,
    Shield,
    Bell,
    CreditCard,
    Key,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Edit,
    Save,
    X
} from 'lucide-react';

const ProfilePage = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        marketing: true,
        security: true
    });

    // Mock user data - replace with actual user data from API
    const [userInfo, setUserInfo] = useState({
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+84 901 234 567',
        address: '123 Main Street, District 1, Ho Chi Minh City',
        joinedDate: '2024-01-15',
        avatar: '',
        role: 'user'
    });

    const handleSave = () => {
        // API call to save user info
        setIsEditing(false);
    };

    const handleCancel = () => {
        // Reset form data
        setIsEditing(false);
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">User Profile</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account information and settings
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2">
                            <div className='space-y-1.5'>
                                <CardTitle>Personal Information</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Update your personal information
                                </p>
                            </div>
                            <Button
                                variant={isEditing ? "destructive" : "default"}
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? (
                                    <>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </>
                                ) : (
                                    <>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </>
                                )}
                            </Button>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="w-20 h-20">
                                    <AvatarImage src={userInfo.avatar} />
                                    <AvatarFallback className='dark:bg-gray-700'>
                                        {userInfo.fullName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-medium">{userInfo.fullName}</h3>
                                        <Badge variant="secondary">{userInfo.role}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Member since {new Date(userInfo.joinedDate).toLocaleDateString('en-US')}
                                    </p>
                                </div>
                            </div>

                            <Separator className='bg-gradient-to-r from-transparent via-gray-400 to-transparent' />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="fullName"
                                            value={userInfo.fullName}
                                            disabled={!isEditing}
                                            onChange={(e) =>
                                                setUserInfo({ ...userInfo, fullName: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="flex items-center space-x-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={userInfo.email}
                                            disabled={!isEditing}
                                            onChange={(e) =>
                                                setUserInfo({ ...userInfo, email: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="flex items-center space-x-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            value={userInfo.phone}
                                            disabled={!isEditing}
                                            onChange={(e) =>
                                                setUserInfo({ ...userInfo, phone: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="joinedDate">Join Date</Label>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="joinedDate"
                                            value={new Date(userInfo.joinedDate).toLocaleDateString('en-US')}
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <div className="flex items-start space-x-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-3" />
                                        <Textarea
                                            id="address"
                                            value={userInfo.address}
                                            disabled={!isEditing}
                                            onChange={(e) =>
                                                setUserInfo({ ...userInfo, address: e.target.value })
                                            }
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex justify-end space-x-2">
                                    <Button variant="ghost" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSave}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Update your password to secure your account
                            </p>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input id="currentPassword" type="password" className='border border-dashed border-muted-foreground/50' />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" type="password" className='border border-dashed border-muted-foreground/50' />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input id="confirmPassword" type="password" className='border border-dashed border-muted-foreground/50' />
                            </div>
                            <Button>
                                <Key className="h-4 w-4 mr-2" />
                                Update Password
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ProfilePage;