'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import AuthForm from './auth-form';
import { Button } from './ui/button';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted) return null;
    if (!isVisible && !isOpen) return null;

    // Portal content to document.body to break out of Header stacking context
    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                } bg-black/50 backdrop-blur-sm`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} // Inline style safety net
        >
            <div
                className={`relative w-full max-w-md bg-white rounded-xl shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                {/* Close Button */}
                <div className="absolute top-4 right-4 z-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-slate-500 hover:bg-slate-100 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <AuthForm />
            </div>
        </div>,
        document.body
    );
}
