import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

export default function ComingSoon() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4"
      style={{
        background: "linear-gradient(180deg, #15151E 0%, #0F1020 20%, #090B14 100%)",
      }}
    >
      <div className="flex flex-col items-center justify-center text-center max-w-2xl w-full space-y-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight">
          Under <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-accent">Construction</span>
        </h1>
        
        <div className="w-full max-w-[550px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <div className="-mt-[10%]">
            <img
              src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3hobmpzN3U3NmwyNzl0bGRnMm5tczdvNTN0cWJmNmp2M2Z3ODhubCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZBh5RSqtSCRoECaVhz/giphy.gif"
              alt="Under Construction"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1b1843]/60 border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-[#201d4a]/80 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
