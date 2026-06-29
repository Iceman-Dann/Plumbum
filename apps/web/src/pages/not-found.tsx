import { Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#F8F6F1] px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-serif text-6xl font-bold text-[#1A1A18] mb-4">{t.notFound.code}</h1>
        <p className="text-[#888880] mb-8">{t.notFound.message}</p>
        <Link href="/" className="inline-block px-6 py-3 bg-[#A63D2F] text-white font-medium text-sm">
          {t.notFound.returnHome}
        </Link>
      </div>
    </div>
  );
}
