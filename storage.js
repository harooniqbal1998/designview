// storage.js

const STORAGE_KEY = 'screenshots';

export function saveScreenshot(screenshot) {
    try {
        const screenshots = getAllScreenshots();
        screenshots.push({
            ...screenshot,
            id: Date.now(), // Unique identifier
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(screenshots));
        return true;
    } catch (error) {
        console.error('Error saving screenshot:', error);
        return false;
    }
}

export function getAllScreenshots() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting screenshots:', error);
        return [];
    }
}

export function getScreenshotById(id) {
    try {
        const screenshots = getAllScreenshots();
        return screenshots.find(screenshot => screenshot.id === id);
    } catch (error) {
        console.error('Error getting screenshot by id:', error);
        return null;
    }
}

export function deleteScreenshot(id) {
    try {
        const screenshots = getAllScreenshots();
        const updatedScreenshots = screenshots.filter(screenshot => screenshot.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScreenshots));
        return true;
    } catch (error) {
        console.error('Error deleting screenshot:', error);
        return false;
    }
}

export function clearAllScreenshots() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing screenshots:', error);
        return false;
    }
} 