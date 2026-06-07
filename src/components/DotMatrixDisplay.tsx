import { useEffect, useRef } from "react";

interface DotMatrixDisplayProps {
  title: string;
  author: string;
  recommendation: string;
  index: number;
  total: number;
  scrollSpeed?: number;
}

const DOT_SIZE = 6;
const DOT_GAP = 2;
const CELL = DOT_SIZE + DOT_GAP;

const COLOR_ON = "#ff9a2e";
const COLOR_GLOW = "rgba(255, 154, 46, 0.8)";
const COLOR_DIM = "#150800";
const COLOR_AMBER_ON = "#ffd85c";
const COLOR_AMBER_GLOW = "rgba(255, 216, 92, 0.75)";
const COLOR_RED_ON = "#ff6b3a";
const COLOR_RED_GLOW = "rgba(255, 107, 58, 0.75)";

interface LineDef {
  key: string;
  rows: number;
  color: { on: string; glow: string };
  scroll: boolean;
  yStart: number;
  pixelData: Uint8ClampedArray;
  pixelWidth: number;
  pixelHeight: number;
  dotColsInText: number;
  staticColOffset: number;
  pxPerDot: number;
  startDotOffset: number;
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const glowWithAlpha = (glow: string, alpha: number) => {
  const match = glow.match(/rgba?\(([^)]+)\)/);
  if (!match) return glow;
  const parts = match[1].split(",").map((s) => s.trim());
  if (parts.length === 4) {
    const a = parseFloat(parts[3]);
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${a * alpha})`;
  }
  return glow;
};

export default function DotMatrixDisplay({
  title,
  author,
  recommendation,
  index,
  total,
  scrollSpeed = 30,
}: DotMatrixDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const scrollRef = useRef(0);
  const flickerRef = useRef<Uint8Array>(new Uint8Array(0));
  const sizeRef = useRef({ cols: 0, rows: 0 });
  const layoutRef = useRef<LineDef[]>([]);
  const buildLayoutRef = useRef<(() => void) | null>(null);
  const fadeAlphaRef = useRef(1);
  const fadeTargetRef = useRef(1);
  const hasRenderedOnceRef = useRef(false);
  const FADE_DURATION = 300;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const buildLayout = async () => {
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }

      const dpr = window.devicePixelRatio || 1;
      const cw = container.clientWidth || window.innerWidth * 0.9;
      const ch = container.clientHeight || window.innerHeight * 0.6;
      const cols = Math.max(30, Math.floor(cw / CELL));
      const rows = Math.max(24, Math.floor(ch / CELL));
      sizeRef.current = { cols, rows };

      canvas.width = cols * CELL * dpr;
      canvas.height = rows * CELL * dpr;
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      flickerRef.current = new Uint8Array(cols * rows);

      const spacer = Math.max(2, Math.round(rows * 0.03));
      const used = spacer * 2;
      const remaining = Math.max(30, rows - used);
      const titleRows = Math.max(20, Math.round(remaining * 0.4));
      const authorRows = Math.max(18, Math.round(remaining * 0.30));
      const recRows = Math.max(18, remaining - titleRows - authorRows);

      const OVERSAMPLE = 5;

      const makeTextCanvas = (
        text: string,
        rowCount: number,
        isScroll: boolean,
      ) => {
        const tc = document.createElement("canvas");
        const pixelH = rowCount * OVERSAMPLE;
        tc.height = pixelH;
        const tctx = tc.getContext("2d")!;
        tctx.imageSmoothingEnabled = true;
        const fontSize = Math.floor(pixelH * 0.86);
        const fontStr = `${fontSize}px "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", "VT323", monospace`;
        tctx.font = fontStr;
        const metrics = tctx.measureText(text);
        let textStartPx = 0;
        let textWidthPx: number;
        if (isScroll) {
          const gapPx = Math.max(cols * OVERSAMPLE, pixelH * 2);
          textStartPx = 0;
          textWidthPx = Math.ceil(metrics.width) + gapPx;
        } else {
          textWidthPx = Math.ceil(metrics.width) + pixelH * 2;
          textStartPx = pixelH;
        }
        tc.width = textWidthPx;
        tctx.imageSmoothingEnabled = true;
        tctx.fillStyle = "#000";
        tctx.fillRect(0, 0, tc.width, tc.height);
        tctx.font = fontStr;
        tctx.textBaseline = "middle";
        tctx.textAlign = isScroll ? "left" : "center";
        tctx.fillStyle = "#fff";
        tctx.fillText(
          text,
          isScroll ? textStartPx : tc.width / 2,
          pixelH / 2,
        );
        const imgData = tctx.getImageData(0, 0, tc.width, tc.height).data;
        const dotColsInText = Math.ceil(tc.width / OVERSAMPLE);
        return {
          pixelData: imgData,
          pixelWidth: tc.width,
          pixelHeight: tc.height,
          dotColsInText,
          pxPerDot: OVERSAMPLE,
          startDotOffset: Math.ceil(textStartPx / OVERSAMPLE),
        };
      };

      const lineDefs: {
        key: string;
        rows: number;
        color: { on: string; glow: string };
        scroll: boolean;
        text: string;
      }[] = [
        {
          key: "title",
          rows: titleRows,
          color: { on: COLOR_ON, glow: COLOR_GLOW },
          scroll: true,
          text: title + "          ",
        },
        {
          key: "author",
          rows: authorRows,
          color: { on: COLOR_AMBER_ON, glow: COLOR_AMBER_GLOW },
          scroll: true,
          text: author + "          ",
        },
        {
          key: "recommendation",
          rows: recRows,
          color: { on: COLOR_RED_ON, glow: COLOR_RED_GLOW },
          scroll: true,
          text: recommendation + "          ",
        },
      ];

      const finalLayout: LineDef[] = [];
      let cursor = Math.max(1, Math.floor(spacer / 2));

      lineDefs.forEach((def) => {
        const result = makeTextCanvas(def.text, def.rows, def.scroll);
        const staticColOffset = def.scroll
          ? 0
          : Math.floor((cols - result.dotColsInText) / 2);
        finalLayout.push({
          key: def.key,
          rows: def.rows,
          color: def.color,
          scroll: def.scroll,
          yStart: cursor,
          pixelData: result.pixelData,
          pixelWidth: result.pixelWidth,
          pixelHeight: result.pixelHeight,
          dotColsInText: result.dotColsInText,
          staticColOffset,
          pxPerDot: result.pxPerDot,
          startDotOffset: result.startDotOffset,
        });
        cursor += def.rows + spacer;
      });

      layoutRef.current = finalLayout;
      scrollRef.current = 0;
    };

    buildLayoutRef.current = buildLayout;

    const isFirstLoad = !hasRenderedOnceRef.current;
    if (isFirstLoad) {
      buildLayout();
      hasRenderedOnceRef.current = true;
      fadeAlphaRef.current = 1;
      fadeTargetRef.current = 1;
    } else {
      fadeAlphaRef.current = 0;
      fadeTargetRef.current = 1;
      buildLayout();
    }

    const onResize = () => {
      if (buildLayoutRef.current) buildLayoutRef.current();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [title, author, recommendation, index, total]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const samplePixel = (
      data: Uint8ClampedArray,
      w: number,
      cx: number,
      cy: number,
    ) => {
      const px = Math.max(0, Math.min(w - 1, Math.round(cx)));
      const py = Math.max(
        0,
        Math.min(data.length / (w * 4) - 1, Math.round(cy)),
      );
      const p = (py * w + px) * 4;
      return (data[p] + data[p + 1] + data[p + 2]) / 3;
    };

    const draw = (time: number) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;
      const { cols, rows } = sizeRef.current;
      if (cols === 0 || rows === 0) {
        if (buildLayoutRef.current) buildLayoutRef.current();
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      if (fadeAlphaRef.current !== fadeTargetRef.current) {
        const step = delta / FADE_DURATION;
        if (fadeAlphaRef.current < fadeTargetRef.current) {
          fadeAlphaRef.current = Math.min(
            fadeTargetRef.current,
            fadeAlphaRef.current + step,
          );
        } else {
          fadeAlphaRef.current = Math.max(
            fadeTargetRef.current,
            fadeAlphaRef.current - step,
          );
        }
      }

      const alpha = fadeAlphaRef.current;

      if (alpha > 0) {
        scrollRef.current -= (scrollSpeed * delta) / 1000;
      }
      const flicker = flickerRef.current;
      for (let i = 0; i < flicker.length; i++) {
        if (Math.random() < 0.004) {
          flicker[i] = flicker[i] ? 0 : 1;
        }
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cols * CELL, rows * CELL);

      const lines = layoutRef.current;

      for (let row = 0; row < rows; row++) {
        let lineData: LineDef | null = null;
        for (const line of lines) {
          if (row >= line.yStart && row < line.yStart + line.rows) {
            lineData = line;
            break;
          }
        }

        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const isFlickering = flicker[idx] === 1;
          const dotX = col * CELL;
          const dotY = row * CELL;

          let isLit = false;
          let dotColor = { on: COLOR_ON, glow: COLOR_GLOW };

          if (lineData) {
            const localRow = row - lineData.yStart;

            let colInText: number;
            if (lineData.scroll) {
              const w = lineData.dotColsInText;
              let shift = scrollRef.current;
              colInText = Math.floor(((col + shift) % w) + w) % w;
            } else {
              colInText = col - lineData.staticColOffset;
            }

            if (
              colInText >= 0 &&
              colInText < lineData.dotColsInText
            ) {
              const px = (colInText + 0.5) * lineData.pxPerDot;
              const py = (localRow + 0.5) * (lineData.pixelHeight / lineData.rows);
              const v = samplePixel(
                lineData.pixelData,
                lineData.pixelWidth,
                px,
                py,
              );
              if (v > 110) {
                isLit = true;
                dotColor = lineData.color;
              }
            }
          }

          if (isLit && !isFlickering && alpha > 0) {
            const effectiveAlpha = alpha;
            ctx.shadowColor = glowWithAlpha(dotColor.glow, effectiveAlpha);
            ctx.shadowBlur = 2.5;
            ctx.fillStyle = hexToRgba(dotColor.on, effectiveAlpha);
            ctx.beginPath();
            ctx.arc(
              dotX + DOT_SIZE / 2,
              dotY + DOT_SIZE / 2,
              DOT_SIZE / 2 - 0.2,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = hexToRgba("#ffffff", effectiveAlpha * 0.32);
            ctx.beginPath();
            ctx.arc(
              dotX + DOT_SIZE / 2 - 0.7,
              dotY + DOT_SIZE / 2 - 0.7,
              DOT_SIZE / 6,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          } else {
            ctx.fillStyle = COLOR_DIM;
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
  }, [scrollSpeed, index, total]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.13) 0px, rgba(0,0,0,0.13) 1px, transparent 1px, transparent 6px)",
        }}
      />

      <div
        className="absolute left-0 right-0 h-[3px] pointer-events-none z-20 animate-scan-line opacity-25"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(255,180,80,0.5), transparent)",
          boxShadow: "0 0 10px 2px rgba(255,150,50,0.35)",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </div>
  );
}
