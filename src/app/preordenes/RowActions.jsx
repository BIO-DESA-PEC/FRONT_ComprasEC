"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import FavStar from "@/components/FavStar";
import DuplicateBtn from "@/components/DuplicateBtn";
import styles from "./preordenes.module.css";

export default function RowActions({ idPreoc, isFav, userId, userEmail }) {
  const router = useRouter();
  const sp = useSearchParams(); // preserva q y page en el refresh

  const refresh = () => {
    // Mantiene los query params actuales
    router.replace(`/preordenes?${sp.toString()}`);
    router.refresh();
  };

  return (
    <div className={styles.actionsCell}>
      <Link
        className={styles.iconBtn}
        href={`/preordenes/${idPreoc}`}
        title="Editar"
        aria-label={`Editar #${idPreoc}`}
      >
        ✎
      </Link>

      <FavStar
        preocId={idPreoc}
        userId={userId}
        userEmail={userEmail}
        initial={!!isFav}
        onToggled={refresh}           // 👈 auto-refresh
      />

      <DuplicateBtn
        preocId={idPreoc}
        userId={userId}
        enabled={!!isFav}
      />
    </div>
  );
}
