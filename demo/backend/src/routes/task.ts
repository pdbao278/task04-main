import { Router } from 'express';
import { authenticate, attachWorkspace } from '../middleware/auth.middleware';
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  changeTaskStatus,
  getActivities,
} from '../controllers/task.controller';
import { createComment, listComments } from '../controllers/comment.controller';

const router = Router();

// All routes require auth + workspace context
router.use(authenticate, attachWorkspace);

// CRUD — all workspace members can create/update tasks
router.get('/', listTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

// Status change (with permission check) — Slice C
router.patch('/:id/status', changeTaskStatus);

// Activity log (read-only) — Slice C
router.get('/:id/activities', getActivities);

// Comments — Slice D (FR-06)
router.post('/:id/comments', createComment);
router.get('/:id/comments', listComments);

export default router;
