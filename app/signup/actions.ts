"use server";

import { createClient } from "@/lib/supabase/server";

export type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  company: string;
  jobTitle: string;
};

export type SignupResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

export async function signupUser(input: SignupInput): Promise<SignupResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const company = input.company.trim();
  const jobTitle = input.jobTitle.trim();

  if (!fullName || !email || !password || !company) {
    return { ok: false, error: "Name, email, password, and company are required." };
  }
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (company.length < 2) return { ok: false, error: "Company name is too short." };

  const supabase = createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company,
        role: jobTitle || null,
      },
    },
  });

  if (signUpError) {
    if (/already registered|already exists|user already/i.test(signUpError.message)) {
      return { ok: false, error: "An account with this email already exists. Try logging in." };
    }
    return { ok: false, error: signUpError.message };
  }

  const userId = signUpData.user?.id ?? signUpData.session?.user.id;
  if (!userId) {
    return {
      ok: false,
      error: "Account created — please check your email to confirm before logging in.",
    };
  }

  // Ensure profile exists (handle_new_user trigger handles it, but just in case)
  await supabase.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    company,
    role: jobTitle || null,
  });

  // If signUp returned a session immediately (email confirmation off in
  // Supabase auth settings), we can create the workspace inline because
  // auth.uid() is now set. Otherwise the user will land on /onboarding after
  // confirming their email.
  if (signUpData.session) {
    const baseSlug = slugify(company) || `workspace-${userId.slice(0, 8)}`;
    let slug = baseSlug;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await supabase.from("workspaces").insert({
        owner_id: userId,
        name: company,
        slug,
        legal_entity: company,
        timezone: "America/Chicago",
        plan: "essential",
        settings: {
          approval_threshold_cents: 100000,
          auto_file_window_days: 14,
          deadline_lead_days: 45,
          escalation_hours: 48,
          default_mode: "auto",
        },
      });
      if (!error) break;
      if (error.code !== "23505") {
        // Soft-fail: the user can finish onboarding manually from /onboarding.
        break;
      }
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }
  }

  return { ok: true };
}
