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

function UploadContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [files, setFiles] = useState<File[]>([]);

  // Customization Preferences
  const [gender, setGender] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [clothing, setClothing] = useState("");
  const [background, setBackground] = useState("");
  const [framing, setFraming] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    STYLE_CATEGORIES.map((c) => c.id),
  );

  // Checkout State
  const [plan, setPlan] = useState(searchParams.get("plan") ?? "pro");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  // Biometric consent intentionally starts unchecked for GDPR/CCPA compliance
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setEmail(session.user.email ?? "");
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

  const handleNextStep = () => {
    setError("");
    if (step === 1 && files.length < 1) {
      setError("Please upload at least 1 photo to proceed.");
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

    setIsProcessing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("You must be logged in to upload files.");

      setProgress("Optimizing image dataset…");
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      files.forEach((f, i) => {
        const ext = f.name.split(".").pop() ?? "jpg";
        zip.file(`photo_${i + 1}.${ext}`, f);
      });
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      setProgress("Securing upload channel...");
      const uploadUrlRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "get-upload-url",
          filename: `dataset_${Date.now()}.zip`,
        }),
      });
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
      const downloadUrlRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "get-download-url", path }),
      });
      if (!downloadUrlRes.ok)
        throw new Error("Failed to secure dataset download URL");
      const { zipUrl, storagePath } = await downloadUrlRes.json();

      const idempotencyKey = crypto.randomUUID();

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan,
          email,
          zipUrl,
          storagePath,
          userId,
          gender,
          eyeColor,
          hairColor,
          clothing,
          background,
          framing,
          selectedStyles,
          idempotencyKey,
        }),
      });
      if (!checkoutRes.ok) throw new Error("Checkout failed");
      const { url } = await checkoutRes.json();

      window.location.href = url;
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message ?? "Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Nav />

      <div className="max-w-3xl mx-auto px-6 pt-12">
        {/* Stepper Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10" />
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-slate-50 transition-colors ${step >= num ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}
              >
                {step > num ? <Check className="w-5 h-5" /> : num}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-500 mt-3 uppercase tracking-wider">
            <span className={step >= 1 ? "text-blue-600" : ""}>Upload</span>
            <span className={step >= 2 ? "text-blue-600" : ""}>Details</span>
            <span className={step >= 3 ? "text-blue-600" : ""}>Checkout</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Upload your selfies</h1>
              <p className="text-slate-500">
                Upload 1-5 clear photos of your face. The AI uses these to
                create your personalized headshots.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold">Dataset Quality</span>
                <span className={`font-bold ${score.text}`}>{score.label}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-8">
                <div
                  className={`h-full ${score.color} transition-all duration-500`}
                  style={{ width: `${score.score}%` }}
                />
              </div>

              <label
                htmlFor="file-input"
                className="block cursor-pointer border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
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
                <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {files.length === 0
                    ? "Click to browse or drag photos here"
                    : `Add more photos`}
                </h3>
                <p className="text-sm text-slate-500">
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
                    className="bg-white p-4 rounded-xl border border-slate-200 flex gap-3 shadow-sm"
                  >
                    <span className="text-2xl">{tip.icon}</span>
                    <div>
                      <div className="font-bold text-sm">{tip.text}</div>
                      <div className="text-xs text-slate-500">{tip.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNextStep}
                className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-sm"
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
              <h1 className="text-3xl font-bold mb-2">Details for the AI</h1>
              <p className="text-slate-500">
                These details help the AI create more realistic headshots.
              </p>
            </div>

            <div className="space-y-8 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Gender
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {["Male", "Female", "Non-Binary"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`py-3 rounded-xl border-2 font-semibold transition ${gender === g ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
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
                      className={`py-3 rounded-xl border-2 font-semibold transition ${eyeColor === c ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Hair Color
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {["Black", "Brown", "Blonde", "Red", "Gray", "White"].map(
                    (c) => (
                      <button
                        key={c}
                        onClick={() => setHairColor(c)}
                        className={`py-3 rounded-xl border-2 font-semibold transition ${hairColor === c ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                      >
                        {c}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
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
                      className={`py-3 px-4 rounded-xl border-2 text-left transition ${clothing === opt.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
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
                      className={`py-3 px-4 rounded-xl border-2 text-left transition ${background === opt.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
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
                      className={`py-3 px-4 rounded-xl border-2 text-left transition ${framing === opt.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
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
                    className="text-sm font-bold text-blue-600 hover:text-blue-700"
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
                            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                            : "border-slate-200 bg-white hover:border-slate-300"
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
                        <h4 className="font-bold text-sm text-slate-900">
                          {style.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {style.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {selectedStyles.length === 0 && (
                  <p className="text-sm text-amber-600 mt-3">
                    Select at least one style to continue.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-slate-500 font-bold flex items-center gap-2 hover:text-slate-800"
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
                className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h1 className="text-3xl font-bold mb-2">
                Final Step: Choose Plan
              </h1>
              <p className="text-slate-500">
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
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all relative ${plan === p.id ? "border-blue-600 bg-white shadow-md ring-4 ring-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    {p.popular && (
                      <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wider uppercase">
                        Most Popular
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-lg text-slate-900">
                        {p.name}
                      </span>
                      <span className="text-2xl font-black text-blue-600">
                        ${p.price}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />{" "}
                      {p.shots} photos • {p.turnaround} delivery
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Secure Checkout
                </h3>

                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Delivery Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
                  />
                </div>

                <div className="flex items-start gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 cursor-pointer"
                  />
                  <label
                    htmlFor="consent"
                    className="text-xs text-slate-500 leading-relaxed cursor-pointer select-none"
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
                  <div className="bg-blue-50 text-blue-800 rounded-xl p-4 text-center border border-blue-100">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
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

                <div className="mt-6 flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" /> 256-bit TLS
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" /> Money-back guarantee
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => setStep(2)}
                className="text-slate-500 font-bold flex items-center gap-2 hover:text-slate-800"
              >
                <ChevronLeft className="w-5 h-5" /> Back to Details
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
