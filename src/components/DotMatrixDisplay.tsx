import { useEffect, useRef, useMemo } from "react";

interface DotMatrixDisplayProps {
  lines: {
    text: string;
    size?: "large" | "medium" | "small";
    color?: "orange" | "red" | "amber";
  }[];
  scrollSpeed?: number;
  showBorder?: boolean;
}

const DOT_SIZE = 5;
const DOT_GAP = 1;
const PADDING = 3;

const COLORS = {
  orange: {
    on: "#ff8a1f",
    glow: "rgba(255, 138, 31, 0.55)",
    dim: "#3a1a00",
  },
  red: {
    on: "#ff5533",
    glow: "rgba(255, 85, 51, 0.55)",
    dim: "#2a0c04",
  },
  amber: {
    on: "#ffc23b",
    glow: "rgba(255, 194, 59, 0.5)",
    dim: "#3a2a00",
  },
};

export default function DotMatrixDisplay({
  lines,
  scrollSpeed = 40,
  showBorder = true,
}: DotMatrixDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollXRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const flickerMapRef = useRef<boolean[]>([]);
  const lastTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ cols: 0, rows: 0 });

  const pixelFont = useMemo(
    () => ({
      large: 'bold 44px "VT323", "ZCOOL KuaiLe", monospace',
      medium: 'bold 32px "VT323", "ZCOOL KuaiLe", monospace',
      small: 'bold 22px "VT323", "ZCOOL KuaiLe", monospace',
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const cols = Math.floor(rect.width / (DOT_SIZE + DOT_GAP));
      const rows = Math.floor(rect.height / (DOT_SIZE + DOT_GAP));
      sizeRef.current = { cols, rows };

      canvas.width = cols * (DOT_SIZE + DOT_GAP) * dpr;
      canvas.height = rows * (DOT_SIZE + DOT_GAP) * dpr;
      canvas.style.width = `${cols * (DOT_SIZE + DOT_GAP)}px`;
      canvas.style.height = `${rows * (DOT_SIZE + DOT_GAP)}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      flickerMapRef.current = new Array(cols * rows).fill(false);
      scrollXRef.current = cols;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const textCanvas = document.createElement("canvas");
    textCanvasRef.current = textCanvas;

    const combinedText = lines.map((l) => l.text).join("   ");
    const longestLine = lines.reduce(
      (max, l) => (l.text.length > max.text.length ? l : max),
      lines[0] || { text: "", size: "medium" as const },
    );

    const measureCtx = textCanvas.getContext("2d")!;
    const baseFont =
      pixelFont[longestLine.size && typeof longestLine.size === "string"
        ? longestLine.size
        : "medium"];
    measureCtx.font = baseFont;
    const metrics = measureCtx.measureText(combinedText + "   ");
    const textWidth = Math.ceil(metrics.width) + 200;
    const textHeight = 180;

    textCanvas.width = textWidth;
    textCanvas.height = textHeight;
    const tctx = textCanvas.getContext("2d")!;
    tctx.fillStyle = "#000";
    tctx.fillRect(0, 0, textWidth, textHeight);
    tctx.textBaseline = "middle";
    tctx.textAlign = "left";

    let yCursor = 30;
    lines.forEach((line) => {
      const font = pixelFont[line.size || "medium"];
      tctx.font = font;
      tctx.fillStyle = "#fff";
      tctx.fillText(line.text, 20, yCursor);
      const sizeNum = parseInt(font.match(/\d+/)?.[0] || "28");
      yCursor += sizeNum * 1.1;
    });

    const draw = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      const { cols, rows } = sizeRef.current;
      if (cols === 0 || rows === 0) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      scrollXRef.current -= (scrollSpeed * delta) / 1000;
      const totalTextWidth = textWidth;
      if (-scrollXRef.current > totalTextWidth + cols) {
        scrollXRef.current = cols;
      }

      const flickerChance = 0.015;
      for (let i = 0; i < flickerMapRef.current.length; i++) {
        if (Math.random() < flickerChance) {
          flickerMapRef.current[i] = !flickerMapRef.current[i];
        }
      }

      ctx.fillStyle = "#040404";
      ctx.fillRect(
        0,
        0,
        cols * (DOT_SIZE + DOT_GAP),
        rows * (DOT_SIZE + DOT_GAP),
      );

      const tData = tctx.getImageData(0, 0, textWidth, textHeight).data;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const srcX = Math.floor(col + scrollXRef.current);
          const srcY = Math.floor((row / rows) * textHeight);
          const dotX = col * (DOT_SIZE + DOT_GAP);
          const dotY = row * (DOT_SIZE + DOT_GAP);
          const idx = row * cols + col;
          const isFlickering = flickerMapRef.current[idx];

          if (
            srcX >= 0 &&
            srcX < textWidth &&
            srcY >= 0 &&
            srcY < textHeight
          ) {
            const pixelIdx = (srcY * textWidth + srcX) * 4;
            const brightness = tData[pixelIdx] / 255;
            const isLit = brightness > 0.4;

            if (isLit && !isFlickering) {
              const color =
                COLORS[lines[0]?.color && typeof lines[0].color === "string"
                  ? lines[0].color
                  : "orange"];
              const variance = 0.7 + Math.random() * 0.3;

              ctx.shadowColor = color.glow;
              ctx.shadowBlur = 3 * variance;
              ctx.fillStyle = brightness > 0.7
                ? color.on
                : `rgba(255, 138, 31, ${brightness})`;

              ctx.beginPath();
              ctx.arc(
                dotX + DOT_SIZE / 2,
                dotY + DOT_SIZE / 2,
                DOT_SIZE / 2 - 0.3,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.shadowBlur = 0;
            } else {
              const color = COLORS["orange"];
              ctx.fillStyle = color.dim;
              ctx.beginPath();
              ctx.arc(
                dotX + DOT_SIZE / 2,
                dotY + DOT_SIZE / 2,
                DOT_SIZE / 2 - 1,
                0,
                Math.PI * 2,
              );
              ctx.fill();
            }
          } else {
            const color = COLORS["orange"];
            ctx.fillStyle = color.dim;
            ctx.beginPath();
            ctx.arc(
              dotX + DOT_SIZE / 2,
              dotY + DOT_SIZE / 2,
              DOT_SIZE / 2 - 1,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [lines, scrollSpeed, pixelFont]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-black ${
        showBorder
          ? "border-[6px] border-zinc-900 rounded-sm shadow-[inset_0_0_60px_rgba(255,100,0,0.05)]"
          : ""
      }`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas ref={canvasRef} className="block" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 4px)",
        }}
      />

      <div
        className="absolute left-0 right-0 h-[2px] pointer-events-none z-20 animate-scan-line opacity-40"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(255,160,60,0.6), transparent)",
          boxShadow: "0 0 12px 2px rgba(255,140,40,0.4)",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none z-40 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
