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

function getSavedState(): Record<string, unknown> | null {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function UploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
    () => (getSavedState()?.clothing as string) || "",
  );
  const [background, setBackground] = useState(
    () => (getSavedState()?.background as string) || "",
  );
  const [framing, setFraming] = useState(
    () => (getSavedState()?.framing as string) || "",
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
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync step to URL for back/forward navigation
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
    router.replace(`/upload?step=${step}`, { scroll: false });
  }, [step, router]);

  // Listen for browser back/forward changes to step param
  useEffect(() => {
    if (urlStep >= 1 && urlStep <= 3 && urlStep !== stepRef.current) {
      setStep(urlStep);
    }
  }, [urlStep]);

  // Handle ?cancelled=1 from Stripe cancel URL — clear state and start fresh
  useEffect(() => {
    if (searchParams.get("cancelled")) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {}
      setTimeout(() => setStep(1), 0);
      router.replace("/upload", { scroll: false });
    }
  }, [searchParams, router]);

  // Persist state so browser back from Stripe preserves details
  useEffect(() => {
    if (step === 1 && files.length === 0) return;
    try {
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
        }),
      );
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
    files,
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

  const handleFiles = useCallback(
    async (incoming: FileList | null) => {
      if (!incoming) return;
      const converted: File[] = [];
      const errors: string[] = [];
      for (const f of Array.from(incoming)) {
        if (f.size >= 10 * 1024 * 1024) {
          errors.push(`${f.name}: file too large (max 10MB)`);
          continue;
        }
        if (
          f.type === "image/heic" ||
          f.type === "image/heif" ||
          f.name.toLowerCase().endsWith(".heic") ||
          f.name.toLowerCase().endsWith(".heif")
        ) {
          try {
            const heic2any = (await import("heic2any")).default;
            const blob = await heic2any({ blob: f, toType: "image/jpeg" });
            const jpegFile = new File(
              [blob as Blob],
              f.name.replace(/\.(heic|heif)$/i, ".jpg"),
              { type: "image/jpeg" },
            );
            converted.push(jpegFile);
          } catch {
            errors.push(
              `${f.name}: HEIC conversion failed — please convert to JPEG first`,
            );
          }
        } else if (f.type.startsWith("image/")) {
          converted.push(f);
        } else {
          errors.push(`${f.name}: unsupported format`);
        }
      }
      if (errors.length > 0) {
        toast(errors.join("\n"), "error");
      }
      setFiles((prev) => {
        const next = [...prev, ...converted].slice(0, 5);
        return next;
      });
    },
    [toast],
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
    if (files.length < 3)
      return {
        score: 30,
        label: "Good — add more for better results",
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
    const bitmap = await createImageBitmap(imageFiles[0]);
    const imgW = bitmap.width;
    const imgH = bitmap.height;
    const w = 200;
    const h = 200;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const imageData = ctx.getImageData(0, 0, w, h).data;

    const getDominant = (
      pixels: Uint8ClampedArray,
    ): [number, number, number] => {
      let tr = 0,
        tg = 0,
        tb = 0,
        count = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i],
          g = pixels[i + 1],
          b = pixels[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > 235 || brightness < 20) continue;
        tr += r;
        tg += g;
        tb += b;
        count++;
      }
      if (count === 0) return [128, 128, 128];
      return [
        Math.round(tr / count),
        Math.round(tg / count),
        Math.round(tb / count),
      ];
    };

    const sampleRegion = (x: number, y: number, rw: number, rh: number) => {
      const data: number[] = [];
      for (let row = y; row < y + rh && row < h; row++) {
        for (let col = x; col < x + rw && col < w; col++) {
          const idx = (row * w + col) * 4;
          data.push(
            imageData[idx],
            imageData[idx + 1],
            imageData[idx + 2],
            imageData[idx + 3],
          );
        }
      }
      return new Uint8ClampedArray(data);
    };

    // Framing: estimate from face-to-image ratio heuristic
    const ratio = imgW / imgH;
    if (ratio > 0.65) {
      setFraming("closeup");
    } else {
      setFraming("half-body");
    }

    // Hair color: sample from top-center region
    const hairPixels = sampleRegion(
      Math.round(w * 0.25),
      0,
      Math.round(w * 0.5),
      Math.round(h * 0.2),
    );
    const [hr, hg, hb] = getDominant(hairPixels);
    const hairBrightness = (hr + hg + hb) / 3;
    const hairSaturation = Math.max(hr, hg, hb) - Math.min(hr, hg, hb);
    let detectedHair = "";
    if (hairBrightness < 50) detectedHair = "Black";
    else if (hairBrightness < 100) detectedHair = "Brown";
    else if (hairSaturation > 60 && hr > 150 && hg < 130) detectedHair = "Red";
    else if (hairBrightness < 180) detectedHair = "Brown";
    else if (hairBrightness < 220) detectedHair = "Blonde";
    else detectedHair = "Gray";
    if (
      ["Black", "Brown", "Blonde", "Red", "Gray", "White"].includes(
        detectedHair,
      )
    ) {
      setHairColor(detectedHair);
    }

    // Eye color: sample from center region
    const eyePixels = sampleRegion(
      Math.round(w * 0.3),
      Math.round(h * 0.38),
      Math.round(w * 0.4),
      Math.round(h * 0.15),
    );
    const [er, eg, eb] = getDominant(eyePixels);
    const eyeBrightness = (er + eg + eb) / 3;
    const eyeSat = Math.max(er, eg, eb) - Math.min(er, eg, eb);
    let detectedEye = "";
    if (eyeBrightness < 40) detectedEye = "Black";
    else if (eb > 150 && er < 140 && eg < 150) detectedEye = "Blue";
    else if (eg > 130 && er < 140 && eb < 120) detectedEye = "Green";
    else if (eyeSat > 50 && er > 130 && eg < 140) detectedEye = "Amber";
    else if (eyeSat > 40 && er > 110 && er < 180) detectedEye = "Hazel";
    else if (eyeBrightness < 100) detectedEye = "Brown";
    else detectedEye = "Brown";
    if (
      ["Brown", "Black", "Blue", "Green", "Hazel", "Gray", "Amber"].includes(
        detectedEye,
      )
    ) {
      setEyeColor(detectedEye);
    }
  }, []);

  const handleNextStep = async () => {
    setError("");
    if (step === 1 && files.length < 1) {
      setError("Please upload at least 1 photo to proceed.");
      return;
    }
    if (step === 1) {
      await analyzePhotos(files);
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

    if (files.length === 0) {
      setError("Please upload at least one photo first.");
      setStep(1);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) authHeaders.Authorization = `Bearer ${token}`;

      setProgress("Optimizing image dataset…");
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      files.forEach((f, i) => {
        const ext = f.name.split(".").pop() ?? "jpg";
        zip.file(`photo_${i + 1}.${ext}`, f);
      });

      // Fetch upload URL in parallel with zipping
      const uploadUrlPromise = fetch("/api/upload", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          action: "get-upload-url",
          filename: `dataset_${Date.now()}.zip`,
        }),
      });

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "STORE",
      });

      setProgress("Securing upload channel...");
      const uploadUrlRes = await uploadUrlPromise;
      if (!uploadUrlRes.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, token: uploadToken, path } = await uploadUrlRes.json();

      setProgress("Transferring encrypted data…");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("x-upsert", "true");
        xhr.setRequestHeader("content-type", "application/zip");
        if (uploadToken)
          xhr.setRequestHeader("authorization", `Bearer ${uploadToken}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(
              `Uploading: ${Math.round((e.loaded / e.total) * 100)}%`,
            );
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

      setProgress("Generating checkout session…");

      const idempotencyKey = crypto.randomUUID();

      const checkoutPayload: Record<string, unknown> = {
        plan,
        email,
        storagePath: path,
        gender,
        eyeColor,
        hairColor,
        clothing,
        background,
        framing,
        selectedStyles,
        idempotencyKey,
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
        }),
      );
      window.location.href = url;
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message ?? "Something went wrong. Please try again.");
      setIsProcessing(false);
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

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-slate-900 dark:text-white">
                  Dataset Quality
                </span>
                <span className={`font-bold ${score.text}`}>{score.label}</span>
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
                        src={objectUrls[i] || URL.createObjectURL(f)}
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

            {files.length === 0 && (
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
                onClick={() => {
                  sessionStorage.removeItem(SESSION_KEY);
                  window.location.href = "/upload";
                }}
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
