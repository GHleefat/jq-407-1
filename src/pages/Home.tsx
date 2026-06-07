import { useEffect, useState } from "react";
import { useBookStore } from "@/store/useBookStore";
import MarqueeBanner from "@/components/MarqueeBanner";
import DotMatrixDisplay from "@/components/DotMatrixDisplay";
import { Link } from "react-router-dom";

const ROTATE_INTERVAL = 12000;

export default function Home() {
  const { books, currentIndex, nextBook, setCurrentIndex } = useBookStore();
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    if (books.length === 0) return;
    setDisplayIndex(currentIndex % books.length);
  }, [currentIndex, books.length]);

  useEffect(() => {
    if (books.length <= 1) return;
    const timer = setInterval(() => {
      nextBook();
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [books.length, nextBook]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextBook();
      } else if (e.key === "ArrowLeft") {
        const newIdx =
          displayIndex - 1 < 0 ? books.length - 1 : displayIndex - 1;
        setCurrentIndex(newIdx);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [displayIndex, books.length, nextBook, setCurrentIndex]);

  const current = books[displayIndex];

  return (
    <div className="w-screen h-screen bg-black flex flex-col relative overflow-hidden">
      <div className="relative z-10 border-b-2 border-led-orange/30">
        <MarqueeBanner
          text="◆ 推理书店 · 今日书单 ◆  MYSTERY  BOOKSTORE  ◆  真相只有一个  ◆  欢迎来到推理的世界  ◆  TODAY'S  RECOMMENDATION  ◆"
          speed={90}
          className="py-3 md:py-4 text-xl md:text-3xl"
        />
      </div>

      <div className="relative flex-1 overflow-hidden">
        {current ? (
          <DotMatrixDisplay
            title={`《${current.title}》`}
            author={`作者：${current.author}`}
            recommendation={`「${current.recommendation}」`}
            index={displayIndex}
            total={books.length}
            scrollSpeed={30}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="font-dot text-led-orange led-glow text-3xl pixel-text">
              暂无书单，请前往 /admin 添加
            </p>
          </div>
        )}
      </div>

      <div className="relative z-10 border-t-2 border-led-orange/30">
        <MarqueeBanner
          text="▓▒░  阅读推理，解锁真相  ░▒▓  每一本书都是一场迷宫  ▓▒░  DETECTIVE  FICTION  ░▒▓  今晚你想被哪本书迷住？  ▓▒░"
          speed={110}
          className="py-3 md:py-4 text-lg md:text-2xl"
        />
      </div>

      <Link
        to="/admin"
        className="absolute bottom-2 right-4 z-50 text-xs font-dot text-led-orange/30 hover:text-led-orange/80 transition-colors pixel-text"
      >
        [ADMIN]
      </Link>

      <div className="absolute top-2 left-4 z-50 text-xs font-dot text-led-orange/20 pixel-text pointer-events-none">
        {new Date().toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          weekday: "short",
        })}
      </div>
    </div>
  );
}
