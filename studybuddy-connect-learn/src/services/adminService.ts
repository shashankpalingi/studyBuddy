import { db } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, limit } from 'firebase/firestore';

// Service for admin operations - kept for future administrative features
export const adminService = {
  // Delete all study rooms from the database with pagination for better performance
  async deleteAllStudyRooms(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      console.log('Starting deletion of all study rooms...');
      let totalDeleted = 0;
      let batchSize = 20; // Process rooms in batches for better reliability
      let hasMore = true;
      
      while (hasMore) {
        // Get a batch of study rooms
        const studyRoomsRef = collection(db, 'studyRooms');
        const q = query(studyRoomsRef, limit(batchSize));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          console.log('No more study rooms found to delete.');
          hasMore = false;
          break;
        }
        
        const batchCount = snapshot.size;
        console.log(`Found ${batchCount} study rooms in this batch.`);
        
        // Delete each room
        const deletePromises = [];
        
        for (const document of snapshot.docs) {
          const roomData = document.data();
          console.log(`Deleting room: ${document.id} (${roomData.name || 'Unnamed room'})`);
          deletePromises.push(deleteDoc(doc(db, 'studyRooms', document.id)));
        }
        
        // Wait for all deletions to complete
        await Promise.all(deletePromises);
        
        totalDeleted += batchCount;
        console.log(`Deleted batch of ${batchCount} rooms. Total deleted: ${totalDeleted}`);
        
        // If we got fewer documents than the batch size, there are no more documents
        if (batchCount < batchSize) {
          hasMore = false;
        }
      }
      
      console.log(`All study rooms have been deleted successfully! Total: ${totalDeleted}`);
      return { success: true, count: totalDeleted };
    } catch (error) {
      console.error('Error deleting study rooms:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Additional admin services can be added here in the future
}; 