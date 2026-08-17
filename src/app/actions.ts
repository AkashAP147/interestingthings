"use server";

import { updateDiscoveryStatus, deleteDiscovery } from "@/lib/db";
import { findOrCreateUser, verifyUser, toggleLike, getUserByIdentifier, isUsernameTaken, updateUserProfile } from "@/lib/user-db";
import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";

export async function approveDiscovery(id: string) {
  await updateDiscoveryStatus(id, "published");
  updateTag("discoveries");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/discover");
  return { success: true };
}

export async function rejectDiscovery(id: string) {
  await deleteDiscovery(id);
  updateTag("discoveries");
  revalidatePath("/admin");
  return { success: true };
}

export async function getRandomDiscoveryAction() {
  const { getRandomDiscovery } = await import("@/lib/data");
  return await getRandomDiscovery();
}

export async function deleteDiscoveryAction(id: string) {
  await deleteDiscovery(id);
  updateTag("discoveries");
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
  
  updateTag("discoveries");
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
  const today = new Date().toISOString().split("T")[0]; 
  const activityDates = user.activityDates || [];

  if (activityDates.includes(today)) {
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

export async function sendMessageAction(chatId: string, text?: string, imageUrl?: string, payload?: any) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  if (!text?.trim() && !imageUrl && !payload) return { success: false, error: "Empty message" };

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

export async function backupPrivateKeyAction(encryptedPrivateKeyStr: string) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false };

  const { database } = await import("@/lib/firebase");
  await database.ref(`users/${currentUserId}/encryptedPrivateKey`).set(encryptedPrivateKeyStr);
  return { success: true };
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
    likes: 0
  };

  await database.ref(`posts/${currentUserId}`).push(newPost);
  
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
