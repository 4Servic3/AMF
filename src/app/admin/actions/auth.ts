"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(_previous: { error: string }, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Cannot return error directly to form action without useFormState
    return { error: "Não foi possível entrar. Confira seu e-mail e senha." };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error)
    throw new Error("Não foi possível encerrar a sessão. Tente novamente.");
  redirect("/admin/login");
}
