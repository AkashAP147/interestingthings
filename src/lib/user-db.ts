import { database } from './firebase';

export interface User {
  id: string;
  contact: string; // email or phone
  verified: boolean;
  likes: string[]; // array of discovery IDs
  shares: string[]; // array of discovery IDs
  followers?: string[]; // array of user IDs
  following?: string[]; // array of user IDs
  joinedAt: string;
  passwordHash?: string;
  name?: string;
  username?: string;
  profilePicture?: string;
  phone?: string;
  role?: string;
  activityDates?: string[];
  streakCount?: number;
  curiosityPoints?: number;
  bio?: string;
  encryptedPrivateKey?: string; // stringified JSON object
  publicKey?: string;
  lastActiveAt?: string;
  location?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: 'follow' | 'like';
  read: boolean;
  createdAt: string;
  discoveryId?: string;
}

const COLLECTION = 'users';

export async function readUsersDB(): Promise<User[]> {
  try {
    const snapshot = await database.ref(COLLECTION).once('value');
    const data = snapshot.val() || {};
    return Object.keys(data).map(key => data[key] as User);
  } catch (error) {
    console.error("Failed to read users DB:", error);
    return [];
  }
}

export async function writeUsersDB(users: User[]): Promise<void> {
  // Not used in Firebase implementation
}

export async function findOrCreateUser(contact: string): Promise<User> {
  const snapshot = await database.ref(COLLECTION).orderByChild('contact').equalTo(contact).limitToFirst(1).once('value');
  const data = snapshot.val();
  if (data) {
    const key = Object.keys(data)[0];
    return data[key] as User;
  }

  const newUser: User = {
    id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    contact,
    verified: false,
    likes: [],
    shares: [],
    joinedAt: new Date().toISOString()
  };

  await database.ref(`${COLLECTION}/${newUser.id}`).set(newUser);
  return newUser;
}

export async function getUserByIdentifier(identifier: string): Promise<User | null> {
  try {
    let snapshot = await database.ref(COLLECTION).orderByChild('contact').equalTo(identifier).limitToFirst(1).once('value');
    let data = snapshot.val();
    if (data) {
      const key = Object.keys(data)[0];
      return data[key] as User;
    }
    
    const username = identifier.startsWith('@') ? identifier.slice(1) : identifier;
    snapshot = await database.ref(COLLECTION).orderByChild('username').equalTo(username).limitToFirst(1).once('value');
    data = snapshot.val();
    if (data) {
      const key = Object.keys(data)[0];
      return data[key] as User;
    }
    
    return null;
  } catch (error) {
    console.error("Error in getUserByIdentifier", error);
    return null;
  }
}

export async function syncFirebaseUser(uid: string, contact: string, name?: string): Promise<User> {
  const docRef = database.ref(`${COLLECTION}/${uid}`);
  const docSnap = await docRef.once('value');
  
  if (docSnap.exists()) {
    const user = docSnap.val() as User;
    if (name && !user.name) {
      await docRef.update({ name });
      return { ...user, name };
    }
    return user;
  }
  
  let finalContact = contact;
  let username = undefined;

  if (contact.endsWith("@timit.app")) {
    username = contact.replace("@timit.app", "");
    finalContact = ""; 
  }
  
  const newUser: any = {
    id: uid,
    contact: finalContact,
    verified: true,
    likes: [],
    shares: [],
    joinedAt: new Date().toISOString(),
    role: "user",
    activityDates: [],
    streakCount: 0,
    curiosityPoints: 10,
  };
  
  if (username) newUser.username = username;
  if (name) newUser.name = name;

  await docRef.set(newUser);
  return newUser as User;
}

export async function verifyUser(id: string): Promise<User | null> {
  const docRef = database.ref(`${COLLECTION}/${id}`);
  const docSnap = await docRef.once('value');
  if (!docSnap.exists()) return null;
  
  await docRef.update({ verified: true });
  const updatedSnap = await docRef.once('value');
  return updatedSnap.val() as User;
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const docSnap = await database.ref(`${COLLECTION}/${id}`).once('value');
    if (!docSnap.exists()) return null;
    return docSnap.val() as User;
  } catch (error) {
    console.error("Error in getUserById", error);
    return null;
  }
}

export async function isUsernameTaken(username: string, currentUserId: string): Promise<boolean> {
  if (!username) return false;
  try {
    const snapshot = await database.ref(COLLECTION).orderByChild('username').equalTo(username).once('value');
    const data = snapshot.val();
    if (!data) return false;
    return Object.keys(data).some(key => key !== currentUserId);
  } catch (error) {
    console.error("Error in isUsernameTaken", error);
    return false;
  }
}

export async function updateUserProfile(id: string, updates: Partial<User>): Promise<User | null> {
  try {
    const docRef = database.ref(`${COLLECTION}/${id}`);
    const docSnap = await docRef.once('value');
    if (!docSnap.exists()) return null;

    await docRef.update(updates);
    
    const updatedSnap = await docRef.once('value');
    return updatedSnap.val() as User;
  } catch (error) {
    console.error("Error in updateUserProfile", error);
    return null;
  }
}

import { FieldValue } from 'firebase-admin/firestore';

export async function toggleLike(userId: string, discoveryId: string): Promise<{ liked: boolean; user: User | null }> {
  const userRef = database.ref(`users/${userId}`);
  const discoverySavesRef = database.ref(`discoveries/${discoveryId}/saves`);

  try {
    let liked = false;
    let finalUser: User | null = null;
    
    await userRef.transaction((user) => {
      if (user) {
        if (!user.likes) user.likes = [];
        const likeIndex = user.likes.indexOf(discoveryId);
        if (likeIndex === -1) {
          user.likes.push(discoveryId);
          liked = true;
        } else {
          user.likes.splice(likeIndex, 1);
          liked = false;
        }
        finalUser = user;
      }
      return user; // Write back to DB
    });
    
    if (finalUser) {
      await discoverySavesRef.transaction((currentSaves) => {
        return (currentSaves || 0) + (liked ? 1 : -1);
      });
    }
    
    if (finalUser && liked) {
      // Create notification for the discovery owner
      const discoverySnap = await database.ref(`discoveries/${discoveryId}`).once('value');
      const discovery = discoverySnap.val();
      if (discovery && discovery.authorId && discovery.authorId !== userId) {
        await createNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: discovery.authorId,
          actorId: userId,
          type: 'like',
          read: false,
          createdAt: new Date().toISOString(),
          discoveryId
        });
      }
    }
    
    return { liked, user: finalUser };
  } catch (error) {
    console.error("Like transaction failed: ", error);
    return { liked: false, user: null };
  }
}

export async function toggleFollow(currentUserId: string, targetUserId: string): Promise<{ following: boolean }> {
  if (currentUserId === targetUserId) return { following: false };

  const currentUserRef = database.ref(`users/${currentUserId}`);
  const targetUserRef = database.ref(`users/${targetUserId}`);

  try {
    let isFollowing = false;
    
    await currentUserRef.transaction((user) => {
      if (user) {
        if (!user.following) user.following = [];
        const followIndex = user.following.indexOf(targetUserId);
        if (followIndex === -1) {
          user.following.push(targetUserId);
          isFollowing = true;
        } else {
          user.following.splice(followIndex, 1);
          isFollowing = false;
        }
      }
      return user;
    });

    await targetUserRef.transaction((user) => {
      if (user) {
        if (!user.followers) user.followers = [];
        const followerIndex = user.followers.indexOf(currentUserId);
        if (isFollowing && followerIndex === -1) {
          user.followers.push(currentUserId);
        } else if (!isFollowing && followerIndex !== -1) {
          user.followers.splice(followerIndex, 1);
        }
      }
      return user;
    });

    if (isFollowing) {
      await createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: targetUserId,
        actorId: currentUserId,
        type: 'follow',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return { following: isFollowing };
  } catch (error) {
    console.error("Follow transaction failed: ", error);
    return { following: false };
  }
}

export async function createNotification(notification: Notification): Promise<void> {
  await database.ref(`notifications/${notification.userId}/${notification.id}`).set(notification);
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const snapshot = await database.ref(`notifications/${userId}`).orderByChild('createdAt').once('value');
    const data = snapshot.val();
    if (!data) return [];
    
    // Convert to array and sort descending
    return Object.values(data).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) as Notification[];
  } catch (error) {
    console.error("Failed to get notifications", error);
    return [];
  }
}

export async function markNotificationsRead(userId: string): Promise<void> {
  try {
    const snapshot = await database.ref(`notifications/${userId}`).orderByChild('read').equalTo(false).once('value');
    const unread = snapshot.val();
    if (!unread) return;

    const updates: any = {};
    for (const key of Object.keys(unread)) {
      updates[`${key}/read`] = true;
    }
    await database.ref(`notifications/${userId}`).update(updates);
  } catch (error) {
    console.error("Failed to mark notifications read", error);
  }
}

// Haversine formula to calculate distance in km between two lat/lng points
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export async function updateUserLocation(userId: string, lat: number, lng: number): Promise<void> {
  const docRef = database.ref(`${COLLECTION}/${userId}`);
  await docRef.update({
    location: {
      lat,
      lng,
      updatedAt: new Date().toISOString()
    }
  });
}

export interface FriendSuggestion {
  user: User;
  distanceKm?: number;
  mutualFollowers: number;
  score: number;
  reason: string;
}

export async function getFriendSuggestions(userId: string): Promise<FriendSuggestion[]> {
  const users = await readUsersDB();
  const currentUser = users.find(u => u.id === userId);
  
  if (!currentUser) return [];

  const currentUserFollowers = currentUser.followers || [];
  const currentUserFollowing = currentUser.following || [];
  
  const suggestions: FriendSuggestion[] = [];

  for (const otherUser of users) {
    if (otherUser.id === userId) continue;
    
    // Skip if we already follow them
    if (currentUserFollowing.includes(otherUser.id)) continue;
    
    // Skip if they are an admin or bot (optional filter, we can just skip based on role)
    // if (otherUser.role === 'admin') continue;

    let score = 0;
    let distanceKm: number | undefined = undefined;
    let mutualFollowers = 0;
    let reasons: string[] = [];

    // 1. Location-based matching
    if (currentUser.location && otherUser.location) {
      distanceKm = getDistanceFromLatLonInKm(
        currentUser.location.lat, currentUser.location.lng,
        otherUser.location.lat, otherUser.location.lng
      );
      
      // If within 60km, give points (closer = more points)
      if (distanceKm <= 60) {
        score += (60 - distanceKm) * 2; // up to 120 points for location
        reasons.push(distanceKm < 1 ? "Very close to you" : `${Math.round(distanceKm)}km away`);
      }
    }

    // 2. Mutual connections
    const otherUserFollowers = otherUser.followers || [];
    // Count how many people I follow that follow this person (mutuals)
    const mutuals = currentUserFollowing.filter(id => otherUserFollowers.includes(id));
    mutualFollowers = mutuals.length;
    
    if (mutualFollowers > 0) {
      score += mutualFollowers * 50; // heavily weight mutuals
      reasons.push(`${mutualFollowers} mutual connection${mutualFollowers > 1 ? 's' : ''}`);
    }
    
    // Require at least some reason to suggest them
    if (score > 0) {
      suggestions.push({
        user: otherUser,
        distanceKm,
        mutualFollowers,
        score,
        reason: reasons[0] || "Recommended for you"
      });
    }
  }

  // Sort by score descending and return top 10
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
}
