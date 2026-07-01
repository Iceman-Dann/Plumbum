import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#F8F6F1] px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-serif text-6xl font-bold text-[#1A1A18] mb-4">404</h1>
        <p className="text-[#888880] mb-8">The page you're looking for cannot be found.</p>
        <Link href="/" className="inline-block px-6 py-3 bg-[#A63D2F] text-white font-medium text-sm">
          Return Home
        </Link>
      </div>
    </div>
  );
}
