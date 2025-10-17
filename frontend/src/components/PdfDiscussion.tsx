import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Download,
  FolderPlus,
  Folder,
  X,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { uploadToSupabase, deleteFromSupabase } from "../lib/supabase-storage";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import "./PdfDiscussion.css";

interface PdfFile {
  id: string;
  name: string;
  url: string;
  publicId: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: { toDate: () => Date } | Date;
  folderId: string;
  size: number;
}

interface PdfFolder {
  id: string;
  name: string;
  createdBy: string;
  createdByName: string;
  createdAt: { toDate: () => Date } | Date;
  roomId: string;
}

interface PdfViewerProps {
  pdfUrl: string;
  fileName: string;
  onClose: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl, fileName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewerMethod, setViewerMethod] = useState<
    "iframe" | "object" | "download"
  >("iframe");

  // Create a viewer-friendly URL with multiple fallback options
  const getViewerUrl = (
    url: string,
    method: "iframe" | "object" | "download",
  ) => {
    // Supabase URLs work directly for all methods
    return url;
  };

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);

    // Try different viewer methods on error
    if (viewerMethod === "iframe") {
      setViewerMethod("object");
      setLoading(true);
      setError(false);
    } else if (viewerMethod === "object") {
      setError(true);
    }
  };

  const openInNewTab = () => {
    // For new tab, always use the original URL
    window.open(pdfUrl, "_blank");
  };

  const downloadPdf = () => {
    const downloadUrl = getViewerUrl(pdfUrl, "download");
    window.open(downloadUrl, "_blank");
  };

  return (
    <div className="pdf-viewer-modal">
      <div className="pdf-viewer-overlay" onClick={onClose}></div>
      <div className="pdf-viewer-container">
        <div className="pdf-viewer-header">
          <h3>{fileName}</h3>
          <div className="pdf-viewer-actions">
            <button onClick={downloadPdf} className="btn-download-pdf">
              Download
            </button>
            <button onClick={openInNewTab} className="btn-open-tab">
              Open in New Tab
            </button>
            <button onClick={onClose} className="btn-close">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="pdf-viewer-content">
          {loading && (
            <div className="pdf-loading">
              <div className="loading-spinner"></div>
              <p>Loading PDF...</p>
            </div>
          )}
          {error && (
            <div className="pdf-error">
              <FileText size={48} />
              <p>Failed to load PDF document.</p>
              <p>
                The PDF file might be corrupted or incompatible with the browser
                viewer.
              </p>
              <button onClick={openInNewTab} className="btn-download-alt">
                Try Opening in New Tab
              </button>
            </div>
          )}
          {viewerMethod === "iframe" ? (
            <iframe
              src={getViewerUrl(pdfUrl, viewerMethod)}
              width="100%"
              height="100%"
              style={{ display: loading || error ? "none" : "block" }}
              onLoad={handleLoad}
              onError={handleError}
              title={fileName}
            />
          ) : (
            <object
              data={getViewerUrl(pdfUrl, viewerMethod)}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{ display: loading || error ? "none" : "block" }}
              onLoad={handleLoad}
              onError={handleError}
            >
              <p>
                Your browser doesn't support PDFs.{" "}
                <button onClick={downloadPdf}>Download the PDF</button>.
              </p>
            </object>
          )}
        </div>
      </div>
    </div>
  );
};

interface PdfDiscussionProps {
  roomId: string;
}

const PdfDiscussion: React.FC<PdfDiscussionProps> = ({ roomId }) => {
  const { currentUser } = useAuth();
  const [folders, setFolders] = useState<PdfFolder[]>([]);
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [viewingPdf, setViewingPdf] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time listeners for folders and files
  useEffect(() => {
    if (!roomId) return;

    // Listen to folders
    const foldersQuery = query(
      collection(db, "pdfFolders"),
      where("roomId", "==", roomId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      const folderData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PdfFolder[];
      setFolders(folderData);
    });

    // Listen to PDF files
    const filesQuery = query(
      collection(db, "pdfFiles"),
      where("roomId", "==", roomId),
      orderBy("uploadedAt", "desc"),
    );

    const unsubscribeFiles = onSnapshot(filesQuery, (snapshot) => {
      const fileData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PdfFile[];
      setPdfFiles(fileData);
    });

    return () => {
      unsubscribeFolders();
      unsubscribeFiles();
    };
  }, [roomId]);

  const createFolder = async () => {
    if (!newFolderName.trim() || !currentUser) return;

    try {
      await addDoc(collection(db, "pdfFolders"), {
        name: newFolderName.trim(),
        createdBy: currentUser.uid,
        createdByName:
          currentUser.displayName || currentUser.email || "Anonymous",
        createdAt: serverTimestamp(),
        roomId: roomId,
      });

      setNewFolderName("");
      setShowCreateFolder(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder. Please try again.");
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this folder and all its files?",
      )
    )
      return;

    try {
      // Delete all files in the folder from R2 and Firestore
      const folderFiles = pdfFiles.filter((file) => file.folderId === folderId);

      for (const file of folderFiles) {
        try {
          await deleteFromSupabase(file.publicId);
          await deleteDoc(doc(db, "pdfFiles", file.id));
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }

      // Delete the folder
      await deleteDoc(doc(db, "pdfFolders", folderId));

      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("Failed to delete folder. Please try again.");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedFolder || !currentUser) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (file.type !== "application/pdf") {
          alert(`${file.name} is not a PDF file. Only PDF files are allowed.`);
          continue;
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum file size is 50MB.`);
          continue;
        }

        // Upload to Supabase with folder structure
        const folderPath = `study-rooms/${roomId}/pdfs/${selectedFolder}`;
        const uploadResult = await uploadToSupabase(file, folderPath);

        // Save to Firestore
        await addDoc(collection(db, "pdfFiles"), {
          name: file.name,
          url: uploadResult.url,
          publicId: uploadResult.path, // Use path instead of public_id
          uploadedBy: currentUser.uid,
          uploadedByName:
            currentUser.displayName || currentUser.email || "Anonymous",
          uploadedAt: serverTimestamp(),
          folderId: selectedFolder,
          roomId: roomId,
          size: file.size,
        });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const deletePdfFile = async (fileId: string, publicId: string) => {
    if (!window.confirm("Are you sure you want to delete this PDF?")) return;

    setLoadingFiles((prev) => new Set(prev).add(fileId));

    try {
      await deleteFromSupabase(publicId);
      await deleteDoc(doc(db, "pdfFiles", fileId));
    } catch (error) {
      console.error("Error deleting PDF:", error);
      alert("Failed to delete PDF. Please try again.");
    } finally {
      setLoadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const getFilteredFiles = () => {
    let files = selectedFolder
      ? pdfFiles.filter((file) => file.folderId === selectedFolder)
      : [];

    if (searchTerm) {
      files = files.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return files;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // For Supabase, URLs are already properly formatted and accessible
  const convertPdfUrl = (originalUrl: string, publicId: string): string => {
    // Supabase URLs are directly accessible, no conversion needed
    return originalUrl;
  };

  const openPdfInNewTab = (url: string, fileName: string) => {
    // Supabase URLs work directly
    console.log("Opening PDF:", {
      url: url,
      fileName: fileName,
    });

    // Open PDF in modal viewer for better user experience
    setViewingPdf({ url: url, name: fileName });
  };

  const openPdfInBrowserTab = (url: string) => {
    // Supabase URLs work directly
    console.log("Opening PDF in browser tab:", {
      url: url,
    });

    // Open using Supabase URL directly
    window.open(url, "_blank");
  };

  return (
    <div className="pdf-discussion">
      <div className="pdf-header">
        <h3>PDF Discussion</h3>
        <div className="pdf-actions">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="btn-create-folder"
            title="Create New Folder"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Create New Folder</h4>
              <button onClick={() => setShowCreateFolder(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="folder-name-input"
                maxLength={50}
                onKeyPress={(e) => e.key === "Enter" && createFolder()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="btn-create"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pdf-content">
        {/* Folders Sidebar */}
        <div className="folders-sidebar">
          <div className="folders-header">
            <h4>Folders</h4>
          </div>
          <div className="folders-list">
            {folders.length === 0 ? (
              <div className="no-folders">
                <Folder size={24} />
                <p>No folders yet</p>
                <small>Create your first folder to organize PDFs</small>
              </div>
            ) : (
              folders.map((folder) => {
                const folderFiles = pdfFiles.filter(
                  (file) => file.folderId === folder.id,
                );
                const isSelected = selectedFolder === folder.id;
                const isExpanded = expandedFolders.has(folder.id);

                return (
                  <div key={folder.id} className="folder-item">
                    <div
                      className={`folder-header ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedFolder(folder.id);
                        toggleFolderExpansion(folder.id);
                      }}
                    >
                      <div className="folder-info">
                        <button
                          className="folder-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFolderExpansion(folder.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                        <Folder size={16} />
                        <span className="folder-name">{folder.name}</span>
                        <span className="file-count">
                          ({folderFiles.length})
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolder(folder.id);
                        }}
                        className="delete-folder-btn"
                        title="Delete Folder"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="folder-meta">
                      <small>By {folder.createdByName}</small>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Files Area */}
        <div className="files-area">
          {selectedFolder ? (
            <>
              <div className="files-header">
                <div className="search-upload-row">
                  <div className="search-container">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search PDFs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <div className="upload-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="btn-upload"
                    >
                      <Upload size={16} />
                      {isUploading ? "Uploading..." : "Upload PDFs"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="files-list">
                {getFilteredFiles().length === 0 ? (
                  <div className="no-files">
                    <FileText size={48} />
                    <p>No PDFs in this folder</p>
                    <small>Upload your first PDF to get started</small>
                  </div>
                ) : (
                  getFilteredFiles().map((file) => (
                    <div key={file.id} className="file-item">
                      <div className="file-info">
                        <FileText size={20} className="file-icon" />
                        <div className="file-details">
                          <h5 className="file-name">{file.name}</h5>
                          <div className="file-meta">
                            <span>Uploaded by {file.uploadedByName}</span>
                            <span>•</span>
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>
                              {file.uploadedAt &&
                              typeof file.uploadedAt === "object" &&
                              "toDate" in file.uploadedAt
                                ? file.uploadedAt.toDate().toLocaleDateString()
                                : file.uploadedAt instanceof Date
                                  ? file.uploadedAt.toLocaleDateString()
                                  : "Recently"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="file-actions">
                        <button
                          onClick={() => openPdfInNewTab(file.url, file.name)}
                          className="btn-view"
                          title="View PDF"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openPdfInBrowserTab(file.url)}
                          className="btn-download"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => deletePdfFile(file.id, file.publicId)}
                          disabled={loadingFiles.has(file.id)}
                          className="btn-delete"
                          title="Delete PDF"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="no-folder-selected">
              <Folder size={48} />
              <h4>Select a Folder</h4>
              <p>Choose a folder from the sidebar to view and manage PDFs</p>
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <PdfViewer
          pdfUrl={viewingPdf.url}
          fileName={viewingPdf.name}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </div>
  );
};

export default PdfDiscussion;
