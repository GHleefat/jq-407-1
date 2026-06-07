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
  const indicatorRef = useRef<{ cols: number[]; row: number } | null>(null);
  const buildLayoutRef = useRef<(() => void) | null>(null);

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
      const rect = container.getBoundingClientRect();
      const cols = Math.max(30, Math.floor(rect.width / CELL));
      const rows = Math.max(24, Math.floor(rect.height / CELL));
      sizeRef.current = { cols, rows };

      canvas.width = cols * CELL * dpr;
      canvas.height = rows * CELL * dpr;
      canvas.style.width = `${cols * CELL}px`;
      canvas.style.height = `${rows * CELL}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      flickerRef.current = new Uint8Array(cols * rows);

      const headerRows = Math.max(5, Math.round(rows * 0.09));
      const footerRows = Math.max(4, Math.round(rows * 0.08));
      const spacer = Math.max(1, Math.round(rows * 0.025));
      const indicatorRows = 2;
      const used = headerRows + footerRows + indicatorRows + spacer * 5;
      const remaining = Math.max(18, rows - used);
      const titleRows = Math.round(remaining * 0.42);
      const authorRows = Math.round(remaining * 0.26);
      const recRows = remaining - titleRows - authorRows;

      const OVERSAMPLE = 3;

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
        const fontSize = Math.floor(pixelH * 0.92);
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
          key: "header",
          rows: headerRows,
          color: { on: COLOR_AMBER_ON, glow: COLOR_AMBER_GLOW },
          scroll: false,
          text: "◆ 今日推荐 ◆",
        },
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
        {
          key: "footer",
          rows: footerRows,
          color: { on: COLOR_ON, glow: COLOR_GLOW },
          scroll: false,
          text: `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}   ◆ MYSTERY ◆`,
        },
      ];

      const finalLayout: LineDef[] = [];
      let cursor = 0;
      let indicatorRow = 0;

      lineDefs.forEach((def, i) => {
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
        if (i === 3) {
          cursor += spacer;
          indicatorRow = cursor;
          cursor += indicatorRows + spacer;
        }
      });

      layoutRef.current = finalLayout;

      const dotCols: number[] = [];
      const gap = 3;
      const dotWidth = 2;
      const allWidth = total * dotWidth + Math.max(0, total - 1) * gap;
      const start = Math.max(0, Math.floor((cols - allWidth) / 2));
      for (let i = 0; i < total; i++) {
        for (let j = 0; j < dotWidth; j++) {
          dotCols.push(start + i * (dotWidth + gap) + j);
        }
      }
      indicatorRef.current = { cols: dotCols, row: indicatorRow };

      scrollRef.current = 0;
    };

    buildLayoutRef.current = buildLayout;
    buildLayout();

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

    const SAMPLE = 3;
    const HALF = (SAMPLE - 1) / 2;

    const sampleMax = (
      data: Uint8ClampedArray,
      w: number,
      h: number,
      cx: number,
      cy: number,
    ) => {
      let max = 0;
      for (let dy = -HALF; dy <= HALF; dy++) {
        for (let dx = -HALF; dx <= HALF; dx++) {
          const px = Math.max(0, Math.min(w - 1, cx + dx));
          const py = Math.max(0, Math.min(h - 1, cy + dy));
          const p = (py * w + px) * 4;
          const v = (data[p] + data[p + 1] + data[p + 2]) / 3;
          if (v > max) max = v;
        }
      }
      return max;
    };

    const draw = (time: number) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;
      const { cols, rows } = sizeRef.current;
      if (cols === 0 || rows === 0) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      scrollRef.current -= (scrollSpeed * delta) / 1000;
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
            const py = Math.floor(
              (localRow + 0.5) * (lineData.pixelHeight / lineData.rows),
            );

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
              const px = Math.floor(
                (colInText + 0.5) * lineData.pxPerDot,
              );
              const v = sampleMax(
                lineData.pixelData,
                lineData.pixelWidth,
                lineData.pixelHeight,
                px,
                py,
              );
              if (v > 20) {
                isLit = true;
                dotColor = lineData.color;
              }
            }
          }

          const indicator = indicatorRef.current;
          if (indicator && row >= indicator.row && row < indicator.row + 2) {
            const flatIdx = indicator.cols.indexOf(col);
            if (flatIdx !== -1) {
              const dotIdx = Math.floor(flatIdx / 2);
              if (dotIdx >= 0 && dotIdx < total) {
                isLit = true;
                dotColor =
                  dotIdx === index
                    ? { on: COLOR_ON, glow: COLOR_GLOW }
                    : { on: "#4a2000", glow: "rgba(74,32,0,0.4)" };
              }
            }
          }

          if (isLit && !isFlickering) {
            ctx.shadowColor = dotColor.glow;
            ctx.shadowBlur = 2.5;
            ctx.fillStyle = dotColor.on;
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

            ctx.fillStyle = "rgba(255,255,255,0.32)";
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
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas ref={canvasRef} className="block" />
      </div>

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
