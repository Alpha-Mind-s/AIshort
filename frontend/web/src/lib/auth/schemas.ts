import { z } from "zod";

// ---- Form schemas ----

export const loginSchema = z.object({
  email: z.string().min(1, "auth.error_required").email("auth.error_email"),
  password: z
    .string()
    .min(1, "auth.error_required")
    .min(8, "auth.error_password"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().min(1, "auth.error_required").email("auth.error_email"),
  password: z
    .string()
    .min(1, "auth.error_required")
    .min(8, "auth.error_password"),
  nickname: z
    .string()
    .min(1, "auth.error_required")
    .max(100, "auth.error_required"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ---- Custom zod resolver for react-hook-form ----

import type { Resolver, FieldErrors } from "react-hook-form";

export function zodResolver<T extends z.ZodTypeAny>(
  schema: T
): Resolver<z.infer<T>> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} as FieldErrors<z.infer<T>> };
    }
    const fieldErrors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (path) {
        fieldErrors[path] = { type: issue.code, message: issue.message };
      }
    }
    return {
      values: {} as z.infer<T>,
      errors: fieldErrors as FieldErrors<z.infer<T>>,
    };
  };
}
