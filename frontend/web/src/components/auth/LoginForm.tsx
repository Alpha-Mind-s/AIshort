"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { loginSchema, zodResolver, type LoginFormData } from "@/lib/auth/schemas";
import { useAuth } from "@/lib/auth/hooks";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const { login, isLoggingIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="test@example.com"
          className="flex h-11 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/70 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{t(errors.email.message!)}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="flex h-11 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/70 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
        disabled={isLoggingIn}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoggingIn ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {isLoggingIn ? tc("loading") : t("submit_login")}
      </button>
    </form>
  );
}
