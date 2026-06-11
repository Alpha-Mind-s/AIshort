import type { Resolver } from 'react-hook-form'
import { z } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodResolver<T extends z.ZodType<any, any, any>>(schema: T): Resolver<z.infer<T>> {
  return async (values: any) => {
    const result = schema.safeParse(values)
    if (result.success) {
      return { values: result.data, errors: {} }
    }
    const fieldErrors: Record<string, { type: string; message: string }> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      fieldErrors[path] = { type: issue.code, message: issue.message }
    }
    return { values: {} as any, errors: fieldErrors } as any
  }
}
