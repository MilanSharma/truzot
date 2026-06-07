"use client";
import {
  useState,
  useCallback,
  Suspense,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

import { supabase } from "@/lib/supabase/client";
import { PLANS } from "@/lib/plans";
import { STYLE_CATEGORIES } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import {
  Camera,
  Upload,
  Shield,
  Zap,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Star,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

const PLANS_LIST = Object.values(PLANS);

const PHOTO_TIPS = [
  {
    icon: "😊",
    text: "Clear face visibility",
    desc: "No sunglasses or heavy hats.",
  },
  {
    icon: "💡",
    text: "Good lighting",
    desc: "Natural window light works best.",
  },
  {
    icon: "📐",
    text: "Variety of angles",
    desc: "Front, side, and 3/4 views.",
  },
  {
    icon: "👔",
    text: "Different outfits",
    desc: "Change clothes/backgrounds.",
  },
];

type Step = 1 | 2 | 3;

const SESSION_KEY = "truzot-upload";
const LOCAL_KEY = "truzot-upload-backup";

function getSavedState(): Record<string, unknown> | null {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved);
    const backup = localStorage.getItem(LOCAL_KEY);
    if (backup) {
      const parsed = JSON.parse(backup);
      sessionStorage.setItem(SESSION_KEY, backup);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function UploadContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const urlStep = parseInt(searchParams.get("step") ?? "") as Step;
  const [step, setStep] = useState<Step>(() => {
    const saved = getSavedState();
    if (
      saved?.step &&
      typeof saved.step === "number" &&
      saved.step >= 1 &&
      saved.step <= 3
    )
      return saved.step as Step;
    return urlStep >= 1 && urlStep <= 3 ? urlStep : 1;
  });
  const [files, setFiles] = useState<File[]>([]);
  const [filesCount, setFilesCount] = useState(
    () => (getSavedState()?.filesCount as number) || 0,
  );

  // Customization Preferences
  const [gender, setGender] = useState(
    () => (getSavedState()?.gender as string) || "",
  );
  const [eyeColor, setEyeColor] = useState(
    () => (getSavedState()?.eyeColor as string) || "",
  );
  const [hairColor, setHairColor] = useState(
    () => (getSavedState()?.hairColor as string) || "",
  );
  const [clothing, setClothing] = useState(
    () => (getSavedState()?.clothing as string) || "business-casual",
  );
  const [background, setBackground] = useState(
    () => (getSavedState()?.background as string) || "studio",
  );
  const [framing, setFraming] = useState(
    () => (getSavedState()?.framing as string) || "closeup",
  );
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    () =>
      (getSavedState()?.selectedStyles as string[]) ||
      STYLE_CATEGORIES.map((c) => c.id),
  );

  // Checkout State
  const [plan, setPlan] = useState(
    () =>
      (getSavedState()?.plan as string) || searchParams.get("plan") || "pro",
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
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync step to URL using native history API (pushes entries for back button)
  const stepRef = useRef(step);
  useEffect(() => {
    if (stepRef.current !== step) {
      window.history.pushState(null, "", `/upload?step=${step}`);
    }
    stepRef.current = step;
  }, [step]);

  // Listen for browser back/forward via popstate
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlStep = parseInt(params.get("step") ?? "") as Step;
      if (urlStep >= 1 && urlStep <= 3) {
        setStep(urlStep);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Handle ?cancelled=1 from Stripe cancel URL — preserve state and return to last step
  useEffect(() => {
    if (searchParams.get("cancelled")) {
      setTimeout(() => {
        const saved = getSavedState();
        const targetStep =
          saved?.step &&
          typeof saved.step === "number" &&
          saved.step >= 1 &&
          saved.step <= 3
            ? (saved.step as Step)
            : 3;
        setStep(targetStep);
        // Remove cancelled from URL without losing other state
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("cancelled");
        window.history.replaceState(null, "", newUrl.toString());
      }, 0);
    }
  }, [searchParams]);

  // Persist state so browser back from Stripe preserves details
  useEffect(() => {
    if (step === 1 && files.length === 0 && !storagePath) return;
    try {
      const state = JSON.stringify({
        step,
        plan,
        email,
        consentChecked,
        gender,
        eyeColor,
        hairColor,
        clothing,
        background,
        framing,
        selectedStyles,
        storagePath,
        filesCount: files.length,
        shootName,
      });
      sessionStorage.setItem(SESSION_KEY, state);
      localStorage.setItem(LOCAL_KEY, state);
    } catch {}
  }, [
    step,
    plan,
    email,
    consentChecked,
    gender,
    eyeColor,
    hairColor,
    clothing,
    background,
    framing,
    selectedStyles,
    storagePath,
    files,
    shootName,
  ]);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setEmail((prev) => (prev || session.user.email) ?? "");
      }
    };
    loadUser();
  }, []);

  const selectedPlan = PLANS_LIST.find((p) => p.id === plan) || PLANS_LIST[1];

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
        if (width < 300 || height < 300)
          return `${file.name}: image too small (${width}x${height}). Minimum 300x300.`;
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

  const faceDetectorSupported =
    typeof window !== "undefined" && "FaceDetector" in window;

  const detectFaces = useCallback(
    async (
      file: File,
    ): Promise<{
      count: number;
      crop?: { x: number; y: number; w: number; h: number };
    } | null> => {
      if (!faceDetectorSupported) return null;
      try {
        const bitmap = await createImageBitmap(file);
        const bmpW = bitmap.width;
        const bmpH = bitmap.height;
        const detector = new (window as any).FaceDetector({
          maxDetectedFaces: 5,
          fastMode: true,
        });
        const faces = await detector.detect(bitmap);
        bitmap.close();
        if (faces.length === 0) return { count: 0 };
        const f = faces[0].boundingBox ||
          faces[0].boundingRect || {
            x: 0,
            y: 0,
            width: bmpW,
            height: bmpH,
          };
        const margin = 0.2;
        const x = Math.max(0, f.x - f.width * margin);
        const y = Math.max(0, f.y - f.height * margin);
        const w = Math.min(bitmap.width - x, f.width * (1 + margin * 2));
        const h = Math.min(bitmap.height - y, f.height * (1 + margin * 2));
        return { count: faces.length, crop: { x, y, w, h } };
      } catch {
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const computeFileFingerprint = useCallback(
    (file: File): string => `${file.name}|${file.size}`,
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
              const faceResult = await detectFaces(jpegFile);
              if (faceResult && faceResult.count === 0) {
                warnings.push(
                  `${jpegFile.name}: no face detected — model training may not work well`,
                );
              }
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
            .concat(files)
            .map((ef) => computeFileFingerprint(ef));
          if (existingFps.includes(fp)) {
            errors.push(`${f.name}: duplicate photo detected — skip`);
            continue;
          }
          const faceResult = await detectFaces(f);
          if (faceResult && faceResult.count === 0) {
            warnings.push(
              `${f.name}: no face detected — model training may not work well`,
            );
          }
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
      setFiles((prev) => {
        const next = [...prev, ...converted].slice(0, 5);
        return next;
      });
    },
    [toast, validatePhoto, computeFileFingerprint, files, detectFaces],
  );

  const removeFile = (i: number) => {
    setFiles((f) => f.filter((_, idx) => idx !== i));
  };

  // Quality Score Calculation
  const getQualityScore = () => {
    if (files.length === 0)
      return {
        score: 0,
        label: "Upload photos to start",
        color: "bg-slate-200",
        text: "text-slate-500",
      };
    if (files.length < 5)
      return {
        score: 30,
        label: "Add 3-5 photos for best quality",
        color: "bg-amber-500",
        text: "text-amber-600",
      };
    return {
      score: 100,
      label: "Excellent Variety",
      color: "bg-emerald-500",
      text: "text-emerald-600",
    };
  };

  const score = getQualityScore();

  const analyzePhotos = useCallback(async (imageFiles: File[]) => {
    if (imageFiles.length === 0) return;
    setFraming("closeup");
    setHairColor("Unknown");
    setEyeColor("Unknown");
  }, []);

  const performUpload = useCallback(
    async (filesToUpload: File[], onProgress?: (msg: string) => void) => {
      if (filesToUpload.length === 0) return null;

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

      if (!uploadUrlRes.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, token: uploadToken, path } = await uploadUrlRes.json();

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
            onProgress(`Uploading: ${Math.round((e.loaded / e.total) * 100)}%`);
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201 || xhr.status === 204)
            resolve();
          else reject(new Error("File upload failed."));
        };
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.send(zipBlob);
      });

      return path;
    },
    [],
  );

  const handleNextStep = async () => {
    setError("");
    if (step === 1 && files.length < 3 && !storagePath) {
      setError(
        "Please upload at least 3 photos for best results (5 recommended).",
      );
      return;
    }
    if (step === 1) {
      // Start background upload so it's ready by Step 3
      if (files.length > 0 && !storagePath) {
        performUpload(files)
          .then((path) => {
            if (path) setStoragePath(path);
          })
          .catch((err) => {
            console.warn(
              "Background upload failed, will retry at checkout:",
              err,
            );
          });
      }
      await analyzePhotos(files);
      setStep(2);
      return;
    }
    if (
      step === 2 &&
      (!gender ||
        !eyeColor ||
        !hairColor ||
        !clothing ||
        !background ||
        !framing)
    ) {
      setError("Please fill in all details to help the AI.");
      return;
    }
    if (step === 2 && selectedStyles.length === 0) {
      setError("Please select at least one style.");
      return;
    }
    setStep((s) => (s + 1) as Step);
    window.scrollTo(0, 0);
  };

  const handleStartOver = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LOCAL_KEY);
    } catch {}
    setStep(1);
    setPlan(searchParams.get("plan") || "pro");
    setEmail("");
    setShootName("");
    setGender("");
    setEyeColor("");
    setHairColor("");
    setClothing("business-casual");
    setBackground("studio");
    setFraming("closeup");
    setSelectedStyles(STYLE_CATEGORIES.map((c) => c.id));
    setConsentChecked(true);
    setError("");
    setIsProcessing(false);
    setIdempotencyKey(crypto.randomUUID());
  }, [searchParams]);

  const handleSubmit = async () => {
    setError("");
    if (!consentChecked) {
      setError(
        "Please accept the biometric processing consent check before proceeding.",
      );
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (files.length === 0 && !storagePath) {
      setError("Please upload at least one photo first.");
      setStep(1);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    let finalStoragePath = storagePath;

    // Fallback: If the user was super fast and background upload didn't finish, do it now
    if (files.length > 0 && !finalStoragePath) {
      setProgress("Finalizing photo upload...");
      try {
        finalStoragePath = await performUpload(files, setProgress);
        if (finalStoragePath) setStoragePath(finalStoragePath);
      } catch (err: any) {
        console.error("Upload error:", err);
        setError(
          err.message ??
            "Something went wrong during upload. Please try again.",
        );
        setIsProcessing(false);
        return;
      }
    }

    setProgress("Securing your checkout session...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) authHeaders.Authorization = `Bearer ${token}`;

      const checkoutPayload: Record<string, unknown> = {
        plan,
        email,
        storagePath: finalStoragePath,
        gender,
        eyeColor,
        hairColor,
        clothing,
        background,
        framing,
        selectedStyles,
        idempotencyKey,
        shootName: shootName || defaultShootName,
      };
      if (userId) checkoutPayload.userId = userId;

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(checkoutPayload),
      });

      if (!checkoutRes.ok) {
        const errBody = await checkoutRes.json().catch(() => null);
        throw new Error(
          errBody?.error || `Checkout failed (${checkoutRes.status})`,
        );
      }

      const { url } = await checkoutRes.json();

      // Save final state
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          step,
          plan,
          email,
          consentChecked,
          gender,
          eyeColor,
          hairColor,
          clothing,
          background,
          framing,
          selectedStyles,
          storagePath: finalStoragePath,
          shootName,
        }),
      );

      window.location.href = url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message ?? "Something went wrong. Please try again.");
      setIsProcessing(false);
      if (err.message?.includes("Failed to create order")) {
        setStep(2);
      }
    }
  };

  return (
    <div
      id="main-content"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20"
    >
      <Nav />

      <div className="max-w-3xl mx-auto px-6 pt-12">
        {/* Stepper Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-slate-50 dark:border-slate-950 transition-colors ${step >= num ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-300"}`}
              >
                {step > num ? <Check className="w-5 h-5" /> : num}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mt-3 uppercase tracking-wider">
            <span className={step >= 1 ? "text-blue-600" : ""}>Upload</span>
            <span className={step >= 2 ? "text-blue-600" : ""}>Details</span>
            <span className={step >= 3 ? "text-blue-600" : ""}>Checkout</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">
              {error}
            </p>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                Upload your selfies
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Upload 1-5 clear photos of your face. The AI uses these to
                create your personalized headshots.
              </p>
            </div>

            {/* SAVED DATASET VIEW (Shows after hard reload / returning from Stripe) */}
            {storagePath && files.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-8 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Dataset Quality
                  </span>
                  <span className="font-bold text-emerald-600">
                    Previously Uploaded
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 text-center border border-emerald-100 dark:border-emerald-800">
                  <ImageIcon className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    Photos Securely Saved
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Your previously uploaded photos are safely stored in our
                    secure environment and ready to use. You can upload new
                    photos to replace them, or simply click{" "}
                    <strong>Next</strong> to continue.
                  </p>
                  <button
                    onClick={() => {
                      setStoragePath("");
                      const saved = getSavedState();
                      if (saved) {
                        delete (saved as any).storagePath;
                        sessionStorage.setItem(
                          SESSION_KEY,
                          JSON.stringify(saved),
                        );
                      }
                    }}
                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                  >
                    Replace with new photos
                  </button>
                </div>
              </div>
            ) : (
              /* NORMAL UPLOAD VIEW */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Dataset Quality
                  </span>
                  <span className={`font-bold ${score.text}`}>
                    {score.label}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-8">
                  <div
                    className={`h-full ${score.color} transition-all duration-500`}
                    style={{ width: `${score.score}%` }}
                  />
                </div>
                <label
                  htmlFor="file-input"
                  className="block cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-10 text-center hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/heic"
                    capture="environment"
                    className="hidden"
                    id="file-input"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {files.length === 0
                      ? "Click to browse or drag photos here"
                      : `Add more photos`}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    JPG, PNG, HEIC accepted.
                  </p>
                </label>
                {files.length > 0 && (
                  <div className="mt-8 grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-xl overflow-hidden shadow-sm group"
                      >
                        <img
                          src={objectUrls[i]}
                          alt={`Photo ${i + 1}: ${f.name}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            removeFile(i);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hide tips if dataset is already saved */}
            {files.length === 0 && !storagePath && (
              <div className="grid sm:grid-cols-2 gap-4">
                {PHOTO_TIPS.map((tip, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-3 shadow-sm"
                  >
                    <span className="text-2xl">{tip.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {tip.text}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {tip.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNextStep}
                className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-sm"
              >
                Next: Customization <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DETAILS FOR AI */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                Details for the AI
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                These details help the AI create more realistic headshots.
              </p>
            </div>

            <div className="space-y-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                  <User className="w-5 h-5 text-blue-600" /> Gender
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {["Male", "Female", "Non-Binary"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`py-3 rounded-xl border-2 font-semibold transition ${gender === g ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                  <ImageIcon className="w-5 h-5 text-blue-600" /> Eye Color
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    "Brown",
                    "Black",
                    "Blue",
                    "Green",
                    "Hazel",
                    "Gray",
                    "Amber",
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => setEyeColor(c)}
                      className={`py-3 rounded-xl border-2 font-semibold transition ${eyeColor === c ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                  <User className="w-5 h-5 text-blue-600" /> Hair Color
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {["Black", "Brown", "Blonde", "Red", "Gray", "White"].map(
                    (c) => (
                      <button
                        key={c}
                        onClick={() => setHairColor(c)}
                        className={`py-3 rounded-xl border-2 font-semibold transition ${hairColor === c ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"}`}
                      >
                        {c}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Shield className="w-5 h-5 text-blue-600" /> Clothing
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      id: "business-formal",
                      label: "Business Formal",
                      desc: "Suit & tie",
                    },
                    {
                      id: "business-casual",
                      label: "Business Casual",
                      desc: "Blazer, no tie",
                    },
                    {
                      id: "smart-casual",
                      label: "Smart Casual",
                      desc: "Polished relaxed",
                    },
                    {
                      id: "creative",
                      label: "Creative",
                      desc: "Turtleneck, etc.",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setClothing(opt.id)}
                      className={`py-3 px-4 rounded-xl border-2 text-left transition ${clothing === opt.id ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"}`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Camera className="w-5 h-5 text-blue-600" /> Background
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "studio", label: "Studio", desc: "Clean backdrop" },
                    { id: "office", label: "Office", desc: "Modern workspace" },
                    { id: "outdoor", label: "Outdoor", desc: "Nature, park" },
                    { id: "city", label: "City", desc: "Urban skyline" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setBackground(opt.id)}
                      className={`py-3 px-4 rounded-xl border-2 text-left transition ${background === opt.id ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"}`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Camera className="w-5 h-5 text-blue-600" /> Framing
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      id: "closeup",
                      label: "Close-up",
                      desc: "Head & shoulders",
                    },
                    { id: "half-body", label: "Half-body", desc: "Waist up" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFraming(opt.id)}
                      className={`py-3 px-4 rounded-xl border-2 text-left transition ${framing === opt.id ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"}`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Camera className="w-5 h-5 text-blue-600" /> Headshot Styles
                  </h3>
                  <button
                    onClick={() =>
                      setSelectedStyles((prev) =>
                        prev.length === STYLE_CATEGORIES.length
                          ? []
                          : STYLE_CATEGORIES.map((c) => c.id),
                      )
                    }
                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {selectedStyles.length === STYLE_CATEGORIES.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STYLE_CATEGORIES.map((style) => {
                    const isSelected = selectedStyles.includes(style.id);
                    return (
                      <button
                        key={style.id}
                        onClick={() =>
                          setSelectedStyles((prev) =>
                            isSelected
                              ? prev.filter((s) => s !== style.id)
                              : [...prev, style.id],
                          )
                        }
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-100 dark:ring-blue-900"
                            : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xl">{style.icon}</span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? "border-blue-600 bg-blue-600"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {style.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {style.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {selectedStyles.length === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-3">
                    Select at least one style to continue.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={handleNextStep}
                disabled={
                  !gender ||
                  !eyeColor ||
                  !hairColor ||
                  !clothing ||
                  !background ||
                  !framing ||
                  selectedStyles.length === 0
                }
                className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Choose Plan <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CHECKOUT */}
        {step === 3 && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                Final Step: Choose Plan
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Pick the package that fits your needs. 100% money-back
                guarantee.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {PLANS_LIST.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all relative ${plan === p.id ? "border-blue-600 bg-white dark:bg-slate-800 shadow-md ring-4 ring-blue-50 dark:ring-blue-900" : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500"}`}
                  >
                    {p.popular && (
                      <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wider uppercase">
                        Most Popular
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-lg text-slate-900 dark:text-white">
                        {p.name}
                      </span>
                      <span className="text-2xl font-black text-blue-600">
                        ${p.price}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />{" "}
                      {p.shots} photos • {p.turnaround} delivery
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm h-fit">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Lock className="w-4 h-4" /> Secure Checkout
                </h3>

                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    maxLength={100}
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Delivery Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition font-medium"
                  />
                </div>

                <div className="flex items-start gap-3 mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <label
                    htmlFor="consent"
                    className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer select-none"
                  >
                    I consent to Truzot processing my biometric face photos to
                    train a temporary AI model. Data is automatically
                    permanently deleted in 30 days per the{" "}
                    <Link href="/privacy" className="text-blue-600 underline">
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                {isProcessing ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-800">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    <div className="font-bold text-sm">{progress}</div>
                    <div className="text-xs opacity-75 mt-1">
                      Please do not close this window
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2"
                  >
                    Complete Payment <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                <div className="mt-6 flex items-center justify-center gap-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" /> 256-bit TLS
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" /> Money-back guarantee
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <ChevronLeft className="w-5 h-5" /> Back to Details
              </button>
              <button
                onClick={handleStartOver}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadContent />
    </Suspense>
  );
}
