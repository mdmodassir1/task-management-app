import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
  deleteComment,
} from '../controllers/taskController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/status', updateTaskStatus);
router.post('/:id/comments', addComment);
router.delete('/:taskId/comments/:commentId', deleteComment);

export default router;