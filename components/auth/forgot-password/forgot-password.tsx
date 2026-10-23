"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { forgotPassword, verifyOtp, resetPassword } from "@/lib/services/auth";
import { isErrorResult } from "@/lib/utils/result";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AuthShell, authFieldClass, authLabelClass } from "../auth-shell";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Enter a valid email." }),
});

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .max(50, { message: "Password must be at most 50 characters." }),
    confirmPassword: z.string().min(8, { message: "Confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type EmailValues = z.infer<typeof emailSchema>;
type ResetValues = z.infer<typeof resetSchema>;

type Step = "email" | "otp" | "reset";

/**
 * Forgot password flow in the Nittonova auth card: email → 6-digit OTP →
 * new password, matching the backend's forgot-password / verify-otp /
 * reset-password endpoints.
 */
export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const submitEmail = emailForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const result = await forgotPassword({ email: values.email });
      if (isErrorResult(result)) {
        toast.error(result.message);
      } else {
        toast.success("Check your email to reset your password");
        setEmail(values.email);
        setStep("otp");
      }
    } catch {
      toast.error("Failed to send the OTP");
    } finally {
      setLoading(false);
    }
  });

  async function submitOtp(value: string) {
    if (value.length !== 6) return;
    setLoading(true);
    try {
      const result = await verifyOtp({ email, otp: value });
      if (isErrorResult(result)) {
        toast.error(result.message);
        setOtp("");
      } else {
        const token = result.data?.resetToken;
        if (!token) {
          toast.error("Verification failed. Please try again.");
          setOtp("");
          return;
        }
        setResetToken(token);
        toast.success("OTP verified successfully");
        setStep("reset");
      }
    } catch {
      toast.error("OTP verification failed");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  const submitReset = resetForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const result = await resetPassword({
        token: resetToken,
        newPassword: values.newPassword,
      });
      if (isErrorResult(result)) {
        toast.error(result.message);
      } else {
        toast.success("Password reset successfully! Please sign in.");
        router.push("/login");
      }
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setLoading(false);
    }
  });

  const stepHeadings: Record<Step, { title: string; subtitle: string }> = {
    email: {
      title: "Forgot password?",
      subtitle: "Enter your account email and we'll send you a verification code",
    },
    otp: {
      title: "Verify code",
      subtitle: `Enter the 6-digit code we sent to ${email}`,
    },
    reset: {
      title: "Set a new password",
      subtitle: "Choose a strong password you haven't used before",
    },
  };

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {stepHeadings[step].title}
        </h1>
        <span className="mt-2 block h-1 w-10 rounded-full bg-brand" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">{stepHeadings[step].subtitle}</p>
      </div>

      {step === "email" && (
        <form className="space-y-5" onSubmit={submitEmail} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className={authLabelClass}>
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
              <input
                id="forgot-email"
                {...emailForm.register("email")}
                placeholder="name@example.com"
                inputMode="email"
                autoComplete="email"
                className={authFieldClass(!!emailForm.formState.errors.email)}
              />
            </div>
            {emailForm.formState.errors.email && (
              <p className="text-[11px] font-medium text-destructive">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {loading ? "Sending..." : "Send verification code"}
          </button>

          <p className="text-center text-sm">
            <Link href="/login" className="font-semibold text-brand hover:underline underline-offset-4">
              Back to sign in
            </Link>
          </p>
        </form>
      )}

      {step === "otp" && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                submitOtp(value)
              }}
              disabled={loading}
              autoComplete="one-time-code"
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="size-11 text-base font-bold" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {loading && (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying code...
            </p>
          )}
          <button
            type="button"
            onClick={() => submitOtp(otp)}
            disabled={loading || otp.length !== 6}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            Verify
          </button>
          <div className="flex items-center justify-between text-sm">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-semibold text-brand hover:underline underline-offset-4"
            >
              <ArrowLeft className="size-3.5" /> Back to sign in
            </Link>
            <button
              type="button"
              onClick={submitEmail}
              disabled={loading}
              className="cursor-pointer font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Resend code
            </button>
          </div>
        </div>
      )}

      {step === "reset" && (
        <form className="space-y-5" onSubmit={submitReset} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="new-password" className={authLabelClass}>
              New password
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
              <input
                id="new-password"
                type="password"
                {...resetForm.register("newPassword")}
                placeholder="••••••••"
                autoComplete="new-password"
                className={authFieldClass(!!resetForm.formState.errors.newPassword)}
              />
            </div>
            {resetForm.formState.errors.newPassword && (
              <p className="text-[11px] font-medium text-destructive">
                {resetForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-new-password" className={authLabelClass}>
              Confirm password
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
              <input
                id="confirm-new-password"
                type="password"
                {...resetForm.register("confirmPassword")}
                placeholder="••••••••"
                autoComplete="new-password"
                className={authFieldClass(!!resetForm.formState.errors.confirmPassword)}
              />
            </div>
            {resetForm.formState.errors.confirmPassword && (
              <p className="text-[11px] font-medium text-destructive">
                {resetForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
