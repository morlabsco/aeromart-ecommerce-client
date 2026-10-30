"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Camera, Loader2, Save, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { changePassword } from "@/lib/services/auth";
import {
    DateOfBirthInput,
    getDateOfBirthError,
} from "@/components/dashboard/shared/date-of-birth-input";
import { updateUserProfile } from "@/lib/services/user";
import { notifyInvalidFields, serverErrorMessage} from "@/lib/utils/form-feedback";
import { isErrorResult } from "@/lib/utils/result";
import type { User } from "@/lib/types/backend";

/* ---------------------------------------------------------------------------
 * Dashboard v4 profile — Nittonova dashboard reference: profile summary card
 * (avatar, identity, status/role/member-since rows) beside the Account
 * Details form, with the password change as its own card. Wired to the real
 * update-profile + change-password endpoints.
 * ------------------------------------------------------------------------- */

const GENDERS = ["Male", "Female", "Other"] as const;

export function DashboardProfileV4({ profile }: { profile: User }) {
    const router = useRouter();
    const [, startProfileTransition] = useTransition();
    const [, startPasswordTransition] = useTransition();
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const [name, setName] = useState(profile.name ?? "");
    const [phone, setPhone] = useState(profile.phoneNo ?? "");
    const [gender, setGender] = useState(profile.gender ?? "");
    const [dateOfBirth, setDateOfBirth] = useState(
        profile.dateOfBirth?.slice(0, 10) ?? "",
    );
    const [address, setAddress] = useState(profile.address ?? "");

    const [photoPreview, setPhotoPreview] = useState<File | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const photoUrl = photoPreview
        ? URL.createObjectURL(photoPreview)
        : removePhoto
          ? null
          : profile.photoUrl;

    const initials = (profile.name || "U")
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const saveProfile = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = "Name is required";
        if (phone && !/^[\d+\-\s()]{6,20}$/.test(phone.trim()))
            errs.phone = "Enter a valid phone number";
        const dobError = getDateOfBirthError(dateOfBirth);
        if (dobError) errs.dateOfBirth = "Birthday";
        if (Object.keys(errs).length) {
            notifyInvalidFields(
                Object.keys(errs),
                { name: "Name", phone: "Phone", dateOfBirth: "Birthday" },
                "save your profile",
            );
            return;
        }

        setSavingProfile(true);
        startProfileTransition(async () => {
            const formData = new FormData();
            const payload: Record<string, unknown> = {
                name: name.trim(),
                phoneNo: phone.trim() || undefined,
                gender: gender || undefined,
                dateOfBirth: dateOfBirth || undefined,
                address: address.trim() || undefined,
            };
            if (removePhoto) payload.photoUrl = "";
            formData.append("data", JSON.stringify(payload));
            if (photoPreview) formData.append("profilePhoto", photoPreview);

            const result = await updateUserProfile(formData);
            setSavingProfile(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(result.message ?? "Profile updated successfully");
            setPhotoPreview(null);
            setRemovePhoto(false);
            router.refresh();
        });
    };

    const savePassword = () => {
        const errs: Record<string, string> = {};
        if (!currentPassword) errs.currentPassword = "Current password is required";
        if (newPassword.length < 6) errs.newPassword = "Use at least 6 characters";
        if (confirmPassword !== newPassword)
            errs.confirmPassword = "Passwords do not match";
        if (Object.keys(errs).length) {
            notifyInvalidFields(
                Object.keys(errs),
                {
                    currentPassword: "Current Password",
                    newPassword: "New Password",
                    confirmPassword: "Confirm Password",
                },
                "change your password",
            );
            return;
        }

        setSavingPassword(true);
        startPasswordTransition(async () => {
            const result = await changePassword({
                oldPassword: currentPassword,
                newPassword,
            });
            setSavingPassword(false);
            if (isErrorResult(result)) {
                toast.error(serverErrorMessage(result));
                return;
            }
            toast.success(result.message ?? "Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        });
    };

    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* ── Profile summary card ── */}
            <section className="h-fit rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex flex-col items-center text-center">
                    <div className="relative">
                        {photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={photoUrl}
                                alt={profile.name}
                                className="size-24 rounded-full object-cover"
                            />
                        ) : (
                            <span className="flex size-24 items-center justify-center rounded-full bg-brand text-2xl font-extrabold text-brand-foreground">
                                {initials}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            aria-label="Change photo"
                            className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-header-nav text-header-nav-foreground transition-colors hover:bg-brand"
                        >
                            <Camera className="size-4" />
                        </button>
                        {profile.photoUrl && !removePhoto && !photoPreview && (
                            <button
                                type="button"
                                onClick={() => setRemovePhoto(true)}
                                aria-label="Remove photo"
                                className="absolute -bottom-1 -left-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:text-destructive"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-foreground">
                        {profile.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                                toast.error("Photo is too large. Maximum size is 2 MB.");
                                return;
                            }
                            setPhotoPreview(file);
                            setRemovePhoto(false);
                        }}
                    />
                </div>

                <dl className="mt-6 space-y-3 border-t border-border/60 pt-5 text-sm">
                    <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Status</dt>
                        <dd>
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                    profile.isActive
                                        ? "bg-success/15 text-success"
                                        : "bg-destructive/10 text-destructive"
                                }`}
                            >
                                {profile.isActive ? "Active" : "Blocked"}
                            </span>
                        </dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Role</dt>
                        <dd className="font-semibold capitalize text-foreground">
                            {profile.role}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Member since</dt>
                        <dd className="font-semibold tabular-nums text-foreground">
                            {profile.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                  })
                                : "—"}
                        </dd>
                    </div>
                    {profile.lastLogin && (
                        <div className="flex items-center justify-between gap-3">
                            <dt className="shrink-0 text-muted-foreground">Last login</dt>
                            <dd className="truncate text-right font-semibold tabular-nums text-foreground">
                                {new Date(profile.lastLogin).toLocaleString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </dd>
                        </div>
                    )}
                </dl>
            </section>

            {/* ── Account details + password ── */}
            <div className="space-y-4 xl:col-span-2">
                <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <h2 className="text-base font-bold text-foreground">
                        Account Details
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Update your personal information.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="profile-name">Full Name</Label>
                            <Input
                                id="profile-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Mahfuz Zayn"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="profile-email">Email</Label>
                            <Input
                                id="profile-email"
                                value={profile.email}
                                disabled
                                className="opacity-70"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Email changes need support — it identifies your account.
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="profile-phone">Phone</Label>
                            <Input
                                id="profile-phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="01700 000000"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="profile-gender">Gender</Label>
                            <Select
                                value={gender}
                                onValueChange={(v) => setGender(String(v ?? ""))}
                            >
                                <SelectTrigger id="profile-gender" className="w-full">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GENDERS.map((g) => (
                                        <SelectItem key={g} value={g} label={g}>
                                            {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="profile-dob" className="flex items-center gap-1.5">
                                <CalendarDays className="size-3.5" /> Birthday
                            </Label>
                            <DateOfBirthInput
                                id="profile-dob"
                                value={dateOfBirth}
                                onChange={setDateOfBirth}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="profile-address">Address</Label>
                            <Textarea
                                id="profile-address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="House, road, area, district"
                                rows={2}
                                className="min-h-[2.75rem]"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="brand"
                            onClick={saveProfile}
                            disabled={savingProfile}
                        >
                            {savingProfile ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" /> Saving…
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </section>

                <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                        <ShieldCheck className="size-4.5 text-brand" />
                        Change Password
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Choose a strong password you don&apos;t use anywhere else.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={savePassword}
                            disabled={savingPassword}
                        >
                            {savingPassword ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" /> Updating…
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
