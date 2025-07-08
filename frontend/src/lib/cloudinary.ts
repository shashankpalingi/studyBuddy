import axios from 'axios';

// Cloudinary configuration
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

// Console log the Cloudinary configuration (without sensitive values)
console.log("Cloudinary configuration:", {
  cloudName,
  uploadPresetAvailable: !!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
});

// Development mode detection
const isDevelopment = import.meta.env.DEV;

// Function to upload a file to Cloudinary
export const uploadToCloudinary = async (file: File, folder?: string) => {
  try {
    console.log(`Uploading file to Cloudinary: ${file.name} (${file.size} bytes)`);
    
    // For development without Cloudinary credentials, return a mock response
    if (isDevelopment && cloudName === 'demo') {
      console.log("Using mock Cloudinary upload in development mode");
      
      // Create a mock URL using a data URL for images or a placeholder for other files
      const mockUrl = file.type.startsWith('image/') 
        ? URL.createObjectURL(file)
        : 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
      
      return {
        url: mockUrl,
        public_id: `mock-${Date.now()}`
      };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    if (folder) {
      formData.append('folder', folder);
    }
    
    console.log(`Uploading to Cloudinary cloud: ${cloudName}`);
    
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      formData
    );
    
    console.log("Cloudinary upload successful:", response.data.public_id);
    
    return {
      url: response.data.secure_url,
      public_id: response.data.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('Cloudinary API response:', error.response.data);
      throw new Error(`Cloudinary upload failed: ${error.response.data.error?.message || 'Unknown error'}`);
    }
    
    throw new Error('Failed to upload file. Please check your network connection and try again.');
  }
};

// Function to delete a file from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    console.log(`Attempting to delete file from Cloudinary: ${publicId}`);
    
    // For development without Cloudinary credentials, just log and return
    if (isDevelopment && cloudName === 'demo') {
      console.log("Mock delete from Cloudinary in development mode:", publicId);
      return;
    }
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

    if (!apiSecret || !apiKey) {
      console.warn('Cloudinary API credentials are not configured, skipping deletion');
      return;
    }

    // Generate signature
    const signature = generateSignature(publicId, apiSecret, timestamp);

    // Use the proxy path
    const response = await axios.delete(
      `/cloudinary/${cloudName}/resources/image/upload`,
      {
        params: {
          public_id: publicId,
          api_key: apiKey,
          timestamp: timestamp,
          signature: signature,
          resource_type: 'auto'
        },
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    console.log("Cloudinary delete successful:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    
    // In development, don't throw the error
    if (isDevelopment) {
      console.warn("Ignoring Cloudinary delete error in development mode");
      return;
    }
    
    throw error;
  }
};

// Helper function to generate Cloudinary API signature
const generateSignature = (publicId: string, apiSecret: string, timestamp: number): string => {
  const crypto = require('crypto');
  const str = `public_id=${publicId}&resource_type=auto&timestamp=${timestamp}${apiSecret}`;
  return crypto.createHash('sha1').update(str).digest('hex');
}; 