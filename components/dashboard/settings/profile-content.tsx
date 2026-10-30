"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Camera, KeyRound, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateUserProfile } from "@/lib/services/user";
import { changePassword } from "@/lib/services/auth";
import { PHONE_ERROR_MESSAGE, PHONE_REGEX } from "@/lib/utils/phone";
import { isErrorResult } from "@/lib/utils/result";
import { DateOfBirthInput } from "@/components/dashboard/shared/date-of-birth-input";
import type { User } from "@/lib/types/backend";
import { serverErrorMessage } from "@/lib/utils/form-feedback";

const profileSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    phoneNo: z
        .string()
        .regex(PHONE_REGEX, { message: PHONE_ERROR_MESSAGE })
        .optional()
        .or(z.literal("")),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
});

type ProfileFormInput = z.input<typeof profileSchema>;
type ProfileFormValues = z.output<typeof profileSchema>;

const passwordSchema = z
    .object({
        oldPassword: z
            .string()
            .min(1, { message: "Old password is required." }),
        newPassword: z
            .string()
            .min(6, { message: "New password must be at least 6 characters." }),
        confirmPassword: z
            .string()
            .min(1, { message: "Confirm password is required." }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    })
    .refine((data) => data.newPassword !== data.oldPassword, {
        message: "New password must be different from the old password.",
        path: ["newPassword"],
    });

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ProfilePageContentProps {
    profile: User;
}

export function ProfilePageContent({ profile }: ProfilePageContentProps) {
    const router = useRouter();
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profilePending, startProfileTransition] = useTransition();
    const [passwordPending, startPasswordTransition] = useTransition();

    const profileForm = useForm<ProfileFormInput, unknown, ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: profile.name,
            phoneNo: profile.phoneNo ?? "",
            gender: profile.gender ?? undefined,
            dateOfBirth: profile.dateOfBirth
                ? profile.dateOfBirth.slice(0, 10)
                : "",
            address: profile.address ?? "",
        },
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
    });

    const dateOfBirth = profileForm.watch("dateOfBirth") ?? "";

    const onProfileSubmit = profileForm.handleSubmit(
        async (values: ProfileFormValues) => {
            startProfileTransition(async () => {
                const formData = new FormData();
                const payload: Record<string, unknown> = {
                    name: values.name,
                    phoneNo: values.phoneNo || undefined,
                    gender: values.gender || undefined,
                    dateOfBirth: values.dateOfBirth || undefined,
                    address: values.address || undefined,
                };
                if (removePhoto) {
                    // Backend contract: photoUrl: "" removes the current photo.
                    payload.photoUrl = "";
                }
                formData.append("data", JSON.stringify(payload));
                if (photoFile) {
                    formData.append("profilePhoto", photoFile);
                }

                const result = await updateUserProfile(formData);
                if (isErrorResult(result)) {
                    toast.error(serverErrorMessage(result));
                    return;
                }
                toast.success(result.message ?? "Profile updated successfully");
                router.refresh();
            });
        }
    );

    const onPasswordSubmit = passwordForm.handleSubmit(
        async (values: PasswordFormValues) => {
            startPasswordTransition(async () => {
                const result = await changePassword({
                    oldPassword: values.oldPassword,
                    newPassword: values.newPassword,
                });
                if (isErrorResult(result)) {
                    toast.error(serverErrorMessage(result));
                    return;
                }
                toast.success(result.message ?? "Password changed successfully");
                passwordForm.reset();
                router.refresh();
            });
        }
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your account information
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Profile Details</CardTitle>
                        <CardDescription>
                            Update your name, photo and contact information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onProfileSubmit} className="space-y-4" noValidate>
                            <div className="flex items-center gap-4">
                                <Avatar className="size-16">
                                    <AvatarImage
                                        src={
                                            removePhoto
                                                ? ""
                                                : photoFile
                                                ? URL.createObjectURL(photoFile)
                                                : (profile.photoUrl ?? "")
                                        }
                                        alt={profile.name}
                                    />
                                    <AvatarFallback>
                                        {profile.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setPhotoFile(null);
                                            setRemovePhoto(false);
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        {photoFile ? photoFile.name : "Choose photo"}
                                    </Button>
                                    {!removePhoto && (profile.photoUrl || photoFile) && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => {
                                                setRemovePhoto(true);
                                                setPhotoFile(null);
                                            }}
                                        >
                                            Remove photo
                                        </Button>
                                    )}
                                    {removePhoto && (
                                        <span className="text-xs text-muted-foreground">
                                            Photo will be removed on save
                                        </span>
                                    )}
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            setPhotoFile(e.target.files?.[0] ?? null);
                                            setRemovePhoto(false);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" {...profileForm.register("name")} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNo">Phone Number</Label>
                                <Input
                                    id="phoneNo"
                                    placeholder="+8801712345678"
                                    {...profileForm.register("phoneNo")}
                                />
                                {profileForm.formState.errors.phoneNo && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {profileForm.formState.errors.phoneNo.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={profileForm.watch("gender") ?? ""}
                                        onValueChange={(value) =>
                                            profileForm.setValue(
                                                "gender",
                                                (value || undefined) as "Male" | "Female" | "Other" | undefined
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                    <DateOfBirthInput
                                        id="dateOfBirth"
                                        value={dateOfBirth}
                                        onChange={(value) =>
                                            profileForm.setValue("dateOfBirth", value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    placeholder="123 Main Street, Dhaka"
                                    {...profileForm.register("address")}
                                />
                            </div>

                            <Button type="submit" disabled={profilePending}>
                                {profilePending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <UserCircle className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Change Password</CardTitle>
                        <CardDescription>
                            Enter your old password and a new one (must match).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onPasswordSubmit} className="space-y-4" noValidate>
                            <div className="space-y-2">
                                <Label htmlFor="oldPassword">Old Password</Label>
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    autoComplete="current-password"
                                    aria-invalid={!!passwordForm.formState.errors.oldPassword}
                                    {...passwordForm.register("oldPassword")}
                                />
                                {passwordForm.formState.errors.oldPassword && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {passwordForm.formState.errors.oldPassword.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    aria-invalid={!!passwordForm.formState.errors.newPassword}
                                    {...passwordForm.register("newPassword")}
                                />
                                {passwordForm.formState.errors.newPassword && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {passwordForm.formState.errors.newPassword.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                                    {...passwordForm.register("confirmPassword")}
                                />
                                {passwordForm.formState.errors.confirmPassword && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {passwordForm.formState.errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>

                            <Button type="submit" disabled={passwordPending}>
                                {passwordPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Change Password
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
