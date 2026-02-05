
import { ref, deleteObject } from "firebase/storage";
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
    // ref() can create a reference directly from the full HTTPS URL
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
    console.log("Old file deleted from storage");
  } catch (error: any) {
    // If the object is not found (404), it might have already been deleted. 
    // We log it but don't throw to prevent blocking the main flow.
    if (error.code !== 'storage/object-not-found') {
      console.warn("Error deleting file from storage:", error);
    }
  }
};
