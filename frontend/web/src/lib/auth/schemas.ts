import { z } from "zod";

// ---- Form schemas ----

export const loginSchema = z.object({
  email: z.string().min(1, "error_required").email("error_email"),
  password: z
    .string()
    .min(1, "error_required")
    .min(8, "error_password"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().min(1, "error_required").email("error_email"),
  password: z
    .string()
    .min(1, "error_required")
    .min(8, "error_password"),
  nickname: z
    .string()
    .min(1, "error_required")
    .max(100, "error_required"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ---- Custom zod resolver for react-hook-form ----

import type { Resolver } from "react-hook-form";

export function zodResolver<T extends z.Schema>(
  schema: T
): Resolver<z.infer<T>> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const fieldErrors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      fieldErrors[path] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: fieldErrors };
  };
}
