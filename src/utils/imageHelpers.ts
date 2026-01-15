/**
 * Transforms various image URLs into direct displayable URLs.
 * Specifically handles Google Drive sharing links.
 */
export const getOptimizedImageUrl = (url?: string): string | undefined => {
    if (!url) return undefined;

    // Handle Google Drive URLs
    // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    // Format 2: https://drive.google.com/open?id=FILE_ID

    // Regex to extract the ID
    // Matches file/d/ID or id=ID
    const driveRegex = /(?:file\/d\/|id=)([a-zA-Z0-9_-]+)/;
    const match = url.match(driveRegex);

    if (match && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
        const fileId = match[1];
        if (fileId) {
            // Use the thumbnail endpoint which is more reliable for embedding than "uc?export=view"
            // sz=w500 requests a width of 500px (good for avatars)
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;
        }
    }

    return url;
};
