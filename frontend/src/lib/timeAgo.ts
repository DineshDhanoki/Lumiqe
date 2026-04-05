/**
 * Shared time-ago utility. Accepts either an ISO date string (from API responses)
 * or a numeric timestamp (from localStorage).
 */
export function timeAgo(dateOrTimestamp: string | number): string {
    const then =
        typeof dateOrTimestamp === 'string'
            ? new Date(dateOrTimestamp).getTime()
            : dateOrTimestamp;
    const seconds = Math.floor((Date.now() - then) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(then).toLocaleDateString();
}
