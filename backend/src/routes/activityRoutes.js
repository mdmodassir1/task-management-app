import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getActivities } from '../controllers/activityController.js';

const router = express.Router();

router.use(protect);

router.get('/:projectId', getActivities);

export default router;