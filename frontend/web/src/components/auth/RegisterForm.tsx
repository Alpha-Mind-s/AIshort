"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { registerSchema, zodResolver, type RegisterFormData } from "@/lib/auth/schemas";
import { useAuth } from "@/lib/auth/hooks";

export function RegisterForm() {
  const t = useTranslations("auth");
  const { register: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    registerUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Nickname */}
      <div className="space-y-2">
        <label htmlFor="nickname" className="text-sm font-medium">
          {t("nickname")}
        </label>
        <input
          id="nickname"
          type="text"
          autoComplete="name"
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          {...register("nickname")}
        />
        {errors.nickname && (
          <p className="text-sm text-destructive">
            {t(errors.nickname.message!)}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{t(errors.email.message!)}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">
            {t(errors.password.message!)}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isRegistering}
        className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isRegistering ? t("common.loading") : t("submit_register")}
      </button>
    </form>
  );
}
