import type { Metadata } from "next";
import { Jost, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Toaster } from "../components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { getSettings } from "@/lib/services/settings";
import { unwrapData } from "@/lib/services/api-client";

// AeroMart typography: Jost for Latin text with Hind Siliguri as the Bangla
// companion — the font tokens in globals.css stack Jost first, so Bengali
// glyphs fall through to Hind Siliguri on every page and section.
const jost = Jost({ subsets: ["latin"], variable: "--font-jost" });
const hindSiliguri = Hind_Siliguri({
    subsets: ["bengali", "latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-hind",
});

/** Static fallback favicon shipped with the project (app/favicon.ico). */
const FALLBACK_FAVICON = "/favicon.ico";

export async function generateMetadata(): Promise<Metadata> {
    // Load the settings brand so the favicon tracks the theme; fall back to
    // the project's static favicon when settings are unavailable.
    const settingsResult = await getSettings();
    const settings = unwrapData(settingsResult);
    const favicon = settings?.brand?.favicon || FALLBACK_FAVICON;

    return {
        title: {
            default: settings?.brand?.name || "Attor",
            template: "%s",
        },
        description:
            settings?.brand?.description ??
            "Premium clothing for the modern individual. Discover curated collections designed for those who refuse to blend in.",
        icons: {
            icon: favicon,
        },
    };
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={cn("h-full", "antialiased", "font-sans", jost.variable, hindSiliguri.variable)}
        >
            <head>
                <ThemeProvider />
            </head>
            <body className="min-h-full flex flex-col">
                <main className="flex-1">{children}</main>
                <Toaster position="top-right" />
            </body>
        </html>
    );
}
