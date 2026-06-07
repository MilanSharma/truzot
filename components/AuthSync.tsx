"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

function clearUploadStorage() {
  sessionStorage.removeItem("truzot-upload");
  localStorage.removeItem("truzot-upload");
  localStorage.removeItem("truzot-upload-backup");
}

export default function AuthSync() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        clearUploadStorage();
        return;
      }

      if (event === "SIGNED_IN" && session?.user?.email) {
        const saved = (() => {
          try {
            const fromSession = sessionStorage.getItem("truzot-upload");
            if (fromSession) return JSON.parse(fromSession);
            const fromLocal = localStorage.getItem("truzot-upload");
            if (fromLocal) return JSON.parse(fromLocal);
          } catch {
            return null;
          }
          return null;
        })();

        if (saved?.email && saved.email !== session.user.email) {
          clearUploadStorage();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
