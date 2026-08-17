"use server";

import { updateDiscoveryStatus, deleteDiscovery } from "@/lib/db";
import { findOrCreateUser, verifyUser, toggleLike, getUserByIdentifier, isUsernameTaken, updateUserProfile } from "@/lib/user-db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function approveDiscovery(id: string) {
  await updateDiscoveryStatus(id, "published");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/discover");
  return { success: true };
}

export async function rejectDiscovery(id: string) {
  await deleteDiscovery(id);
  revalidatePath("/admin");
  return { success: true };
}

export async function getRandomDiscoveryAction() {
  const { getRandomDiscovery } = await import("@/lib/data");
  return await getRandomDiscovery();
}

export async function deleteDiscoveryAction(id: string) {
  await deleteDiscovery(id);
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
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
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

export async function sendMessageAction(chatId: string, text: string) {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get("auth_user")?.value;
  if (!currentUserId) return { success: false, error: "Unauthorized" };

  if (!text.trim()) return { success: false, error: "Empty message" };

  const { database } = await import("@/lib/firebase");
  const chatRef = database.ref(`chats/${chatId}`);
  const chatSnap = await chatRef.once('value');
  
  if (!chatSnap.exists()) return { success: false, error: "Chat not found" };
  const chatData = chatSnap.val();
  
  if (!chatData.participants || !chatData.participants[currentUserId]) {
    return { success: false, error: "Unauthorized" };
  }

  const timestamp = new Date().toISOString();

  // Add message
  await database.ref(`messages/${chatId}`).push({
    senderId: currentUserId,
    text: text.trim(),
    createdAt: timestamp
  });

  // Update last message preview
  await chatRef.update({
    lastMessage: text.trim().substring(0, 50),
    updatedAt: timestamp
  });

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
  
  const chats = [];
  for (const chatId of Object.keys(userChats)) {
    const chatSnap = await database.ref(`chats/${chatId}`).once('value');
    if (chatSnap.exists()) {
      const data = chatSnap.val();
      const participants = Object.keys(data.participants || {});
      const otherUserId = participants.find(id => id !== currentUserId) || currentUserId;
      const otherUser = await getUserById(otherUserId);
      
      chats.push({
        id: chatId,
        participants,
        otherUser: otherUser ? {
          id: otherUser.id,
          name: otherUser.name || otherUser.username || "Unknown User",
          username: otherUser.username || null,
          profilePicture: otherUser.profilePicture || null,
        } : null,
        lastMessage: data.lastMessage,
        updatedAt: data.updatedAt
      });
    }
  }
  
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
