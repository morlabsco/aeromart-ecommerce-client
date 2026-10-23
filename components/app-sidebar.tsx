"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { themes, DEFAULT_NICHE } from "@/lib/theme.config";
import { NavUser } from "@/components/nav-user";
import type { Session } from "@/lib/get-session";
import type { SettingsBrand } from "@/lib/types/backend";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    LayoutDashboardIcon,
    PackageIcon,
    ShoppingCartIcon,
    UsersIcon,
    Settings2Icon,
    HomeIcon,
    TagsIcon,
    LayersIcon,
    TicketIcon,
    ActivityIcon,
    ChevronRightIcon,
    CircleUserIcon,
    MessageSquareIcon,
} from "lucide-react";

interface NavItem {
    title: string;
    url: string;
    icon: typeof LayoutDashboardIcon;
    children?: { title: string; url: string }[];
}

const adminNavRoutes: NavItem[] = [
    {
        title: "Overview",
        url: "/dashboard/admin",
        icon: LayoutDashboardIcon,
    },
    {
        title: "Products",
        url: "/dashboard/admin/products",
        icon: PackageIcon,
        children: [
            { title: "All Products", url: "/dashboard/admin/products/all-products" },
            { title: "Create Product", url: "/dashboard/admin/products/create-product" },
        ],
    },
    {
        title: "Orders",
        url: "/dashboard/admin/orders",
        icon: ShoppingCartIcon,
        children: [
            { title: "All Orders", url: "/dashboard/admin/orders/all-orders" },
            { title: "Create Order", url: "/dashboard/admin/orders/create-order" },
        ],
    },
    {
        title: "Users",
        url: "/dashboard/admin/users",
        icon: UsersIcon,
        children: [
            { title: "All Users", url: "/dashboard/admin/users/all-users" },
            { title: "Create User", url: "/dashboard/admin/users/create-user" },
        ],
    },
    {
        title: "Categories",
        url: "/dashboard/admin/categories",
        icon: LayersIcon,
        children: [
            { title: "All Categories", url: "/dashboard/admin/categories/all-categories" },
            { title: "Create Category", url: "/dashboard/admin/categories/create-category" },
        ],
    },
    {
        title: "Brands",
        url: "/dashboard/admin/brands",
        icon: TagsIcon,
        children: [
            { title: "All Brands", url: "/dashboard/admin/brands/all-brands" },
            { title: "Create Brand", url: "/dashboard/admin/brands/create-brand" },
        ],
    },
    {
        title: "Coupons",
        url: "/dashboard/admin/coupons",
        icon: TicketIcon,
        children: [
            { title: "All Coupons", url: "/dashboard/admin/coupons/all-coupons" },
            { title: "Create Coupon", url: "/dashboard/admin/coupons/create-coupon" },
        ],
    },
    {
        title: "Reviews",
        url: "/dashboard/admin/reviews",
        icon: MessageSquareIcon,
    },
    {
        title: "Activities",
        url: "/dashboard/admin/activities",
        icon: ActivityIcon,
    },
    {
        title: "Profile",
        url: "/dashboard/admin/profile",
        icon: CircleUserIcon,
    },
    {
        title: "Home",
        url: "/",
        icon: HomeIcon,
    },
];

const adminBottomRoutes: NavItem[] = [
    { title: "Settings", url: "/dashboard/admin/settings", icon: Settings2Icon },
];

const customerNavRoutes: NavItem[] = [
    {
        title: "Overview",
        url: "/dashboard/customer",
        icon: LayoutDashboardIcon,
    },
    {
        title: "Orders",
        url: "/dashboard/customer/orders/my-orders",
        icon: ShoppingCartIcon,
    },
    {
        title: "My Reviews",
        url: "/dashboard/customer/reviews",
        icon: MessageSquareIcon,
    },
    {
        title: "Profile",
        url: "/dashboard/customer/profile",
        icon: CircleUserIcon,
    },
    {
        title: "Home",
        url: "/",
        icon: HomeIcon,
    },
];

const theme = themes[DEFAULT_NICHE];

function isRouteActive(pathname: string, route: NavItem): boolean {
    if (pathname === route.url) return true;
    if (route.children) {
        return route.children.some((child) => pathname === child.url);
    }
    return false;
}

export function AppSidebar({
    session,
    brand,
    ...props
}: React.ComponentProps<typeof Sidebar> & {
    session?: Session;
    brand?: SettingsBrand | null;
}) {
    const pathname = usePathname();
    const user = session?.user;
    const isCustomer = user?.role === "customer";

    const navRoutes = isCustomer ? customerNavRoutes : adminNavRoutes;
    const bottomRoutes = isCustomer ? [] : adminBottomRoutes;
    const homeUrl = isCustomer ? "/dashboard/customer" : "/dashboard/admin";

    // Prefer the settings brand when available, fall back to the static theme.
    const brandName = brand?.name || theme.brand;
    const brandLogo = brand?.logo || theme.logo;

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <Link href={homeUrl}>
                    <SidebarMenuButton
                        className="cursor-pointer"
                        size="lg"
                    >
                        <div className="flex items-center justify-center size-8 rounded-lg overflow-hidden shrink-0">
                            {brandLogo ? (
                                <Image
                                    src={brandLogo}
                                    alt={brandName}
                                    width={28}
                                    height={28}
                                    className="object-contain"
                                />
                            ) : (
                                <span className="text-base font-bold text-primary">
                                    {brandName.charAt(0)}
                                </span>
                            )}
                        </div>
                        <span className="text-base font-semibold truncate group-data-[collapsible=icon]:hidden">
                            {brandName}
                        </span>
                    </SidebarMenuButton>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navRoutes.map((route) => {
                                const Icon = route.icon;
                                const isActive = isRouteActive(pathname, route);

                                if (!route.children) {
                                    return (
                                        <SidebarMenuItem key={route.title}>
                                            <Link href={route.url}>
                                                <SidebarMenuButton
                                                    tooltip={route.title}
                                                    className={cn(
                                                        "cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors duration-150",
                                                        isActive &&
                                                            "bg-primary/15 text-primary font-medium"
                                                    )}
                                                >
                                                    <Icon className="size-4!" />
                                                    <span className="group-data-[collapsible=icon]:hidden">
                                                        {route.title}
                                                    </span>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                    );
                                }

                                return (
                                    <Collapsible
                                        key={route.title}
                                        defaultOpen={isActive}
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger
                                                render={
                                                    <SidebarMenuButton
                                                        tooltip={route.title}
                                                        className={cn(
                                                            "cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors duration-150",
                                                            isActive &&
                                                                "bg-primary/15 text-primary font-medium"
                                                        )}
                                                    />
                                                }
                                            >
                                                <Icon className="size-4!" />
                                                <span className="group-data-[collapsible=icon]:hidden">
                                                    {route.title}
                                                </span>
                                                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {route.children.map((child) => (
                                                    <SidebarMenuSubItem
                                                        key={child.title}
                                                    >
                                                        <SidebarMenuSubButton
                                                            render={
                                                                <Link href={child.url} />
                                                            }
                                                            className={cn(
                                                                "cursor-pointer",
                                                                pathname ===
                                                                    child.url &&
                                                                    "bg-primary/15 text-primary font-medium"
                                                            )}
                                                        >
                                                            {child.title}
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {bottomRoutes.length > 0 && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup className="mt-auto">
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {bottomRoutes.map((route) => {
                                        const Icon = route.icon;
                                        const isActive = pathname === route.url;
                                        return (
                                            <SidebarMenuItem key={route.title}>
                                                <Link href={route.url}>
                                                    <SidebarMenuButton
                                                        tooltip={route.title}
                                                        className={cn(
                                                            "cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors duration-150",
                                                            isActive &&
                                                                "bg-primary/15 text-primary font-medium"
                                                        )}
                                                    >
                                                        <Icon className="size-4!" />
                                                        <span className="group-data-[collapsible=icon]:hidden">
                                                            {route.title}
                                                        </span>
                                                    </SidebarMenuButton>
                                                </Link>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>
            <SidebarFooter>
                <NavUser
                    user={{
                        name: user?.name ?? "User",
                        email: user?.email ?? "",
                        avatar: user?.photoUrl ?? "",
                    }}
                    profileHref={
                        user?.role === "customer"
                            ? "/dashboard/customer/profile"
                            : "/dashboard/admin/profile"
                    }
                />
            </SidebarFooter>
        </Sidebar>
    );
}
