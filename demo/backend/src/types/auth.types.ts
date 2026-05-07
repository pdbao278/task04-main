import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải ít nhất 8 ký tự')
    .max(100, 'Mật khẩu tối đa 100 ký tự'),
  name: z
    .string()
    .min(1, 'Tên không được để trống')
    .max(100, 'Tên tối đa 100 ký tự')
    .transform((val) => val.trim()),
});

export const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export const InviteMemberSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  role: z.enum(['MANAGER', 'MEMBER']).default('MEMBER'),
});

export const ChangeRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']),
});

export const CreateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên workspace không được để trống')
    .max(100, 'Tên workspace tối đa 100 ký tự')
    .transform((val) => val.trim()),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type ChangeRoleInput = z.infer<typeof ChangeRoleSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
