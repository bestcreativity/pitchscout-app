import { useCallback, useState, useEffect } from "react";

const GUEST_USAGE_KEY = "ace_pitch_guest_usage";
const GUEST_USAGE_LIMIT = 2;

interface GuestUsageData {
  count: number;
  timestamp: number;
}

export function useGuestUsage() {
  const [usage, setUsage] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(GUEST_USAGE_KEY);
        if (stored) {
          const data: GuestUsageData = JSON.parse(stored);
          setUsage(data.count);
        }
      } catch (error) {
        console.error("Failed to load guest usage:", error);
      }
    }
  }, []);

  const consumeUsage = useCallback(() => {
    const newCount = usage + 1;
    if (typeof window !== "undefined") {
      try {
        const data: GuestUsageData = {
          count: newCount,
          timestamp: Date.now(),
        };
        localStorage.setItem(GUEST_USAGE_KEY, JSON.stringify(data));
        setUsage(newCount);
      } catch (error) {
        console.error("Failed to save guest usage:", error);
      }
    }
    return newCount;
  }, [usage]);

  const hasReachedLimit = usage >= GUEST_USAGE_LIMIT;
  const remaining = Math.max(0, GUEST_USAGE_LIMIT - usage);

  return {
    usage,
    limit: GUEST_USAGE_LIMIT,
    hasReachedLimit,
    remaining,
    consumeUsage,
  };
}
