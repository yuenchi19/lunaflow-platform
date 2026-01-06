
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    id: string; // Product ID
    name: string;
    price: number;
    image?: string;
    quantity: number;
    stock: number; // Max available
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalAmount: number;
    totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('lunaflow_cart');
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load cart", e);
            }
        }
    }, []);

    // save to local storage on change
    useEffect(() => {
        localStorage.setItem('lunaflow_cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (product: any, quantity: number) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                // Update quantity, capping at stock
                const newQuantity = Math.min(existing.quantity + quantity, product.stock);
                return prev.map(i => i.id === product.id ? { ...i, quantity: newQuantity } : i);
            } else {
                return [...prev, {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    stock: product.stock,
                    quantity: Math.min(quantity, product.stock)
                }];
            }
        });
    };

    const removeFromCart = (productId: string) => {
        setItems(prev => prev.filter(i => i.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        setItems(prev => prev.map(i => {
            if (i.id === productId) {
                // Ensure quantity is valid
                const validQ = Math.max(1, Math.min(quantity, i.stock));
                return { ...i, quantity: validQ };
            }
            return i;
        }));
    };

    const clearCart = () => setItems([]);

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
}
