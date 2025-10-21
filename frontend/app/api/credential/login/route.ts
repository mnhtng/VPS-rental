import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMIT_CONFIGS, createRateLimitMiddleware, resetRateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/schema';

// Create rate limit middleware for login
const loginRateLimit = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.LOGIN);

export async function POST(request: NextRequest) {
    try {
        // Check rate limit first
        const rateLimitResponse = await loginRateLimit(request);
        if (rateLimitResponse) {
            return rateLimitResponse; // Return rate limit error
        }

        const body = await request.json();

        // Validate input
        const result = loginSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({
                success: false,
                message: 'Validation failed',
                errors: result.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { email, password } = result.data;

        // Attempt authentication with NextAuth
        try {
            // In a real implementation, you would validate credentials here
            // For now, this is a mock implementation

            // Mock authentication logic
            if (email === 'admin@vps.com' && password === 'admin123') {
                // Successful login - reset rate limit for this IP
                await resetRateLimit(request, RATE_LIMIT_CONFIGS.LOGIN, email);

                return NextResponse.json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        user: {
                            id: '1',
                            email: email,
                            name: 'Admin User',
                            role: 'admin'
                        },
                        redirectUrl: '/admin'
                    }
                });
            } else if (email.includes('@') && password.length >= 6) {
                // Mock customer login
                await resetRateLimit(request, RATE_LIMIT_CONFIGS.LOGIN, email);

                return NextResponse.json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        user: {
                            id: '2',
                            email: email,
                            name: 'Customer User',
                            role: 'customer'
                        },
                        redirectUrl: '/dashboard'
                    }
                });
            } else {
                // Invalid credentials - rate limit will apply automatically
                return NextResponse.json({
                    success: false,
                    message: 'Invalid email or password',
                    error: {
                        code: 'INVALID_CREDENTIALS'
                    }
                }, { status: 401 });
            }

        } catch (authError) {
            console.error('Authentication error:', authError);
            return NextResponse.json({
                success: false,
                message: 'Authentication failed',
                error: {
                    code: 'AUTH_ERROR'
                }
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal server error'
        }, { status: 500 });
    }
}
