"use client";

import Link from "next/link";
import { Leaf, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-indigo-700 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
        <Leaf className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
      <p className="text-lg font-semibold text-slate-700 mb-2">Page not found</p>
      <p className="text-slate-500 text-sm mb-8 max-w-xs">
        This page does not exist. Return to the Nivaaran AI home page.
      </p>
      <Link
        href="/"
        className="primary-btn px-6"
      >
        <Home className="h-5 w-5" />
        Go Home
      </Link>
    </div>
  );
}
