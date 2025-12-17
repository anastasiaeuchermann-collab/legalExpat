import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            LegalExpat
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Connect with Legal Experts in Germany
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Find trusted legal service providers specialized in helping expats navigate
            immigration, tax, employment, and other legal matters in Germany.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/providers"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Find Legal Experts
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
            >
              Join as Provider
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">For Expats</h3>
              <p className="text-gray-600">
                Find qualified legal experts who understand your unique challenges as an expat in Germany.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">For Providers</h3>
              <p className="text-gray-600">
                Connect with expats who need your legal expertise and grow your practice.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Secure & Verified</h3>
              <p className="text-gray-600">
                All legal professionals are verified and payments are processed securely through Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
