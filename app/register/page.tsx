import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { LoadingSpinner } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Create an Account | ResourceHub",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center py-12 px-4">
      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
