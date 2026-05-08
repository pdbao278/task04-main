import { Router } from 'express';
import { authenticate, attachWorkspace } from '../middleware/auth.middleware';
import { globalSearch } from '../controllers/search.controller';

const router = Router();

// All routes require auth + workspace context
router.use(authenticate, attachWorkspace);

router.get('/', globalSearch);

export default router;
