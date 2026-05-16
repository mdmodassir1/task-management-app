import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  defaultDropAnimation,
  PointerSensor,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Fab,
  useMediaQuery,
  useTheme,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Add, Search, FilterList, Clear } from '@mui/icons-material';
import { taskService } from '../../services/taskService';
import { useSocket } from '../../context/SocketContext';
import TaskCard from './TaskCard';
import AddTaskForm from './AddTaskForm';
import TaskSkeleton from '../common/TaskSkeleton';
import ExportMenu from '../common/ExportMenu';
import toast from 'react-hot-toast';

const Board = ({ projectId, projectName = 'My Project' }) => {
  const { socket, joinProject, leaveProject } = useSocket();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState({
    todo: { id: 'todo', title: 'To Do', tasks: [] },
    inprogress: { id: 'inprogress', title: 'In Progress', tasks: [] },
    review: { id: 'review', title: 'Review', tasks: [] },
    done: { id: 'done', title: 'Done', tasks: [] },
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [openAddTask, setOpenAddTask] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState('todo');
  const [activeTask, setActiveTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Organize tasks by status - FIXED: Create new array each time
  const organizeTasksByStatus = useCallback((tasksList) => {
    const newColumns = {
      todo: { id: 'todo', title: 'To Do', tasks: [] },
      inprogress: { id: 'inprogress', title: 'In Progress', tasks: [] },
      review: { id: 'review', title: 'Review', tasks: [] },
      done: { id: 'done', title: 'Done', tasks: [] },
    };
    
    tasksList.forEach(task => {
      const status = task.status || 'todo';
      if (newColumns[status]) {
        // Create a new object to avoid reference issues
        newColumns[status].tasks.push({ ...task });
      }
    });
    
    return newColumns;
  }, []);

  const fetchTasks = useCallback(async (page = 1) => {
    if (!projectId || projectId === 'undefined') {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await taskService.getAllTasks(projectId, page, 20, filters);
      
      setTasks(response.data);
      setPagination(response.pagination);
      setColumns(organizeTasksByStatus(response.data));
    } catch (error) {
      console.error('Fetch tasks error:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId, filters, organizeTasksByStatus]);

  useEffect(() => {
    fetchTasks(pagination.page);
  }, [fetchTasks, pagination.page]);

  // Socket setup
  useEffect(() => {
    if (projectId && socket) {
      joinProject(projectId);
      
      const handleTaskCreated = () => {
        fetchTasks(pagination.page);
        toast.success('New task added by team member!');
      };
      
      const handleTaskDeleted = () => {
        fetchTasks(pagination.page);
        toast.info('Task deleted by team member');
      };
      
      const handleTaskMoved = () => {
        fetchTasks(pagination.page);
        toast.success('Task moved by team member');
      };
      
      const handleCommentAdded = () => {
        fetchTasks(pagination.page);
      };
      
      socket.on('task:created', handleTaskCreated);
      socket.on('task:deleted', handleTaskDeleted);
      socket.on('task:moved', handleTaskMoved);
      socket.on('comment:added', handleCommentAdded);
      
      return () => {
        socket.off('task:created', handleTaskCreated);
        socket.off('task:deleted', handleTaskDeleted);
        socket.off('task:moved', handleTaskMoved);
        socket.off('comment:added', handleCommentAdded);
        leaveProject(projectId);
      };
    }
  }, [projectId, socket, fetchTasks, pagination.page, joinProject, leaveProject]);

  const handleDragStart = (event) => {
    const { active } = event;
    document.body.classList.add('dragging');
    // Find task from tasks array, not from columns
    const task = tasks.find(t => t._id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (over && (over.id === 'todo' || over.id === 'inprogress' || over.id === 'review' || over.id === 'done')) {
      setDragOverColumn(over.id);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    document.body.classList.remove('dragging');
    setDragOverColumn(null);
    setActiveTask(null);
    
    if (!over || active.id === over.id) return;
    
    const sourceTask = tasks.find(t => t._id === active.id);
    if (!sourceTask) return;
    
    let targetStatus = null;
    
    if (over.id === 'todo' || over.id === 'inprogress' || over.id === 'review' || over.id === 'done') {
      targetStatus = over.id;
    } else {
      const targetTask = tasks.find(t => t._id === over.id);
      if (targetTask) targetStatus = targetTask.status;
    }
    
    if (!targetStatus || sourceTask.status === targetStatus) return;
    
    // Update tasks array
    const updatedTasks = tasks.map(task => 
      task._id === active.id ? { ...task, status: targetStatus } : task
    );
    setTasks(updatedTasks);
    
    // Update columns with new tasks
    setColumns(organizeTasksByStatus(updatedTasks));
    
    try {
      await taskService.updateTaskStatus(active.id, targetStatus);
      toast.success(`Task moved to ${targetStatus === 'todo' ? 'To Do' : targetStatus === 'inprogress' ? 'In Progress' : targetStatus === 'review' ? 'Review' : 'Done'}`);
      fetchTasks(pagination.page);
    } catch (error) {
      fetchTasks(pagination.page);
      toast.error('Failed to move task');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', search: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAddTask = (columnId) => {
    setSelectedColumn(columnId);
    setOpenAddTask(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      await taskService.createTask({
        ...taskData,
        projectId,
        status: selectedColumn,
      });
      
      toast.success('Task created successfully');
      setOpenAddTask(false);
      fetchTasks(1);
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    
    try {
      await taskService.deleteTask(taskId);
      toast.success('Task deleted!');
      fetchTasks(pagination.page);
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleCommentAdded = (taskId, newComment) => {
    const updatedTasks = tasks.map(task => {
      if (task._id === taskId) {
        return {
          ...task,
          comments: [...(task.comments || []), newComment]
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    setColumns(organizeTasksByStatus(updatedTasks));
  };

  const handleCommentDeleted = (taskId, commentId) => {
    const updatedTasks = tasks.map(task => {
      if (task._id === taskId) {
        return {
          ...task,
          comments: (task.comments || []).filter(c => c._id !== commentId)
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    setColumns(organizeTasksByStatus(updatedTasks));
  };

  const columnsData = [
    { id: 'todo', title: 'To Do', color: '#1976d2' },
    { id: 'inprogress', title: 'In Progress', color: '#ed6c02' },
    { id: 'review', title: 'Review', color: '#9c27b0' },
    { id: 'done', title: 'Done', color: '#2e7d32' },
  ];

  if (loading && tasks.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <TaskSkeleton />
        <TaskSkeleton />
        <TaskSkeleton />
      </Box>
    );
  }

  return (
    <>
      {/* Toolbar with Export */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Task Board
        </Typography>
        <ExportMenu 
          tasks={tasks} 
          columns={columns} 
          projectName={projectName}
          isLoading={loading}
        />
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            variant={showFilters ? "contained" : "outlined"}
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            Filters
          </Button>
          
          {(filters.status || filters.priority || filters.search) && (
            <Button size="small" onClick={clearFilters} startIcon={<Clear />}>
              Clear All
            </Button>
          )}
        </Box>
        
        {showFilters && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="todo">To Do</MenuItem>
                <MenuItem value="inprogress">In Progress</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="done">Done</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                label="Priority"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>

      {/* Active Filters Display */}
      {(filters.status || filters.priority || filters.search) && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {filters.search && (
            <Chip 
              label={`Search: ${filters.search}`} 
              size="small" 
              onDelete={() => handleFilterChange('search', '')} 
            />
          )}
          {filters.status && (
            <Chip 
              label={`Status: ${filters.status === 'todo' ? 'To Do' : filters.status === 'inprogress' ? 'In Progress' : filters.status === 'review' ? 'Review' : 'Done'}`} 
              size="small" 
              onDelete={() => handleFilterChange('status', '')} 
            />
          )}
          {filters.priority && (
            <Chip 
              label={`Priority: ${filters.priority}`} 
              size="small" 
              onDelete={() => handleFilterChange('priority', '')} 
            />
          )}
        </Box>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ overflowX: 'auto', pb: 8 }}>
          <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ minWidth: isMobile ? 'auto' : 800 }}>
            {columnsData.map((column) => (
              <Grid item xs={12} sm={6} md={3} key={column.id}>
                <Paper
                  id={column.id}
                  className={`droppable-column ${dragOverColumn === column.id ? 'drag-over' : ''}`}
                  sx={{
                    p: { xs: 1, sm: 2 },
                    bgcolor: dragOverColumn === column.id ? '#e3f2fd' : '#f8f9fa',
                    minHeight: { xs: 'auto', sm: '70vh' },
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'background-color 0.2s',
                    mb: { xs: 2, sm: 0 },
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 1.5, 
                    pb: 1, 
                    borderBottom: `2px solid ${column.color}`,
                    flexWrap: 'wrap',
                    gap: 1,
                  }}>
                    <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={600}>
                      {column.title}
                      <Typography component="span" sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>
                        ({columns[column.id]?.tasks?.length || 0})
                      </Typography>
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<Add />} 
                      onClick={() => handleAddTask(column.id)}
                      sx={{ minWidth: 'auto', px: { xs: 1, sm: 2 } }}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <SortableContext 
                    id={column.id} 
                    items={columns[column.id]?.tasks?.map(t => t._id) || []} 
                    strategy={verticalListSortingStrategy}
                  >
                    <Box sx={{ flex: 1 }}>
                      {columns[column.id]?.tasks?.map((task) => (
                        <TaskCard 
                          key={task._id} 
                          task={task} 
                          onDelete={handleDeleteTask}
                          onCommentAdded={(comment) => handleCommentAdded(task._id, comment)}
                          onCommentDeleted={(commentId) => handleCommentDeleted(task._id, commentId)}
                        />
                      ))}
                      {(!columns[column.id]?.tasks || columns[column.id].tasks.length === 0) && !loading && (
                        <Box
                          sx={{
                            p: { xs: 2, sm: 3 },
                            textAlign: 'center',
                            color: 'text.secondary',
                            border: '2px dashed #ccc',
                            borderRadius: 2,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#f5f5f5' }
                          }}
                          onClick={() => handleAddTask(column.id)}
                        >
                          <Typography variant="body2">📌 No tasks</Typography>
                          <Button size="small" sx={{ mt: 1 }}>+ Add Task</Button>
                        </Box>
                      )}
                    </Box>
                  </SortableContext>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
        <DragOverlay dropAnimation={defaultDropAnimation}>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>

      {/* Pagination */}
      {!loading && tasks.length > 0 && pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Typography variant="body2">
              Page {pagination.page} of {pagination.pages}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={pagination.page === pagination.pages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}

      {/* Pagination Info */}
      {!loading && tasks.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
        </Typography>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleAddTask('todo')}
        >
          <Add />
        </Fab>
      )}

      <AddTaskForm open={openAddTask} onClose={() => setOpenAddTask(false)} onSave={handleSaveTask} />
    </>
  );
};

export default Board;