// Function to delete a file from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

  if (!apiSecret || !apiKey) {
    throw new Error('Cloudinary API credentials are not configured');
  }

  // Generate signature
  const signature = generateSignature(publicId, apiSecret, timestamp);

  try {
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
    
    return response.data;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to generate Cloudinary API signature
const generateSignature = (publicId: string, apiSecret: string, timestamp: number): string => {
  const crypto = require('crypto');
  const str = `public_id=${publicId}&resource_type=auto&timestamp=${timestamp}${apiSecret}`;
  return crypto.createHash('sha1').update(str).digest('hex');
}; 