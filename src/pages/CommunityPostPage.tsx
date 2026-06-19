import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowFatUp,
  ArrowFatDown,
  ChatCircle,
  Eye,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { POSTS, CATEGORIES } from "../data/posts";

const CATEGORY_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-400",
  sky: "bg-sky-500/15 text-sky-400",
  amber: "bg-amber-500/15 text-amber-400",
  rose: "bg-rose-500/15 text-rose-400",
};

export default function CommunityPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const post = POSTS.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
        <h1 className="text-2xl font-bold text-white">Post not found</h1>
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-emerald-400 transition-colors hover:text-emerald-300"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      {/* Hero banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl">
        <img
          src="https://picsum.photos/seed/football-community-banner/1400/400"
          alt=""
          className="h-48 w-full object-cover md:h-64"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white md:text-4xl">
            FootyStream <span className="text-accent">Connect</span>
          </h1>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar: categories */}
        <aside className="space-y-1">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span>#{cat.name}</span>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                {cat.count} posts
              </span>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <div>
          {/* Back link */}
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-accent"
          >
            <ArrowLeft size={14} />
            Back to{" "}
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                CATEGORY_COLORS[post.categoryColor] ?? CATEGORY_COLORS.emerald
              }`}
            >
              #{post.category}
            </span>
          </Link>

          {/* Post card */}
          <article className="rounded-xl border border-white/5 bg-[#433f81]/40 p-6 md:p-8">
            <div className="flex gap-4">
              {/* Vote column */}
              <div className="hidden flex-col items-center gap-1 pt-1 sm:flex">
                <button className="rounded p-1 text-zinc-500 transition-colors hover:text-accent">
                  <ArrowFatUp size={20} />
                </button>
                <span className="text-sm font-bold text-zinc-300">
                  {post.upvotes}
                </span>
                <button className="rounded p-1 text-zinc-500 transition-colors hover:text-rose-400">
                  <ArrowFatDown size={20} />
                </button>
              </div>

              {/* Post body */}
              <div className="flex-1">
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span
                    className={`rounded-md px-2.5 py-1 font-medium ${
                      CATEGORY_COLORS[post.categoryColor] ??
                      CATEGORY_COLORS.emerald
                    }`}
                  >
                    #{post.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                      {post.authorInitials}
                    </div>
                    <span className="font-medium text-zinc-300">
                      {post.author}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="mt-4 text-xl font-bold text-white md:text-2xl">
                  {post.title}
                </h2>

                {/* Body */}
                <p className="mt-3 leading-relaxed text-zinc-400">{post.body}</p>

                {/* Stats */}
                <div className="mt-6 flex items-center gap-5 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <ChatCircle size={14} /> {post.comments} comments
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={14} /> {post.views} views
                  </span>
                </div>
              </div>
            </div>
          </article>

          {/* Comment box */}
          <div className="mt-6 rounded-xl border border-white/5 bg-[#433f81]/40 p-6">
            <p className="mb-3 text-sm text-zinc-400">
              Comment as <span className="font-semibold text-white">You</span>
            </p>
            <textarea
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-accent/50"
            />
            <div className="mt-3 flex justify-end">
              <button className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent/90 active:scale-[0.97]">
                <PaperPlaneTilt size={16} weight="fill" />
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
