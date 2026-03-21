import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

export type DocFrontmatter = {
  title: string;
  description?: string;
};

export function getDocContent(slugParts: string[]): {
  frontmatter: DocFrontmatter;
  content: string;
} | null {
  const filePath = path.join(contentDir, ...slugParts) + ".mdx";

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    frontmatter: data as DocFrontmatter,
    content,
  };
}
