export function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  const variants = {
    primary: 'bg-brand-primary hover:bg-brand-600 text-white shadow-md shadow-brand-primary/10',
    secondary: 'bg-surface-700 hover:bg-surface-600 text-gray-800 dark:text-white border border-surface-650 transition-colors',
    ghost: 'bg-transparent hover:bg-surface-700 text-gray-650 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors',
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
