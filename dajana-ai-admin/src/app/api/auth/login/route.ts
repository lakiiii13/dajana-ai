import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { signSessionToken } from "@/lib/auth";
import type { Database } from "@/types/database";
import bcrypt from "bcryptjs";

type AdminRow = Database["public"]["Tables"]["admin_users"]["Row"];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email i lozinka su obavezni" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .eq("is_active", true)
      .single();

    if (error) {
      console.log("[Login] Supabase error:", error.code, error.message);
      return NextResponse.json(
        { error: "Pogrešan email ili lozinka" },
        { status: 401 }
      );
    }
    if (!admin) {
      console.log("[Login] No admin found for email:", email);
      return NextResponse.json(
        { error: "Pogrešan email ili lozinka" },
        { status: 401 }
      );
    }

    const adminRow = admin as AdminRow;
    const isValidPassword = await bcrypt.compare(password, adminRow.password_hash);
    if (!isValidPassword) {
      console.log("[Login] Password mismatch for:", adminRow.email);
      return NextResponse.json(
        { error: "Pogrešan email ili lozinka" },
        { status: 401 }
      );
    }

    const sessionToken = signSessionToken({
      id: adminRow.id,
      email: adminRow.email,
      role: adminRow.role,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    });

    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: adminRow.id,
        email: adminRow.email,
        name: adminRow.name,
        role: adminRow.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Došlo je do greške" },
      { status: 500 }
    );
  }
}
