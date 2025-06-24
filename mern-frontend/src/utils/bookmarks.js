const BOOKMARK_STORAGE_KEY = "Social Shield_bookmarks";
const FOLDER_STORAGE_KEY = "Social Shield_bookmark_folders";

export const getBookmarks = () => {
    const bookmarksJson = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    return bookmarksJson ? JSON.parse(bookmarksJson) : [];
};

export const addBookmark = (analysisData) => {
    const bookmarks = getBookmarks();
    const timestamp = new Date().toISOString();

    // Ensure all required fields are present
    const bookmarkItem = {
        ...analysisData,
        id: analysisData.id,
        subject: analysisData.subject || "No Subject",
        sender: analysisData.from || analysisData.sender || "Unknown Sender",
        from: analysisData.from || analysisData.sender || "Unknown Sender",
        date: analysisData.date || new Date().toLocaleString(),
        score: analysisData.score || 0,
        threat: analysisData.prediction === "Suspicious" || analysisData.threat === true,
        sentiment: analysisData.sentiment || "Neutral",
        prediction: analysisData.prediction || (analysisData.threat ? "Suspicious" : "Safe"),
        suspicious_factors: analysisData.suspicious_factors || [],
        safety_factors: analysisData.safety_factors || [],
        body: analysisData.body || "",
        headers: analysisData.headers || [],
        bookmarked_at: timestamp,
        // Use the provided folder or set to null
        folder: analysisData.folder || null,
    };

    // console.log("Saving bookmark to folder:", bookmarkItem.folder);

    // Check if already exists
    const existingIndex = bookmarks.findIndex(b => b.id === analysisData.id);
    if (existingIndex >= 0) {
        bookmarks[existingIndex] = bookmarkItem;
    } else {
        bookmarks.push(bookmarkItem);
    }

    localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
    return bookmarkItem;
};

export const removeBookmark = (id) => {
    const bookmarks = getBookmarks();
    const filteredBookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
    localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(filteredBookmarks));
};

export const isBookmarked = (id) => {
    const bookmarks = getBookmarks();
    return bookmarks.some(bookmark => bookmark.id === id);
};

export const createBookmarkFolder = (folderName) => {
    const foldersJson = localStorage.getItem(FOLDER_STORAGE_KEY) || "[]";
    const folders = JSON.parse(foldersJson);

    if (!folders.includes(folderName)) {
        folders.push(folderName);
        localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(folders));
    }

    return folders;
};

export const moveBookmarkToFolder = (id, folderName) => {
    const bookmarks = getBookmarks();
    const bookmarkIndex = bookmarks.findIndex(b => b.id === id);

    if (bookmarkIndex >= 0) {
        bookmarks[bookmarkIndex].folder = folderName;
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
    }

    return bookmarks;
};

export const deleteBookmarkFolder = (folderName) => {
    // Get all folders
    const foldersJson = localStorage.getItem(FOLDER_STORAGE_KEY) || "[]";
    const folders = JSON.parse(foldersJson);

    // Remove the folder from the list
    const updatedFolders = folders.filter(folder => folder !== folderName);
    localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(updatedFolders));

    // Set any bookmarks from the deleted folder to null folder
    const bookmarks = getBookmarks();
    let modified = false;

    bookmarks.forEach(bookmark => {
        if (bookmark.folder === folderName) {
            bookmark.folder = null;
            modified = true;
        }
    });

    if (modified) {
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
    }

    return updatedFolders;
}; 