import { Router } from 'express';
import { authenticate, attachWorkspace } from '../middleware/auth.middleware';
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';

const router = Router();

// All routes require auth + workspace context
router.use(authenticate, attachWorkspace);

// CRUD — all workspace members can create/update tasks
router.get('/', listTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
