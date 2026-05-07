import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Tên project không được để trống').max(100).trim(),
  description: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Màu không hợp lệ').optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title không được để trống').max(200, 'Title tối đa 200 ký tự').trim(),
  description: z.string().max(5000, 'Mô tả tối đa 5000 ký tự').optional(),
  projectId: z.string().uuid('Project ID không hợp lệ'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
});
