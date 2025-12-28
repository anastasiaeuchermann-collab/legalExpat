"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

// Opt out of static prerendering since this page uses useSearchParams
export const dynamic = 'force-dynamic';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const userType = searchParams.get("type");

  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      setMessage("Email address is required to resend verification");
      return;
    }

    setIsResending(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/auth/verify-email?email=${encodeURIComponent(email)}`,
        { method: "GET" }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to resend verification email");
        setIsResending(false);
        return;
      }

      setMessage("Verification email sent! Please check your inbox.");
      setIsResending(false);
    } catch (error) {
      console.error("Resend error:", error);
      setMessage("An unexpected error occurred");
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Check Your Email
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verification Email Sent
            </h2>
            <p className="text-gray-600 mb-4">
              We&apos;ve sent a verification link to{" "}
              {email && <strong className="block mt-2">{email}</strong>}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please click the link in the email to verify your account. The link
              will expire in 24 hours.
            </p>

            {userType === "provider" && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> After verifying your email, your
                  provider account will require admin approval before you can start
                  offering services. You&apos;ll receive a notification once
                  approved.
                </p>
              </div>
            )}

            {message && (
              <div
                className={`p-3 border rounded-md mb-4 ${
                  message.includes("sent")
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p
                  className={`text-sm ${
                    message.includes("sent") ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-gray-500">Didn&apos;t receive the email?</p>
              {email && (
                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </Button>
              )}
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
