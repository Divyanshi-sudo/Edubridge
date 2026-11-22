import { supabase } from './supabase';

const BUCKET_NAME = 'timetable-uploads';

// Upload timetable
export async function uploadTimetable(
  userId: string,
  file: File
) {
  const fileExtension = file.name.split('.').pop();
  const filePath = `${userId}/timetable.${fileExtension}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  return data;
}

// Get timetable download URL
export async function getTimetableUrl(
  userId: string,
  fileName: string
) {
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 60 * 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

// Delete timetable
export async function deleteTimetable(
  userId: string,
  fileName: string
) {
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw error;
  }
}