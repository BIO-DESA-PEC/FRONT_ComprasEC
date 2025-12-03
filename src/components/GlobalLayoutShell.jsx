// src/components/GlobalLayoutShell.jsx
"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";
import styles from "./GlobalLayoutShell.module.css";

export default function GlobalLayoutShell({ children, session, user }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(true);
    if (pathname === "/") {
        return <>{children}</>;
    }
  return (
    <div className={styles.theme}>
      {/* Botón hamburguesa SIEMPRE visible (desktop y mobile) */}
      <button
        className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Alternar menú"
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`${styles.shell} ${open ? "" : styles.shellCollapsed}`}
      >
        <Sidebar session={session} user={user} collapsed={!open} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
