'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    User,
    Shield,
    Key,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Edit,
    Save,
    X
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Profile } from '@/types/types';

const ProfilePage = () => {
    const { data: session } = useSession();

    const [userInfo, setUserInfo] = useState<Profile | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (session && session.user) {
            setUserInfo({
                name: session.user.name as string,
                email: session.user.email as string,
                phone: session.user?.phone as string,
                address: session.user?.address as string,
                joinedDate: session.user.created_at || '',
                avatar: session.user.image || '',
                role: session.user.role || 'USER'
            });
        }
    }, [session]);

    const handleSave = () => {
        // API call to save user info
        setIsEditing(false);
    };

    const handleCancel = () => {
        // Reset form data
        setIsEditing(false);
    };

    return (
        <div className="min-h-screen max-w-4xl mx-auto py-8 px-4">
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
                    <Card className='relative group'>
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        {/* Top-left corner with gradient fade */}
                        <div className="absolute top-0 left-0 w-40 h-40 pointer-events-none">
                            {/* Vertical border - bright at top, fade down */}
                            <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-primary via-primary/50 to-transparent
                                          transition-all duration-500 group-hover:from-purple-400 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                            {/* Horizontal border - bright at left, fade right */}
                            <div className="absolute top-0 left-0 h-[3px] w-full bg-gradient-to-r from-primary via-primary/50 to-transparent
                                          transition-all duration-500 group-hover:from-purple-400 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                            {/* Corner glow */}
                            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent blur-xl
                                          transition-all duration-500 group-hover:from-purple-400/30 group-hover:w-28 group-hover:h-28" />
                        </div>

                        {/* Bottom-right corner with gradient fade */}
                        <div className="absolute bottom-0 right-0 w-40 h-40 pointer-events-none">
                            {/* Vertical border - bright at bottom, fade up */}
                            <div className="absolute bottom-0 right-0 w-[3px] h-full bg-gradient-to-t from-primary via-primary/50 to-transparent
                                          transition-all duration-500 group-hover:from-purple-400 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                            {/* Horizontal border - bright at right, fade left */}
                            <div className="absolute bottom-0 right-0 h-[3px] w-full bg-gradient-to-l from-primary via-primary/50 to-transparent
                                          transition-all duration-500 group-hover:from-purple-400 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                            {/* Corner glow */}
                            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-primary/20 via-primary/10 to-transparent blur-xl
                                          transition-all duration-500 group-hover:from-purple-400/30 group-hover:w-28 group-hover:h-28" />
                        </div>

                        <CardHeader className="flex flex-row items-center justify-between gap-2 relative z-10">
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

                        <CardContent className="space-y-6 relative z-10">
                            <div className="flex items-center space-x-4">
                                <Avatar className="w-20 h-20">
                                    <AvatarImage src={userInfo?.avatar} />
                                    <AvatarFallback className='dark:bg-gray-700'>
                                        {userInfo?.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-medium">{userInfo?.name}</h3>
                                        <Badge variant="secondary">{userInfo?.role}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Member since {userInfo?.joinedDate ? new Date(userInfo.joinedDate).toLocaleDateString('en-US') : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <Separator className='bg-gradient-to-r from-transparent via-gray-400 to-transparent' />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            name="name"
                                            value={userInfo?.name}
                                            placeholder='N/A'
                                            disabled={!isEditing}
                                            onChange={(e) =>
                                                userInfo && setUserInfo({ ...userInfo, name: e.target.value })
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
                                            name="email"
                                            type="email"
                                            value={userInfo?.email}
                                            placeholder='N/A'
                                            disabled={!isEditing}
                                            onChange={(e) =>
                                                userInfo && setUserInfo({ ...userInfo, email: e.target.value })
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
                                            name="phone"
                                            type="tel"
                                            value={userInfo?.phone}
                                            placeholder='N/A'
                                            disabled={!isEditing}
                                            onChange={(e) =>
                                                userInfo && setUserInfo({ ...userInfo, phone: e.target.value })
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
                                            name="joinedDate"
                                            placeholder='N/A'
                                            value={userInfo?.joinedDate ? new Date(userInfo.joinedDate).toLocaleDateString('en-US') : ''}
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
                                            name="address"
                                            value={userInfo?.address}
                                            placeholder='N/A'
                                            disabled={!isEditing}
                                            onChange={(e) =>
                                                userInfo && setUserInfo({ ...userInfo, address: e.target.value })
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
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    className='border border-dashed border-muted-foreground/50'
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    className='border border-dashed border-muted-foreground/50'
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className='border border-dashed border-muted-foreground/50'
                                />
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