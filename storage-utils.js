// storage-utils.js

const STORAGE_PREFIX = 'screenshot_tool_';
const ESTIMATED_STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB in bytes

export function calculateTotalStorageUsed() {
    try {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            total += key.length + value.length;
        }
        return total;
    } catch (error) {
        console.error('Error calculating total storage:', error);
        return 0;
    }
}

export function calculateAppStorageUsed() {
    try {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(STORAGE_PREFIX)) {
                const value = localStorage.getItem(key);
                total += key.length + value.length;
            }
        }
        return total;
    } catch (error) {
        console.error('Error calculating app storage:', error);
        return 0;
    }
}

export function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getStoragePercentage(usedBytes) {
    return Math.min(100, Math.round((usedBytes / ESTIMATED_STORAGE_LIMIT) * 100));
}

export function getEstimatedStorageLimit() {
    return ESTIMATED_STORAGE_LIMIT;
}

export function isStorageAvailable() {
    try {
        const testKey = STORAGE_PREFIX + 'test';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.error('Storage is not available:', error);
        return false;
    }
}

export function getStorageStatusColor(percentage) {
    if (percentage < 50) return '#4CAF50'; // green
    if (percentage < 80) return '#FFC107'; // yellow
    return '#F44336'; // red
}

export function getStorageDetails() {
    const details = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(STORAGE_PREFIX)) {
            const value = localStorage.getItem(key);
            details.push({
                key,
                size: key.length + value.length,
                formattedSize: formatBytes(key.length + value.length)
            });
        }
    }
    return details;
} 