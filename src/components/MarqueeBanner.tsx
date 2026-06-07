interface MarqueeBannerProps {
  text: string;
  speed?: number;
  className?: string;
}

export default function MarqueeBanner({
  text,
  speed = 120,
  className = "",
}: MarqueeBannerProps) {
  const duration = Math.max(8, (text.length * 16) / speed * 6);

  return (
    <div
      className={`marquee-wrapper w-full overflow-hidden bg-black ${className}`}
    >
      <div
        className="marquee-content whitespace-nowrap font-dot text-led-orange led-glow-strong pixel-text"
        style={{
          animation: `bannerScroll ${duration}s linear infinite`,
        }}
      >
        <span className="inline-block px-8">{text}</span>
        <span className="inline-block px-8">{text}</span>
        <span className="inline-block px-8">{text}</span>
        <span className="inline-block px-8">{text}</span>
      </div>

      <style>{`
        @keyframes bannerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
