import { Router } from 'express';
import { authenticate, attachWorkspace, requireRole } from '../middleware/auth.middleware';
import {
  createWorkspace,
  listWorkspaces,
  listMembers,
  inviteMember,
  acceptInvite,
  changeMemberRole,
  removeMember,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspace.controller';

const router = Router();

// Authenticated routes (no workspace context needed)
router.post('/', authenticate, createWorkspace);
router.get('/', authenticate, listWorkspaces);

// Accept invite (authenticated, no workspace context)
router.post('/invites/accept', authenticate, acceptInvite);

// Workspace-scoped routes
router.get('/:id/members', authenticate, attachWorkspace, listMembers);
router.patch('/:id', authenticate, attachWorkspace, requireRole('ADMIN'), updateWorkspace);
router.delete('/:id', authenticate, attachWorkspace, requireRole('ADMIN'), deleteWorkspace);
router.post('/:id/invite', authenticate, attachWorkspace, requireRole('ADMIN'), inviteMember);
router.patch(
  '/:id/members/:memberId/role',
  authenticate,
  attachWorkspace,
  requireRole('ADMIN'),
  changeMemberRole
);
router.delete(
  '/:id/members/:memberId',
  authenticate,
  attachWorkspace,
  requireRole('ADMIN'),
  removeMember
);

export default router;
