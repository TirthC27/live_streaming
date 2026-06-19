import { Link } from "react-router-dom";
import {
  ChatCircle,
  ArrowFatUp,
  Eye,
  TrendUp,
} from "@phosphor-icons/react";
import { POSTS, type Post } from "../data/posts";

const CATEGORY_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-400",
  sky: "bg-sky-500/15 text-sky-400",
  amber: "bg-amber-500/15 text-amber-400",
  rose: "bg-rose-500/15 text-rose-400",
};

function PostCard({ post }: { post: Post }) {
  return (
      <Link
      to={`/community/post/${post.id}`}
      className="group block rounded-xl border border-white/5 bg-[#433f81]/40 p-5 transition-all hover:border-emerald-500/20 hover:bg-[#433f81]"
    >
      {/* Top row: category + meta */}
      <div className="flex items-center gap-3 text-xs">
        <span
          className={`rounded-md px-2.5 py-1 font-medium ${
            CATEGORY_COLORS[post.categoryColor] ?? CATEGORY_COLORS.emerald
          }`}
        >
          #{post.category}
        </span>
        <span className="text-zinc-500">{post.timeAgo}</span>
        <span className="flex items-center gap-1 text-zinc-500">
          <ChatCircle size={13} />
          {post.comments}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-3 font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-emerald-400">
        {post.title}
      </h3>

      {/* Preview body */}
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
        {post.body}
      </p>

      {/* Bottom row */}
      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
        {/* Author avatar */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
            {post.authorInitials}
          </div>
          <span className="font-medium text-zinc-400">{post.author}</span>
        </div>
        <span className="ml-auto flex items-center gap-1">
          <ArrowFatUp size={13} /> {post.upvotes}
        </span>
        <span className="flex items-center gap-1">
          <Eye size={13} /> {post.views}
        </span>
      </div>
    </Link>
  );
}

export default function TrendingPosts() {
  return (
    <section>
      {/* Section header */}
      <div className="mb-6 flex items-center gap-3">
        <TrendUp size={24} weight="bold" className="text-emerald-400" />
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Trending Posts
        </h2>
      </div>

      {/* Posts stack */}
      <div className="flex flex-col gap-4">
        {POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
