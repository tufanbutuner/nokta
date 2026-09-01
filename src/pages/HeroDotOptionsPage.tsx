import { Search } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const title = "Discover social venues";
const titleAccent = "worth going out for";
const subtitle = "Find shisha lounges, restaurants, bars and cafes across the UK.";

export function HeroDotOptionsPage() {
  return (
    <main className="bg-nokta-page-bg text-nokta-ink">
      <PageMeta title="Hero dot options | Nokta" description="Homepage hero dot treatment options." canonicalPath="/hero-dot-options" />
      <PageContainer className="space-y-8 py-8">
        <header>
          <p className="text-sm font-semibold text-clay-accent">Hero options</p>
          <h1 className="mt-2 text-3xl font-semibold">Nokta dot treatments</h1>
        </header>

        <HeroFrame label="A. Corner bleed dot" recommended>
          <section className="relative isolate overflow-hidden rounded-3xl bg-white px-6 py-12 text-center shadow-sm shadow-stone-950/5 sm:px-10 sm:py-16">
            <Dot className="-right-28 -top-28 h-72 w-72 opacity-100 sm:-right-20 sm:-top-32 sm:h-96 sm:w-96" />
            <HeroCopy accentClassName="text-clay-accent" />
            <HeroSearch />
          </section>
        </HeroFrame>

        <HeroFrame label="B. Inline headline dot">
          <section className="rounded-3xl bg-white px-6 py-12 text-center shadow-sm shadow-stone-950/5 sm:px-10 sm:py-16">
            <h2 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.02] sm:text-6xl">
              {title}
              <span className="mt-1 flex items-center justify-center gap-3">
                {titleAccent}
                <span className="mt-2 inline-block h-5 w-5 rounded-full bg-clay-accent sm:h-7 sm:w-7" />
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{subtitle}</p>
            <HeroSearch />
          </section>
        </HeroFrame>

        <HeroFrame label="C. Search-led dot accent">
          <section className="rounded-3xl bg-white px-6 py-12 text-center shadow-sm shadow-stone-950/5 sm:px-10 sm:py-16">
            <HeroCopy accentClassName="text-clay-accent" />
            <form className="mx-auto mt-8 max-w-3xl rounded-2xl border bg-card p-2 shadow-xl shadow-stone-950/5">
              <div className="relative">
                <span className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-clay-accent/20" />
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="min-w-0 border-0 bg-transparent pl-9 pr-14 shadow-none focus-visible:ring-0 sm:pr-32" placeholder="Search venues, areas or vibes..." />
                <Button type="button" className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 bg-clay-accent px-0 text-white hover:bg-clay-accent-hover sm:w-24 sm:px-4">
                  <Search className="h-4 w-4 sm:hidden" />
                  <span className="sr-only sm:not-sr-only">Explore</span>
                </Button>
              </div>
            </form>
          </section>
        </HeroFrame>

        <HeroFrame label="D. Split dot panel">
          <section className="grid overflow-hidden rounded-3xl bg-white shadow-sm shadow-stone-950/5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="px-6 py-12 text-left sm:px-10 sm:py-16">
              <h2 className="max-w-2xl text-4xl font-bold leading-[1.02] sm:text-6xl">
                {title}
                <span className="mt-1 block text-clay-accent">{titleAccent}</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">{subtitle}</p>
              <HeroSearch align="left" />
            </div>
            <div className="relative min-h-64 overflow-hidden bg-clay-accent">
              <Dot className="-bottom-24 -right-20 h-96 w-96 bg-white/20" />
              <Dot className="left-10 top-10 h-24 w-24 bg-white/15" />
            </div>
          </section>
        </HeroFrame>

        <HeroFrame label="E. Soft background watermark">
          <section className="relative isolate overflow-hidden rounded-3xl bg-white px-6 py-12 text-center shadow-sm shadow-stone-950/5 sm:px-10 sm:py-16">
            <Dot className="left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]" />
            <HeroCopy accentClassName="text-clay-accent" />
            <HeroSearch />
          </section>
        </HeroFrame>
      </PageContainer>
    </main>
  );
}

function HeroFrame({ label, recommended, children }: { label: string; recommended?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-nokta-ink">{label}</h2>
        {recommended ? <span className="rounded-full bg-clay-accent/10 px-2 py-0.5 text-xs font-semibold text-clay-accent">Recommended</span> : null}
      </div>
      {children}
    </section>
  );
}

function HeroCopy({ accentClassName }: { accentClassName: string }) {
  return (
    <div className="relative z-10">
      <h2 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.02] sm:text-6xl">
        {title}
        <span className={`mt-1 block ${accentClassName}`}>{titleAccent}</span>
      </h2>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{subtitle}</p>
    </div>
  );
}

function HeroSearch({ align = "center" }: { align?: "center" | "left" }) {
  return (
    <form className={`relative z-10 mt-8 max-w-3xl rounded-2xl border bg-card p-2 shadow-xl shadow-stone-950/5 ${align === "center" ? "mx-auto" : ""}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="min-w-0 border-0 bg-transparent pl-9 pr-14 shadow-none focus-visible:ring-0 sm:pr-32" placeholder="Search venues, areas or vibes..." />
        <Button type="button" className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 bg-clay-accent px-0 text-white hover:bg-clay-accent-hover sm:w-24 sm:px-4">
          <Search className="h-4 w-4 sm:hidden" />
          <span className="sr-only sm:not-sr-only">Explore</span>
        </Button>
      </div>
    </form>
  );
}

function Dot({ className }: { className: string }) {
  return <span aria-hidden="true" className={`pointer-events-none absolute z-0 rounded-full bg-clay-accent ${className}`} />;
}
