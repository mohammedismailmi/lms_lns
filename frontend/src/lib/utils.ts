import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Deep merges Tailwind CSS classes, resolving conflicts safely.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
