import { useState } from "react";
import { Link } from "react-router-dom";
import { useBookStore } from "@/store/useBookStore";
import type { Book } from "@/types";
import { Pencil, Plus, RotateCcw, Save, Trash2, X, Eye } from "lucide-react";

interface FormState {
  title: string;
  author: string;
  recommendation: string;
}

const emptyForm: FormState = {
  title: "",
  author: "",
  recommendation: "",
};

export default function Admin() {
  const { books, addBook, updateBook, deleteBook, resetToDefault } =
    useBookStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2200);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (book: Book) => {
    setIsAdding(false);
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      recommendation: book.recommendation,
    });
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const isValid =
    form.title.trim() && form.author.trim() && form.recommendation.trim();

  const submit = () => {
    if (!isValid) {
      showMsg("所有字段都不能为空哦");
      return;
    }
    const data = {
      title: form.title.trim(),
      author: form.author.trim(),
      recommendation: form.recommendation.trim(),
    };
    if (isAdding) {
      addBook(data);
      showMsg("✓ 已添加新书");
    } else if (editingId) {
      updateBook(editingId, data);
      showMsg("✓ 已保存修改");
    }
    cancel();
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`确定要删除《${title}》吗？`)) {
      deleteBook(id);
      showMsg("✓ 已删除");
      if (editingId === id) cancel();
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-y-auto dot-grid-bg">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b-2 border-led-orange/40">
          <div>
            <h1 className="font-pixel text-2xl md:text-3xl text-led-orange led-glow-strong pixel-text tracking-widest">
              ◆ 书单管理后台 ◆
            </h1>
            <p className="font-dot text-lg md:text-xl text-led-orange/60 mt-2 pixel-text">
              MYSTERY BOOKSTORE ADMIN PANEL
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 font-dot text-lg text-led-orange border-2 border-led-orange/60 hover:bg-led-orange hover:text-black transition-all pixel-text"
            >
              <Eye size={18} />
              预览屏
            </Link>
          </div>
        </header>

        {message && (
          <div className="mb-6 px-4 py-3 border-2 border-led-amber/70 bg-led-amber/10 font-dot text-xl text-led-amber pixel-text animate-pulse">
            {message}
          </div>
        )}

        {(isAdding || editingId) && (
          <section className="mb-8 p-5 md:p-6 border-2 border-led-orange/70 bg-led-dim/40 relative">
            <button
              onClick={cancel}
              className="absolute top-3 right-3 text-led-orange/60 hover:text-led-orange transition-colors"
              aria-label="关闭"
            >
              <X size={22} />
            </button>
            <h2 className="font-dot text-2xl text-led-orange led-glow pixel-text mb-5">
              {isAdding ? "[ + ] 添加新书" : "[ ✎ ] 编辑书籍"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div className="md:col-span-2">
                <label className="block font-dot text-xl text-led-amber pixel-text mb-2">
                  书名
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="如：无人生还"
                  className="admin-input w-full px-4 py-3 bg-black border-2 border-led-orange/60 focus:border-led-orange outline-none text-led-orange text-2xl placeholder:text-led-orange/30 pixel-text"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-dot text-xl text-led-amber pixel-text mb-2">
                  作者
                </label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, author: e.target.value }))
                  }
                  placeholder="如：阿加莎·克里斯蒂"
                  className="admin-input w-full px-4 py-3 bg-black border-2 border-led-orange/60 focus:border-led-orange outline-none text-led-orange text-2xl placeholder:text-led-orange/30 pixel-text"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-dot text-xl text-led-amber pixel-text mb-2">
                  一句话推荐语
                </label>
                <textarea
                  value={form.recommendation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recommendation: e.target.value }))
                  }
                  rows={3}
                  placeholder="如：十个陌生人，一座孤岛，一首童谣，无人能逃。"
                  className="admin-input w-full px-4 py-3 bg-black border-2 border-led-orange/60 focus:border-led-orange outline-none text-led-orange text-xl leading-relaxed placeholder:text-led-orange/30 pixel-text resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={submit}
                disabled={!isValid}
                className="flex items-center gap-2 px-6 py-3 font-dot text-xl text-black bg-led-orange hover:bg-led-orange-bright disabled:bg-led-orange/30 disabled:cursor-not-allowed transition-colors pixel-text"
              >
                <Save size={20} />
                保存
              </button>
              <button
                onClick={cancel}
                className="flex items-center gap-2 px-6 py-3 font-dot text-xl text-led-orange border-2 border-led-orange/60 hover:bg-led-orange/10 transition-colors pixel-text"
              >
                <X size={20} />
                取消
              </button>
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="font-dot text-2xl text-led-orange led-glow pixel-text">
              当前书单 ({books.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={startAdd}
                className="flex items-center gap-2 px-5 py-2.5 font-dot text-lg text-black bg-led-orange hover:bg-led-orange-bright transition-colors pixel-text"
              >
                <Plus size={20} />
                添加新书
              </button>
              <button
                onClick={() => {
                  if (confirm("要恢复到默认的5本经典推理小说吗？")) {
                    resetToDefault();
                    showMsg("✓ 已恢复默认书单");
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 font-dot text-lg text-led-orange border-2 border-led-orange/50 hover:bg-led-orange/10 transition-colors pixel-text"
              >
                <RotateCcw size={18} />
                恢复默认
              </button>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-led-orange/30 text-center">
              <p className="font-dot text-2xl text-led-orange/50 pixel-text">
                还没有书单，点「添加新书」开始吧
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {books.map((book, i) => (
                <div
                  key={book.id}
                  className={`p-4 md:p-5 border-2 transition-all ${
                    editingId === book.id
                      ? "border-led-amber bg-led-amber/5"
                      : "border-led-orange/40 hover:border-led-orange/80 bg-led-dim/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-pixel text-sm text-led-red led-glow pixel-text flex-shrink-0">
                        #{String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-dot text-2xl text-led-orange led-glow pixel-text truncate">
                        《{book.title}》
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(book)}
                        className="p-2 text-led-amber hover:text-led-amber hover:bg-led-amber/10 transition-colors"
                        title="编辑"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id, book.title)}
                        className="p-2 text-led-red hover:text-led-red hover:bg-led-red/10 transition-colors"
                        title="删除"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <p className="font-dot text-lg text-led-amber pixel-text mb-3">
                    作者：{book.author}
                  </p>
                  <p className="font-dot text-base md:text-lg text-led-orange/80 pixel-text leading-relaxed border-l-2 border-led-orange/40 pl-3">
                    「{book.recommendation}」
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="pt-6 border-t border-led-orange/20 text-center">
          <p className="font-dot text-sm text-led-orange/40 pixel-text tracking-wider">
            ◆ DATA SAVED LOCALLY · localStorage · 推理书店 DOT MATRIX SYSTEM ◆
          </p>
        </footer>
      </div>
    </div>
  );
}
