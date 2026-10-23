"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { themes, DEFAULT_NICHE } from "@/lib/theme.config";
import { registerAction } from "@/lib/services/auth";
import { isErrorResult } from "@/lib/utils/result";
import type { SettingsBrand } from "@/lib/types/backend";

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

export default function SignupPage({ brand }: { brand?: SettingsBrand | null }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RegisterInner brand={brand} />
    </Suspense>
  );
}

function RegisterInner({ brand }: { brand?: SettingsBrand | null }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const theme = themes[DEFAULT_NICHE];

  const brandName = brand?.name || theme.brand;
  const brandLogo = brand?.logo || "";
  const hasLogo = brandLogo.length > 0;

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
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 flex flex-col">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          {hasLogo ? (
            <div className="flex items-center justify-center h-8 w-8 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
              <Image
                src={brandLogo}
                alt={brandName}
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground font-bold text-xs transition-transform group-hover:scale-105">
              {brandName[0]}
            </div>
          )}
          <span className="font-bold text-lg tracking-tight">
            {brandName}
          </span>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="relative">
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-2xl font-bold tracking-tight">
                  Create an account
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your details to create your account
                </p>
              </div>

              <form className="space-y-4" onSubmit={onSubmit} noValidate>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      {...register("name")}
                      placeholder="John Doe"
                      autoComplete="name"
                      className={cn(
                        "h-10 w-full rounded-xl bg-muted/50 pl-10 pr-4 text-sm outline-none ring-1 ring-border transition-all focus:ring-2 focus:ring-primary/50",
                        errors.name &&
                          "ring-destructive focus:ring-destructive/50",
                      )}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] font-medium text-destructive ml-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      {...register("email")}
                      placeholder="name@example.com"
                      inputMode="email"
                      autoComplete="email"
                      className={cn(
                        "h-10 w-full rounded-xl bg-muted/50 pl-10 pr-4 text-sm outline-none ring-1 ring-border transition-all focus:ring-2 focus:ring-primary/50",
                        errors.email &&
                          "ring-destructive focus:ring-destructive/50",
                      )}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] font-medium text-destructive ml-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                      <input
                        {...register("password")}
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className={cn(
                          "h-10 w-full rounded-xl bg-muted/50 pl-10 pr-10 text-sm outline-none ring-1 ring-border transition-all focus:ring-2 focus:ring-primary/50",
                          errors.password &&
                            "ring-destructive focus:ring-destructive/50",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] font-medium text-destructive ml-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground ml-1">
                      Confirm password
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                      <input
                        {...register("confirmPassword")}
                        placeholder="••••••••"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className={cn(
                          "h-10 w-full rounded-xl bg-muted/50 pl-10 pr-10 text-sm outline-none ring-1 ring-border transition-all focus:ring-2 focus:ring-primary/50",
                          errors.confirmPassword &&
                            "ring-destructive focus:ring-destructive/50",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] font-medium text-destructive ml-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-xl font-semibold shadow-sm mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Sign up
                    </>
                  )}
                </Button>

                <div className="text-center text-sm pt-2">
                  <span className="text-muted-foreground">
                    Already have an account?{" "}
                  </span>
                  <Link
                    href="/login"
                    className="font-semibold text-primary hover:underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Need help?{" "}
            <Link
              href="/contact"
              className="text-primary hover:underline font-medium"
            >
              Contact support
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
