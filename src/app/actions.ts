"use server";

import { updateDiscoveryStatus, deleteDiscovery } from "@/lib/db";
import { findOrCreateUser, verifyUser, toggleLike } from "@/lib/user-db";
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

export async function requestAuthAction(contact: string) {
  // Step 1: Create or find unverified user
  const user = await findOrCreateUser(contact);
  // In a real app, send email/SMS here.
  return { success: true, userId: user.id };
}

export async function adminLoginAction(id: string, pass: string) {
  if (id.toLowerCase() === "akash" && pass === "96500") {
    const user = await findOrCreateUser("akash");
    const cookieStore = await cookies();
    cookieStore.set("auth_user", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return { success: true };
  }
  return { success: false, error: "Invalid admin credentials" };
}

export async function verifyAuthAction(userId: string, code: string) {
  // Step 2: Verify code (mocking with '1234')
  if (code !== "1234") {
    return { success: false, error: "Invalid code" };
  }
  const user = await verifyUser(userId);
  if (user) {
    // Drop a secure cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_user", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return { success: true, user };
  }
  return { success: false, error: "User not found" };
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
