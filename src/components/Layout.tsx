import Link from "next/link";
import { Radio } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col pb-24">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <Radio className="w-6 h-6 text-primary" />
            OTW Radio
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/schedule" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Schedule
            </Link>
            <Link href="/shows" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Shows
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}