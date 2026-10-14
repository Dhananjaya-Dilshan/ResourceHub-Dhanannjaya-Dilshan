import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoadingSpinner } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Sign in | ResourceHub",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center py-12 px-4">
      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
