
import { storage } from "../lib/firebase";

/**
 * Deletes a file from Firebase Storage using its Download URL.
 * It safely ignores external URLs (e.g., mock data placeholders).
 */
export const deleteFileFromUrl = async (url: string | undefined | null) => {
  if (!url) return;

  // Safety check: Only attempt to delete files hosted on Firebase Storage
  if (!url.includes('firebasestorage.googleapis.com')) {
    return;
  }

  try {
    // storage.refFromURL() is a v8 convenience method
    const fileRef = storage.refFromURL(url);
    await fileRef.delete();
    console.log("Old file deleted from storage");
  } catch (error: any) {
    // If the object is not found (404), it might have already been deleted. 
    // We log it but don't throw to prevent blocking the main flow.
    if (error.code !== 'storage/object-not-found') {
      console.warn("Error deleting file from storage:", error);
    }
  }
};
