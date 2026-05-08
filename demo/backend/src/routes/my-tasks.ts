import { Router } from 'express';
import { authenticate, attachWorkspace } from '../middleware/auth.middleware';
import { getMyTasks } from '../controllers/my-tasks.controller';

const router = Router();

// All routes require auth + workspace context
router.use(authenticate, attachWorkspace);

router.get('/', getMyTasks);

export default router;
