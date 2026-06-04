import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";
import { authService } from "./auth";
import type { Profile, VehicleClass } from "@/types";

/**
 * Profile + driver self-service: edit name/phone/avatar (and vehicle details for
 * drivers). Email is intentionally NOT editable here. Avatar images are stored
 * in the public `avatars` bucket under "<uid>/avatar.<ext>".
 */
export const profileService = {
  /** Update editable profile fields (never email). Returns the fresh profile. */
  async updateProfile(userId: string, fields: { fullName?: string; phone?: string | null; avatarUrl?: string }): Promise<Profile> {
    const patch: Record<string, unknown> = {};
    if (fields.fullName !== undefined) patch.full_name = fields.fullName;
    if (fields.phone !== undefined) patch.phone = fields.phone || null;
    if (fields.avatarUrl !== undefined) patch.avatar_url = fields.avatarUrl;

    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) throw error;
    return authService.fetchProfile(userId);
  },

  /** Update the driver's own vehicle details. */
  async updateDriver(userId: string, fields: { vehicleClass?: VehicleClass; vehicleMake?: string | null; licensePlate?: string | null }) {
    const patch: Record<string, unknown> = {};
    if (fields.vehicleClass !== undefined) patch.vehicle_class = fields.vehicleClass;
    if (fields.vehicleMake !== undefined) patch.vehicle_make = fields.vehicleMake || null;
    if (fields.licensePlate !== undefined) patch.license_plate = fields.licensePlate || null;
    if (Object.keys(patch).length === 0) return;
    const { error } = await supabase.from("drivers").update(patch).eq("id", userId);
    if (error) throw error;
  },

  /**
   * Upload a base64 image to the avatars bucket and return its public URL.
   * `base64` comes from expo-image-picker (base64: true).
   */
  async uploadAvatar(userId: string, base64: string, ext = "jpg"): Promise<string> {
    const path = `${userId}/avatar_${Date.now()}.${ext}`;
    const contentType = ext === "png" ? "image/png" : "image/jpeg";
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, decode(base64), { contentType, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  },
};
