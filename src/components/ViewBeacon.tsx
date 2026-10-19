"use client";
import { useEffect } from "react";

/** Counts a listing view for the seller's statistics (once per browser per day, bots ignored by the API). */
export default function ViewBeacon({ listingId }: { listingId: string }) {
  useEffect(() => {
    const body = JSON.stringify({ listingId, kind: "view" });
    if (!navigator.sendBeacon?.("/api/event", new Blob([body], { type: "application/json" })))
      fetch("/api/event", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
  }, [listingId]);
  return null;
}
