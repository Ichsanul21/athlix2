export function Skeleton({ className = '' }) {
    return (
        <div
            className={`animate-pulse rounded-xl bg-neutral-200/80 dark:bg-neutral-800/80 ${className}`}
            aria-hidden="true"
        />
    );
}
