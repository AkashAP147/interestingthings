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
