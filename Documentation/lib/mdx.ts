import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { docsMdxComponents } from "@/components/docs/mdx-components";
import type { DocFrontmatter } from "./docs";

export async function renderMDX(source: string) {
  const { content, frontmatter } = await compileMDX<DocFrontmatter>({
    source,
    components: docsMdxComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  return { content, frontmatter };
}
