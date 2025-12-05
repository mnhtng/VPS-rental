"use client"

import useProduct from "@/hooks/useProduct"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

interface CartContextProps {
    cartItemsAmount: number
    refreshCart: () => Promise<void>
    incrementCart: () => void
    decrementCart: () => void
    setCartAmount: (amount: number) => void
    isLoading: boolean
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

export const CartProvider = ({
    children
}: {
    children: React.ReactNode
}) => {
    const [cartItemsAmount, setCartItemsAmount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const { getCartItemsAmount } = useProduct()
    const { data: session, status } = useSession()

    const refreshCart = useCallback(async () => {
        if (status !== 'authenticated' || !session?.user) {
            setCartItemsAmount(0)
            return
        }

        try {
            setIsLoading(true)

            const result = await getCartItemsAmount()

            if (result.error) {
                return
            }

            setCartItemsAmount(result.data?.total_items || 0)
        } catch {
            return
        } finally {
            setIsLoading(false)
        }
    }, [getCartItemsAmount, session?.user, status])

    const incrementCart = useCallback(() => {
        setCartItemsAmount(prev => prev + 1)
    }, [])

    const decrementCart = useCallback(() => {
        setCartItemsAmount(prev => Math.max(0, prev - 1))
    }, [])

    const setCartAmount = useCallback((amount: number) => {
        setCartItemsAmount(Math.max(0, amount))
    }, [])

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            refreshCart()
        } else if (status === 'unauthenticated') {
            setCartItemsAmount(0)
        }
    }, [status, session?.user, refreshCart])

    return (
        <CartContext.Provider value={{
            cartItemsAmount,
            refreshCart,
            incrementCart,
            decrementCart,
            setCartAmount,
            isLoading
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)

    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }

    return context
}