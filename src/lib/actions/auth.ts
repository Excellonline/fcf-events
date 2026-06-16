"use server";

import { redirect } from "next/navigation";
import { getPostLoginRedirect } from "@/lib/auth";
import { env, isServiceRoleConfigured } from "@/lib/env";
import { accountSignupSchema } from "@/lib/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAction(input: FormData) {
  const email = String(input.get("email") ?? "").trim().toLowerCase();
  const password = String(input.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing_credentials");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/dashboard");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  redirect(await getPostLoginRedirect(data.user?.id ?? null));
}

export async function signUpAction(input: FormData) {
  const redirectTo = safeLocalRedirect(String(input.get("redirect") ?? "/account"));
  const email = String(input.get("email") ?? "").trim().toLowerCase();
  const parsed = accountSignupSchema.safeParse({
    fullName: input.get("fullName"),
    email,
    password: input.get("password"),
    confirmPassword: input.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect(signupRedirect({ error: "invalid", email, redirectTo }));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(signupRedirect({ created: "demo", email: parsed.data.email, redirectTo }));
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${env.appUrl.replace(/\/$/, "")}/account`,
    },
  });

  if (error) {
    redirect(signupRedirect({ error: "signup", email: parsed.data.email, redirectTo }));
  }

  if (data.user && isServiceRoleConfigured()) {
    const admin = createSupabaseAdminClient();
    await admin.from("user_profiles").upsert({
      id: data.user.id,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      phone: null,
    });
  }

  if (data.session) {
    redirect(redirectTo);
  }

  redirect(signupRedirect({ created: "check_email", email: parsed.data.email, redirectTo }));
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/login");
}

function safeLocalRedirect(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

function signupRedirect({
  created,
  error,
  email,
  redirectTo,
}: {
  created?: string;
  error?: string;
  email?: string;
  redirectTo: string;
}) {
  const params = new URLSearchParams({ redirect: redirectTo });
  if (email) params.set("email", email);
  if (created) params.set("created", created);
  if (error) params.set("error", error);
  return `/signup?${params.toString()}`;
}
