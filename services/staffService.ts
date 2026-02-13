
import firebase from "../lib/firebase";
import { db } from "../lib/firebase";
import { UserProfile, UserRole } from "../types";
import { sendStaffEmail } from "./emailService";

const COLLECTION_NAME = "users";

// Helper to get restaurant name
const getRestaurantName = async (restaurantId: string): Promise<string> => {
    try {
        const rDoc = await db.collection("users").doc(restaurantId).get();
        if (rDoc.exists) {
            const data = rDoc.data();
            return data?.restaurantName || data?.displayName || "The Restaurant";
        }
    } catch(e) {}
    return "The Restaurant";
};

export const getStaffMembers = async (restaurantId: string): Promise<UserProfile[]> => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME).where("employerId", "==", restaurantId).get();
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
    const restaurantName = await getRestaurantName(restaurantId);
    
    // 1. Check if user exists by email
    const snapshot = await db.collection(COLLECTION_NAME).where("email", "==", email).get();

    let newUser: UserProfile;
    let isNewUser = false;

    if (!snapshot.empty) {
      // User exists - Update role to STAFF
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data() as UserProfile;

      if (userData.role === UserRole.RESTAURANT) {
        return { success: false, message: "This email belongs to another restaurant owner." };
      }

      await db.collection(COLLECTION_NAME).doc(userDoc.id).update({
        role: UserRole.STAFF,
        employerId: restaurantId,
        permissions: permissions,
        isStaffBlocked: false
      });

      newUser = { ...userData, role: UserRole.STAFF, employerId: restaurantId, permissions };
    } else {
      isNewUser = true;
      // Create Invitation
      const newUid = `invite_${Date.now()}`;
      const inviteData: Partial<UserProfile> = {
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

      await db.collection(COLLECTION_NAME).doc(newUid).set(inviteData);
      newUser = inviteData as UserProfile;
    }

    // EMAIL: Only sent here (Create/Invite time)
    await sendStaffEmail({
        to_email: email,
        to_name: name,
        subject: `Welcome to ${restaurantName}`,
        message: isNewUser 
            ? `You have been invited to join the staff at ${restaurantName}. Since you don't have an account yet, please click the button below to create your password and set up your account.`
            : `You have been added to the staff team at ${restaurantName}. You can now log in to the dashboard to access your new workspace.`,
        action_url: `${window.location.origin}/#/`,
        action_text: isNewUser ? "Create Password & Account" : "Login to Dashboard"
    });

    return { success: true, message: "Invitation sent successfully.", newUser };

  } catch (error: any) {
    console.error("Error inviting staff:", error);
    return { success: false, message: error.message || "Failed to invite staff." };
  }
};

export const updateStaffPermissions = async (staffUid: string, permissions: string[]): Promise<boolean> => {
  try {
    await db.collection(COLLECTION_NAME).doc(staffUid).update({ permissions });
    return true;
  } catch (error) {
    console.error("Error updating permissions:", error);
    return false;
  }
};

export const toggleStaffBlock = async (staffUid: string, isBlocked: boolean): Promise<boolean> => {
  try {
    await db.collection(COLLECTION_NAME).doc(staffUid).update({ isStaffBlocked: isBlocked });
    return true;
  } catch (error) {
    console.error("Error toggling block:", error);
    return false;
  }
};

export const removeStaff = async (staffUid: string): Promise<boolean> => {
  try {
    const userDocRef = db.collection(COLLECTION_NAME).doc(staffUid);
    const userSnap = await userDocRef.get();
    
    if (!userSnap.exists) {
        return true; 
    }

    if (staffUid.startsWith('invite_')) {
        // Hard delete for pending invites
        await userDocRef.delete();
    } else {
        // Soft delete for real users (downgrade to customer)
        // Ensure we are using the firestore namespace from the initialized module
        await userDocRef.update({
            role: UserRole.CUSTOMER,
            employerId: firebase.firestore.FieldValue.delete(), 
            permissions: firebase.firestore.FieldValue.delete(),
            isStaffBlocked: firebase.firestore.FieldValue.delete()
        });
    }
    
    return true;
  } catch (error) {
    console.error("Error removing staff:", error);
    return false;
  }
};
