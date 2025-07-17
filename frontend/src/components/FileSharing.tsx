import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary';
import './FileSharing.css';

interface SharedFile {
  id: string;
  name: string;
  url: string;
  publicId: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Timestamp;
}

interface FileSharingProps {
  roomId: string;
}

const FileSharing: React.FC<FileSharingProps> = ({ roomId }) => {
  const { currentUser, userProfile } = useAuth();
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Load shared files
  useEffect(() => {
    if (!roomId) return;
    
    const filesRef = collection(db, 'studyRooms', roomId, 'files');
    const q = query(filesRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const loadedFiles: SharedFile[] = [];
        snapshot.forEach((doc) => {
          loadedFiles.push({
            id: doc.id,
            ...doc.data()
          } as SharedFile);
        });
        setFiles(loadedFiles);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading files:', err);
        setError('Failed to load shared files');
        setIsLoading(false);
      }
    }, (err) => {
      console.error('Error subscribing to files updates:', err);
      setError('Failed to subscribe to files updates');
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [roomId]);
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !currentUser || !roomId || !userProfile) return;
    
    // Check file size (limit to 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(10);
      setError('');
      
      // Upload to Cloudinary
      setUploadProgress(30);
      const { url, public_id } = await uploadToCloudinary(selectedFile, `studybuddy/rooms/${roomId}/files`);
      setUploadProgress(80);
      
      // Save file reference in Firestore
      const filesRef = collection(db, 'studyRooms', roomId, 'files');
      await addDoc(filesRef, {
        name: selectedFile.name,
        url: url,
        publicId: public_id,
        type: selectedFile.type,
        size: selectedFile.size,
        uploadedBy: currentUser.uid,
        uploadedByName: userProfile.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      });
      
      setUploadProgress(100);
      setIsUploading(false);
      setSuccessMessage('File uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file: ' + (err instanceof Error ? err.message : String(err)));
      setIsUploading(false);
    }
    
    // Reset file input
    e.target.value = '';
  };
  
  // Handle file download
  const handleDownloadFile = (file: SharedFile) => {
    try {
      // Create a temporary anchor element
      const anchor = document.createElement('a');
      anchor.href = file.url;
      anchor.target = '_blank';
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    }
  };
  
  // Handle file deletion
  const handleDeleteFile = async (file: SharedFile) => {
    if (!currentUser || !roomId) {
      console.error("Cannot delete file - no current user or room ID");
      return;
    }
    
    // Only allow deletion if user is the uploader
    if (file.uploadedBy !== currentUser.uid) {
      setError('You can only delete files you uploaded');
      return;
    }
    
    // Ask for confirmation before deleting
    if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }
    
    try {
      // Delete from Firestore first
      console.log("Deleting file reference from Firestore...");
      const fileRef = doc(db, 'studyRooms', roomId, 'files', file.id);
      await deleteDoc(fileRef);
      
      // Then attempt to delete from Cloudinary
      try {
        await deleteFromCloudinary(file.publicId);
      } catch (cloudinaryError) {
        console.warn('Failed to delete from Cloudinary, but file reference was removed:', cloudinaryError);
      }
      
      // Show success message
      setSuccessMessage('File deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setError('');
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file: ' + (err instanceof Error ? err.message : String(err)));
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Get file icon based on type
  const getFileIcon = (type: string): string => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📑';
    if (type.includes('text')) return '📝';
    return '📁';
  };
  
  return (
    <div className="file-sharing">
      <div className="file-sharing-header">
        <h2>Shared Files</h2>
        <div className="file-upload">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
            id="file-upload"
            className="file-input"
          />
          <label htmlFor="file-upload" className="upload-button">
            {isUploading ? 'Uploading...' : 'Upload File'}
          </label>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {isUploading && (
        <div className="upload-progress">
          <div 
            className="progress-bar"
            style={{ width: `${uploadProgress}%` }}
          />
          <span>{Math.round(uploadProgress)}%</span>
        </div>
      )}
      
      <div className="files-list">
        {isLoading ? (
          <div className="loading">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="no-files">No files have been shared yet</div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-icon">{getFileIcon(file.type)}</div>
              <div className="file-info">
                <div 
                  onClick={() => handleDownloadFile(file)} 
                  className="file-name clickable"
                  title="Click to download"
                >
                  {file.name}
                </div>
                <div className="file-meta">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>By {file.uploadedByName}</span>
                </div>
              </div>
              <div className="file-actions">
                <button
                  onClick={() => handleDownloadFile(file)}
                  className="download-button"
                  title="Download file"
                >
                  📥
                </button>
                {currentUser?.uid === file.uploadedBy && (
                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="delete-button"
                    title="Delete file"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileSharing; 