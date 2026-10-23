"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSettingsSection } from "@/lib/services/settings";
import {
    ContactEditor,
    FooterEditor,
    NavbarEditor,
    ThemeEditor,
} from "@/components/dashboard/settings/settings-manager";
import { HeroImageEditor } from "@/components/dashboard/settings/hero-image-editor";
import { TestimonialsImageEditor } from "@/components/dashboard/settings/testimonials-image-editor";
import { AboutImageEditor } from "@/components/dashboard/settings/about-image-editor";
import { LimitedOfferImageEditor } from "@/components/dashboard/settings/limited-offer-image-editor";
import type {
    Settings,
    SettingsSectionKey,
} from "@/lib/types/backend";
import { isErrorResult } from "@/lib/utils/result";

interface SectionEditorContentProps {
    settings: Settings;
    section: SettingsSectionKey;
}

/** Renders the correct section editor and wires it to the section save flow. */
export function SectionEditorContent({
    settings,
    section,
}: SectionEditorContentProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const runSave = (
        payload: unknown,
        images?: (File | null)[]
    ) => {
        startTransition(async () => {
            const result = await updateSettingsSection(section, payload, images);
            if (isErrorResult(result)) {
                toast.error(result.message);
                return;
            }
            toast.success(result.message ?? "Settings updated successfully");
            router.refresh();
        });
    };

    switch (section) {
        case "theme":
            return (
                <ThemeEditor
                    theme={settings.theme}
                    onSave={(theme) => runSave(theme)}
                    saving={isPending}
                />
            );
        case "hero":
            return (
                <HeroImageEditor
                    slides={settings.hero.slides}
                    onSave={(slides, images) => runSave({ slides }, images)}
                    saving={isPending}
                />
            );
        case "testimonials":
            return (
                <TestimonialsImageEditor
                    heading={settings.testimonials.heading}
                    items={settings.testimonials.items}
                    onSave={(heading, items, images) =>
                        runSave({ heading, items }, images)
                    }
                    saving={isPending}
                />
            );
        case "navbar":
            return (
                <NavbarEditor
                    navbar={settings.navbar}
                    onSave={(navbar) => runSave(navbar)}
                    saving={isPending}
                />
            );
        case "footer":
            return (
                <FooterEditor
                    footer={settings.footer}
                    onSave={(footer) => runSave(footer)}
                    saving={isPending}
                />
            );
        case "contact":
            return (
                <ContactEditor
                    contact={settings.contact}
                    onSave={(contact) => runSave(contact)}
                    saving={isPending}
                />
            );
        case "about":
            return (
                <AboutImageEditor
                    about={settings.about}
                    onSave={(about, images) => runSave(about, images)}
                    saving={isPending}
                />
            );
        case "limitedOffer":
            return (
                <LimitedOfferImageEditor
                    offer={settings.limitedOffer}
                    onSave={(offer, images) => runSave(offer, images)}
                    saving={isPending}
                />
            );
        default:
            return null;
    }
}
