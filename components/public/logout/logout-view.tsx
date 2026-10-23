"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/services/auth";

const MIN_LOGOUT_MS = 1200;

export function LogoutView() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    const finish = () => {
      const elapsed = Date.now() - startedAt;
      // Hold the animation briefly so the logout feels deliberate,
      // then send the user home.
      const delay = Math.max(0, MIN_LOGOUT_MS - elapsed);
      setTimeout(() => {
        if (cancelled) return;
        setDone(true);
        router.replace("/");
        router.refresh();
      }, delay);
    };

    void logoutAction().finally(finish);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {done ? (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <LogOut className="h-7 w-7 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              >
                <LogOut className="h-7 w-7 text-primary" />
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <h1 className="text-xl font-semibold tracking-tight">
            {done ? "Logged out" : "Logging you out…"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {done
              ? "Taking you back to the home page."
              : "Clearing your session, please wait."}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
