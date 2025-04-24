'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface ProfileUpdateData {
  first_name: string
  last_name: string
  display_name: string
  phone: string
  company: string
  department: string
  title: string
  bio: string
  location: string
  avatar_url: string
  role: string
}

export async function updateProfile(formData: ProfileUpdateData) {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Update auth user metadata
  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: {
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
    }
  })

  if (authUpdateError) {
    throw new Error('Failed to update user metadata')
  }

  // Update profile in database
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      first_name: formData.first_name,
      last_name: formData.last_name,
      display_name: formData.display_name,
      phone: formData.phone,
      company: formData.company,
      department: formData.department,
      title: formData.title,
      bio: formData.bio,
      location: formData.location,
      avatar_url: formData.avatar_url,
      role: formData.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    throw new Error('Failed to update profile')
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  // Upload to Supabase Storage
  const { data, error } = await supabase
    .storage
    .from('avatars')
    .upload(`${user.id}/avatar.jpg`, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw new Error('Failed to upload image')
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(data.path)

  // Update the profile with the new avatar URL
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      avatar_url: publicUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (profileError) {
    throw new Error('Failed to update profile with new avatar')
  }

  revalidatePath('/profile')
  return { url: publicUrl, error: null }
}

export async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: data.newPassword
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}




