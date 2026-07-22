import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { marked } from "marked";

// Blog posts live as markdown inside the app so they're read at build time and
// baked into fully static pages (see generateStaticParams). cwd during build is
// the app directory.
const BLOG_DIR = join(process.cwd(), "content/blog");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  cluster: string;
  image: string;
  date: string;
};

export type Post = PostMeta & { html: string };

// Human labels for the `cluster` frontmatter, shown as the eyebrow.
const CLUSTER_LABELS: Record<string, string> = {
  retakes: "Retakes",
  logistics: "Test day",
  prep: "How to prepare",
  "how-it-works": "How it works",
  scoring: "Scoring",
  career: "The trade",
};

export function clusterLabel(cluster: string): string {
  return CLUSTER_LABELS[cluster] ?? "Guide";
}

function rawPosts() {
  return readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const { data, content } = matter(readFileSync(join(BLOG_DIR, file), "utf8"));
      return { data: data as Record<string, string>, content, file };
    })
    .filter((p) => p.data.status === "published");
}

export function getAllPostMeta(): PostMeta[] {
  return rawPosts()
    .map(({ data }) => ({
      slug: data.slug,
      title: data.title,
      description: data.description,
      cluster: data.cluster ?? "",
      image: data.image ?? "",
      date: data.date ?? "",
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getPostSlugs(): string[] {
  return rawPosts().map((p) => p.data.slug);
}

export function getPost(slug: string): Post | null {
  const found = rawPosts().find((p) => p.data.slug === slug);
  if (!found) return null;
  const { data, content } = found;

  // The frontmatter title is the page's <h1>; strip the leading markdown H1 so
  // the rendered body doesn't emit a second one. trimStart first because
  // gray-matter leaves a newline between the frontmatter and the body.
  const body = content.trimStart().replace(/^#\s+.*\r?\n+/, "");
  const html = renderMarkdown(body);

  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    cluster: data.cluster ?? "",
    image: data.image ?? "",
    date: data.date ?? "",
    html,
  };
}

function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false }) as string;
  // A paragraph that is entirely bold is a "short answer" key takeaway. Promote
  // it to a branded callout box (the amber-bordered motif from the About page)
  // rather than leaving it as an ordinary bold paragraph.
  return html.replace(
    /<p><strong>([\s\S]*?)<\/strong><\/p>/g,
    '<div class="blog-callout">$1</div>'
  );
}
