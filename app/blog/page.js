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
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-brand-skyDeep mb-3">The JriveContent Blog</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-brand-ink">
            Playbooks for brands & creators
          </h1>
          <p className="mt-4 text-slate-600 text-lg">
            Practical tactics, case studies, and stories from inside the creator economy.
          </p>
        </div>
      </section>

      <section className="flex-1 px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          {posts.length === 0 ? (
            <p className="text-center text-slate-500">No posts yet. Check back soon!</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {posts.map((post) => (
                <li key={post.slug} className="py-8">
                  <Link href={`/blog/${post.slug}`} className="group block">
                    {post.cover && (
                      <img
                        src={post.cover}
                        alt=""
                        className="w-full h-56 object-cover rounded-xl mb-5"
                      />
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      {post.date && <time>{formatDate(post.date)}</time>}
                      {post.author && (
                        <>
                          <span>·</span>
                          <span>{post.author}</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-brand-ink group-hover:text-brand-skyDeep transition">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 text-slate-600">{post.excerpt}</p>
                    )}
                    <span className="mt-3 inline-block text-sm font-medium text-brand-skyDeep">
                      Read more →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
