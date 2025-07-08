import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import './TaskManager.css';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedTo: string[];
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueDate: Timestamp | null;
}

interface TaskManagerProps {
  roomId: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ roomId }) => {
  const { currentUser, userProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
  const [filterAssigned, setFilterAssigned] = useState<'all' | 'me'>('all');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0
  });
  
  // Load tasks
  useEffect(() => {
    if (!roomId || !currentUser) return;
    
    setIsLoading(true);
    
    const tasksRef = collection(db, 'studyRooms', roomId, 'tasks');
    let q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    // Apply filters
    if (filterStatus !== 'all') {
      q = query(q, where('status', '==', filterStatus));
    }
    
    if (filterAssigned === 'me') {
      q = query(q, where('assignedTo', 'array-contains', currentUser.uid));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const loadedTasks: Task[] = [];
        snapshot.forEach((doc) => {
          loadedTasks.push({
            id: doc.id,
            ...doc.data()
          } as Task);
        });
        setTasks(loadedTasks);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('Failed to load tasks');
        setIsLoading(false);
      }
    }, (err) => {
      console.error('Error subscribing to tasks updates:', err);
      setError('Failed to subscribe to tasks updates');
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [roomId, currentUser, filterStatus, filterAssigned]);
  
  // Calculate task statistics when tasks change
  useEffect(() => {
    const stats = {
      total: tasks.length,
      completed: tasks.filter(task => task.status === 'done').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      todo: tasks.filter(task => task.status === 'todo').length
    };
    setTaskStats(stats);
  }, [tasks]);
  
  // Add new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId || !currentUser || !userProfile) return;
    if (!newTask.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    try {
      setIsAddingTask(true);
      setError('');
      
      const tasksRef = collection(db, 'studyRooms', roomId, 'tasks');
      
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        status: 'todo' as const,
        assignedTo: [currentUser.uid], // Assign to self by default
        createdBy: currentUser.uid,
        createdByName: userProfile.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dueDate: newTask.dueDate ? Timestamp.fromDate(new Date(newTask.dueDate)) : null
      };
      
      await addDoc(tasksRef, taskData);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        dueDate: ''
      });
      setShowNewTaskForm(false);
      setIsAddingTask(false);
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task');
      setIsAddingTask(false);
    }
  };
  
  // Update task status
  const handleUpdateStatus = async (taskId: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    if (!roomId || !currentUser) return;
    
    try {
      const taskRef = doc(db, 'studyRooms', roomId, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status');
    }
  };
  
  // Delete task
  const handleDeleteTask = async (taskId: string, createdBy: string) => {
    if (!roomId || !currentUser) return;
    
    // Only allow deletion if user is the creator
    if (createdBy !== currentUser.uid) {
      setError('You can only delete tasks you created');
      return;
    }
    
    try {
      const taskRef = doc(db, 'studyRooms', roomId, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };
  
  // Toggle task assignment
  const handleToggleAssignment = async (task: Task) => {
    if (!roomId || !currentUser) return;
    
    try {
      const taskRef = doc(db, 'studyRooms', roomId, 'tasks', task.id);
      
      if (task.assignedTo.includes(currentUser.uid)) {
        // Remove self from task
        await updateDoc(taskRef, {
          assignedTo: task.assignedTo.filter(id => id !== currentUser.uid),
          updatedAt: serverTimestamp()
        });
      } else {
        // Assign self to task
        await updateDoc(taskRef, {
          assignedTo: [...task.assignedTo, currentUser.uid],
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error updating task assignment:', err);
      setError('Failed to update task assignment');
    }
  };
  
  // Format date
  const formatDate = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'No due date';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString();
  };
  
  // Check if task is overdue
  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate) return false;
    
    const now = new Date();
    const dueDate = task.dueDate.toDate();
    return dueDate < now && task.status !== 'done';
  };
  
  if (isLoading) {
    return <div className="tasks-loading">Loading tasks...</div>;
  }
  
  return (
    <div className="task-manager">
      <div className="tasks-header">
        <h3>Tasks</h3>
        <div className="task-controls">
          <div className="task-filters">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Completed</option>
            </select>
            
            <select 
              value={filterAssigned} 
              onChange={(e) => setFilterAssigned(e.target.value as any)}
              className="assigned-filter"
            >
              <option value="all">All Tasks</option>
              <option value="me">Assigned to Me</option>
            </select>
          </div>
          
          <button 
            className="add-task-btn"
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          >
            {showNewTaskForm ? 'Cancel' : 'Add Task'}
          </button>
        </div>
      </div>
      
      {error && <div className="tasks-error">{error}</div>}
      
      {/* Task Progress Dashboard */}
      {!showNewTaskForm && tasks.length > 0 && (
        <div className="task-progress-dashboard">
          <div className="task-stats">
            <div className="stat-item">
              <div className="stat-label">Total</div>
              <div className="stat-value">{taskStats.total}</div>
            </div>
            <div className="stat-item todo">
              <div className="stat-label">To Do</div>
              <div className="stat-value">{taskStats.todo}</div>
            </div>
            <div className="stat-item in-progress">
              <div className="stat-label">In Progress</div>
              <div className="stat-value">{taskStats.inProgress}</div>
            </div>
            <div className="stat-item done">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{taskStats.completed}</div>
            </div>
          </div>
          
          <div className="progress-container">
            <div className="progress-label">
              {taskStats.total > 0 ? (
                `${Math.round((taskStats.completed / taskStats.total) * 100)}% Complete`
              ) : 'No tasks yet'}
            </div>
            <div className="progress-bar-wrapper">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <div className="progress-segments">
              {taskStats.total > 0 && (
                <>
                  {taskStats.todo > 0 && (
                    <div 
                      className="segment todo" 
                      style={{ 
                        width: `${(taskStats.todo / taskStats.total) * 100}%` 
                      }}
                    ></div>
                  )}
                  {taskStats.inProgress > 0 && (
                    <div 
                      className="segment in-progress" 
                      style={{ 
                        width: `${(taskStats.inProgress / taskStats.total) * 100}%` 
                      }}
                    ></div>
                  )}
                  {taskStats.completed > 0 && (
                    <div 
                      className="segment done" 
                      style={{ 
                        width: `${(taskStats.completed / taskStats.total) * 100}%` 
                      }}
                    ></div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showNewTaskForm && (
        <div className="new-task-form">
          <form onSubmit={handleAddTask}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              />
            </div>
            <div className="form-group">
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              />
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                disabled={isAddingTask || !newTask.title.trim()}
              >
                {isAddingTask ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="no-tasks">
            <p>No tasks found</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className={`task-item ${task.status} ${isOverdue(task) ? 'overdue' : ''}`}
            >
              <div className="task-header">
                <h4 className="task-title">{task.title}</h4>
                <div className="task-actions">
                  {currentUser && task.createdBy === currentUser.uid && (
                    <button 
                      className="delete-task-btn"
                      onClick={() => handleDeleteTask(task.id, task.createdBy)}
                      title="Delete task"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              
              <div className="task-meta">
                <div className="task-status-controls">
                  <span className="status-label">Status:</span>
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(task.id, e.target.value as any)}
                    className={`status-select ${task.status}`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>
                </div>
                
                <div className="task-info">
                  <span className="task-creator">By: {task.createdByName}</span>
                  <span className={`task-due-date ${isOverdue(task) ? 'overdue' : ''}`}>
                    Due: {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>
              
              <div className="task-assignment">
                <button 
                  className={`assignment-toggle ${currentUser && task.assignedTo.includes(currentUser.uid) ? 'assigned' : ''}`}
                  onClick={() => handleToggleAssignment(task)}
                >
                  {currentUser && task.assignedTo.includes(currentUser.uid) ? 'Assigned to Me' : 'Assign to Me'}
                </button>
                <span className="assignment-count">
                  {task.assignedTo.length} {task.assignedTo.length === 1 ? 'person' : 'people'} assigned
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManager; 