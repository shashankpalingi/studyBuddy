import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MessageSquare, Play, Save, Copy, Info, RefreshCw } from "lucide-react";
import { PyodideInterface } from "../types/pyodide";
import "./CodingIDE.css";

// Theme options for the code editor
const themes = {
  dark: {
    background: "#1e1e1e",
    text: "#ffffff",
    comment: "#6A9955",
    keyword: "#569CD6",
    string: "#CE9178",
    number: "#B5CEA8",
    function: "#DCDCAA",
  },
  light: {
    background: "#ffffff",
    text: "#000000",
    comment: "#008000",
    keyword: "#0000ff",
    string: "#a31515",
    number: "#098658",
    function: "#795E26",
  },
};

interface CodingIDEProps {
  roomId?: string; // Making roomId optional since it's a standalone feature
}

const CodingIDE: React.FC<CodingIDEProps> = ({ roomId }) => {
  const { currentUser, userProfile } = useAuth();
  const [code, setCode] = useState(
    '# Write your Python code here\nprint("Hello, world!")\n\n# Example: Add two numbers\ndef add(a, b):\n    return a + b\n\nprint(add(5, 3))',
  );
  const [output, setOutput] = useState("");
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [showChatbot, setShowChatbot] = useState(false);
  const [query, setQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can help you with coding. Ask me anything or request code examples!",
    },
  ]);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Load Pyodide when component mounts
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        setIsLoading(true);
        // Only load the script if it hasn't been loaded yet
        if (!window.loadPyodide) {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/pyodide/v0.24.0/full/pyodide.js";
          script.async = true;
          document.body.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        // Initialize Pyodide
        const pyodideInstance = await window.loadPyodide();
        await pyodideInstance.loadPackagesFromImports(code);
        setPyodide(pyodideInstance);
        setIsLoading(false);

        // Set up custom print function to capture output
        await pyodideInstance.runPython(`
          import sys
          from pyodide.ffi import create_proxy

          class PyodideOutput:
              def __init__(self):
                  self.outputs = []

              def write(self, text):
                  self.outputs.append(text)

              def flush(self):
                  pass

              def getvalue(self):
                  return ''.join(self.outputs)

          sys.stdout = PyodideOutput()
          sys.stderr = PyodideOutput()
        `);

        // Add a welcome message to output
        setOutput("Python environment loaded successfully. Ready to run code!");
      } catch (error) {
        console.error("Failed to load Pyodide:", error);
        setOutput(`Error loading Python environment: ${error.message}`);
        setIsLoading(false);
      }
    };

    loadPyodide();

    // Clean up
    return () => {
      // Nothing to clean up for now
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load only, code will be handled separately

  // Run the Python code
  const runCode = async () => {
    if (!pyodide || isLoading) return;

    try {
      setIsRunning(true);
      setOutput("Running...");

      // Reset stdout before running
      await pyodide.runPython(`
        import sys
        sys.stdout.outputs = []
        sys.stderr.outputs = []
      `);

      // Run the user's code
      await pyodide.runPythonAsync(code);

      // Get output from stdout
      const stdout = await pyodide.runPython("sys.stdout.getvalue()");
      const stderr = await pyodide.runPython("sys.stderr.getvalue()");

      // Display output
      setOutput(String(stdout) + String(stderr));

      // Scroll output to bottom
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    } catch (error) {
      console.error("Error running code:", error);
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle code changes
  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Toggle chatbot visibility
  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  // Send query to Groq LLM
  const sendQuery = async (e) => {
    e.preventDefault();

    if (!query.trim() || isProcessingQuery) return;

    // Add user message to chat
    const userMessage = { role: "user", content: query };
    setChatMessages((prev) => [...prev, userMessage]);

    // Clear input field
    setQuery("");
    setIsProcessingQuery(true);

    try {
      // Scroll chat to bottom
      if (chatMessagesRef.current) {
        setTimeout(() => {
          chatMessagesRef.current.scrollTop =
            chatMessagesRef.current.scrollHeight;
        }, 100);
      }

      // Get selected code or use all code
      const selection = window.getSelection().toString();
      const contextCode = selection || code;

      // Prepare the prompt
      const prompt = {
        messages: [
          {
            role: "system",
            content:
              "You are an expert Python programming assistant. Provide clear, concise, and helpful responses to coding questions. When asked to generate code, provide clean, well-commented Python code that is ready to run. If the user is asking about specific code, analyze it and provide insights. Keep your responses focused on the programming task at hand.",
          },
          {
            role: "user",
            content: `${query}\n\nContext (current code):\n\`\`\`python\n${contextCode}\n\`\`\``,
          },
        ],
      };

      // Call Groq API with updated parameters
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ_API2_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile", // Updated to current model name
            messages: prompt.messages,
            temperature: 0.7,
            max_completion_tokens: 1024, // Changed from max_tokens to max_completion_tokens
            top_p: 1,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error?.message || `API request failed: ${response.status}`;
        console.error("Groq API error:", errorData);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: result.choices[0].message.content,
      };

      // Add assistant response to chat
      setChatMessages((prev) => [...prev, assistantMessage]);

      // Log the interaction for analytics (optional)
      console.log("CodingIDE AI interaction:", {
        question: query.substring(0, 50),
        answer: result.choices[0].message.content.substring(0, 50),
      });

      // Check if response contains code block to insert
      const codeBlockMatch = assistantMessage.content.match(
        /```python\n([\s\S]*?)```/,
      );
      if (codeBlockMatch && codeBlockMatch[1]) {
        // Add a button to insert this code
        const codeToInsert = codeBlockMatch[1].trim();
        setTimeout(() => {
          const insertBtn = document.createElement("button");
          insertBtn.textContent = "Insert Code";
          insertBtn.className = "insert-code-btn";
          insertBtn.onclick = () => {
            setCode(codeToInsert);
          };

          // Find the last message and append button
          const lastMsg = document.querySelector(
            ".chatbot-messages .message:last-child .message-content",
          );
          if (lastMsg) {
            lastMsg.appendChild(insertBtn);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error querying Groq LLM:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}`,
        },
      ]);
    } finally {
      setIsProcessingQuery(false);

      // Scroll chat to bottom again after response
      if (chatMessagesRef.current) {
        setTimeout(() => {
          chatMessagesRef.current.scrollTop =
            chatMessagesRef.current.scrollHeight;
        }, 100);
      }
    }
  };

  // For auto-resizing the code editor
  useEffect(() => {
    if (codeEditorRef.current) {
      codeEditorRef.current.style.height = "auto";
      codeEditorRef.current.style.height = `${codeEditorRef.current.scrollHeight}px`;
    }
  }, [code]);

  // Scroll chat to bottom whenever messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const currentTheme = themes[theme];

  return (
    <div className={`coding-ide ${theme}`}>
      <div className="ide-header">
        <h2>Coding IDE</h2>
        <div className="ide-controls">
          <button
            className="ide-btn theme-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            className="ide-btn chatbot-btn"
            onClick={toggleChatbot}
            title={`${showChatbot ? "Hide" : "Show"} code assistant`}
          >
            <MessageSquare size={16} />
            {showChatbot ? "Hide Assistant" : "Code Assistant"}
          </button>
        </div>
      </div>

      <div className="ide-main">
        <div className="ide-editor-container">
          <div className="editor-toolbar">
            <span className="language-label">Python</span>
            <div className="editor-actions">
              <button
                className="ide-btn"
                onClick={() => {
                  navigator.clipboard.writeText(code);
                }}
                title="Copy code"
              >
                <Copy size={16} />
              </button>
              <button
                className="ide-btn"
                onClick={runCode}
                disabled={isLoading || isRunning}
                title="Run code"
              >
                <Play size={16} />
                {isLoading ? "Loading..." : isRunning ? "Running..." : "Run"}
              </button>
            </div>
          </div>
          <textarea
            ref={codeEditorRef}
            className="code-editor"
            value={code}
            onChange={handleCodeChange}
            style={{
              backgroundColor: currentTheme.background,
              color: currentTheme.text,
            }}
            spellCheck="false"
            placeholder="Write your Python code here..."
          />

          <div className="output-container">
            <div className="output-header">Output</div>
            <pre ref={outputRef} className="output-panel">
              {output || "Code output will appear here..."}
            </pre>
          </div>
        </div>

        {showChatbot && (
          <div className="chatbot-container">
            <div className="chatbot-header">
              <h3>Code Assistant</h3>
              <button
                className="close-chatbot"
                onClick={toggleChatbot}
                title="Close assistant"
              >
                ×
              </button>
            </div>
            <div ref={chatMessagesRef} className="chatbot-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === "assistant" ? "🤖" : "👤"}
                  </div>
                  <div className="message-content">
                    {msg.content.split("```").map((part, i) => {
                      // If it's an even index, it's regular text
                      if (i % 2 === 0) {
                        return <p key={i}>{part}</p>;
                      }
                      // If it's an odd index, it's a code block
                      const language = part.split("\n")[0];
                      const code = part.split("\n").slice(1).join("\n");
                      return (
                        <pre key={i} className="code-block">
                          <div className="code-block-header">
                            <span>{language || "code"}</span>
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(code)
                              }
                              title="Copy code"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <code>{code}</code>
                        </pre>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <form className="chatbot-input" onSubmit={sendQuery}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isProcessingQuery
                    ? "Thinking..."
                    : "Ask coding questions or request examples..."
                }
                disabled={isProcessingQuery}
              />
              <button
                type="submit"
                disabled={isProcessingQuery || !query.trim()}
              >
                {isProcessingQuery ? (
                  <RefreshCw size={16} className="spin" />
                ) : (
                  "Send"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingIDE;
