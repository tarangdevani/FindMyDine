
import { collection, query, where, getDocs, updateDoc, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, UserRole } from "../types";

const COLLECTION_NAME = "users";

export const getStaffMembers = async (restaurantId: string): Promise<UserProfile[]> => {
  try {
    // Fetch users who have employerId == restaurantId
    // Note: Requires index on 'employerId'
    const q = query(
      collection(db, COLLECTION_NAME),
      where("employerId", "==", restaurantId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
};

export const inviteStaffMember = async (
  restaurantId: string, 
  email: string, 
  name: string, 
  permissions: string[]
): Promise<{ success: boolean; message: string; newUser?: UserProfile }> => {
  try {
    // 1. Check if user exists by email
    const q = query(collection(db, COLLECTION_NAME), where("email", "==", email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // User exists - Update role to STAFF
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data() as UserProfile;

      // Prevent poaching other restaurant staff/owners
      if (userData.role === UserRole.RESTAURANT) {
        return { success: false, message: "This email belongs to another restaurant owner." };
      }

      await updateDoc(doc(db, COLLECTION_NAME, userDoc.id), {
        role: UserRole.STAFF,
        employerId: restaurantId,
        permissions: permissions,
        isStaffBlocked: false
      });

      return { success: true, message: "Existing user added as staff.", newUser: { ...userData, role: UserRole.STAFF, employerId: restaurantId, permissions } };
    } else {
      // User does not exist - Create placeholder "Invited" user
      // In a real app, this would trigger an email via Cloud Functions
      // For this demo, we create a doc so it shows in the list.
      const newUid = `invite_${Date.now()}`; // Temporary ID until they sign up
      const newUser: Partial<UserProfile> = {
        uid: newUid,
        email: email,
        displayName: name,
        role: UserRole.STAFF,
        employerId: restaurantId,
        permissions: permissions,
        invitationStatus: 'pending',
        isStaffBlocked: false,
        createdAt: new Date().toISOString()
      };

      // Use setDoc to create with custom ID if needed, or addDoc
      await setDoc(doc(db, COLLECTION_NAME, newUid), newUser);

      // Construct Invite Link (Mock)
      const inviteLink = `${window.location.origin}/#/set-password?email=${encodeURIComponent(email)}`;
      
      console.log(`[MOCK EMAIL SERVICE] Sending invite to ${email}: ${inviteLink}`);

      return { success: true, message: "Invitation sent to email.", newUser: newUser as UserProfile };
    }
  } catch (error: any) {
    console.error("Error inviting staff:", error);
    return { success: false, message: error.message || "Failed to invite staff." };
  }
};

export const updateStaffPermissions = async (staffUid: string, permissions: string[]): Promise<boolean> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, staffUid), { permissions });
    return true;
  } catch (error) {
    console.error("Error updating permissions:", error);
    return false;
  }
};

export const toggleStaffBlock = async (staffUid: string, isBlocked: boolean): Promise<boolean> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, staffUid), { isStaffBlocked: isBlocked });
    return true;
  } catch (error) {
    console.error("Error toggling block:", error);
    return false;
  }
};

export const removeStaff = async (staffUid: string): Promise<boolean> => {
  try {
    // If it was a pending invite, delete the doc completely
    if (staffUid.startsWith('invite_')) {
        await deleteDoc(doc(db, COLLECTION_NAME, staffUid));
    } else {
        // If it was a real user, revert to customer
        await updateDoc(doc(db, COLLECTION_NAME, staffUid), {
            role: UserRole.CUSTOMER,
            employerId: null, // Remove link
            permissions: null,
            isStaffBlocked: null
        });
    }
    return true;
  } catch (error) {
    console.error("Error removing staff:", error);
    return false;
  }
};
