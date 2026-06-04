import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAllPosts, formatDate } from "@/lib/blog";

export const metadata = {
  title: "Blog — JriveContent",
  description:
    "Playbooks, case studies, and tactics for brands and creators. From the JriveContent team.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <section className="pt-32 pb-12 px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-brand-ink">
            Latest Articles
          </h1>
        </div>
      </section>

      <section className="flex-1 px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          {posts.length === 0 ? (
            <p className="text-center text-slate-500">No posts yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <article className="h-full flex flex-col">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 mb-4">
                      {post.cover ? (
                        <img
                          src={post.cover}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-sky/30 to-brand-skyDeep/30 flex items-center justify-center">
                          <svg className="w-12 h-12 text-brand-skyDeep/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      {post.category && (
                        <p className="text-xs font-semibold text-brand-skyDeep uppercase tracking-wide mb-2">
                          {post.category}
                        </p>
                      )}

                      <h2 className="text-xl font-semibold tracking-tight text-brand-ink group-hover:text-brand-skyDeep transition mb-2 line-clamp-2">
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                          {post.excerpt}
                        </p>
                      )}

                      <div className="mt-auto flex items-center gap-2 text-xs text-slate-500">
                        {post.date && <time>{formatDate(post.date)}</time>}
                        {post.author && (
                          <>
                            <span>·</span>
                            <span>{post.author}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
