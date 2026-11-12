"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DecorIcon } from "@/components/ui/decor-icon";
import { Download, Smartphone, X, Share, PlusSquare, Check } from "lucide-react";
import Image from "next/image";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Check if already running in standalone / installed mode
    if (typeof window !== "undefined") {
      const isRunningStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isRunningStandalone);

      // Check if iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIosDevice);

      // 3. Listen for Android / Chrome / Edge install prompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      window.addEventListener("appinstalled", () => {
        console.log("[PWA] SurveyForm was successfully installed");
        setIsInstallable(false);
        setDeferredPrompt(null);
        setIsStandalone(true);
      });

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  // Handle native install click
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If already installed or dismissed, don't show prompt
  if (isStandalone || isDismissed) {
    return null;
  }

  // Show if either native install prompt is ready or user is on iOS mobile browser
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Floating Modern Brutalist Install Card (Bottom-right on desktop, bottom banner on mobile) */}
      <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto bg-card/95 backdrop-blur-md border border-primary/50 p-4 shadow-2xl rounded-none text-foreground animate-in slide-in-from-bottom-5">
        <DecorIcon position="top-left" className="opacity-70" />
        <DecorIcon position="top-right" className="opacity-70" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-10 border border-primary/40 bg-background flex items-center justify-center shrink-0 rounded-none shadow-sm overflow-hidden">
              <Image
                src="/icons/brand-logo.png"
                alt="SurveyForm Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-xs tracking-tight text-foreground">
                  Install SurveyForm
                </span>
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[9px] font-mono px-1 py-0 rounded-none">
                  APP
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Install on your home screen for quick evaluation access, offline view, and fullscreen response entry.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss install prompt"
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/60">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="w-full gap-1.5 font-mono text-xs uppercase tracking-wider rounded-none font-bold"
          >
            <Smartphone className="size-3.5" />
            <span>Install on Home Screen</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="shrink-0 font-mono text-xs rounded-none"
          >
            Later
          </Button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border-2 border-primary/50 max-w-sm w-full p-6 space-y-4 rounded-none shadow-2xl relative">
            <DecorIcon position="top-left" />
            <DecorIcon position="bottom-right" />

            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-primary" />
                <span className="font-heading font-bold text-sm text-foreground">
                  Install on iOS / Safari
                </span>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="size-5 rounded-none bg-primary/20 border border-primary/40 text-primary font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tap the <strong className="text-foreground">Share button</strong> (
                  <Share className="inline size-3.5 mx-0.5 text-primary" />
                  ) at the bottom toolbar of Safari.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="size-5 rounded-none bg-primary/20 border border-primary/40 text-primary font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Scroll down the menu and select{" "}
                  <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong> (
                  <PlusSquare className="inline size-3.5 mx-0.5 text-primary" />
                  ).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="size-5 rounded-none bg-primary/20 border border-primary/40 text-primary font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Tap <strong className="text-foreground">Add</strong> in the top-right corner.
                  SurveyForm is now installed as a full standalone app!
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setShowIOSGuide(false)}
              className="w-full font-mono text-xs uppercase rounded-none mt-2"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

