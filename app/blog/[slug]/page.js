import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShareSection from "@/components/blog/ShareSection";
import { getAllPostSlugs, getPostBySlug, formatDate, extractHeadings, estimateReadTime } from "@/lib/blog";

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} — JriveContent`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.cover ? [post.cover] : [],
      type: "article",
    },
  };
}

const mdxComponents = {
  h1: (props) => (
    <h1 id={props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')} className="text-4xl font-semibold tracking-tight text-brand-ink mt-10 mb-4" {...props} />
  ),
  h2: (props) => (
    <h2 id={props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')} className="text-2xl font-semibold tracking-tight text-brand-ink mt-10 mb-3" {...props} />
  ),
  h3: (props) => (
    <h3 id={props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')} className="text-xl font-semibold tracking-tight text-brand-ink mt-8 mb-2" {...props} />
  ),
  p: (props) => <p className="text-slate-700 leading-7 my-4" {...props} />,
  ul: (props) => <ul className="list-disc pl-6 my-4 text-slate-700 space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal pl-6 my-4 text-slate-700 space-y-1" {...props} />,
  a: (props) => (
    <a
      className="text-brand-skyDeep underline underline-offset-2 hover:text-brand-ink transition"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-brand-sky pl-4 italic text-slate-600 my-6"
      {...props}
    />
  ),
  code: (props) => (
    <code className="bg-slate-100 text-brand-ink rounded px-1.5 py-0.5 text-sm" {...props} />
  ),
  pre: (props) => (
    <pre
      className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-sm my-6"
      {...props}
    />
  ),
  img: (props) => <img className="rounded-xl my-6 w-full" {...props} />,
  hr: () => <hr className="my-10 border-slate-200" />,
};

function TableOfContents({ headings }) {
  if (!headings || headings.length === 0) return null;
  
  return (
    <nav className="mb-8">
      <h3 className="text-sm font-semibold text-brand-ink uppercase tracking-wide mb-4">
        Table of Contents
      </h3>
      <ul className="space-y-2">
        {headings.map((heading, index) => (
          <li key={index}>
            <a
              href={`#${heading.id}`}
              className="text-sm text-slate-600 hover:text-brand-skyDeep transition block py-1 border-l-2 border-slate-200 hover:border-brand-skyDeep pl-3"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}


export default function BlogPostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const readTime = estimateReadTime(post.content);

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <article className="pt-32 pb-16 px-6">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/blog"
            className="text-sm text-slate-500 hover:text-brand-ink transition"
          >
            ← Back to blog
          </Link>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
            {/* Main Content */}
            <div>
              <header className="mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  {post.date && <time>{formatDate(post.date)}</time>}
                  {readTime && (
                    <>
                      <span>•</span>
                      <span>{readTime} min read</span>
                    </>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-brand-ink">
                  {post.title}
                </h1>
                {post.excerpt && (
                  <p className="mt-4 text-lg text-slate-600">{post.excerpt}</p>
                )}
              </header>

              {post.cover && (
                <img
                  src={post.cover}
                  alt=""
                  className="w-full h-72 md:h-96 object-cover rounded-2xl mb-10"
                />
              )}

              <div className="prose-content">
                <MDXRemote source={post.content} components={mdxComponents} />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-32">
                <TableOfContents headings={headings} />
                <ShareSection title={post.title} slug={params.slug} />
              </div>
            </aside>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
