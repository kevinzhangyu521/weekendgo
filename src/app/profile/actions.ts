"use server";

import { revalidatePath } from "next/cache";
import { saveMyProfile } from "@/features/profiles/repository";

export async function updateProfile(formData: FormData) {
  const result = await saveMyProfile(formData);
  revalidatePath("/profile");
  return result;
}
