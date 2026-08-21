"use server";

import { updateDiscoveryStatus, deleteDiscovery } from "@/lib/db";
import { findOrCreateUser, verifyUser, toggleLike, getUserByIdentifier, isUsernameTaken, updateUserProfile } from "@/lib/user-db";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { auth, database } from "@/lib/firebase";
import crypto from "crypto";

export async function approveDiscovery(id: string) {
  await updateDiscoveryStatus(id, "published");
  revalidateTag("discoveries-v2" as any, undefined as any);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/discover");
  return { success: true };
}

export async function rejectDiscovery(id: string) {
  await deleteDiscovery(id);
  revalidateTag("discoveries-v2" as any, undefined as any);
  revalidatePath("/admin");
  return { success: true };
}

export async function getTrendingDiscoveriesAction() {
  const { getTrendingDiscoveries } = await import("@/lib/data");
  return await getTrendingDiscoveries();
}

export async function getUserEncryptedPrivateKeyAction(uid: string) {
  const { getUserByIdentifier } = await import("@/lib/user-db");
  const userDb = await getUserByIdentifier(uid);
  return userDb?.encryptedPrivateKey || null;
}

export async function getNotificationsAction() {
  const { getNotifications, readUsersDB } = await import("@/lib/user-db");
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_user")?.value;
  if (!userId) return { success: false, notifications: [] };
  
  const notifications = (await getNotifications(userId)).filter((n: any) => n.type !== 'message');
  
  const allUsers = await readUsersDB();
  
  const enriched = notifications.map((n: any) => {
    if (n.actorId) {
       const actor = allUsers.find(u => u.id === n.actorId);
       if (actor) {
         return { ...n, actorName: actor.name || actor.username || "Someone", actorUsername: actor.username || null };
       }
    }
    return { ...n, actorName: "Someone" };
  });
  
  return { success: true, notifications: enriched };
}

export async function markNotificationsReadAction() {
  const { markNotificationsRead } = await import("@/lib/user-db");
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_user")?.value;
  if (!userId) return { success: false };
  
  await markNotificationsRead(userId);
  return { success: true };
}

export async function getRandomDiscoveryAction() {
  const { getRandomDiscovery } = await import("@/lib/data");
  return await getRandomDiscovery();
}

export async function deleteDiscoveryAction(id: string) {
  await deleteDiscovery(id);
  revalidateTag("discoveries-v2" as any, undefined as any);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/discover");
  return { success: true };
}

export async function syncAuthTokenAction(idToken: string | null) {
  const cookieStore = await cookies();
  if (!idToken) {
    cookieStore.delete("auth_user");
    return { success: true };
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBiceHC3KNNDpNhRQGBzLH8qmxwd7os-VQ";
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || "Invalid token");
    }
    
    const data = await res.json();
    const user = data.users[0];
    const decoded = { uid: user.localId, email: user.email, name: user.displayName, phoneNumber: user.phoneNumber };
    
    const { syncFirebaseUser } = await import("@/lib/user-db");
    await syncFirebaseUser(decoded.uid, decoded.email || decoded.phoneNumber || "unknown", decoded.name);

    cookieStore.set("auth_user", decoded.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return { success: true };
  } catch (error: any) {
    console.error("Token verification failed", error);
    return { success: false, error: `Authentication failed: ${error.message || 'Unknown server error'}` };
  }
}



export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_user");
  return { success: true };
}

export async function getCurrentUserAction() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_user")?.value;
  if (!userId) return null;
  const { getUserById } = await import("@/lib/user-db");
  return await getUserById(userId);
}

export async function toggleLikeAction(discoveryId: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_user")?.value;
  if (!userId) throw new Error("Unauthorized");
  
  const result = await toggleLike(userId, discoveryId);
  revalidatePath("/");
  revalidatePath("/discover");
  return result;
}

export async function toggleFollowAction(targetUserId: string) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) throw new Error("Unauthorized");
  
  const { toggleFollow } = await import("@/lib/user-db");
  const result = await toggleFollow(currentUserId, targetUserId);
  
  // Revalidate paths where follow state might be shown
  revalidateTag('connections' as any, undefined as any);
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/profile/[username]`, "page");
  
  return result;
}

export async function manualAddDiscoveryAction(formData: FormData) {
  const title = formData.get("title") as string;
  const url = formData.get("url") as string;
  const description = formData.get("description") as string;
  const categoryId = formData.get("categoryId") as string;
  
  if (!title || !url || !categoryId) return { success: false, error: "Missing fields" };
  
  const { addDiscovery } = await import("@/lib/db");
  
  const newDiscovery = {
    id: `man-${Date.now()}`,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    description: description.substring(0, 150) + (description.length > 150 ? "..." : ""),
    content: description,
    categoryId,
    imageUrl: `https://image.thum.io/get/width/1200/crop/800/${url}`,
    sourceUrl: url,
    tags: ["manual"],
    score: 100,
    views: 0,
    saves: 0,
    shares: 0,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    status: "published" as const,
    featured: false
  };

  const added = await addDiscovery(newDiscovery);
  if (!added) {
    return { success: false, error: "This URL has already been added." };
  }
  
  revalidateTag("discoveries-v2" as any, undefined as any);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/discover");
  
  return { success: true };
}

export async function submitContactMessage(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;
  
  if (!name || !email || !message) return { success: false, error: "Missing fields" };
  
  const { database } = await import("@/lib/firebase");
  
  await database.ref("contactMessages").push({
    name,
    email,
    message,
    createdAt: new Date().toISOString(),
    status: "unread"
  });
  
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin");
  
  return { success: true };
}

export async function markMessageReadAction(id: string) {
  const { markMessageRead } = await import("@/lib/db");
  await markMessageRead(id);
  revalidatePath("/admin");
}

export async function updateUserProfileAction(formData: FormData) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_user")?.value;
  if (!userId) return { success: false, error: "Unauthorized" };

  const name = formData.get("name") as string || "";
  const username = formData.get("username") as string || "";
  const contact = formData.get("contact") as string || "";
  const phone = formData.get("phone") as string || "";
  const profilePicture = formData.get("profilePicture") as string || "";
  const bio = formData.get("bio") as string || "";

  if (username) {
    const taken = await isUsernameTaken(username, userId);
    if (taken) {
      return { success: false, error: "Username is already taken" };
    }
  }

  if (contact) {
    const existing = await getUserByIdentifier(contact);
    if (existing && existing.id !== userId) {
      return { success: false, error: "Contact (email/phone) is already used by another account" };
    }
  }

  const updates = {
    name,
    username,
    contact,
    phone,
    profilePicture,
    bio,
  };

  const user = await updateUserProfile(userId, updates);
  if (!user) {
    return { success: false, error: "User not found" };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true, user };
}

export async function trackDailyActivityAction() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_user")?.value;
  if (!userId) return { success: false };

  const { getUserById, updateUserProfile } = await import("@/lib/user-db");
  const user = await getUserById(userId);
  if (!user) return { success: false };

  // Use local time for the streak to match user expectation, simplified to UTC for server
  // More complex apps might track timezone, but for this demo UTC is fine.
  const now = new Date();
  const today = now.toISOString().split("T")[0]; 
  const activityDates = user.activityDates || [];
  
  const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
  const isStale = (now.getTime() - lastActive) > 5 * 60 * 1000; // 5 minutes

  if (activityDates.includes(today)) {
    if (isStale) {
      await updateUserProfile(userId, { lastActiveAt: now.toISOString() });
    }
    return { success: true, updated: false }; 
  }

  // Calculate streak and award points
  let streakCount = user.streakCount || 0;
  let curiosityPoints = user.curiosityPoints || 0;
  
  curiosityPoints += 10; // Award 10 points for visiting today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (activityDates.includes(yesterdayStr)) {
    streakCount += 1;
  } else {
    streakCount = 1;
  }

  const newActivityDates = [...activityDates, today];

  await updateUserProfile(userId, {
    activityDates: newActivityDates,
    streakCount,
    curiosityPoints,
    lastActiveAt: now.toISOString()
  });

  return { success: true, updated: true };
}

export async function setUsernameAction(username: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_user")?.value;
  if (!userId) return { success: false, error: "Not logged in" };

  const { isUsernameTaken, updateUserProfile } = await import("@/lib/user-db");
  
  // Format username (lowercase, remove @ if added)
  const formattedUsername = username.trim().toLowerCase().replace(/^@/, '');
  if (!formattedUsername) return { success: false, error: "Username cannot be empty" };

  const taken = await isUsernameTaken(formattedUsername, userId);
  if (taken) {
    return { success: false, error: "This username is already taken" };
  }

  await updateUserProfile(userId, { username: formattedUsername });
  return { success: true };
}

export async function resolveUsernameToEmailAction(username: string) {
  const { getUserByIdentifier } = await import("@/lib/user-db");
  const formattedUsername = username.trim().toLowerCase().replace(/^@/, '');
  
  if (!formattedUsername) return null;
  
  const user = await getUserByIdentifier(formattedUsername);
  
  // Return the contact email if the user exists and it's a valid email
  if (user && user.contact && user.contact.includes("@")) {
    return user.contact;
  }
  
  return null;
}

export async function startChatAction(targetUsername: string) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  const { getUserByIdentifier } = await import("@/lib/user-db");
  const { database } = await import("@/lib/firebase");
  const formattedUsername = targetUsername.trim().toLowerCase().replace(/^@/, '');
  
  if (!formattedUsername) return { success: false, error: "Invalid username" };
  
  const targetUser = await getUserByIdentifier(formattedUsername);
  if (!targetUser) return { success: false, error: "User not found" };
  
  if (targetUser.id === currentUserId) {
    return { success: false, error: "You cannot chat with yourself" };
  }

  // Check if chat already exists
  const userChatsRef = database.ref(`userChats/${currentUserId}`);
  const userChatsSnap = await userChatsRef.once('value');
  const userChats = userChatsSnap.val() || {};
  
  let existingChatId = null;
  for (const chatId of Object.keys(userChats)) {
    const chatSnap = await database.ref(`chats/${chatId}`).once('value');
    const chatData = chatSnap.val();
    if (chatData && chatData.participants && chatData.participants[targetUser.id]) {
      existingChatId = chatId;
      break;
    }
  }

  if (existingChatId) {
    return { success: true, chatId: existingChatId };
  }

  // Create new chat
  const newChatRef = database.ref('chats').push();
  const chatId = newChatRef.key;
  
  const newChat = {
    id: chatId,
    participants: {
      [currentUserId]: true,
      [targetUser.id]: true
    },
    updatedAt: new Date().toISOString(),
    lastMessage: ""
  };

  await newChatRef.set(newChat);
  await database.ref(`userChats/${currentUserId}/${chatId}`).set(true);
  await database.ref(`userChats/${targetUser.id}/${chatId}`).set(true);
  
  return { success: true, chatId };
}

export async function sendMessageAction(chatId: string, text?: string, imageUrl?: string, payload?: any, sharedPost?: any) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  if (!text?.trim() && !imageUrl && !payload && !sharedPost) return { success: false, error: "Empty message" };

  const { database } = await import("@/lib/firebase");
  const chatRef = database.ref(`chats/${chatId}`);
  const chatSnap = await chatRef.once('value');
  
  if (!chatSnap.exists()) return { success: false, error: "Chat not found" };
  const chatData = chatSnap.val();
  
  if (!chatData.participants || !chatData.participants[currentUserId]) {
    return { success: false, error: "Unauthorized" };
  }

  const timestamp = new Date().toISOString();

  await database.ref(`messages/${chatId}`).push({
    senderId: currentUserId,
    text: text?.trim() || null,
    imageUrl: imageUrl || null,
    payload: payload || null,
    sharedPost: sharedPost || null,
    createdAt: timestamp,
    status: "sent"
  });

  // Update last message preview
  await chatRef.update({
    lastMessage: payload ? "🔒 Encrypted Message" : (imageUrl ? "📸 Image" : text?.trim().substring(0, 50) || ""),
    lastMessagePayload: payload || null,
    lastMessageSenderId: currentUserId,
    updatedAt: timestamp
  });

  // Increment unread count for recipient
  const participants = Object.keys(chatData.participants || {});
  const recipientId = participants.find(id => id !== currentUserId);
  if (recipientId) {
    const currentUnread = chatData[`unreadCount_${recipientId}`] || 0;
    await chatRef.child(`unreadCount_${recipientId}`).set(currentUnread + 1);
  }

  return { success: true };
}

export async function getChatsAction() {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  const { database } = await import("@/lib/firebase");
  const { getUserById } = await import("@/lib/user-db");
  const userChatsSnap = await database.ref(`userChats/${currentUserId}`).once('value');
  const userChats = userChatsSnap.val() || {};
  
  const chatPromises = Object.keys(userChats).map(async (chatId) => {
    const chatSnap = await database.ref(`chats/${chatId}`).once('value');
    if (chatSnap.exists()) {
      const data = chatSnap.val();
      const participants = Object.keys(data.participants || {});
      const otherUserId = participants.find(id => id !== currentUserId) || currentUserId;
      const otherUser = await getUserById(otherUserId);
      
      return {
        id: chatId,
        participants,
        otherUser: otherUser ? {
          id: otherUser.id,
          name: otherUser.name || otherUser.username || "Unknown User",
          username: otherUser.username || null,
          profilePicture: otherUser.profilePicture || null,
          publicKey: (otherUser as any).publicKey || null,
        } : null,
        lastMessage: data.lastMessage,
        lastMessagePayload: data.lastMessagePayload || null,
        lastMessageSenderId: data.lastMessageSenderId || null,
        updatedAt: data.updatedAt,
        unreadCount: data[`unreadCount_${currentUserId}`] || 0
      };
    }
    return null;
  });
  
  const resolvedChats = await Promise.all(chatPromises);
  const chats = resolvedChats.filter(Boolean);
  
  chats.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { success: true, chats };
}

export async function getMessagesAction(chatId: string) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  const { database } = await import("@/lib/firebase");
  const chatSnap = await database.ref(`chats/${chatId}`).once('value');
  
  if (!chatSnap.exists()) return { success: false, error: "Chat not found" };
  const chatData = chatSnap.val();
  
  if (!chatData.participants || !chatData.participants[currentUserId]) {
    return { success: false, error: "Unauthorized" };
  }
  
  const messagesSnap = await database.ref(`messages/${chatId}`).once('value');
  const messagesObj = messagesSnap.val() || {};
  
  // Mark incoming messages as read
  let hasUpdates = false;
  const updates: any = {};
  
  Object.keys(messagesObj).forEach(key => {
    const msg = messagesObj[key];
    if (msg.senderId !== currentUserId && msg.status !== "read") {
      msg.status = "read";
      updates[`${key}/status`] = "read";
      hasUpdates = true;
    }
  });

  if (hasUpdates) {
    await database.ref(`messages/${chatId}`).update(updates);
  }
  
  // Reset unread count for this chat for the current user
  await database.ref(`chats/${chatId}/unreadCount_${currentUserId}`).set(0);
  
  const messages = Object.keys(messagesObj).map(key => ({
    id: key,
    ...messagesObj[key]
  }))
  .filter((msg: any) => !(msg.deletedBy || []).includes(currentUserId))
  .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  return { success: true, messages };
}

export async function markChatReadAction(chatId: string) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  const { database } = await import("@/lib/firebase");
  
  const messagesSnap = await database.ref(`messages/${chatId}`).once('value');
  const messagesObj = messagesSnap.val() || {};
  
  let hasUpdates = false;
  const updates: any = {};
  
  Object.keys(messagesObj).forEach(key => {
    const msg = messagesObj[key];
    if (msg.senderId !== currentUserId && msg.status !== "read") {
      updates[`${key}/status`] = "read";
      hasUpdates = true;
    }
  });

  if (hasUpdates) {
    await database.ref(`messages/${chatId}`).update(updates);
  }
  
  // Reset unread count for this chat for the current user
  await database.ref(`chats/${chatId}/unreadCount_${currentUserId}`).set(0);
  
  return { success: true };
}

export async function deleteMessageAction(chatId: string, messageId: string, forEveryone: boolean) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  const { database } = await import("@/lib/firebase");
  const msgRef = database.ref(`messages/${chatId}/${messageId}`);
  const msgSnap = await msgRef.once('value');
  
  if (!msgSnap.exists()) return { success: false, error: "Message not found" };
  const msgData = msgSnap.val();
  
  if (forEveryone) {
    if (msgData.senderId !== currentUserId) {
      return { success: false, error: "Can only delete your own messages for everyone" };
    }
    await msgRef.update({
      text: "This message was deleted",
      imageUrl: null,
      payload: null,
      isDeleted: true
    });
  } else {
    const deletedBy = msgData.deletedBy || [];
    if (!deletedBy.includes(currentUserId)) {
      deletedBy.push(currentUserId);
      await msgRef.update({ deletedBy });
    }
  }

  return { success: true };
}

export async function setPublicKeyAction(publicKey: string) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false };

  const { database } = await import("@/lib/firebase");
  await database.ref(`users/${currentUserId}/publicKey`).set(publicKey);
  return { success: true };
}

export async function backupPrivateKeyAction(encryptedPrivateKey: string) {
  const { updateUserProfile } = await import("@/lib/user-db");
  const user = await getCurrentUserAction();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await updateUserProfile(user.id, { encryptedPrivateKey });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateRecoverySessionAction(masterPassword: string) {
  const { database, auth } = await import("@/lib/firebase");
  const user = await getCurrentUserAction();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const customToken = await auth.createCustomToken(user.id);
    const uuid = crypto.randomUUID();
    
    // Save session in RTDB with a 5-minute expiration
    const expiresAt = Date.now() + 5 * 60 * 1000;
    await database.ref(`recoverySessions/${uuid}`).set({
      token: customToken,
      masterPassword,
      expiresAt
    });
    
    return { success: true, uuid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function consumeRecoverySessionAction(uuid: string) {
  const { database } = await import("@/lib/firebase");
  try {
    const ref = database.ref(`recoverySessions/${uuid}`);
    const snapshot = await ref.once('value');
    const session = snapshot.val();
    
    if (!session) {
      return { success: false, error: "Invalid or expired session" };
    }
    
    // Immediately delete the session so it can only be used once
    await ref.remove();
    
    if (Date.now() > session.expiresAt) {
      return { success: false, error: "Session expired" };
    }
    
    return { success: true, token: session.token, masterPassword: session.masterPassword };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPostAction(formData: FormData) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  const imageUrlsRaw = formData.get("imageUrls") as string;
  const imageUrls = imageUrlsRaw ? JSON.parse(imageUrlsRaw) : [];
  const caption = (formData.get("caption") as string) || "";
  const visibility = (formData.get("visibility") as "public" | "private" | "friends") || "public";

  if (!imageUrls || imageUrls.length === 0) return { success: false, error: "At least one image is required" };

  const { database } = await import("@/lib/firebase");
  
  const newPost = {
    userId: currentUserId,
    imageUrls,
    caption: caption.trim(),
    visibility,
    createdAt: new Date().toISOString(),
    likedBy: []
  };

  const postRef = await database.ref(`posts/${currentUserId}`).push(newPost);
  const postId = postRef.key;
  
  // Notify followers
  const { getUserById, createNotification } = await import("@/lib/user-db");
  const currentUser = await getUserById(currentUserId);
  if (currentUser && currentUser.followers && currentUser.followers.length > 0) {
    const timestamp = new Date().toISOString();
    await Promise.all(currentUser.followers.map(async (followerId) => {
      await createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: followerId,
        actorId: currentUserId,
        type: 'post',
        link: `/profile/${currentUserId}`,
        read: false,
        createdAt: timestamp,
        discoveryId: postId || undefined
      } as any);
    }));
  }
  
  revalidatePath("/profile");
  return { success: true };
}

export async function updatePostVisibilityAction(postId: string, visibility: "public" | "private" | "friends") {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  const { database } = await import("@/lib/firebase");
  await database.ref(`posts/${currentUserId}/${postId}`).update({ visibility });
  
  revalidatePath("/profile");
  return { success: true };
}

export const getCachedUserPostsAction = unstable_cache(
  async (targetUserId: string, viewerId?: string) => {
    return getUserPostsAction(targetUserId, viewerId);
  },
  ['user-posts'],
  { tags: ['posts'], revalidate: 3600 } // 1 hour cache, revalidated on mutation
);

export async function getUserPostsAction(targetUserId: string, viewerId?: string) {
  const { database } = await import("@/lib/firebase");
  const { getUserById } = await import("@/lib/user-db");
  
  const postsSnap = await database.ref(`posts/${targetUserId}`).once('value');
  const postsData = postsSnap.val() || {};
  
  // Fetch target user to check followers list
  let isFriend = false;
  if (viewerId && viewerId !== targetUserId) {
    const targetUser = await getUserById(targetUserId);
    if (targetUser && targetUser.followers) {
      isFriend = targetUser.followers.includes(viewerId);
    }
  }

  const posts = Object.keys(postsData).map(key => ({
    id: key,
    ...postsData[key]
  })).filter((post: any) => {
    if (targetUserId === viewerId) return true; // Owner sees all
    if (post.visibility === "private") return false; // Hide private
    if (post.visibility === "friends") return isFriend; // Check friend status
    return true; // Public
  }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return { success: true, posts };
}

export async function togglePostLikeAction(authorId: string, postId: string) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  const { database } = await import("@/lib/firebase");
  const { createNotification } = await import("@/lib/user-db");

  const postRef = database.ref(`posts/${authorId}/${postId}`);
  
  let isLiked = false;
  await postRef.transaction((post) => {
    if (post) {
      if (!post.likedBy) post.likedBy = [];
      const index = post.likedBy.indexOf(currentUserId);
      if (index === -1) {
        post.likedBy.push(currentUserId);
        isLiked = true;
      } else {
        post.likedBy.splice(index, 1);
        isLiked = false;
      }
    }
    return post;
  });

  // Create notification if liked and not liking own post
  if (isLiked && authorId !== currentUserId) {
    await createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: authorId,
      actorId: currentUserId,
      type: 'like',
      read: false,
      createdAt: new Date().toISOString(),
      discoveryId: postId // Reusing discoveryId field for post ID
    });
  }

  revalidatePath("/profile");
  revalidateTag('posts' as any, undefined as any);
  return { success: true, liked: isLiked };
}

export async function addPostCommentAction(authorId: string, postId: string, text: string) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  if (!text.trim()) return { success: false, error: "Comment cannot be empty" };

  const { database } = await import("@/lib/firebase");
  
  const newComment = {
    userId: currentUserId,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  await database.ref(`post_comments/${postId}`).push(newComment);

  return { success: true };
}

export async function getPostCommentsAction(postId: string) {
  const { database } = await import("@/lib/firebase");
  const { getUserById } = await import("@/lib/user-db");

  const commentsSnap = await database.ref(`post_comments/${postId}`).once('value');
  const commentsData = commentsSnap.val();
  
  if (!commentsData) return { success: true, comments: [] };

  const comments = await Promise.all(
    Object.keys(commentsData).map(async (key) => {
      const comment = commentsData[key];
      const user = await getUserById(comment.userId);
      return {
        id: key,
        ...comment,
        user: user ? {
          id: user.id,
          username: user.username,
          name: user.name,
          profilePicture: user.profilePicture
        } : null
      };
    })
  );

  return { success: true, comments: comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) };
}

export async function sharePostToFollowersAction(authorId: string, postId: string) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  const { getUserById } = await import("@/lib/user-db");
  const { database } = await import("@/lib/firebase");
  const { startChatAction, sendMessageAction } = await import("@/app/actions");

  const currentUser = await getUserById(currentUserId);
  if (!currentUser || !currentUser.followers || currentUser.followers.length === 0) {
    return { success: false, error: "No followers to share with" };
  }

  // Determine post link (or format)
  const postLinkMessage = `Check out this post: /profile/${authorId}?post=${postId}`;

  // For each follower, ensure a chat exists and send a message
  for (const followerId of currentUser.followers) {
    const follower = await getUserById(followerId);
    if (!follower) continue;
    
    // Attempt to start/get chat
    const chatRes = await startChatAction(follower.username || follower.id);
    if (chatRes.success && chatRes.chatId) {
      await sendMessageAction(chatRes.chatId, postLinkMessage, undefined);
    }
  }

  return { success: true, sharedCount: currentUser.followers.length };
}

export const getCachedUserConnectionsAction = unstable_cache(
  async (userId: string) => {
    return getUserConnectionsAction(userId);
  },
  ['user-connections'],
  { tags: ['connections'], revalidate: 3600 } // 1 hour cache
);

export async function getUserConnectionsAction(userId: string) {
  const { getUserById, readUsersDB } = await import("@/lib/user-db");
  
  const user = await getUserById(userId);
  if (!user) return { success: false, error: "User not found" };

  const followersList = user.followers || [];
  const followingList = user.following || [];

  // Optimize: fetch all users once instead of N+1 queries
  const allUsers = await readUsersDB();

  const followers = followersList
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map(u => ({ 
      id: u.id, 
      username: u.username || null, 
      name: u.name || null, 
      profilePicture: u.profilePicture || null,
      publicKey: (u as any).publicKey || null
    }));
    
  const following = followingList
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map(u => ({ 
      id: u.id, 
      username: u.username || null, 
      name: u.name || null, 
      profilePicture: u.profilePicture || null,
      publicKey: (u as any).publicKey || null
    }));

  return { success: true, followers, following };
}

export async function searchUsersAction(query: string) {
  if (!query || query.length < 2) return { success: true, users: [] };
  
  const { database } = await import("@/lib/firebase");
  
  const q = query.toLowerCase();
  
  // We'll fetch all users for now since RTDB doesn't have robust full-text search.
  // In production with thousands of users, we should use Algolia or Typesense.
  const usersSnap = await database.ref('users').once('value');
  const usersData = usersSnap.val() || {};
  
  const matches = Object.keys(usersData).map(id => ({
    id,
    username: usersData[id].username || "",
    name: usersData[id].name || "",
    profilePicture: usersData[id].profilePicture || null,
    verified: usersData[id].verified || false
  })).filter(user => 
    user.username.toLowerCase().includes(q) || 
    user.name.toLowerCase().includes(q)
  ).slice(0, 10); // Limit to 10 results
  
  return { success: true, users: matches };
}

export async function markChatsDeliveredAction(chatIds: string[]) {
  if (!chatIds || chatIds.length === 0) return { success: true };
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false };

  const { database } = await import("@/lib/firebase");
  
  // For each chat, fetch messages that are "sent" and from the other user, and mark as "delivered"
  for (const chatId of chatIds) {
    const snap = await database.ref(`messages/${chatId}`).orderByChild("status").equalTo("sent").once("value");
    if (snap.exists()) {
      const updates: any = {};
      const msgs = snap.val();
      Object.keys(msgs).forEach(key => {
        if (msgs[key].senderId !== currentUserId) {
          updates[`${chatId}/${key}/status`] = "delivered";
        }
      });
      if (Object.keys(updates).length > 0) {
        await database.ref(`messages`).update(updates);
      }
    }
  }
  return { success: true };
}

export async function updateUserLocationAction(lat: number, lng: number) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  const { updateUserLocation, getFriendSuggestions, getUserById, createNotification, updateNotifiedSuggestions } = await import("@/lib/user-db");
  await updateUserLocation(currentUserId, lat, lng);
  
  // Fetch suggestions and create notifications for new ones
  const suggestions = await getFriendSuggestions(currentUserId);
  const currentUser = await getUserById(currentUserId);
  if (currentUser) {
    const notified = currentUser.notifiedSuggestions || [];
    const newSuggestions = suggestions.filter((s: any) => !notified.includes(s.user.id));
    
    if (newSuggestions.length > 0) {
      const timestamp = new Date().toISOString();
      const newlyNotified: string[] = [];
      
      await Promise.all(newSuggestions.map(async (s: any) => {
        await createNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          userId: currentUserId,
          actorId: s.user.id,
          type: 'suggestion',
          link: `/profile/${s.user.username || s.user.id}`,
          read: false,
          createdAt: timestamp
        } as any);
        newlyNotified.push(s.user.id);
      }));
      
      await updateNotifiedSuggestions(currentUserId, [...notified, ...newlyNotified]);
    }
  }
  
  return { success: true };
}

export async function getFriendSuggestionsAction() {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized", suggestions: [] };

  const { getFriendSuggestions } = await import("@/lib/user-db");
  const suggestions = await getFriendSuggestions(currentUserId);
  return { success: true, suggestions };
}
