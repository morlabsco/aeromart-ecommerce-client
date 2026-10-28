"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LogIn, Mail, KeyRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/services/auth";
import { isErrorResult } from "@/lib/utils/result";
import { AuthShell, authLabelClass } from "../auth-shell";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Enter a valid email." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .max(50, { message: "Password must be at most 50 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-hero-surface" />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const result = await login({
        email: values.email,
        password: values.password,
      });

      if (isErrorResult(result)) {
        toast.error(result.message);
      } else {
        toast.success("Login successful");
        // Full page navigation — guarantees the accessToken cookie set by the
        // server action is committed before the browser requests the dashboard,
        // avoiding the RSC navigation/cookie race that bounces back to /login.
        window.location.href = callbackUrl;
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthShell active="login">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Welcome back!
        </h1>
        <span className="mt-2 block h-1 w-10 rounded-full bg-brand" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to continue to your account
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <label htmlFor="login-email" className={authLabelClass}>
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              id="login-email"
              {...register("email")}
              placeholder="rahimuddin@example.com"
              inputMode="email"
              autoComplete="email"
              className="pl-10"
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] font-medium text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className={authLabelClass}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand hover:underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              id="login-password"
              {...register("password")}
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-11 pl-10"
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-medium text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" variant="brand" size="xl" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign In
            </>
          )}
        </Button>

        <p className="text-center text-sm">
          <span className="text-muted-foreground">New here? </span>
          <Link
            href="/register"
            className="font-semibold text-brand hover:underline underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
