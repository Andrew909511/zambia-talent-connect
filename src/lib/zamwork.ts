import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const LOCATIONS = ["Lusaka", "Copperbelt", "Ndola", "Kitwe", "Livingstone", "Kabwe", "Chipata", "Solwezi", "Kasama", "Mongu", "Remote"];
export const CATEGORIES = ["Skilled Trades", "Driving", "Security", "Domestic Work", "IT & Technology", "Construction", "Other"];
export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Casual", "Freelance"];

export type Role = "worker" | "employer";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, user: session?.user ?? null, ready };
}

export function useAccount(userId: string | undefined) {
  return useQuery({
    queryKey: ["account", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId!),
        supabase.from("profiles").select("*").eq("id", userId!).maybeSingle(),
      ]);
      return { role: (roles?.[0]?.role ?? null) as Role | null, profile };
    },
  });
}

export function usePublicJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
}

export function usePublicWorkers() {
  return useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_workers");
      if (error) throw error;
      return data;
    },
  });
}

export const inputCls = "w-full px-4 py-3 rounded-lg border border-border bg-card text-base focus:outline-none focus:ring-2 focus:ring-primary";
