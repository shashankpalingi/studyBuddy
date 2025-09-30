import { createClient } from "@supabase/supabase-js";
import { auth } from "./firebase";

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or Anon Key is missing. Please check your environment variables.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      "x-firebase-auth": "true",
    },
  },
});

// Storage bucket name
const STORAGE_BUCKET = "study-buddy-files";

// Function to upload a file to Supabase Storage
export const uploadToSupabase = async (file: File, folder?: string) => {
  try {
    console.log(
      `Uploading file to Supabase: ${file.name} (${file.size} bytes)`,
    );

    // Check if user is authenticated with Firebase
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be authenticated to upload files");
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // For now, we'll disable RLS check by using service role or making bucket public
    // This is a workaround since we're using Firebase Auth instead of Supabase Auth
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        // Add custom metadata to identify the uploader
        metadata: {
          uploadedBy: currentUser.uid,
          uploadedAt: new Date().toISOString(),
        },
      });

    if (error) {
      console.error("Supabase upload error:", error);

      // Provide more specific error messages
      if (error.message.includes("row-level security policy")) {
        throw new Error(
          "Storage access denied. Please check bucket permissions in Supabase dashboard.",
        );
      } else if (error.message.includes("not found")) {
        throw new Error(
          "Storage bucket not found. Please verify bucket name and configuration.",
        );
      }

      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    console.log("Supabase upload successful:", data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
      fullPath: data.fullPath,
    };
  } catch (error) {
    console.error("Error uploading to Supabase:", error);
    throw error instanceof Error
      ? error
      : new Error(
          "Failed to upload file. Please check your network connection and try again.",
        );
  }
};

// Function to delete a file from Supabase Storage
export const deleteFromSupabase = async (filePath: string): Promise<void> => {
  try {
    console.log(`Deleting file from Supabase: ${filePath}`);

    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be authenticated to delete files");
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Supabase delete error:", error);

      // Provide more specific error messages
      if (error.message.includes("row-level security policy")) {
        throw new Error(
          "Delete access denied. Please check bucket permissions.",
        );
      }

      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log("Supabase delete successful");
  } catch (error) {
    console.error("Error deleting from Supabase:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to delete file from storage.");
  }
};
