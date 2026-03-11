"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProfileData {
  email: string;
  name: string | null;
  phone: string | null;
  userType: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/en/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me");
      if (!res.ok) return;
      const data = await res.json();
      setUser({
        email: data.email,
        name: data.name,
        phone: data.phone,
        userType: data.userType
      });
    }
    if (status === "authenticated") {
      void load();
    }
  }, [status]);

  if (!session || !user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      <div className="space-y-2 rounded-lg border bg-card p-4">
        <p>
          <span className="font-medium">Email:</span> {user.email}
        </p>
        <p>
          <span className="font-medium">Name:</span> {user.name ?? "-"}
        </p>
        <p>
          <span className="font-medium">Phone:</span> {user.phone ?? "-"}
        </p>
        <p>
          <span className="font-medium">User type:</span> {user.userType ?? "-"}
        </p>
      </div>
    </section>
  );
}

