import { notFound } from "next/navigation";
import { DocsLayout } from "@/components/docs/docs-layout";
import { PrevNextNav } from "@/components/docs/prev-next-nav";
import { getDocContent } from "@/lib/docs";
import { renderMDX } from "@/lib/mdx";
import { getPrevNext } from "@/lib/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocContent(slug);
  if (!doc) return {};
  return {
    title: `${doc.frontmatter.title} — Rolewise Docs`,
    description: doc.frontmatter.description,
  };
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  const doc = getDocContent(slug);

  if (!doc) {
    notFound();
  }

  const { content } = await renderMDX(doc.content);
  const currentHref = `/docs/${slug.join("/")}`;
  const { prev, next } = getPrevNext(currentHref);

  return (
    <DocsLayout>
      <article>
        {content}
        <PrevNextNav prev={prev} next={next} />
      </article>
    </DocsLayout>
  );
}
