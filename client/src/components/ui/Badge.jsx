
/**
 * Badge Component
 * @param {string} variant - 'default' | 'outline' | 'secondary' | 'destructive' | 'success'
 */
export function Badge({ children, className = '', variant = 'default' }) {
    const variants = {
        default: "bg-indigo-100 text-indigo-700 border-transparent",
        secondary: "bg-slate-100 text-slate-700 border-transparent",
        outline: "text-slate-600 border-slate-200 bg-transparent border",
        destructive: "bg-red-100 text-red-700 border-transparent",
        success: "bg-emerald-100 text-emerald-700 border-transparent",
        warning: "bg-amber-100 text-amber-700 border-transparent",
    };

    const selectedVariant = variants[variant] || variants.default;

    return (
        <span
            className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
        ${selectedVariant} 
        ${className}
      `}
        >
            {children}
        </span>
    );
}