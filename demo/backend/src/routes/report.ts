import { Router } from 'express';
import { authenticate, attachWorkspace } from '../middleware/auth.middleware';
import { getReports } from '../controllers/report.controller';

const router = Router();

// All routes require auth + workspace context
router.use(authenticate, attachWorkspace);

router.get('/', getReports);

export default router;
