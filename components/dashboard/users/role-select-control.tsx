"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { InstantStatusSelect } from "@/components/dashboard/shared/instant-status-select";
import { updateUserRole } from "@/lib/services/user";
import { isErrorResult } from "@/lib/utils/result";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types/backend";

/**
 * Inline role control for the user single view — customer <-> manager only.
 * Admin accounts show a locked badge (admins are granted by direct database
 * edit, not from the panel).
 */
export function RoleSelectControl({ user }: { user: User }) {
    const [, startTransition] = useTransition();
    const router = useRouter();

    if (user.role === "admin") {
        return (
            <Badge variant="secondary" className="text-xs capitalize">
                admin
            </Badge>
        );
    }

    return (
        <InstantStatusSelect
            value={user.role}
            options={[
                { value: "customer", label: "Customer" },
                { value: "manager", label: "Manager" },
            ]}
            onUpdate={async (next) => {
                const result = await updateUserRole(
                    user._id,
                    next as "customer" | "manager",
                );
                return result;
            }}
            onSuccess={() =>
                startTransition(() => router.refresh())
            }
            className="w-[8.5rem]"
        />
    );
}
