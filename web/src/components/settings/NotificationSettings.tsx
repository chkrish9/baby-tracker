"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  getPushPermissionState,
  isSubscribedToPush,
  subscribeToPush,
  unsubscribeFromPush,
  type PushPermissionState,
} from "@/lib/push";

export function NotificationSettings() {
  const { toast } = useToast();
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPermission(getPushPermissionState());
    isSubscribedToPush().then((v) => {
      setSubscribed(v);
      setReady(true);
    });
  }, []);

  async function handleEnable() {
    setLoading(true);
    const result = await subscribeToPush();
    setLoading(false);
    setPermission(getPushPermissionState());
    if ("error" in result) {
      toast(result.error, "error");
      return;
    }
    setSubscribed(true);
    toast("Notifications enabled!", "success");
  }

  async function handleDisable() {
    setLoading(true);
    await unsubscribeFromPush();
    setLoading(false);
    setSubscribed(false);
    toast("Notifications disabled", "success");
  }

  if (!ready) return null;

  if (permission === "unsupported") {
    return (
      <p className="text-sm text-foreground/50">
        Push notifications aren&apos;t supported in this browser.
      </p>
    );
  }

  if (permission === "denied") {
    return (
      <p className="text-sm text-foreground/50">
        Notifications are blocked for this site. Enable them in your browser&apos;s site settings to get feeding
        and diaper reminders.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-foreground/60">
        Get a reminder when it&apos;s time for a feeding or diaper change, set per baby in their edit page.
      </p>
      {subscribed ? (
        <Button size="sm" variant="secondary" loading={loading} onClick={handleDisable} className="shrink-0">
          Disable
        </Button>
      ) : (
        <Button size="sm" loading={loading} onClick={handleEnable} className="shrink-0">
          Enable
        </Button>
      )}
    </div>
  );
}
