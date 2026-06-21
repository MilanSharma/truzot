"use client";

import { useState, useEffect } from "react";
import { Brain, Sparkles, Zap } from "lucide-react";

interface AILoadingAnimationProps {
  stage: "training" | "generating";
  progress: number;
}

export default function AILoadingAnimation({
  stage,
  progress,
}: AILoadingAnimationProps) {
  const [particles] = useState<
    Array<{ id: number; x: number; y: number; delay: number }>
  >(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
  });

  const isTraining = stage === "training";

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl animate-pulse" />

      {/* Main content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-2xl">
        {/* Neural network particles */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-30">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-blue-500 rounded-full animate-ping"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: "3s",
              }}
            />
          ))}
        </div>

        {/* Icon with pulse effect */}
        <div className="relative mb-8 flex justify-center">
          <div className="relative">
            {/* Outer rings */}
            <div
              className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"
              style={{ animationDuration: "2s" }}
            />
            <div
              className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"
              style={{ animationDuration: "2s", animationDelay: "0.5s" }}
            />

            {/* Main icon */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
              {isTraining ? (
                <Brain className="w-12 h-12 text-white animate-pulse" />
              ) : (
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            {isTraining
              ? "Training Your AI Model"
              : "Generating Your Headshots"}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {isTraining
              ? "Our AI is learning your unique features and style preferences..."
              : "Creating professional headshots in multiple styles..."}
          </p>
        </div>

        {/* Progress bar with gradient */}
        <div className="mb-6">
          <div className="flex justify-between text-sm font-medium mb-3">
            <span className="text-slate-600 dark:text-slate-400">Progress</span>
            <span className="text-blue-600 dark:text-blue-400">
              {progress}%
            </span>
          </div>
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>

        {/* Feature indicators */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div
            className={`flex flex-col items-center p-4 rounded-xl transition-all duration-500 ${progress > 20 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-slate-50 dark:bg-slate-800/50"}`}
          >
            <Zap
              className={`w-6 h-6 mb-2 ${progress > 20 ? "text-blue-600" : "text-slate-400"}`}
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              AI Processing
            </span>
          </div>
          <div
            className={`flex flex-col items-center p-4 rounded-xl transition-all duration-500 ${progress > 50 ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-slate-50 dark:bg-slate-800/50"}`}
          >
            <Brain
              className={`w-6 h-6 mb-2 ${progress > 50 ? "text-indigo-600" : "text-slate-400"}`}
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Model Training
            </span>
          </div>
          <div
            className={`flex flex-col items-center p-4 rounded-xl transition-all duration-500 ${progress > 80 ? "bg-purple-50 dark:bg-purple-900/20" : "bg-slate-50 dark:bg-slate-800/50"}`}
          >
            <Sparkles
              className={`w-6 h-6 mb-2 ${progress > 80 ? "text-purple-600" : "text-slate-400"}`}
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Finalizing
            </span>
          </div>
        </div>

        {/* Estimated time */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {isTraining
              ? "Training typically takes 5-15 minutes"
              : "Generation usually completes in 2-5 minutes"}
          </p>
        </div>
      </div>

      {/* CSS for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
