interface BookCardMatrixProps {
  title: string;
  author: string;
  recommendation: string;
  index: number;
  total: number;
}

export default function BookCardMatrix({
  title,
  author,
  recommendation,
  index,
  total,
}: BookCardMatrixProps) {
  return (
    <div className="relative w-full h-full flex flex-col justify-center px-8 md:px-16 py-6 overflow-hidden animate-flicker">
      <div className="absolute top-4 left-0 right-0 flex justify-between px-8 md:px-16 z-10">
        <div className="font-dot text-2xl md:text-3xl text-led-orange led-glow pixel-text tracking-widest">
          ◆ 今日推荐 ◆
        </div>
        <div className="font-dot text-2xl md:text-3xl text-led-amber led-glow pixel-text tracking-widest">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-3 md:gap-5 mt-4">
        <div className="marquee-wrapper w-full py-2">
          <div
            className="marquee-content font-pixel text-led-orange-bright led-glow-strong pixel-text text-3xl md:text-5xl lg:text-6xl whitespace-nowrap"
            style={{
              ["--scroll-duration" as string]: `${Math.max(10, title.length * 1.2)}s`,
              animation: "textScroll var(--scroll-duration) linear infinite",
            }}
          >
            《{title}》&nbsp;&nbsp;&nbsp;&nbsp;《{title}》&nbsp;&nbsp;&nbsp;&nbsp;
          </div>
        </div>

        <div className="marquee-wrapper w-full py-1">
          <div
            className="marquee-content font-dot text-led-amber led-glow pixel-text text-xl md:text-3xl whitespace-nowrap"
            style={{
              ["--scroll-duration" as string]: `${Math.max(8, author.length * 1.5 + 6)}s`,
              animation: "textScroll var(--scroll-duration) linear infinite",
            }}
          >
            作者：{author}&nbsp;&nbsp;&nbsp;&nbsp;作者：{author}&nbsp;&nbsp;&nbsp;&nbsp;
          </div>
        </div>

        <div className="relative mt-4 md:mt-6 border-t border-led-orange/30 pt-4 md:pt-6">
          <div className="marquee-wrapper w-full py-2">
            <div
              className="marquee-content font-dot text-led-red-bright led-glow pixel-text text-lg md:text-2xl lg:text-3xl whitespace-nowrap"
              style={{
                ["--scroll-duration" as string]: `${Math.max(14, recommendation.length * 0.9)}s`,
                animation: "textScroll var(--scroll-duration) linear infinite",
              }}
            >
              「{recommendation}」&nbsp;&nbsp;&nbsp;&nbsp;「{recommendation}」&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-between px-8 md:px-16 z-10">
        <div className="font-dot text-lg md:text-xl text-led-orange/60 pixel-text tracking-wider">
          ▓▒░ MYSTERY ░▒▓
        </div>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-500 ${
                i === index
                  ? "bg-led-orange shadow-[0_0_12px_3px_rgba(255,123,0,0.8)]"
                  : "bg-led-orange/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
