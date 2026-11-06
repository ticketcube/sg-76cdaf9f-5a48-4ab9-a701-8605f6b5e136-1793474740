import Head from "next/head";
import { useRouter } from "next/router";
import { memo, useEffect, useMemo, useState } from "react";
import { Headphones } from "lucide-react";
import { DOT_LAT_TOP, DOT_STEP, LAND_ROWS } from "@/lib/worldDots";
import type { ListenersMapResponse } from "@/pages/api/listeners-map";

// Embeddable live listener map.
//   https://onestowatch.live/embed/listeners
//   ?demo=1      sample data (works before the AzuraCast key is set)
//   ?compact=1   map and count only, no country list
//   ?bg=transparent  no card background (host page shows through)

const COLS = LAND_ROWS[0].length;
const ROWS = LAND_ROWS.length;
const REFRESH_MS = 30_000;

const project = (lat: number, lon: number) => ({
  x: (lon + 180) / DOT_STEP,
  y: (DOT_LAT_TOP - lat) / DOT_STEP + 0.5,
});

const LandDots = memo(function LandDots() {
  const dots: JSX.Element[] = [];
  LAND_ROWS.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "1") dots.push(<circle key={`${x}-${y}`} cx={x + 0.5} cy={y + 0.5} r={0.3} />);
    }
  });
  return <g className="fill-foreground/20">{dots}</g>;
});

// Post our height to the host page (works with the onestowatch.com auto-resize snippet).
function useAutoResize() {
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    let raf = 0;
    const send = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.documentElement;
        window.parent.postMessage({ type: "otw:resize", height: el.scrollHeight, width: el.scrollWidth }, "*");
      });
    };
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    window.addEventListener("load", send);
    send();
    return () => {
      ro.disconnect();
      window.removeEventListener("load", send);
    };
  }, []);
}

export default function EmbedListeners() {
  const { query, isReady } = useRouter();
  const demo = query.demo === "1";
  const compact = query.compact === "1";
  const transparent = query.bg === "transparent";
  const [data, setData] = useState<ListenersMapResponse | null>(null);
  const [failed, setFailed] = useState(false);
  useAutoResize();

  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/listeners-map${demo ? "?demo=1" : ""}`);
        if (!r.ok) throw new Error(String(r.status));
        const d: ListenersMapResponse = await r.json();
        if (alive) { setData(d); setFailed(false); }
      } catch {
        if (alive) setFailed(true);
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(id); };
  }, [isReady, demo]);

  const maxCount = useMemo(() => Math.max(1, ...(data?.spots.map((s) => s.count) ?? [1])), [data]);
  const total = data?.total ?? 0;

  return (
    <>
      <Head>
        <title>OTW Radio listeners</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className={transparent ? "p-0" : "bg-background p-3"}>
        <div className={`${transparent ? "" : "bg-accent"} rounded-lg p-4 w-full max-w-3xl mx-auto`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">Listening now</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-sm text-foreground tabular-nums">
                {data ? total.toLocaleString("en-US") : "--"}
              </span>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${COLS} ${ROWS}`}
            className="w-full h-auto block"
            role="img"
            aria-label={`${total} people listening to OTW Radio right now`}
          >
            <LandDots />
            {data?.spots.map((s) => {
              const { x, y } = project(s.lat, s.lon);
              const r = 0.9 + 2.6 * Math.sqrt(s.count / maxCount);
              return (
                <g key={`${s.lat},${s.lon}`}>
                  <circle cx={x} cy={y} r={r} className="fill-primary/25">
                    <animate attributeName="r" values={`${r};${r * 1.8};${r}`} dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r={r * 0.55} className="fill-primary">
                    <title>{`${s.label}: ${s.count} listening`}</title>
                  </circle>
                </g>
              );
            })}
          </svg>

          {!compact && (
            <div className="mt-3 min-h-[1.25rem]">
              {failed && !data && <div className="text-muted text-xs">Listener map unavailable. Retrying...</div>}
              {data && data.countries.length > 0 && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {data.countries.slice(0, 6).map((c) => (
                    <li key={c.country} className="text-xs text-muted">
                      <span className="text-foreground">{c.country}</span>{" "}
                      <span className="font-mono">{c.count}</span>
                    </li>
                  ))}
                </ul>
              )}
              {data && data.countries.length === 0 && (
                <div className="text-muted text-xs">
                  {data.source === "unconfigured" || data.source === "error"
                    ? "Locations coming soon."
                    : total === 0 ? "Be the first one listening." : "Locations unavailable right now."}
                </div>
              )}
            </div>
          )}
          {demo && <div className="mt-2 font-mono text-[10px] uppercase tracking-wide text-primary">Sample data</div>}
        </div>
      </div>
    </>
  );
}