export interface Book {
  id: string;
  title: string;
  author: string;
  recommendation: string;
}

export const STORAGE_KEY = "mystery-bookstore-books";

export const DEFAULT_BOOKS: Book[] = [
  {
    id: "1",
    title: "无人生还",
    author: "阿加莎·克里斯蒂",
    recommendation: "十个陌生人，一座孤岛，一首童谣，无人能逃。",
  },
  {
    id: "2",
    title: "白夜行",
    author: "东野圭吾",
    recommendation: "我的天空里没有太阳，总是黑夜，但并不暗。",
  },
  {
    id: "3",
    title: "福尔摩斯探案全集",
    author: "阿瑟·柯南·道尔",
    recommendation: "当你排除了不可能，剩下的无论多么难以置信，都是真相。",
  },
  {
    id: "4",
    title: "嫌疑人X的献身",
    author: "东野圭吾",
    recommendation: "最完美的诡计，最深沉的爱情。",
  },
  {
    id: "5",
    title: "罗杰疑案",
    author: "阿加莎·克里斯蒂",
    recommendation: "叙述性诡计的开山之作，最后十页颠覆一切。",
  },
];
