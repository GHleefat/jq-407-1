import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Book } from "@/types";
import { DEFAULT_BOOKS, STORAGE_KEY } from "@/types";

interface BookState {
  books: Book[];
  currentIndex: number;
  addBook: (book: Omit<Book, "id">) => void;
  updateBook: (id: string, book: Omit<Book, "id">) => void;
  deleteBook: (id: string) => void;
  setCurrentIndex: (index: number) => void;
  nextBook: () => void;
  resetToDefault: () => void;
}

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const useBookStore = create<BookState>()(
  persist(
    (set, get) => ({
      books: DEFAULT_BOOKS,
      currentIndex: 0,

      addBook: (book) =>
        set((state) => ({
          books: [...state.books, { id: generateId(), ...book }],
        })),

      updateBook: (id, book) =>
        set((state) => ({
          books: state.books.map((b) =>
            b.id === id ? { ...b, ...book } : b,
          ),
        })),

      deleteBook: (id) =>
        set((state) => {
          const books = state.books.filter((b) => b.id !== id);
          const currentIndex =
            state.currentIndex >= books.length
              ? Math.max(0, books.length - 1)
              : state.currentIndex;
          return { books, currentIndex };
        }),

      setCurrentIndex: (index) => set({ currentIndex: index }),

      nextBook: () =>
        set((state) => ({
          currentIndex:
            state.books.length === 0
              ? 0
              : (state.currentIndex + 1) % state.books.length,
        })),

      resetToDefault: () =>
        set({ books: DEFAULT_BOOKS, currentIndex: 0 }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ books: state.books }),
    },
  ),
);
