// Cloudinary configuration
import axios from 'axios';

// Replace with your own Cloudinary cloud name from dashboard
const cloudName = 'dpjyzpg3r'; // Your actual cloud name

// Function to upload any file to Cloudinary using unsigned upload
export const uploadToCloudinary = async (file: File, folder: string = 'studybuddy_files'): Promise<{ url: string; publicId: string }> => {
  // Create a FormData object
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'studybuddy_upload'); // Use the preset name you created
  formData.append('folder', folder);
  formData.append('resource_type', 'auto'); // This allows any file type

  try {
    // Upload to Cloudinary via its upload API
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      formData
    );
    
    // Return both the secure URL and public_id of the uploaded file
    return {
      url: response.data.secure_url,
      publicId: response.data.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Function to delete a file from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('upload_preset', 'studybuddy_upload');

  try {
    await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/destroy`,
      formData
    );
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
}; 