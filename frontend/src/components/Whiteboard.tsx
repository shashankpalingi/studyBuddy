import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  collection, 
  addDoc, 
  deleteDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  Timestamp,
  orderBy,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';
import './Whiteboard.css';

interface Point {
  x: number;
  y: number;
}

interface Shape {
  id?: string;
  type: 'freehand' | 'rectangle' | 'circle' | 'line' | 'text' | 'eraser';
  points: Point[];
  color: string;
  width: number;
  text?: string;
  userId: string;
  timestamp: number;
}

type Tool = 'freehand' | 'rectangle' | 'circle' | 'line' | 'text' | 'eraser';

interface WhiteboardProps {
  roomId: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ roomId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentWidth, setCurrentWidth] = useState(2);
  const [currentTool, setCurrentTool] = useState<Tool>('freehand');
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [undoStack, setUndoStack] = useState<Shape[]>([]);
  const [redoStack, setRedoStack] = useState<Shape[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Point | null>(null);

  // Initialize canvas and whiteboard document
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Restore context settings after resize
        const context = canvas.getContext('2d');
        if (context) {
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.strokeStyle = currentColor;
          context.lineWidth = currentWidth;
          contextRef.current = context;
          // Redraw all shapes after resize
          redrawCanvas(shapes);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize whiteboard document in Firestore
    const initializeWhiteboard = async () => {
      if (!currentUser) return;
      
      const whiteboardRef = doc(db, 'studyRooms', roomId, 'tools', 'whiteboard');
      try {
        const whiteboardDoc = await getDoc(whiteboardRef);
        if (!whiteboardDoc.exists()) {
          await setDoc(whiteboardRef, {
            createdAt: Timestamp.now(),
            createdBy: currentUser.uid,
            lastUpdated: Timestamp.now()
          });
        }
      } catch (error) {
        console.error('Error initializing whiteboard:', error);
      }
    };

    initializeWhiteboard();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [roomId, shapes, currentColor, currentWidth, currentUser]);

  // Subscribe to whiteboard updates
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const whiteboardRef = doc(db, 'studyRooms', roomId, 'tools', 'whiteboard');
    const shapesCollection = collection(whiteboardRef, 'shapes');
    const q = query(shapesCollection, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firebaseShapes: Shape[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = typeof data.timestamp === 'number' 
          ? data.timestamp 
          : data.timestamp.toMillis();
        firebaseShapes.push({ id: doc.id, ...data, timestamp } as Shape);
      });

      setShapes(currentLocalShapes => {
        const confirmedShapeIds = new Set(firebaseShapes.map(s => s.id));
        const mergedShapes: Shape[] = [];
        
        // Add all Firebase shapes first
        firebaseShapes.forEach(fShape => {
          mergedShapes.push(fShape);
        });

        // Then add any local shapes that don't exist in Firebase yet
        currentLocalShapes.forEach(localShape => {
          if (localShape.id && !confirmedShapeIds.has(localShape.id)) {
            mergedShapes.push(localShape);
          }
        });

        // Remove duplicates by ID and sort by timestamp
        const finalShapes = Array.from(
          new Map(mergedShapes.map(item => [item.id || `temp-${item.timestamp}`, item])).values()
        );
        finalShapes.sort((a, b) => a.timestamp - b.timestamp);

        // Redraw the canvas with the updated shapes
        if (canvasRef.current && contextRef.current) {
          redrawCanvas(finalShapes);
        }
        return finalShapes;
      });
    }, (error) => {
      console.error("Error in Whiteboard snapshot listener:", error);
    });

    return () => unsubscribe();
  }, [roomId, currentUser]);

  const redrawCanvas = (shapesToDraw: Shape[]) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all shapes
    shapesToDraw.forEach((shape) => {
      if (!shape.points || shape.points.length === 0) return;

      context.beginPath();
      context.strokeStyle = shape.color;
      context.lineWidth = shape.width;
      context.lineCap = 'round';
      context.lineJoin = 'round';

      switch (shape.type) {
        case 'freehand':
        case 'eraser':
          context.moveTo(shape.points[0].x, shape.points[0].y);
          shape.points.forEach((point, index) => {
            if (index > 0) {
              context.lineTo(point.x, point.y);
            }
          });
          if (shape.type === 'eraser') {
            context.strokeStyle = '#ffffff';
          }
          context.stroke();
          break;

        case 'rectangle':
          if (shape.points.length === 2) {
            const [start, end] = shape.points;
            const width = end.x - start.x;
            const height = end.y - start.y;
            context.strokeRect(start.x, start.y, width, height);
          }
          break;

        case 'circle':
          if (shape.points.length === 2) {
            const [center, radiusPoint] = shape.points;
            const radius = Math.sqrt(
              Math.pow(radiusPoint.x - center.x, 2) + Math.pow(radiusPoint.y - center.y, 2)
            );
            context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            context.stroke();
          }
          break;

        case 'line':
          if (shape.points.length === 2) {
            const [start, end] = shape.points;
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.stroke();
          }
          break;

        case 'text':
          if (shape.text) {
            context.font = `${shape.width * 8}px Arial`;
            context.fillStyle = shape.color;
            context.fillText(shape.text, shape.points[0].x, shape.points[0].y);
          }
          break;
      }
    });
  };

  // Draw current shape while user is interacting
  const drawCurrentShape = (currentPoints: Point[], endPoint?: Point) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context || currentPoints.length === 0) return;

    // First redraw all existing shapes
    redrawCanvas(shapes);

    // Then draw the current shape
    context.beginPath();
    context.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
    context.lineWidth = currentWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    switch (currentTool) {
      case 'freehand':
      case 'eraser':
        context.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.forEach((point, index) => {
          if (index > 0) {
            context.lineTo(point.x, point.y);
          }
        });
        if (endPoint) {
          context.lineTo(endPoint.x, endPoint.y);
        }
        context.stroke();
        break;

      case 'rectangle':
        if (currentPoints.length === 1 && endPoint) {
          const start = currentPoints[0];
          const width = endPoint.x - start.x;
          const height = endPoint.y - start.y;
          context.strokeRect(start.x, start.y, width, height);
        }
        break;

      case 'circle':
        if (currentPoints.length === 1 && endPoint) {
          const center = currentPoints[0];
          const radius = Math.sqrt(
            Math.pow(endPoint.x - center.x, 2) + Math.pow(endPoint.y - center.y, 2)
          );
          context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          context.stroke();
        }
        break;

      case 'line':
        if (currentPoints.length === 1 && endPoint) {
          const start = currentPoints[0];
          context.moveTo(start.x, start.y);
          context.lineTo(endPoint.x, endPoint.y);
          context.stroke();
        }
        break;
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentUser) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'text') {
      setTextPosition({ x, y });
      if (textInputRef.current) {
        textInputRef.current.style.left = `${e.clientX}px`;
        textInputRef.current.style.top = `${e.clientY}px`;
        textInputRef.current.style.display = 'block';
        textInputRef.current.focus();
      }
      return;
    }

    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
    drawCurrentShape([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentUser || currentTool === 'text') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'freehand' || currentTool === 'eraser') {
      setCurrentPoints(prev => [...prev, { x, y }]);
      drawCurrentShape([...currentPoints, { x, y }]);
    } else {
      // For shapes like rectangle, circle, and line, only use start point and current mouse position
      drawCurrentShape(currentPoints, { x, y });
    }
  };

  const endDrawing = async () => {
    if (!isDrawing || !currentUser || currentPoints.length === 0) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const whiteboardRef = doc(db, 'studyRooms', roomId, 'tools', 'whiteboard');
    const shapesCollection = collection(whiteboardRef, 'shapes');

    try {
      let finalPoints = [...currentPoints];
      
      // For shapes that need only 2 points (start and end)
      if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
        // Get the mouse position at the end of drawing
        const rect = canvas.getBoundingClientRect();
        const lastMouseEvent = window.event as MouseEvent;
        if (lastMouseEvent) {
          const endX = lastMouseEvent.clientX - rect.left;
          const endY = lastMouseEvent.clientY - rect.top;
          finalPoints = [currentPoints[0], { x: endX, y: endY }];
        }
      }
      
      const newShape: Omit<Shape, 'id'> = {
        type: currentTool,
        points: finalPoints,
        color: currentTool === 'eraser' ? '#ffffff' : currentColor,
        width: currentWidth,
        timestamp: Timestamp.now().toMillis(),
        userId: currentUser.uid
      };

      if (currentTool === 'text' && textInput) {
        newShape.text = textInput;
      }

      const docRef = await addDoc(shapesCollection, newShape);
      console.log(`Added new shape with ID: ${docRef.id}`);
      
      // Update the whiteboard timestamp
      await updateDoc(whiteboardRef, {
        lastUpdated: Timestamp.now()
      });
      
      // Reset current points
      setCurrentPoints([]);
      setTextInput('');
    } catch (error) {
      console.error('Error saving shape:', error);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput || !textPosition || !currentUser) return;

    const whiteboardRef = doc(db, 'studyRooms', roomId, 'tools', 'whiteboard');
    const shapesCollection = collection(whiteboardRef, 'shapes');

    try {
      const newShape: Omit<Shape, 'id'> = {
        type: 'text',
        points: [textPosition],
        color: currentColor,
        width: currentWidth,
        text: textInput,
        timestamp: Timestamp.now().toMillis(),
        userId: currentUser.uid
      };

      const docRef = await addDoc(shapesCollection, newShape);
      // Optimistically add the new shape to local state with its ID
      setShapes(prevShapes => [...prevShapes, { id: docRef.id, ...newShape }]);
      setTextInput('');
      setTextPosition(null);
      if (textInputRef.current) {
        textInputRef.current.style.display = 'none';
      }
    } catch (error) {
      console.error('Error saving text shape:', error);
    }
  };

  const undo = async () => {
    if (!currentUser) return;

    // Fetch all shapes to get the current state
    const whiteboardRef = doc(db, 'studyRooms', roomId, 'tools', 'whiteboard');
    const shapesCollection = collection(whiteboardRef, 'shapes');
    const q = query(shapesCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const allShapes: Shape[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = typeof data.timestamp === 'number'
        ? data.timestamp
        : data.timestamp.toMillis();
      allShapes.push({ id: doc.id, ...data, timestamp } as Shape);
    });

    const lastShape = allShapes.find(shape => shape.userId === currentUser.uid);

    if (lastShape) {
      try {
        await deleteDoc(doc(shapesCollection, lastShape.id!));
        // The onSnapshot listener will update the local state
        setRedoStack(prev => [...prev, lastShape]);
      } catch (error) {
        console.error('Error undoing shape:', error);
      }
    }
  };

  const redo = async () => {
    if (redoStack.length === 0 || !currentUser) return;

    const lastRedoShape = redoStack[redoStack.length - 1];

    const whiteboardRef = doc(db, 'studyRooms', roomId, 'tools', 'whiteboard');
    const shapesCollection = collection(whiteboardRef, 'shapes');

    try {
      await addDoc(shapesCollection, {
        ...lastRedoShape,
        id: undefined, // Let Firestore generate a new ID
        timestamp: Timestamp.now().toMillis() // Use current timestamp for redo
      });
      setRedoStack(prev => prev.slice(0, prev.length - 1));
      // The onSnapshot listener will update the local state
    } catch (error) {
      console.error('Error redoing shape:', error);
    }
  };

  const clearWhiteboard = async () => {
    if (!currentUser) return;

    const whiteboardRef = doc(db, 'studyRooms', roomId, 'tools', 'whiteboard');
    const shapesCollection = collection(whiteboardRef, 'shapes');

    try {
      // Only allow clearing if the current user is the creator of the whiteboard tool
      const whiteboardDoc = await getDoc(whiteboardRef);
      if (whiteboardDoc.exists() && whiteboardDoc.data()?.createdBy === currentUser.uid) {
        const querySnapshot = await getDocs(shapesCollection);
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        setUndoStack([]);
        setRedoStack([]);
      } else {
        console.warn('Only the whiteboard creator can clear the whiteboard.');
      }
    } catch (error) {
      console.error('Error clearing whiteboard:', error);
    }
  };

  const exportWhiteboard = async () => {
    if (!canvasRef.current || !currentUser) return;

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      // Create File object
      const file = new File([blob], `whiteboard-${Date.now()}.png`, { type: 'image/png' });

      // Upload to Cloudinary
      const result = await uploadToCloudinary(file);

      // Save reference in Firestore
      const whiteboardRef = doc(db, 'studyRooms', roomId, 'tools', 'whiteboard');
      await updateDoc(whiteboardRef, {
        exports: arrayUnion({
          url: result.url,
          exportedAt: Timestamp.now(),
          exportedBy: currentUser.uid,
          fileName: file.name
        })
      });

      // Provide download link
      const downloadLink = document.createElement('a');
      downloadLink.href = result.url;
      downloadLink.download = file.name;
      downloadLink.click();
    } catch (error) {
      console.error('Error exporting whiteboard:', error);
    }
  };

  return (
    <div className="whiteboard-container">
      <div className="whiteboard-toolbar">
        <div className="tool-group">
          <button
            className={`tool-btn ${currentTool === 'freehand' ? 'active' : ''}`}
            onClick={() => setCurrentTool('freehand')}
            title="Freehand"
          >
            ✏️
          </button>
          <button
            className={`tool-btn ${currentTool === 'line' ? 'active' : ''}`}
            onClick={() => setCurrentTool('line')}
            title="Line"
          >
            ⟋
          </button>
          <button
            className={`tool-btn ${currentTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => setCurrentTool('rectangle')}
            title="Rectangle"
          >
            □
          </button>
          <button
            className={`tool-btn ${currentTool === 'circle' ? 'active' : ''}`}
            onClick={() => setCurrentTool('circle')}
            title="Circle"
          >
            ○
          </button>
          <button
            className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
            onClick={() => setCurrentTool('text')}
            title="Text"
          >
            T
          </button>
          <button
            className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
            onClick={() => setCurrentTool('eraser')}
            title="Eraser"
          >
            🧹
          </button>
        </div>

        <div className="tool-group">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            title="Select Color"
          />
          <input
            type="range"
            min="1"
            max="20"
            value={currentWidth}
            onChange={(e) => setCurrentWidth(Number(e.target.value))}
            title="Brush Size"
          />
        </div>

        <div className="tool-group">
          <button
            onClick={undo}
            disabled={shapes.length === 0}
            className="action-btn"
            title="Undo"
          >
            ↩️
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="action-btn"
            title="Redo"
          >
            ↪️
          </button>
          <button onClick={clearWhiteboard} className="clear-btn" title="Clear">
            🗑️
          </button>
          <button onClick={exportWhiteboard} className="export-btn" title="Export">
            💾
          </button>
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className="whiteboard-canvas"
        />
        <input
          ref={textInputRef}
          type="text"
          className="text-input"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTextSubmit();
            }
          }}
          onBlur={handleTextSubmit}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default Whiteboard; 