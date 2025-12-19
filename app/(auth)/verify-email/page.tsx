"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type VerificationState = "pending" | "verifying" | "success" | "error" | "expired";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [state, setState] = useState<VerificationState>("pending");
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const verifyEmail = useCallback(async (verificationToken: string) => {
    setState("verifying");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("expired")) {
          setState("expired");
          setMessage(data.error);
        } else {
          setState("error");
          setMessage(data.error || "Verification failed");
        }
        return;
      }

      setState("success");
      setMessage(data.message);
      setUserRole(data.role);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      console.error("Verification error:", error);
      setState("error");
      setMessage("An unexpected error occurred during verification");
    }
  }, [router]);

  useEffect(() => {
    // If token is present in URL, automatically verify
    if (token) {
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

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
            Email Verification
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Verifying State */}
          {state === "verifying" && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {/* Success State */}
          {state === "success" && (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Email Verified Successfully!
              </h2>
              <p className="text-gray-600 mb-4">
                Your email has been verified. You can now sign in to your account.
              </p>
              {userRole === "provider" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your provider account is pending admin
                    approval. You&apos;ll be notified once your account is activated.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Redirecting to login page...
              </p>
              <Link href="/login">
                <Button variant="primary" className="mt-4">
                  Go to Login
                </Button>
              </Link>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              {email && (
                <Button
                  variant="primary"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="mb-4"
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </Button>
              )}
              <div className="mt-4">
                <Link href="/register">
                  <Button variant="outline">Back to Registration</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Expired State */}
          {state === "expired" && (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Link Expired
              </h2>
              <p className="text-gray-600 mb-4">
                This verification link has expired. Please request a new one.
              </p>
              {email && (
                <Button
                  variant="primary"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="mb-4"
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </Button>
              )}
              <div className="mt-4">
                <Link href="/register">
                  <Button variant="outline">Back to Registration</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Pending State (No token in URL - just registered) */}
          {state === "pending" && !token && (
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
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-4">
                We&apos;ve sent a verification link to{" "}
                {email && <strong>{email}</strong>}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please click the link in the email to verify your account. The link
                will expire in 24 hours.
              </p>
              {message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-4">
                  <p className="text-sm text-green-800">{message}</p>
                </div>
              )}
              <div className="space-y-3">
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
          )}
        </div>
      </div>
    </div>
  );
}
