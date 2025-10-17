import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";
import "./AIChatAssistant.css";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Define the reaction type with emoji and users who reacted
interface Reaction {
  emoji: string;
  users: string[]; // Array of user IDs who reacted with this emoji
}

interface AIChatMessage {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: Date;
  isAI: boolean;
  isProcessing?: boolean;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  analysis?: string;
  reactions?: Record<string, Reaction>; // Map of emoji to reaction data
}

interface AIChatAssistantProps {
  roomId: string;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ roomId }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(
    null,
  ); // Store message ID for which reaction picker is shown

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to download chat history as text file
  const downloadChatHistory = () => {
    if (messages.length === 0) return;

    // Format the messages as text
    const chatText = messages
      .map((msg) => {
        const timestamp = msg.timestamp.toLocaleString();
        const sender = msg.isAI ? "StudyBuddy AI" : msg.senderName;
        return `[${timestamp}] ${sender}:\n${msg.content}\n\n`;
      })
      .join("");

    // Create a blob with the text content
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = `studybuddy-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Extract text from PDF using PDF.js
  const extractPDFText = async (file: File): Promise<string> => {
    try {
      console.log("Starting PDF processing for:", file.name);

      const arrayBuffer = await file.arrayBuffer();
      console.log("File read successfully, size:", arrayBuffer.byteLength);

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        disableFontFace: false,
      });

      const pdf = await loadingTask.promise;
      console.log("PDF loaded successfully, pages:", pdf.numPages);

      let fullText = "";

      // Extract text from all pages (limit to first 5 pages for better performance)
      const maxPages = Math.min(pdf.numPages, 5);

      for (let i = 1; i <= maxPages; i++) {
        try {
          console.log(`Processing page ${i}/${maxPages}`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          // Process text items (using type assertion since PDF.js types can be complex)
          const pageText = textContent.items
            .filter(
              (item) =>
                "str" in item &&
                typeof item.str === "string" &&
                item.str.trim() !== "",
            )
            .map((item) => (item as { str: string }).str)
            .join(" ");

          if (pageText.trim()) {
            fullText += pageText + "\n\n";
          }
        } catch (pageError) {
          console.error(`Error processing page ${i}:`, pageError);
          // Continue with other pages even if one fails
        }
      }

      console.log("Extracted text length:", fullText.length);

      if (!fullText.trim()) {
        throw new Error("No text content found in PDF");
      }

      // Limit content to 4000 characters for API efficiency
      const limitedText = fullText.substring(0, 4000);
      console.log("Final text length after limiting:", limitedText.length);

      return limitedText;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  };

  // Extract text from DOC/DOCX using mammoth
  const extractDocText = async (file: File): Promise<string> => {
    try {
      console.log("Starting DOC processing for:", file.name);

      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();

      console.log("File read successfully, size:", arrayBuffer.byteLength);

      const result = await mammoth.extractRawText({ arrayBuffer });

      console.log("Text extracted successfully, length:", result.value.length);

      if (!result.value.trim()) {
        throw new Error("No text content found in document");
      }

      // Limit content to 4000 characters for API efficiency
      const limitedText = result.value.substring(0, 4000);
      console.log("Final text length after limiting:", limitedText.length);

      return limitedText;
    } catch (error) {
      console.error("Error extracting DOC text:", error);
      throw new Error(`Failed to extract text from document: ${error.message}`);
    }
  };

  // Clean response text by removing unwanted characters
  const cleanResponseText = (text: string): string => {
    return text
      .replace(/[-*()]/g, "") // Remove -, *, (, )
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();
  };

  // Process AI query with limited context and direct answers
  const processAIQuery = async (query: string): Promise<string> => {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ_API2_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "user",
                content: `Give a direct, concise answer (maximum 200 words). Be straightforward and factual. Question: ${query}`,
              },
            ],
            temperature: 0.3, // Low temperature for more focused responses
            max_completion_tokens: 300, // Limit response length
            top_p: 0.8,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      const cleanedResponse = cleanResponseText(aiResponse);

      // Log the interaction for analytics (optional)
      console.log("AI Chat interaction:", {
        question: query.substring(0, 50),
        answer: cleanedResponse.substring(0, 50),
      });
      return cleanedResponse;
    } catch (error) {
      console.error("Error processing AI querys:", error);
      throw error;
    }
  };

  // Process file analysis with extracted content
  const processFileAnalysis = async (file: File): Promise<string> => {
    try {
      let extractedContent = "";
      const fileType = file.type;

      console.log("Starting file analysis for:", file.name, "Type:", fileType);

      // Extract content based on file type
      if (
        fileType.includes("pdf") ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        console.log("Processing as PDF");
        extractedContent = await extractPDFText(file);
      } else if (
        fileType.includes("document") ||
        fileType.includes("word") ||
        fileType.includes("msword") ||
        file.name.toLowerCase().endsWith(".doc") ||
        file.name.toLowerCase().endsWith(".docx")
      ) {
        console.log("Processing as DOC/DOCX");
        extractedContent = await extractDocText(file);
      } else {
        console.error(
          "Unsupported file type:",
          fileType,
          "File name:",
          file.name,
        );
        throw new Error(
          "Unsupported file type. Only PDF and DOC/DOCX files are supported.",
        );
      }

      console.log(
        "Content extracted successfully, length:",
        extractedContent.length,
      );

      if (!extractedContent.trim()) {
        throw new Error("No readable content found in the file");
      }

      // Create focused prompt for document analysis
      const prompt = `Analyze this document and provide a concise summary with key points. Be direct and educational. Maximum 250 words.

Document Name: ${file.name}
Content: ${extractedContent.substring(0, 3500)}

Please provide:
1. Main topics
2. Key points
3. Brief summary
4. If academic, explain core concepts simply`;

      console.log("Sending to API...");

      // Make the API call with limited context
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ_API2_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.2, // Very low temperature for focused analysis
            max_tokens: 400, // Limit response length
            top_p: 0.7,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid API response format");
      }

      const analysisResponse = data.choices[0].message.content;
      const cleanedResponse = cleanResponseText(analysisResponse);

      console.log("Analysis completed successfully");

      // Send the file analysis request and response to the n8n webhook in the background
      // without awaiting the response
      fetch("https://n8n.editwithsanjay.in/webhook/studdy-buddy-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Question: `File Analysis Request: ${file.name}`,
          Answer: cleanedResponse,
        }),
      })
        .then(() =>
          console.log("File analysis request and response sent to n8n webhook"),
        )
        .catch((webhookError) =>
          console.error(
            "Error sending file analysis to webhook:",
            webhookError,
          ),
        );

      return cleanedResponse;
    } catch (error) {
      console.error("Error processing file analysis:", error);

      // Provide more specific error messages
      if (error.message.includes("No text content found")) {
        throw new Error(
          "This file appears to be empty or contains no readable text. Please check if the file is valid.",
        );
      } else if (error.message.includes("Unsupported file type")) {
        throw new Error(
          "Only PDF and DOC/DOCX files are supported. Please upload a different file type.",
        );
      } else if (error.message.includes("API error")) {
        throw new Error(
          "There was an issue processing your request. Please try again.",
        );
      } else {
        throw new Error(`Failed to analyze the document: ${error.message}`);
      }
    }
  };

  // Validate file type (only PDFs and DOCs allowed)
  const isValidFileType = (file: File): boolean => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    return (
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension)
    );
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;

    const messageText = newMessage.trim();
    if (messageText === "" && !file) return;

    try {
      const isAIQuery = messageText.toLowerCase().startsWith("@ai");
      const queryText = isAIQuery
        ? messageText.substring(3).trim()
        : messageText;

      // Create a user message
      const userMessage: AIChatMessage = {
        id: uuidv4(),
        content: queryText,
        sender: currentUser.uid,
        senderName: currentUser.displayName || "Anonymous",
        timestamp: new Date(),
        isAI: false,
      };

      // Add the user message to the state
      setMessages((prev) => [...prev, userMessage]);

      // Clear the input field
      setNewMessage("");

      // Handle file upload if there's a file
      if (file) {
        // Validate file type
        if (!isValidFileType(file)) {
          setError("Only PDF and DOC/DOCX files are allowed");
          return;
        }

        // Add file info to user message
        userMessage.attachmentType = file.type;
        userMessage.attachmentName = file.name;

        setMessages((prev) =>
          prev.map((msg) => (msg.id === userMessage.id ? userMessage : msg)),
        );

        // Create an AI response message for file analysis
        const aiMessageId = uuidv4();
        const aiAnalysisMessage: AIChatMessage = {
          id: aiMessageId,
          content: "Analyzing your document...",
          sender: "ai",
          senderName: "StudyBuddy AI",
          timestamp: new Date(),
          isAI: true,
          isProcessing: true,
          attachmentType: file.type,
          attachmentName: file.name,
        };

        setMessages((prev) => [...prev, aiAnalysisMessage]);
        scrollToBottom();

        // Process file analysis
        try {
          setIsProcessing(true);
          const analysis = await processFileAnalysis(file);

          // Update the AI message with the analysis
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: analysis, isProcessing: false }
                : msg,
            ),
          );
        } catch (err) {
          console.error("File analysis error:", err);

          // Provide more specific error message based on error type
          let errorMessage = "Sorry, I couldn't analyze this document.";

          if (err instanceof Error) {
            if (
              err.message.includes("No text content found") ||
              err.message.includes("empty")
            ) {
              errorMessage =
                "This file appears to be empty or contains no readable text. Please check if it's a valid document.";
            } else if (err.message.includes("Unsupported file type")) {
              errorMessage =
                "Only PDF and DOC/DOCX files are supported. Please upload a different file type.";
            } else if (
              err.message.includes("API error") ||
              err.message.includes("processing your request")
            ) {
              errorMessage =
                "There was an issue processing your request. Please try again in a moment.";
            } else {
              errorMessage = `Analysis failed: ${err.message}`;
            }
          }

          // Update the AI message with the specific error
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: errorMessage, isProcessing: false }
                : msg,
            ),
          );

          setError(
            "Document analysis failed. Please try uploading a different file.",
          );
        } finally {
          setIsProcessing(false);
          setFile(null);
          setFilePreviewUrl(null);
          scrollToBottom();
        }
      }
      // Handle AI query
      else if (isAIQuery) {
        // Create an AI response message
        const aiMessageId = uuidv4();
        const aiResponseMessage: AIChatMessage = {
          id: aiMessageId,
          content: "Thinking...",
          sender: "ai",
          senderName: "StudyBuddy AI",
          timestamp: new Date(),
          isAI: true,
          isProcessing: true,
        };

        // Add the AI message to the state
        setMessages((prev) => [...prev, aiResponseMessage]);
        scrollToBottom();

        // Process AI query
        try {
          setIsProcessing(true);
          const response = await processAIQuery(queryText);

          // Update the AI message with the response
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: response, isProcessing: false }
                : msg,
            ),
          );
        } catch (err) {
          // Update the AI message with an error
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    content:
                      "Sorry, I couldn't process your request. Please try again later.",
                    isProcessing: false,
                  }
                : msg,
            ),
          );

          setError("Failed to process AI query");
        } finally {
          setIsProcessing(false);
          scrollToBottom();
        }
      }

      scrollToBottom();
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      if (!isValidFileType(selectedFile)) {
        setError("Only PDF and DOC/DOCX files are allowed");
        return;
      }

      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setFile(selectedFile);
      setError(null); // Clear any previous errors
    }
  };

  // Trigger file input click
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Toggle reaction picker for a specific message
  const toggleReactionPicker = (messageId: string) => {
    setShowReactionPicker((current) =>
      current === messageId ? null : messageId,
    );
  };

  // Add a reaction to a message
  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;

    setMessages((prevMessages) => {
      return prevMessages.map((msg) => {
        if (msg.id === messageId) {
          // Create a new reactions object if it doesn't exist
          const reactions = msg.reactions || {};

          // Create or update the reaction for this emoji
          const existingReaction = reactions[emoji] || { emoji, users: [] };

          // Check if the user has already reacted with this emoji
          const userIndex = existingReaction.users.indexOf(currentUser.uid);

          // If user already reacted, remove their reaction, otherwise add it
          let updatedUsers;
          if (userIndex >= 0) {
            // Remove user from the reaction
            updatedUsers = [
              ...existingReaction.users.slice(0, userIndex),
              ...existingReaction.users.slice(userIndex + 1),
            ];
          } else {
            // Add user to the reaction
            updatedUsers = [...existingReaction.users, currentUser.uid];
          }

          // If no users left after removing, remove the reaction entirely
          if (updatedUsers.length === 0) {
            const { [emoji]: _, ...remainingReactions } = reactions;
            return { ...msg, reactions: remainingReactions };
          }

          // Otherwise update the reaction with the new users list
          return {
            ...msg,
            reactions: {
              ...reactions,
              [emoji]: { emoji, users: updatedUsers },
            },
          };
        }
        return msg;
      });
    });

    // Close reaction picker after selection
    setShowReactionPicker(null);
  };

  // Render file preview
  const renderFilePreview = () => {
    if (!file) return null;

    return (
      <div className="file-preview">
        <span className="file-icon">📄</span>
        <span className="file-name">{file.name}</span>
        <button
          type="button"
          className="remove-file-btn"
          onClick={handleRemoveFile}
        >
          ×
        </button>
      </div>
    );
  };

  // Render a message
  const renderMessage = (message: AIChatMessage) => {
    const isCurrentUser = message.sender === currentUser?.uid;
    const messageClass = isCurrentUser
      ? "user-message"
      : message.isAI
        ? "ai-message"
        : "other-message";

    // Common emoji reactions
    const commonEmojis = ["👍", "👏", "❤️", "🔥", "😊", "🤔"];

    return (
      <div key={message.id} className={`message-container ${messageClass}`}>
        <div className="message-header">
          <span className="sender-name">{message.senderName}</span>
          <span className="timestamp">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="message-content">
          {message.content}

          {/* File attachment */}
          {message.attachmentName && (
            <div className="attachment-preview">
              <div className="file-attachment">
                <span className="file-icon">📄</span>
                <span className="file-name">{message.attachmentName}</span>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {message.isProcessing && (
            <div className="processing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}

          {/* Message reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="message-reactions">
              {Object.values(message.reactions).map((reaction) => (
                <button
                  key={reaction.emoji}
                  className={`reaction-badge ${reaction.users.includes(currentUser?.uid || "") ? "user-reacted" : ""}`}
                  onClick={() => addReaction(message.id, reaction.emoji)}
                >
                  <span className="reaction-emoji">{reaction.emoji}</span>
                  <span className="reaction-count">
                    {reaction.users.length}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Reaction controls */}
          <div className="message-actions">
            <button
              className="reaction-btn"
              onClick={() => toggleReactionPicker(message.id)}
              aria-label="Add reaction"
            >
              😀
            </button>

            {/* Emoji picker */}
            {showReactionPicker === message.id && (
              <div className="emoji-picker">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="emoji-option"
                    onClick={() => addReaction(message.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="ai-welcome-message">
              <h3>Welcome to StudyBuddy AI Chat!</h3>
              <p>
                Ask me anything by starting your message with{" "}
                <strong>@ai</strong>
              </p>
              <p>Examples:</p>
              <ul>
                <li>@ai What is the quadratic formula?</li>
                <li>@ai Explain the concept of photosynthesis</li>
                <li>@ai Help me solve this calculus problem</li>
              </ul>
              <p>You can also upload PDF and DOC files for me to analyze:</p>
              <ul>
                <li>PDF documents and academic papers</li>
                <li>Word documents (.doc, .docx)</li>
                <li>Maximum file size: 10MB</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((message) => renderMessage(message))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="ai-chat-input-form">
        {renderFilePreview()}

        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type @ai to ask a question or upload a PDF/DOC file"
            disabled={isProcessing}
            className="message-input"
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept=".pdf,.doc,.docx"
          />

          <button
            type="button"
            onClick={handleFileButtonClick}
            disabled={isProcessing || !!file}
            className="attach-file-btn"
            title="Attach PDF or DOC file"
          >
            📄
          </button>

          <button
            type="submit"
            disabled={isProcessing && !newMessage.trim() && !file}
            className="send-btn"
          >
            Send
          </button>

          <button
            type="button"
            onClick={downloadChatHistory}
            disabled={messages.length === 0}
            className="download-chat-btn"
            title="Download chat history"
          >
            💾
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChatAssistant;
