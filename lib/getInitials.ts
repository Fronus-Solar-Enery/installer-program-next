/**
 * Utility functions for the application
 */

/**
 * Extracts initials from a name (up to 2 characters)
 * @param name - The full name to extract initials from
 * @returns The uppercase initials (maximum 2 characters)
 */
export const getInitials = (name: string): string => {
    if (!name) return '';

    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

// Export additional utility functions below