"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerAction } from "@/lib/services/auth";
import { isErrorResult } from "@/lib/utils/result";
import { AuthShell, authLabelClass } from "../auth-shell";

const signupSchema = z
  .object({
    name: z.string().min(1, { message: "Full name is required." }),
    email: z
      .string()
      .min(1, { message: "Email is required." })
      .email({ message: "Enter a valid email." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .max(50, { message: "Password must be at most 50 characters." }),
    confirmPassword: z
      .string()
      .min(8, { message: "Confirm password is required." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Register() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-hero-surface" />}>
      <RegisterInner />
    </Suspense>
  );
}

function RegisterInner() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const result = await registerAction({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (isErrorResult(result)) {
        toast.error(result.message || "Failed to create account");
      } else {
        toast.success("Account created successfully");
        // Full page navigation — guarantees the accessToken cookie set by the
        // server action is committed before the browser requests the dashboard,
        // avoiding the RSC navigation/cookie race that bounces back to /login.
        window.location.href = callbackUrl;
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create account");
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthShell active="register">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Create an account
        </h1>
        <span className="mt-2 block h-1 w-10 rounded-full bg-brand" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">
          Enter your details to create your account
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <label htmlFor="register-name" className={authLabelClass}>
            Full name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              id="register-name"
              {...register("name")}
              placeholder="John Doe"
              autoComplete="name"
              className="pl-10"
              aria-invalid={!!errors.name}
            />
          </div>
          {errors.name && (
            <p className="text-[11px] font-medium text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-email" className={authLabelClass}>
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              id="register-email"
              {...register("email")}
              placeholder="name@example.com"
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

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="register-password" className={authLabelClass}>
              Password
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                id="register-password"
                {...register("password")}
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          <div className="space-y-1.5">
            <label htmlFor="register-confirm" className={authLabelClass}>
              Confirm password
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                id="register-confirm"
                {...register("confirmPassword")}
                placeholder="••••••••"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                className="pr-11 pl-10"
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                {showConfirmPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" variant="brand" size="xl" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Sign up
            </>
          )}
        </Button>

        <p className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link
            href="/login"
            className="font-semibold text-brand hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
