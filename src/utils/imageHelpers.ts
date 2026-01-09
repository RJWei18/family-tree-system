/**
 * Compresses an image file to a smaller size and returns a Base64 string.
 * Max width: 300px
 * Quality: 0.7
 */
export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.7 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/**
 * Converts a Google Drive sharing URL to a direct image link.
 * Supports standard sharing links: https://drive.google.com/file/d/Vk.../view\?usp\=sharing
 */
export const convertGoogleDriveLink = (url: string): string => {
    try {
        // Regex to extract File ID
        // Matches /file/d/FILE_ID/ or id=FILE_ID
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)\/|id=([a-zA-Z0-9_-]+)/);
        const fileId = match ? (match[1] || match[2]) : null;

        if (fileId) {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`; // Use thumbnail API for reliability
        }
    } catch (e) {
        console.warn('Invalid Google Drive URL', e);
    }
    return url;
};
