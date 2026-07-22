/* eslint-disable @next/next/no-img-element */
"use client";
import {
  useState,
  useCallback,
  Suspense,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { BreadcrumbSchema } from "@/components/JsonLd";

import { supabase } from "@/lib/supabase/client";
import { PLANS } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import UploadErrorBoundary from "@/components/UploadErrorBoundary";
import PaymentErrorBoundary from "@/components/PaymentErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Shield,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Star,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  UploadCloud,
  Smile,
  Sun,
  Camera,
  Shirt,
  ImagePlus,
  Sparkles,
  Eye,
} from "lucide-react";

const PLANS_LIST = Object.values(PLANS);

const PHOTO_TIPS = [
  {
    icon: Smile,
    text: "Clear face visibility",
    desc: "Look straight at the camera. No sunglasses or hats.",
  },
  {
    icon: Sun,
    text: "Good lighting",
    desc: "Natural window light works best. Avoid harsh shadows.",
  },
  {
    icon: Camera,
    text: "Variety of angles",
    desc: "Include front, side, and 3/4 views for best AI training.",
  },
  {
    icon: Shirt,
    text: "Different outfits",
    desc: "Change your clothing to give the AI more variety.",
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Turn raw image measurements into a precise, explainable 0-100 quality score.
// Weights: sharpness 45, resolution 30, exposure 25 — the three things that
// actually determine whether a selfie trains a good face model. Returns the
// score plus the single most useful improvement hint for that photo.
function scoreFile(a: { sharpness: number; brightness: number; width: number; height: number }): {
  score: number;
  hint: string | null;
} {
  const minEdge = Math.min(a.width, a.height);
  const resScore = clamp((minEdge - 400) / (1200 - 400), 0, 1) * 30;
  const sharpScore = clamp((a.sharpness - 50) / (500 - 50), 0, 1) * 45;

  let expScore: number;
  if (a.brightness >= 90 && a.brightness <= 170) expScore = 25;
  else if (a.brightness < 90) expScore = clamp((a.brightness - 40) / 50, 0, 1) * 25;
  else expScore = clamp((215 - a.brightness) / 45, 0, 1) * 25;

  const score = Math.round(clamp(resScore + sharpScore + expScore, 0, 100));

  // Surface the weakest dimension as an actionable hint.
  let hint: string | null = null;
  if (sharpScore < 25) hint = "a bit soft — a sharper, in-focus photo will train better";
  else if (a.brightness < 90) hint = "a little dark — try brighter, even lighting";
  else if (a.brightness > 170) hint = "slightly overexposed — avoid direct harsh light";
  else if (resScore < 18) hint = "low resolution — a larger, closer photo helps";
  return { score, hint };
}

type Step = 1 | 2;

const SESSION_KEY = "truzot-upload";
const LOCAL_KEY = "truzot-upload-backup";

function getSavedState(): Record<string, unknown> | null {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved);
    const backup = localStorage.getItem(LOCAL_KEY);
    if (backup) {
      const parsed = JSON.parse(backup);
      delete parsed.email;
      delete parsed.idempotencyKey;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// Debug: intercept fetch to log CORS errors
if (typeof window !== "undefined" && !(window as any).__fetchIntercepted) {
  (window as any).__fetchIntercepted = true;
  const originalFetch = window.fetch;
  // @ts-ignore - fetch interception for debugging
  window.fetch = async (url, options) => {
    try {
      const response = await originalFetch(url, options);
      if (!response.ok && response.status === 403) {
        const text = await response.clone().text();
        if (text.includes("Forbidden Origin")) {
          console.error(
            "CORS ERROR - URL:",
            url,
            "Status:",
            response.status,
            "Body:",
            text,
          );
        }
      }
      return response;
    } catch (e) {
      console.error("FETCH ERROR - URL:", url, "Error:", e);
      throw e;
    }
  };
}
function UploadContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<{
    email: string;
    user_metadata?: any;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUser({
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        });
      }
      setAuthLoading(false);
    });
  }, []);

  const urlStep = parseInt(searchParams.get("step") ?? "") as Step;
  
  // Extract UTM parameters for tracking
  const utmParams = useMemo(() => ({
    utm_source: searchParams.get("utm_source") || "",
    utm_medium: searchParams.get("utm_medium") || "",
    utm_campaign: searchParams.get("utm_campaign") || "",
    utm_term: searchParams.get("utm_term") || "",
    utm_content: searchParams.get("utm_content") || "",
  }), [searchParams]);

  const [step, setStep] = useState<Step>(() => {
    const saved = getSavedState();
    if (
      saved?.step &&
      typeof saved.step === "number" &&
      saved.step >= 1 &&
      saved.step <= 2
    )
      return saved.step as Step;
    return urlStep >= 1 && urlStep <= 2 ? urlStep : 1;
  });

  const [files, setFiles] = useState<File[]>([]);
  const [fileQualityScores, setFileQualityScores] = useState<Record<number, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  
  // Demographic form state
  const [demographics, setDemographics] = useState({
    age: "",
    gender: "",
    hairColor: "",
    ethnicity: "",
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Checkout State
  const [plan, setPlan] = useState(
    () =>
      searchParams.get("plan") || (getSavedState()?.plan as string) || "pro",
  );
  const [email, setEmail] = useState(
    () => (getSavedState()?.email as string) || "",
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(() => {
    const saved = getSavedState();
    return saved?.consentChecked !== undefined
      ? (saved.consentChecked as boolean)
      : true;
  });
  const [coupon, setCoupon] = useState(
    () => (getSavedState()?.coupon as string) || "",
  );
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [storagePath, setStoragePath] = useState(
    () => (getSavedState()?.storagePath as string) || "",
  );

  const SHOOT_NAMES = [
    "Professional Headshots",
    "My New Headshots",
    "LinkedIn Ready",
    "Corporate Collection",
    "Personal Branding",
    "Portfolio Shots",
    "Profile Pictures",
    "Business Photos",
  ];

  const [shootName, setShootName] = useState(
    () => (getSavedState()?.shootName as string) || "",
  );
  const [defaultShootName] = useState(
    () => SHOOT_NAMES[Math.floor(Math.random() * SHOOT_NAMES.length)],
  );
  const [idempotencyKey, setIdempotencyKey] = useState(() => {
    const saved = getSavedState()?.idempotencyKey as string | undefined;
    if (saved) return saved;
    try {
      const stable = localStorage.getItem("truzot-idempotency-key");
      if (stable) return stable;
    } catch {}
    const key = crypto.randomUUID();
    try {
      localStorage.setItem("truzot-idempotency-key", key);
    } catch {}
    return key;
  });
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Background Upload Optimization state
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [backgroundProgress, setBackgroundProgress] = useState("");
  const uploadPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    if (searchParams.get("cancelled")) {
      setTimeout(() => {
        const saved = getSavedState();
        const targetStep =
          saved?.step &&
          typeof saved.step === "number" &&
          saved.step >= 1 &&
          saved.step <= 2
            ? (saved.step as Step)
            : 2;
        setStep(targetStep);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("cancelled");
        window.history.replaceState(null, "", newUrl.toString());
      }, 0);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!storagePath || step < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        let session = null;
        try {
          const {
            data: { session: s },
          } = await supabase.auth.getSession();
          session = s;
        } catch (e) {
          console.warn("Session check failed:", e);
          session = null;
        }
        const authHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          authHeaders.Authorization = `Bearer ${session.access_token}`;
        }
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ action: "check", path: storagePath }),
        });
        if (!res.ok) {
          if (!isProcessing) {
            toast(
              "Your uploaded files have expired. Please upload again.",
              "error",
            );
            setStoragePath("");
            setStep(1);
          }
        }
      } catch {
        // Skip validation quietly
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [storagePath, step, toast, isProcessing]);

  const validateCoupon = async () => {
    if (!coupon.trim()) {
      setCouponValid(null);
      setCouponMessage("");
      return;
    }

    setValidatingCoupon(true);
    setCouponValid(null);
    setCouponMessage("");

    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupon: coupon,
          plan: plan,
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setCouponValid(true);
        setCouponMessage(`Coupon applied! $${(data.finalAmount / 100).toFixed(2)}`);
      } else {
        setCouponValid(false);
        setCouponMessage(data.error || "Invalid coupon code");
      }
    } catch (err) {
      setCouponValid(false);
      setCouponMessage("Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => {
    try {
      const stateObj = {
        step,
        plan,
        email,
        consentChecked,
        coupon,
        storagePath,
        filesCount: files.length,
        shootName,
        idempotencyKey,
      };
      const stateStr = JSON.stringify(stateObj);
      sessionStorage.setItem(SESSION_KEY, stateStr);

      if (userId) {
        localStorage.setItem(LOCAL_KEY, stateStr);
      } else {
        localStorage.removeItem(LOCAL_KEY);
      }
    } catch {}
  }, [
    step,
    plan,
    email,
    consentChecked,
    coupon,
    storagePath,
    files,
    shootName,
    idempotencyKey,
    userId,
  ]);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setEmail((prev) => (prev || session.user.email) ?? "");

        if (!sessionStorage.getItem(SESSION_KEY)) {
          const backup = localStorage.getItem(LOCAL_KEY);
          if (backup) {
            JSON.parse(backup);
          }
        }
      } else {
        setUserId(null);
        setEmail("");
        localStorage.removeItem(LOCAL_KEY);
        localStorage.removeItem("truzot-idempotency-key");
      }
    };
    loadUser();
  }, []);

  const objectUrls = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const url of objectUrls) URL.revokeObjectURL(url);
    };
  }, [objectUrls]);

  const validatePhoto = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        const bitmap = await createImageBitmap(file);
        const { width, height } = bitmap;
        bitmap.close();
        const minEdge = Math.min(width, height);
        if (minEdge < 512)
          return `${file.name}: image too small (${width}x${height}). Minimum 512px on the shortest edge.`;
        const ratio = width / height;
        if (ratio < 0.4 || ratio > 2.5)
          return `${file.name}: unusual aspect ratio (${ratio.toFixed(1)}). Use a standard photo.`;
        return null;
      } catch {
        return `${file.name}: unable to read image file.`;
      }
    },
    [],
  );

  // Browser-universal image analysis. We deliberately do NOT use the
  // experimental FaceDetector API — it only exists in Chrome/Edge behind a flag,
  // so it was unavailable for ~all real visitors, made the quality score
  // meaningless, and triggered a scary "face detection unsupported" warning on
  // nearly every browser. Instead we measure objective signals that work
  // everywhere: sharpness (Laplacian variance), exposure (mean luminance), and
  // native resolution.
  const analyzeImage = useCallback(
    async (
      file: File,
    ): Promise<{ sharpness: number; brightness: number; width: number; height: number }> => {
      const S = 400;
      try {
        const bitmap = await createImageBitmap(file);
        const width = bitmap.width;
        const height = bitmap.height;
        const canvas = document.createElement("canvas");
        canvas.width = S;
        canvas.height = S;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          bitmap.close();
          return { sharpness: 0, brightness: 128, width, height };
        }
        ctx.drawImage(bitmap, 0, 0, S, S);
        bitmap.close();
        const data = ctx.getImageData(0, 0, S, S).data;

        const gray = new Float32Array(S * S);
        let brightSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          gray[i / 4] = g;
          brightSum += g;
        }
        const brightness = brightSum / (S * S);

        // Laplacian kernel [[0,1,0],[1,-4,1],[0,1,0]] → variance = sharpness proxy
        let sum = 0;
        let sumSq = 0;
        let count = 0;
        for (let y = 1; y < S - 1; y++) {
          for (let x = 1; x < S - 1; x++) {
            const idx = y * S + x;
            const lap = gray[idx - S] + gray[idx + S] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx];
            sum += lap;
            sumSq += lap * lap;
            count++;
          }
        }
        const mean = sum / count;
        const sharpness = sumSq / count - mean * mean;
        return { sharpness, brightness, width, height };
      } catch {
        return { sharpness: 0, brightness: 128, width: 0, height: 0 };
      }
    },
    [],
  );

  const computeFileFingerprint = useCallback(
    (file: File): string => `${file.name}|${file.size}`,
    [],
  );

  const performUpload = useCallback(
    async (filesToUpload: File[], onProgress?: (msg: string) => void) => {
      if (filesToUpload.length === 0) return null;

      if (uploadPromiseRef.current) {
        return uploadPromiseRef.current;
      }

      const promise = (async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        const authHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) authHeaders.Authorization = `Bearer ${token}`;

        if (onProgress) onProgress("Preparing photos...");
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        filesToUpload.forEach((f, i) => {
          const ext = f.name.split(".").pop() ?? "jpg";
          zip.file(`photo_${i + 1}.${ext}`, f);
        });

        const uploadUrlRes = await fetch("/api/upload", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            action: "get-upload-url",
            filename: `dataset_${Date.now()}.zip`,
          }),
        });

        if (!uploadUrlRes.ok) {
          const errorText = await uploadUrlRes.text();
          console.error(
            "Upload URL request failed:",
            uploadUrlRes.status,
            errorText,
          );
          throw new Error("Failed to get upload URL");
        }
        const {
          signedUrl,
          token: uploadToken,
          path,
        } = (await uploadUrlRes.json()) as {
          signedUrl: string;
          token?: string;
          path: string;
        };

        if (!signedUrl || !path) {
          throw new Error("Invalid upload response");
        }

        if (onProgress) onProgress("Uploading photos...");
        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "STORE",
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", signedUrl);
          xhr.setRequestHeader("x-upsert", "true");
          xhr.setRequestHeader("content-type", "application/zip");
          if (uploadToken)
            xhr.setRequestHeader("authorization", `Bearer ${uploadToken}`);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
              onProgress(
                `Uploading: ${Math.round((e.loaded / e.total) * 100)}%`,
              );
            }
          };
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201 || xhr.status === 204)
              resolve();
            else reject(new Error(`File upload failed (HTTP ${xhr.status})`));
          };
          xhr.onerror = () => reject(new Error("Network error during upload."));
          xhr.send(zipBlob);
        });

        return path;
      })();

      uploadPromiseRef.current = promise;

      try {
        const path = await promise;
        return path;
      } finally {
        uploadPromiseRef.current = null;
      }
    },
    [],
  );

  const heicConverterRef = useRef<((blob: Blob) => Promise<Blob>) | null>(null);

  const handleFiles = useCallback(
    async (incoming: FileList | null) => {
      if (!incoming) return;
      if (!heicConverterRef.current) {
        try {
          const heic2any = (await import("heic2any")).default;
          heicConverterRef.current = (blob: Blob) =>
            heic2any({ blob, toType: "image/jpeg" }) as Promise<Blob>;
        } catch {
          heicConverterRef.current = null;
        }
      }
      const converted: File[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      // Cache each accepted file's analysis (keyed by fingerprint) so we score
      // once here instead of re-decoding every image again below.
      const analyses = new Map<string, { sharpness: number; brightness: number; width: number; height: number }>();
      for (const f of Array.from(incoming)) {
        if (f.size >= 10 * 1024 * 1024) {
          errors.push(`${f.name}: file too large (max 10MB)`);
          continue;
        }
        const validationError = await validatePhoto(f);
        if (validationError) {
          errors.push(validationError);
          continue;
        }
        if (
          f.type === "image/heic" ||
          f.type === "image/heif" ||
          f.name.toLowerCase().endsWith(".heic") ||
          f.name.toLowerCase().endsWith(".heif")
        ) {
          if (heicConverterRef.current) {
            try {
              const blob = await heicConverterRef.current(f);
              const convErr = await validatePhoto(
                new File([blob as Blob], f.name, { type: "image/jpeg" }),
              );
              if (convErr) {
                errors.push(convErr);
                continue;
              }
              const jpegFile = new File(
                [blob as Blob],
                f.name.replace(/\.(heic|heif)$/i, ".jpg"),
                { type: "image/jpeg" },
              );
              const analysis = await analyzeImage(jpegFile);
              if (analysis.sharpness > 0 && analysis.sharpness < 50) {
                errors.push(`${jpegFile.name}: photo is too blurry — please use a sharper image`);
                continue;
              }
              analyses.set(computeFileFingerprint(jpegFile), analysis);
              converted.push(jpegFile);
            } catch {
              errors.push(
                `${f.name}: HEIC conversion failed — please convert to JPEG first`,
              );
            }
          } else {
            errors.push(`${f.name}: HEIC converter not available`);
          }
        } else if (f.type.startsWith("image/")) {
          const fp = computeFileFingerprint(f);
          const existingFps = converted
            .concat(filesRef.current)
            .map((ef) => computeFileFingerprint(ef));
          if (existingFps.includes(fp)) {
            errors.push(`${f.name}: duplicate photo detected — skip`);
            continue;
          }
          const analysis = await analyzeImage(f);
          if (analysis.sharpness > 0 && analysis.sharpness < 50) {
            errors.push(`${f.name}: photo is too blurry — please use a sharper image`);
            continue;
          }
          analyses.set(fp, analysis);
          converted.push(f);
        } else {
          errors.push(`${f.name}: unsupported format`);
        }
      }
      if (warnings.length > 0) {
        toast(warnings.join("\n"), "info");
      }
      if (errors.length > 0) {
        toast(errors.join("\n"), "error");
      }
      const nextFiles = [...filesRef.current, ...converted].slice(0, 10);
      setFiles(nextFiles);

      // Score each newly added file from its cached analysis (falls back to a
      // fresh analysis for the rare case it wasn't cached, e.g. odd code paths).
      const newScores: Record<number, number> = {};
      for (let i = filesRef.current.length; i < nextFiles.length; i++) {
        const file = nextFiles[i];
        const analysis = analyses.get(computeFileFingerprint(file)) ?? (await analyzeImage(file));
        newScores[i] = scoreFile(analysis).score;
      }
      setFileQualityScores(prev => ({ ...prev, ...newScores }));

      setStoragePath("");
      uploadPromiseRef.current = null;
      setIsUploadingBackground(false);
      setBackgroundProgress("");
    },
    [
      toast,
      validatePhoto,
      computeFileFingerprint,
      analyzeImage,
      setIsUploadingBackground,
      setBackgroundProgress,
      setStoragePath,
    ],
  );

  const removeFile = (i: number) => {
    setFiles((f) => f.filter((_, idx) => idx !== i));
    setFileQualityScores(prev => {
      const newScores = { ...prev };
      delete newScores[i];
      return newScores;
    });
    setStoragePath("");
    uploadPromiseRef.current = null;
    setIsUploadingBackground(false);
    setBackgroundProgress("");
  };

  useEffect(() => {
    if (
      files.length >= 2 &&
      !storagePath &&
      !isProcessing &&
      !isUploadingBackground
    ) {
      const timer = setTimeout(async () => {
        setIsUploadingBackground(true);
        setBackgroundProgress("Uploading photos in background...");
        try {
          const path = await performUpload(files, (msg) =>
            setBackgroundProgress(msg),
          );
          if (path) {
            setStoragePath(path);
          }
        } catch (err) {
          console.error("Background upload failed:", err);
        } finally {
          setIsUploadingBackground(false);
          setBackgroundProgress("");
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [files, storagePath, isProcessing, isUploadingBackground, performUpload]);

  const handleNextStep = async () => {
    setError("");
    if (step === 1) {
      if (files.length < 2 && !storagePath) {
        setError("Please upload at least 2 photos to continue. We recommend 6–10 for the best, most accurate results.");
        return;
      }
      // Required, not optional: without it every prompt uses a gender-neutral
      // "a person" anchor, and a live end-to-end test showed this isn't a
      // strong enough signal to keep the LoRA's identity consistent against
      // Flux's own per-category gender bias — some style categories (e.g.
      // "model", "creative") skew toward generating a different-gendered
      // person entirely. Explicitly selecting male/female/non-binary fixes
      // this for the customer; only "prefer not to say" keeps the neutral
      // wording (a smaller, accepted residual risk for that choice).
      if (!demographics.gender) {
        setError("Please select a gender so we can generate consistent, accurate results.");
        return;
      }
      if (files.length > 0 && !storagePath) {
        setIsProcessing(true);
        try {
          const path = await performUpload(files, (msg) => setProgress(msg));
          if (path) {
            setStoragePath(path);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            throw new Error("Upload failed to return a path");
          }
        } catch (err: any) {
          console.error("Upload failed:", err);
          setError(err.message || "Failed to upload photos. Please try again.");
          setIsProcessing(false);
          return;
        } finally {
          setIsProcessing(false);
        }
      }
      setStep(2);
      window.scrollTo(0, 0);
      
      // Track Step 1 Completion (Photos Uploaded)
      if (typeof window !== "undefined") {
        if ((window as any).fbq) (window as any).fbq('track', 'CustomizeProduct');
        if ((window as any).gtag) (window as any).gtag('event', 'add_to_cart');
      }
      return;
    }
  };

  const handleSubmit = async () => {
    if (!consentChecked) {
      setError("Please consent to biometric data processing to continue.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!storagePath) {
      setError("Please upload your photos before proceeding to checkout.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setProgress("Processing payment...");

    // Track Checkout Initiated
    if (typeof window !== "undefined") {
      const planConfig = PLANS[plan as keyof typeof PLANS];
      const planPrice = planConfig?.price || 0;
      
      if ((window as any).fbq) {
        (window as any).fbq('track', 'InitiateCheckout', {
          content_name: plan,
          value: planPrice,
          currency: 'USD',
        });
      }
      if ((window as any).gtag) {
        (window as any).gtag('event', 'begin_checkout', {
          currency: 'USD',
          value: planPrice,
          items: [{ item_name: plan, price: planPrice }]
        });
      }
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        authHeaders.Authorization = `Bearer ${session.access_token}`;
      }

      const checkoutPayload = {
        plan,
        email,
        storagePath,
        selectedStyles: ["auto"], // Styles are fully automated on backend now
        idempotencyKey,
        shootName: shootName || defaultShootName,
        coupon: couponValid && coupon ? coupon : undefined, // Only send coupon if validated
        utmParams, // Include UTM parameters for tracking
        demographics: Object.fromEntries(
          Object.entries(demographics ?? {}).filter(([_, v]) => v.trim() !== "")
        ) as Record<string, string>,
        imageCount: Math.max(files.length, 2), // Floor at the 2-photo minimum (covers the storagePath-only case)
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          ...authHeaders,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(checkoutPayload),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errBody?.error || "Checkout failed");
      }

      const { url } = (await res.json()) as { url?: string };

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(
        err.message?.includes("already being processed")
          ? "An order session is already active. Please click 'Start Over' at the bottom to begin a fresh shoot."
          : err.message || "Failed to process payment.",
      );
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setEmail("");
    setStoragePath("");
    setFiles([]);
    setFileQualityScores({});
    setDemographics({ age: "", gender: "", hairColor: "", ethnicity: "" });
    setPlan("pro");
    setShootName("");
    setCoupon("");
    setConsentChecked(true);
    setProgress("");
    setError("");
    setBackgroundProgress("");
    setIsProcessing(false);
    setIsUploadingBackground(false);
    setStep(1);

    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem("truzot-idempotency-key");
    localStorage.removeItem("truzot-upload");
    localStorage.removeItem("truzot-upload-backup");
    sessionStorage.removeItem("truzot-upload");

    const newKey = crypto.randomUUID();
    localStorage.setItem("truzot-idempotency-key", newKey);
    setIdempotencyKey(newKey);
    filesRef.current = [];
  };

  // Overall quality score = how many photos (0-40) + how good they are (0-60).
  // Deliberately excludes the optional demographics form — that's personalization,
  // not photo quality, and folding it in made the number confusing (a single
  // great photo used to read "43/100 Fair"). Photo count is weighted so 6+ sharp
  // photos reach "Excellent" while 2 caps you around "Good", matching the
  // guidance to upload 6-10.
  const qualityScore = useMemo(() => {
    const n = files.length;
    if (n === 0) return 0;
    const countScore = Math.min(40, n * 5.5); // 2→11, 6→33, 8+→40
    const scores = Object.values(fileQualityScores ?? {});
    const avgQuality = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 60; // neutral placeholder until per-file scores finish computing
    const qualityContribution = (avgQuality / 100) * 60;
    return Math.round(countScore + qualityContribution);
  }, [files.length, fileQualityScores]);

  const getQualityTier = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (score >= 60) return { label: "Good", color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/20" };
    if (score >= 40) return { label: "Fair", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: "Needs Improvement", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
  };

  // Inline CSS for the landing page theme
  return (
    <UploadErrorBoundary>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Upload", url: "/upload" },
        ]}
      />
      <div
        id="main-content"
        className="min-h-screen font-sans text-[var(--text)] pb-20 overflow-x-hidden"
        style={{ background: "var(--bg)" }}
      >
        <Nav user={user} />

        <div className="max-w-4xl mx-auto px-6 pt-12">
          {/* Stepper Header */}
          <div className="mb-12 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-24 relative">
              <div className="absolute top-1/2 left-[calc(50%-48px)] w-24 h-1 bg-[var(--border)] -z-10 rounded-full" />
              <div
                className="absolute top-1/2 left-[calc(50%-48px)] h-1 bg-[var(--lime)] -z-10 rounded-full transition-all duration-500 ease-out"
                style={{ width: step === 2 ? "96px" : "0px" }}
              />
              {[1, 2].map((num) => (
                <div
                  key={num}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-[4px] transition-all duration-500 ease-out z-10 ${
                    step >= num
                      ? "bg-[var(--lime)] border-[var(--lime)]/30 text-[var(--lime-on)] shadow-[0_0_20px_var(--lime)]"
                      : "bg-[var(--surface2)] border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {step > num ? <Check className="w-6 h-6" /> : num}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mt-4 px-[14px] text-[var(--text-secondary)]">
              <span className={step >= 1 ? "text-[var(--lime)]" : ""}>
                Upload Photos
              </span>
              <span className={step >= 2 ? "text-[var(--lime)]" : ""}>
                Select Plan
              </span>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300 font-medium">{error}</p>
              </motion.div>
            )}

            {/* STEP 1: UPLOAD */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-10">
                  <h1 className="text-4xl font-black tracking-tighter mb-4 text-[var(--text)]">
                    Upload your selfies
                  </h1>
                  <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
                    Upload 2–10 clear photos of your face — we recommend 6–10 for
                    the best, most accurate results. Takes{" "}
                    <span className="font-bold text-[var(--text)]">
                      2 minutes
                    </span>{" "}
                    instead of the 20 minutes other apps require.
                  </p>
                </div>

                {/* SAVED DATASET VIEW */}
                {storagePath && files.length === 0 ? (
                  <div
                    className="relative rounded-2xl border border-emerald-500/20 p-10 mb-8 overflow-hidden group"
                    style={{ background: "var(--surface)" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-[var(--text)] mb-2">
                        Photos Ready
                      </h3>
                      <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                        Your previous dataset is saved and ready for checkout.
                        You can proceed directly to select a plan.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <button
                          onClick={handleNextStep}
                          className="bg-[var(--lime)] text-[var(--lime-on)] px-8 py-3.5 rounded-xl font-bold text-lg hover:brightness-110 transition shadow-[var(--shadow-lime)] active:scale-95"
                        >
                          Continue to Checkout
                        </button>
                        <button
                          onClick={() => setStoragePath("")}
                          className="bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-[var(--surface3)] transition shadow-sm active:scale-95"
                        >
                          Replace Photos
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Upload Zone & Tips */}
                {files.length === 0 && !storagePath && (
                  <div className="grid md:grid-cols-5 gap-8 mb-10">
                    <div className="md:col-span-3">
                      <label
                        htmlFor="file-input"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                          const input = document.getElementById('file-input') as HTMLInputElement;
                          if (input) input.click();
                        }}
                        className={`group relative flex flex-col items-center justify-center w-full h-full min-h-[320px] p-8 text-center cursor-pointer border-2 border-dashed rounded-[2rem] transition-all duration-500 ease-out overflow-hidden shadow-sm hover:shadow-xl
                          ${isDragging ? "border-[var(--lime)] bg-[var(--surface)] scale-[1.02]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--lime-border)]"}`}
                      >
                        <div
                          className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform duration-300 bg-[var(--bg)] shadow-sm border ${isDragging ? "scale-110 border-[var(--lime-text)]" : "border-[var(--border-secondary)] group-hover:-translate-y-1 group-hover:border-[var(--lime-text)]"}`}
                        >
                          <ImagePlus className="w-10 h-10 text-[var(--lime-text)]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text)] mb-3">
                          {isDragging
                            ? "Drop photos here"
                            : "Click or drag photos here"}
                        </h3>
                        <p className="text-[var(--text-secondary)] font-medium max-w-xs">
                          Upload 2–10 selfies (JPG, PNG, HEIC)
                        </p>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/heic"
                          className="hidden"
                          id="file-input"
                          onChange={(e) => handleFiles(e.target.files)}
                        />
                      </label>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <div className="border border-[var(--border-secondary)] p-8 rounded-[2rem] bg-[var(--surface)] relative overflow-hidden h-full shadow-sm">
                        <h3 className="text-lg font-bold text-[var(--text)] mb-4">
                          Photo Requirements
                        </h3>

                        <div className="flex flex-col gap-5">
                          {PHOTO_TIPS.map((tip, idx) => {
                            const Icon = tip.icon;
                            return (
                              <div key={idx} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-[var(--bg)] shadow-sm border border-[var(--border-secondary)] flex items-center justify-center shrink-0">
                                  <Icon className="w-5 h-5 text-[var(--lime-text)]" />
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-[var(--text)]">
                                    {tip.text}
                                  </div>
                                  <div className="text-sm text-[var(--text-secondary)] mt-0.5">
                                    {tip.desc}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Files Uploaded Preview */}
                {files.length > 0 && (
                  <div className="rounded-[2rem] border border-[var(--border)] p-8 mb-10 shadow-sm bg-[var(--surface)]">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xl font-bold text-[var(--text)] flex items-center gap-3">
                        Uploaded Photos
                        <span className="bg-[var(--surface2)] text-[var(--text-secondary)] text-sm py-1 px-3 rounded-full border border-[var(--border)]">
                          {files.length} / 10
                        </span>
                      </span>
                    </div>

                    {/* Count-based quality guidance. Minimum is 2, but likeness
                        improves sharply with more reference photos, so we tell the
                        customer plainly what to expect before they pay. */}
                    {files.length < 6 && (
                      <div className="mb-6 p-4 rounded-xl border border-amber-300/40 bg-amber-50/60 dark:bg-amber-500/10">
                        <p className="text-sm text-[var(--text)]">
                          {files.length < 2 ? (
                            <><span className="font-bold">Add at least 2 photos to continue.</span> </>
                          ) : (
                            <><span className="font-bold">You can continue with {files.length} photo{files.length === 1 ? "" : "s"}.</span> </>
                          )}
                          For the most accurate, natural-looking results we strongly recommend{" "}
                          <span className="font-bold">6–10 varied photos</span> — different angles,
                          lighting, and expressions. Fewer photos can produce a less consistent likeness.
                        </p>
                      </div>
                    )}

                    {/* Quality Bar */}
                    <div className="mb-6 p-4 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg)]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-[var(--text)]">Photo Quality Score</span>
                        <span className={`text-sm font-bold ${getQualityTier(qualityScore).color}`}>
                          {qualityScore}/100 - {getQualityTier(qualityScore).label}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[var(--surface2)] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            qualityScore >= 80 ? 'bg-emerald-500' :
                            qualityScore >= 60 ? 'bg-lime-500' :
                            qualityScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${qualityScore}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-2">
                        {files.length < 6
                          ? `✨ ${files.length} photo${files.length === 1 ? "" : "s"} added. Add ${6 - files.length} more (6–10 total) for the most accurate, consistent results.`
                          : qualityScore >= 80
                            ? "🎉 Excellent — this set will train a strong, accurate model."
                            : qualityScore >= 60
                              ? "✅ Good set. For an even better model, swap any softer or dim photos for sharper, well-lit ones."
                              : "💡 Replace the lowest-scoring photos (see the % on each) with sharper, brighter, closer shots."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {objectUrls.map((url, i) => (
                        <div
                          key={i}
                          className="relative aspect-[3/4] group rounded-2xl overflow-hidden shadow-md border border-[var(--border)]"
                        >
                          <img
                            src={url}
                            alt={`Uploaded photo preview ${i + 1} for AI headshot generation`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {fileQualityScores[i] !== undefined && (
                            <div
                              className={`absolute bottom-2 left-2 text-white text-xs font-bold px-2 py-1 rounded ${
                                fileQualityScores[i] >= 75
                                  ? "bg-emerald-600/90"
                                  : fileQualityScores[i] >= 55
                                    ? "bg-amber-600/90"
                                    : "bg-red-600/90"
                              }`}
                              title="Photo quality: sharpness, lighting and resolution"
                            >
                              {fileQualityScores[i]}/100
                            </div>
                          )}
                          <button
                            onClick={() => removeFile(i)}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-[var(--text)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 hover:scale-110"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {files.length < 10 && (
                        <label className="aspect-[3/4] border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[var(--lime-border)] hover:bg-[var(--lime-dim)] transition-colors group">
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/heic"
                            className="hidden"
                            onChange={(e) => handleFiles(e.target.files)}
                          />
                          <div className="w-12 h-12 bg-[var(--surface2)] border border-[var(--border)] group-hover:border-[var(--lime-border)] rounded-full flex items-center justify-center mb-3 transition-colors shadow-sm">
                            <Plus className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-[var(--text)]:text-[var(--lime)]" />
                          </div>
                          <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text)]:text-[var(--lime)] transition-colors">
                            Add Photo
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Demographic Form */}
                {files.length > 0 && (
                  <div className="rounded-[2rem] border border-[var(--border)] p-8 mb-10 shadow-sm bg-[var(--surface)]">
                    <h3 className="text-lg font-bold text-[var(--text)] mb-4">
                      Help Us Personalize Your Results
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">
                      Gender is required so every generated photo consistently looks like you. The rest is optional but helps accuracy further.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                          Age Range
                        </label>
                        <select
                          value={demographics.age}
                          onChange={(e) => setDemographics(prev => ({ ...prev, age: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] focus:border-[var(--lime-text)] focus:ring-2 focus:ring-[var(--lime-dim)] outline-none transition font-semibold shadow-sm"
                        >
                          <option value="">Select age range</option>
                          <option value="18-24">18-24</option>
                          <option value="25-34">25-34</option>
                          <option value="35-44">35-44</option>
                          <option value="45-54">45-54</option>
                          <option value="55-64">55-64</option>
                          <option value="65+">65+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={demographics.gender}
                          onChange={(e) => setDemographics(prev => ({ ...prev, gender: e.target.value }))}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] focus:border-[var(--lime-text)] focus:ring-2 focus:ring-[var(--lime-dim)] outline-none transition font-semibold shadow-sm"
                        >
                          <option value="">Select gender (required)</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="non-binary">Non-binary</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                          Hair Color
                        </label>
                        <select
                          value={demographics.hairColor}
                          onChange={(e) => setDemographics(prev => ({ ...prev, hairColor: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] focus:border-[var(--lime-text)] focus:ring-2 focus:ring-[var(--lime-dim)] outline-none transition font-semibold shadow-sm"
                        >
                          <option value="">Select hair color</option>
                          <option value="black">Black</option>
                          <option value="brown">Brown</option>
                          <option value="blonde">Blonde</option>
                          <option value="red">Red</option>
                          <option value="gray">Gray</option>
                          <option value="white">White</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                          Ethnicity (Optional)
                        </label>
                        <select
                          value={demographics.ethnicity}
                          onChange={(e) => setDemographics(prev => ({ ...prev, ethnicity: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] focus:border-[var(--lime-text)] focus:ring-2 focus:ring-[var(--lime-dim)] outline-none transition font-semibold shadow-sm"
                        >
                          <option value="">Select ethnicity (optional)</option>
                          <option value="asian">Asian</option>
                          <option value="black">Black / African</option>
                          <option value="hispanic">Hispanic / Latino</option>
                          <option value="middle-eastern">Middle Eastern</option>
                          <option value="native-american">Native American</option>
                          <option value="pacific-islander">Pacific Islander</option>
                          <option value="white">White / Caucasian</option>
                          <option value="mixed">Mixed</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {files.length > 0 && (
                  <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                    <button
                      onClick={handleNextStep}
                      disabled={isUploadingBackground || isProcessing}
                      className="bg-[var(--lime)] text-[var(--lime-on)] px-10 py-4 rounded-xl text-lg font-bold flex items-center gap-2 hover:brightness-110 transition shadow-xl hover:shadow-[var(--shadow-lime)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      {isUploadingBackground ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading securely...
                        </>
                      ) : isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Next: Select Plan
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: CHECKOUT */}
            {step === 2 && (
              <PaymentErrorBoundary>
                <motion.div
                  key="step2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-12">
                    <h1 className="text-3xl font-black tracking-tighter mb-3 text-[var(--text)]">
                      Complete your order
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)]">
                      Pick the package that fits your needs. Backed by our 100%
                      money-back guarantee.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-12 gap-8 lg:gap-12">
                    <div className="md:col-span-7 space-y-5">
                      <h3 className="text-xl font-bold text-[var(--text)] mb-4">
                        Select a Package
                      </h3>
                      {PLANS_LIST.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPlan(p.id)}
                          className={`w-full p-6 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                            plan === p.id
                              ? "border-[var(--lime-text)] bg-[var(--lime-dim)] shadow-md ring-1 ring-[var(--lime-text)]"
                              : "border-[var(--border-secondary)] bg-[var(--surface)] hover:border-[var(--lime-text)] hover:bg-[var(--surface2)]"
                          }`}
                        >
                          {plan === p.id && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--lime-dim)] rounded-full blur-3xl" />
                          )}
                          {p.popular && (
                            <div className="absolute top-0 right-6 bg-[var(--lime)] text-[var(--lime-on)] text-xs font-bold px-3 py-1.5 rounded-b-lg tracking-wider uppercase shadow-sm">
                              Most Popular
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-xl text-[var(--text)]">
                              {p.name}
                            </span>
                            <span className="text-3xl font-black text-[var(--text)]">
                              ${p.price}
                            </span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-medium text-[var(--text-secondary)]">
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={`w-5 h-5 ${plan === p.id ? "text-[var(--lime-text)]" : "text-[var(--success)]"}`}
                              />
                              {p.shots} photos
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={`w-5 h-5 ${plan === p.id ? "text-[var(--lime-text)]" : "text-[var(--success)]"}`}
                              />
                              {p.styles} styles
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={`w-5 h-5 ${plan === p.id ? "text-[var(--lime-text)]" : "text-[var(--success)]"}`}
                              />
                              {p.resolution}
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={`w-5 h-5 ${plan === p.id ? "text-[var(--lime-text)]" : "text-[var(--success)]"}`}
                              />
                              {p.turnaround}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="md:col-span-5">
                      <div className="rounded-[2rem] border border-[var(--border)] p-8 h-fit sticky top-24 shadow-sm bg-[var(--surface)]">
                        <h3 className="text-xl font-bold mb-6 text-[var(--text)]">
                          Order Details
                        </h3>

                        <div className="space-y-5 mb-8">
                          <div>
                            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                              Name This Shoot
                            </label>
                            <input
                              type="text"
                              value={shootName}
                              onChange={(e) => setShootName(e.target.value)}
                              onFocus={() => {
                                if (!shootName) setShootName("");
                              }}
                              placeholder={defaultShootName}
                              className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--lime-text)] focus:ring-2 focus:ring-[var(--lime-dim)] outline-none transition font-semibold shadow-sm"
                              maxLength={100}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                              Delivery Email
                            </label>
                            <input
                              type="email"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="w-full px-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--lime-text)] focus:ring-2 focus:ring-[var(--lime-dim)] outline-none transition font-semibold shadow-sm"
                            />
                          </div>
                        </div>

                        <div className="bg-[var(--surface)] border border-[var(--border-secondary)] p-5 rounded-2xl mb-8 shadow-sm">
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center mt-0.5">
                              <input
                                type="checkbox"
                                checked={consentChecked}
                                onChange={(e) =>
                                  setConsentChecked(e.target.checked)
                                }
                                className="peer appearance-none w-5 h-5 border-2 border-[var(--border-secondary)] rounded checked:bg-[var(--lime)] checked:border-[var(--lime)] transition-colors"
                              />
                              <Check className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                            </div>
                            <span className="text-sm font-semibold text-[var(--text)] leading-relaxed transition-colors">
                              I consent to processing my photos to train a
                              temporary AI model. Data is automatically deleted
                              in 30 days per the{" "}
                              <Link
                                href="/privacy"
                                className="text-[var(--lime)] font-medium hover:underline"
                              >
                                Privacy Policy
                              </Link>
                              .
                            </span>
                          </label>
                        </div>

                        {isProcessing ? (
                          <div className="bg-[var(--lime-dim)] border border-[var(--lime-border)] rounded-2xl p-6 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[var(--lime)]" />
                            <div className="font-bold text-lg text-[var(--text)]">
                              {progress}
                            </div>
                            <div className="text-sm text-[var(--text-secondary)] mt-1">
                              Redirecting to secure checkout...
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={handleSubmit}
                            className="w-full bg-[var(--lime)] text-[var(--lime-on)] py-4 rounded-xl text-lg font-bold hover:bg-lime-300 transition-all shadow-xl hover:shadow-lime-400/20 active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Lock className="w-5 h-5" /> Continue to Payment
                          </button>
                        )}

                        <div className="mt-8 flex flex-col items-center gap-3">
                          <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-[var(--text-secondary)] w-full">
                            <div className="flex items-center justify-center gap-1.5 bg-[var(--surface2)] border border-[var(--border-secondary)] px-2 py-2.5 rounded-xl whitespace-nowrap shadow-sm">
                              <Shield className="w-4 h-4 text-[var(--lime-text)]" />{" "}
                              SSL Secured
                            </div>
                            <div className="flex items-center justify-center gap-1.5 bg-[var(--surface2)] border border-[var(--border-secondary)] px-2 py-2.5 rounded-xl whitespace-nowrap shadow-sm">
                              <Star className="w-4 h-4 text-amber-400" />{" "}
                              Guaranteed
                            </div>
                          </div>

                          <div className="w-full mt-4 flex shadow-sm rounded-xl">
                            <input
                              type="text"
                              value={coupon}
                              onChange={(e) => {
                                setCoupon(e.target.value.toUpperCase());
                                setCouponValid(null);
                                setCouponMessage("");
                              }}
                              placeholder="Discount Code"
                              className="w-full px-4 py-2.5 rounded-l-xl border border-r-0 border-[var(--border-secondary)] bg-[var(--bg)] text-sm outline-none uppercase font-bold placeholder-[var(--text-muted)] text-[var(--text)] focus:border-[var(--lime-text)] focus:ring-1 focus:ring-[var(--lime-dim)]"
                            />
                            <button
                              onClick={validateCoupon}
                              disabled={validatingCoupon}
                              className="bg-[var(--surface2)] hover:bg-[var(--surface3)] transition cursor-pointer border border-[var(--border-secondary)] px-5 py-2.5 rounded-r-xl text-sm font-bold text-[var(--text)] flex items-center justify-center disabled:opacity-50"
                            >
                              {validatingCoupon ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Apply"
                              )}
                            </button>
                          </div>
                          {couponMessage && (
                            <div
                              className={`mt-2 text-xs ${
                                couponValid ? "text-lime-400" : "text-red-400"
                              }`}
                            >
                              {couponMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 flex items-center justify-between border-t border-[var(--border-secondary)] pt-8">
                    <button
                      onClick={() => setStep(1)}
                      className="text-[var(--text)] font-bold flex items-center gap-2 bg-[var(--surface2)] hover:bg-[var(--surface3)] border border-[var(--border-secondary)] px-6 py-3 rounded-xl transition-colors active:scale-95 shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" /> Back to Uploads
                    </button>
                    <button
                      onClick={handleStartOver}
                      className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text)] underline underline-offset-4 transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                </motion.div>
              </PaymentErrorBoundary>
            )}
          </AnimatePresence>
        </div>
      </div>
    </UploadErrorBoundary>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg)" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Preparing studio...
            </p>
          </div>
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}
