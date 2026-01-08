import React from 'react'

export function LoadingSpinner({ size = 'md', text = '' }) {
    const sizeClasses = {
        sm: 'spinner-sm',
        md: 'spinner-md',
        lg: 'spinner-lg'
    }

    return (
        <div className="loading-container">
            <div className={`spinner ${sizeClasses[size]}`}>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    )
}

export function LoadingOverlay({ text = 'Processing...' }) {
    return (
        <div className="loading-overlay">
            <div className="loading-overlay-content">
                <LoadingSpinner size="lg" />
                <p className="loading-overlay-text">{text}</p>
            </div>
        </div>
    )
}

export function SkeletonLoader({ width = '100%', height = '20px', variant = 'text' }) {
    const variantClass = variant === 'circle' ? 'skeleton-circle' : variant === 'rect' ? 'skeleton-rect' : 'skeleton-text'

    return (
        <div
            className={`skeleton ${variantClass}`}
            style={{ width, height }}
        />
    )
}

export function CardSkeleton() {
    return (
        <div className="skeleton-card">
            <SkeletonLoader height="180px" variant="rect" />
            <div className="skeleton-card-body">
                <SkeletonLoader width="60%" height="24px" />
                <SkeletonLoader width="100%" height="16px" />
                <SkeletonLoader width="80%" height="16px" />
            </div>
        </div>
    )
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
    return (
        <div className="table-skeleton">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="table-skeleton-row">
                    {Array.from({ length: cols }).map((_, j) => (
                        <SkeletonLoader key={j} width={`${100 / cols - 2}%`} height="16px" />
                    ))}
                </div>
            ))}
        </div>
    )
}

export function ButtonLoading({ loading, children, ...props }) {
    return (
        <button {...props} disabled={loading || props.disabled}>
            {loading ? (
                <>
                    <span className="btn-spinner"></span>
                    <span className="ms-2">Processing...</span>
                </>
            ) : children}
        </button>
    )
}
