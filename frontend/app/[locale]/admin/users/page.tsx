"use client"

import { Button } from "@/components/ui/button"
import { Eye, EyeClosed, PlusIcon, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { colors } from "@/utils/color"
import { UserDataTable } from "@/components/custom/table/user-data-table"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { useEffect, useState } from "react"
import { toast } from "sonner"
import debounce from "@/utils/performanceUtil/debounce"
import { normalizeString } from "@/utils/string"
import { UserDataType } from "@/types/data-table-types"

interface Validation {
    error: string
    loading: boolean
}

interface PasswordVisibleProps {
    element: string
    isVisible: boolean
}

const dataFile = [
    {
        "id": '1123121',
        "name": "Eddie Lake",
        "email": "alex@gmail.com",
        "role": "admin",
        "provider": "Google",
        "createdAt": "2023-10-01T12:34:56Z",
        "status": "online",
    },
    {
        "id": '1123122',
        "name": "Alex Johnson",
        "email": "stadj@gmail.com",
        "role": "user",
        "provider": "Github",
        "createdAt": "2023-10-02T14:20:30Z",
        "status": "offline",
    },
    {
        "id": '1123123',
        "name": "Maria Smith",
        "email": "maria.smith@example.com",
        "role": "user",
        "provider": "Email",
        "createdAt": "2023-10-03T09:15:00Z",
        "status": "online",
    },
    {
        "id": '1123124',
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "moderator",
        "provider": "Google",
        "createdAt": "2023-10-04T16:45:10Z",
        "status": "offline",
    },
    {
        "id": '1123125',
        "name": "Eddie Lake",
        "email": "alex@gmail.com",
        "role": "admin",
        "provider": "Google",
        "createdAt": "2023-10-01T12:34:56Z",
        "status": "online",
    },
    {
        "id": '1123126',
        "name": "Alex Johnson",
        "email": "stadj@gmail.com",
        "role": "user",
        "provider": "Github",
        "createdAt": "2023-10-02T14:20:30Z",
        "status": "offline",
    },
    {
        "id": '1123127',
        "name": "Maria Smith",
        "email": "maria.smith@example.com",
        "role": "user",
        "provider": "Email",
        "createdAt": "2023-10-03T09:15:00Z",
        "status": "online",
    },
    {
        "id": '1123128',
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "moderator",
        "provider": "Google",
        "createdAt": "2023-10-04T16:45:10Z",
        "status": "offline",
    },
    {
        "id": '1123129',
        "name": "Eddie Lake",
        "email": "alex@gmail.com",
        "role": "admin",
        "provider": "Google",
        "createdAt": "2023-10-01T12:34:56Z",
        "status": "online",
    },
    {
        "id": '1123130',
        "name": "Alex Johnson",
        "email": "stadj@gmail.com",
        "role": "user",
        "provider": "Github",
        "createdAt": "2023-10-02T14:20:30Z",
        "status": "offline",
    },
    {
        "id": '1123131',
        "name": "Maria Smith",
        "email": "maria.smith@example.com",
        "role": "user",
        "provider": "Email",
        "createdAt": "2023-10-03T09:15:00Z",
        "status": "online",
    },
    {
        "id": '1123112314',
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "moderator",
        "provider": "Google",
        "createdAt": "2023-10-04T16:45:10Z",
        "status": "offline",
    },
    {
        "id": '11231221',
        "name": "Eddie Lake",
        "email": "alex@gmail.com",
        "role": "admin",
        "provider": "Google",
        "createdAt": "2023-10-01T12:34:56Z",
        "status": "online",
    },
    {
        "id": '11234234122',
        "name": "Alex Johnson",
        "email": "stadj@gmail.com",
        "role": "user",
        "provider": "Github",
        "createdAt": "2023-10-02T14:20:30Z",
        "status": "offline",
    },
    {
        "id": '11231623',
        "name": "Maria Smith",
        "email": "maria.smith@example.com",
        "role": "user",
        "provider": "Email",
        "createdAt": "2023-10-03T09:15:00Z",
        "status": "online",
    },
    {
        "id": '11231274',
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "moderator",
        "provider": "Google",
        "createdAt": "2023-10-04T16:45:10Z",
        "status": "offline",
    },
    {
        "id": '112318821',
        "name": "Eddie Lake",
        "email": "alex@gmail.com",
        "role": "admin",
        "provider": "Google",
        "createdAt": "2023-10-01T12:34:56Z",
        "status": "online",
    },
    {
        "id": '112312222',
        "name": "Alex Johnson",
        "email": "stadj@gmail.com",
        "role": "user",
        "provider": "Github",
        "createdAt": "2023-10-02T14:20:30Z",
        "status": "offline",
    },
    {
        "id": '113423123',
        "name": "Maria Smith",
        "email": "maria.smith@example.com",
        "role": "user",
        "provider": "Email",
        "createdAt": "2023-10-03T09:15:00Z",
        "status": "online",
    },
    {
        "id": '112355124',
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "moderator",
        "provider": "Google",
        "createdAt": "2023-10-04T16:45:10Z",
        "status": "offline",
    },
    {
        "id": '112312331',
        "name": "Eddie Lake",
        "email": "alex@gmail.com",
        "role": "admin",
        "provider": "Google",
        "createdAt": "2023-10-01T12:34:56Z",
        "status": "online",
    },
    {
        "id": '112312232',
        "name": "Alex Johnson",
        "email": "stadj@gmail.com",
        "role": "user",
        "provider": "Github",
        "createdAt": "2023-10-02T14:20:30Z",
        "status": "offline",
    },
    {
        "id": '112312233',
        "name": "Maria Smith",
        "email": "maria.smith@example.com",
        "role": "user",
        "provider": "Email",
        "createdAt": "2023-10-03T09:15:00Z",
        "status": "online",
    },
    {
        "id": '1123123424',
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "moderator",
        "provider": "Google",
        "createdAt": "2023-10-04T16:45:10Z",
        "status": "offline",
    },
    {
        "id": '11231',
        "name": "Eddie Lake",
        "email": "alex@gmail.com",
        "role": "admin",
        "provider": "Google",
        "createdAt": "2023-10-01T12:34:56Z",
        "status": "online",
    },
    {
        "id": '112122',
        "name": "Alex Johnson",
        "email": "stadj@gmail.com",
        "role": "user",
        "provider": "Github",
        "createdAt": "2023-10-02T14:20:30Z",
        "status": "offline",
    },
    {
        "id": '11233123',
        "name": "Maria Smith",
        "email": "maria.smith@example.com",
        "role": "user",
        "provider": "Email",
        "createdAt": "2023-10-03T09:15:00Z",
        "status": "online",
    },
    {
        "id": '11231sd24',
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "moderator",
        "provider": "Google",
        "createdAt": "2023-10-04T16:45:10Z",
        "status": "offline",
    },
]

export default function UsersPage() {
    const [users, setUsers] = useState<UserDataType[]>([])
    const [validation, setValidation] = useState<Validation>({
        error: "",
        loading: false
    })
    const [passwordVisible, setPasswordVisible] = useState<PasswordVisibleProps[]>([])

    const handleTogglePassword = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const passwordInput = e.currentTarget.parentElement?.querySelector('input')?.name

        const currentPasswordVisible = passwordVisible.find(pv => pv.element === passwordInput)

        if (!(currentPasswordVisible?.element === passwordInput)) {
            setPasswordVisible(prevState => [
                ...prevState.filter(pv => pv.element !== passwordInput),
                { element: passwordInput || "", isVisible: true }
            ])
            return
        }

        if (currentPasswordVisible?.isVisible === false) {
            setPasswordVisible(prevState => [
                ...prevState.filter(pv => pv.element !== passwordInput),
                { element: passwordInput || "", isVisible: true }
            ])
            return
        }

        setPasswordVisible(prevState => [
            ...prevState.filter(pv => pv.element !== passwordInput),
            { element: passwordInput || "", isVisible: false }
        ])
    }

    const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as string;

        try {
            setValidation((prev) => {
                return {
                    ...prev,
                    error: "",
                    loading: true
                }
            })

            console.log('Adding user:', { name, email, password, role })
            toast.success('User added successfully!')
        } catch {
            setValidation({
                error: 'Failed to add user. Please try again.',
                loading: false
            })

            toast.error('Failed to add user. Please try again.')
        } finally {
            setValidation((prev) => {
                return {
                    ...prev,
                    error: "",
                    loading: false
                }
            })
        }
    }

    useEffect(() => {
        if (dataFile) {
            setUsers(dataFile as UserDataType[])
        }
    }, [])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = normalizeString(e.target.value)

        if (!query) {
            setUsers(dataFile as UserDataType[])
            return
        }

        const filteredData = dataFile.filter(user => {
            return (
                normalizeString(user.name).includes(query) ||
                normalizeString(user.email).includes(query) ||
                normalizeString(user.role).includes(query) ||
                normalizeString(user.provider).includes(query) ||
                normalizeString(user.createdAt).includes(query) ||
                normalizeString(user.status).includes(query)
            )
        })

        setUsers(filteredData as UserDataType[])
    }

    return (
        <>
            <div className="flex flex-col lg:flex-row justify-between items-center gap-5 mb-4">
                <div className="relative lg:w-1/2 w-full h-max">
                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />

                    <Input
                        id="search-users"
                        name="search-users"
                        type="search"
                        placeholder="Search users..."
                        className="md:pr-10 pr-8"
                        onChange={debounce(handleSearch, 500)}
                    />
                </div>

                <div className="flex justify-between items-center gap-4 md:gap-2 w-full lg:w-auto">
                    <div className={cn(
                        "flex items-center gap-2 p-2 rounded-lg",
                        colors.green.active
                    )}>
                        <div className="relative">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                        </div>

                        <span className={cn(
                            "text-sm font-medium",
                            colors.green.text
                        )}>
                            4 users online
                        </span>
                    </div>

                    {/* Ađ new user */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="default"
                                size="sm"
                            >
                                <PlusIcon />
                                <span>Add User</span>
                            </Button>
                        </SheetTrigger>

                        <SheetContent
                            side="right"
                            onInteractOutside={e => {
                                e.preventDefault()
                            }}
                            className="flex flex-col z-1000"
                        >
                            <SheetHeader className="gap-1">
                                <SheetTitle>Add User</SheetTitle>

                                <SheetDescription>
                                    Fill out the form below to add a new user. Make sure to provide all the required information.
                                </SheetDescription>
                            </SheetHeader>

                            <Separator />

                            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 text-sm">
                                <form
                                    onSubmit={handleAddUser}
                                    className="flex flex-1 h-full"
                                >
                                    <div className="flex flex-1 flex-col justify-between items-stretch gap-4 overflow-y-auto p-4 text-sm">
                                        <div className="flex flex-col gap-4 flex-1">
                                            <div className="flex flex-col gap-3">
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    placeholder="User name..."
                                                    required
                                                    disabled={validation.loading}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="User email..."
                                                    required
                                                    disabled={validation.loading}
                                                />
                                            </div>

                                            <div className="relative flex flex-col gap-3">
                                                <Label htmlFor="password">Password</Label>
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type={passwordVisible.find(pv => pv.element === 'password')?.isVisible ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    className="pr-10"
                                                    required
                                                    disabled={validation.loading}
                                                />
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    type='button'
                                                    className='absolute top-[50%] right-0 -translate-y-1 cursor-pointer'
                                                    onClick={(e) => handleTogglePassword(e)}
                                                >
                                                    {passwordVisible.find(pv => pv.element === 'password')?.isVisible ?
                                                        <Eye size={20} />
                                                        :
                                                        <EyeClosed size={20} />
                                                    }
                                                </Button>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <Label htmlFor="role">Role</Label>

                                                <Select name="role" disabled={validation.loading}>
                                                    <SelectTrigger id="role" className="w-full">
                                                        <SelectValue placeholder="Select a role..." />
                                                    </SelectTrigger>

                                                    <SelectContent className="z-1001">
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="user">User</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <SheetFooter className="mt-auto flex flex-col gap-4 md:flex-row px-0">
                                            <Button
                                                type="submit"
                                                className="flex-1 w-full"
                                                disabled={validation.loading}
                                            >
                                                Submit
                                            </Button>

                                            <SheetClose asChild>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 w-full"
                                                    disabled={validation.loading}
                                                >
                                                    Cancel
                                                </Button>
                                            </SheetClose>
                                        </SheetFooter>
                                    </div>
                                </form>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="relative mb-4">
                <UserDataTable
                    initialData={users}
                />
            </div>
        </>
    )
} 