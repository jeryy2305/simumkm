import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
    size?: "sm" | "md" | "lg";
    className?: string;
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = "primary",
    size = "md",
    className = "",
    fullWidth = false,
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
        secondary: "bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
        outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
