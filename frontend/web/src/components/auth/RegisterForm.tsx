"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { registerSchema, zodResolver, type RegisterFormData } from "@/lib/auth/schemas";
import { useAuth } from "@/lib/auth/hooks";
import { Loader2 } from "lucide-react";

export function RegisterForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nickname */}
      <div className="space-y-1.5">
        <label htmlFor="nickname" className="text-sm font-medium">
          {t("nickname")}
        </label>
        <input
          id="nickname"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          className="flex h-11 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/70 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          {...register("nickname")}
        />
        {errors.nickname && (
          <p className="text-sm text-destructive">
            {t(errors.nickname.message!)}
          </p>
        )}
      </div>

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
          autoComplete="new-password"
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
        disabled={isRegistering}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRegistering ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {isRegistering ? tc("loading") : t("submit_register")}
      </button>
    </form>
  );
}
