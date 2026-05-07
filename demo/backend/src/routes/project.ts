import { Router } from 'express';
import { authenticate, attachWorkspace, requireRole } from '../middleware/auth.middleware';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  archiveProject,
} from '../controllers/project.controller';

const router = Router();

// All routes require auth + workspace context
router.use(authenticate, attachWorkspace);

// List & detail — all roles
router.get('/', listProjects);
router.get('/:id', getProject);

// Create, update, archive — Admin/Manager only
router.post('/', requireRole('ADMIN', 'MANAGER'), createProject);
router.patch('/:id', requireRole('ADMIN', 'MANAGER'), updateProject);
router.post('/:id/archive', requireRole('ADMIN', 'MANAGER'), archiveProject);

export default router;
