import { decode } from 'base64-arraybuffer';
import { supabase } from '@library/supabase';

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(payload) {
  const { email, password, full_name, phone, role, vehicle_class, vehicle_make, license_plate } = payload;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone: phone || null,
        role,
        vehicle_class: role === 'driver' ? vehicle_class : null,
        vehicle_make: role === 'driver' ? vehicle_make || null : null,
        license_plate: role === 'driver' ? license_plate || null : null,
      },
      emailRedirectTo: 'rideva://auth/callback',
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser() {
  const { data: auth } = await supabase.auth.getUser();
  const authUser = auth && auth.user;
  if (!authUser) return null;

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    if (data) return data;
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

export async function forgotPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'rideva://reset-password',
  });
  if (error) throw error;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

export async function updateDriver(userId, updates) {
  const { error } = await supabase.from('drivers').update(updates).eq('id', userId);
  if (error) throw error;
}

export async function getDriver(userId) {
  const { data } = await supabase.from('drivers').select('*').eq('id', userId).maybeSingle();
  return data;
}

export async function uploadAvatar(userId, base64, ext) {
  const path = `${userId}/avatar_${Date.now()}.${ext || 'jpg'}`;
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const { error } = await supabase.storage.from('avatars').upload(path, decode(base64), { contentType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
