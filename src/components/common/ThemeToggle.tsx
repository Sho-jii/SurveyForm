"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Check initial theme from localStorage or document class
    const saved = localStorage.getItem("surveyform_theme") as "dark" | "light" | null;
    const initialTheme = saved || (document.documentElement.classList.contains("light") ? "light" : "dark");
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(t);
    localStorage.setItem("surveyform_theme", t);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={`rounded-none font-mono text-xs uppercase tracking-wider gap-1.5 border-border/80 h-9 px-2.5 ${className || ""}`}
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      aria-label="Toggle dark/light mode"
    >
      {theme === "dark" ? (
        <>
          <Sun className="size-3.5 text-amber-400" />
          <span className="hidden sm:inline">LIGHT</span>
        </>
      ) : (
        <>
          <Moon className="size-3.5 text-sky-400" />
          <span className="hidden sm:inline">DARK</span>
        </>
      )}
    </Button>
  );
}

