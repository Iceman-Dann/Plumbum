import { Link } from "wouter";

export function Nav() {
  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" data-testid="nav-logo">
          <img 
            src="/logo.png" 
            alt="Plumbum Logo" 
            className="h-8 w-auto object-contain"
            onError={(e) => {
              // Fallback to alias if logo.png is missing
              (e.target as HTMLImageElement).src = "/image_1782242829776.png"; 
            }}
          />
          <span className="font-serif font-bold text-xl tracking-tight hidden sm:block">Plumbum</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <a href="#" className="hover:text-primary transition-colors" data-testid="nav-link-research">Research</a>
          <a href="#" className="hover:text-primary transition-colors" data-testid="nav-link-github">GitHub ↗</a>
        </div>
      </div>
    </nav>
  );
}
