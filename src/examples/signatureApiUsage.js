// Example usage of the new get-signature-by-id API
// This file demonstrates how to use the new signature API endpoint

import { getSignatureById } from '../services/authService';

/**
 * Example function to fetch and display user signature
 * @param {string} userId - The user ID to fetch signature for
 */
export const fetchUserSignatureExample = async (userId) => {
  try {
    console.log('Fetching signature for user ID:', userId);
    
    const response = await getSignatureById(userId);
    
    if (response.isSuccess && response.data) {
      const signatureData = response.data;
      
      console.log('Signature data received:', {
        signatureImageName: signatureData.signatureImageName,
        signatureUrl: signatureData.signatureUrl,
        userId: signatureData.userId
      });
      
      // Example of how to display the signature
      if (signatureData.signatureUrl) {
        console.log('Signature URL:', signatureData.signatureUrl);
        // You can use this URL in an <img> tag to display the signature
        return signatureData;
      }
    } else {
      console.log('No signature found or error:', response.msg);
      return null;
    }
  } catch (error) {
    console.error('Error fetching signature:', error);
    return null;
  }
};

/**
 * Example of how the API response looks:
 * {
 *   "success": true,
 *   "message": "string",
 *   "exceptionMessage": "string", 
 *   "validationErrors": ["string"],
 *   "data": {
 *     "signatureImageName": "string",
 *     "signatureUrl": "string",
 *     "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *   }
 * }
 */

export default fetchUserSignatureExample;
