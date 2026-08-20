import { inject } from "@vercel/analytics";
import { useEffect } from "react";

export function VercelAnalytics() {
  useEffect(() => {
    inject({ framework: "react" });
  }, []);

  return null;
}
