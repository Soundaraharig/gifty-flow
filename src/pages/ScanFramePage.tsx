import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, AlertCircle, Sparkles, Image, Camera } from "lucide-react";

const ScanFramePage = () => {
  const navigate = useNavigate();
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [activeTargetIndex, setActiveTargetIndex] = useState<number | null>(null);
  const [detectedFrame, setDetectedFrame] = useState<any | null>(null);

  // Inject custom CSS to isolate A-Frame / MindAR and prevent Vite root container offsets or transition delays
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.id = "ar-multi-scanner-styles";
    styleEl.innerHTML = `
      #root {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      body, html {
        overflow: hidden !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: #000000 !important;
      }
      /* Prevent CSS transition properties from lagging MindAR position updates */
      * {
        transition: none !important;
      }
      /* Suppress only for A-Frame canvas updates, but let our scanner guide fade nicely */
      .ar-guide-fade, .ar-guide-fade * {
        transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out !important;
      }
      /* Force MindAR webcam video tag to be absolutely fullscreen and aligned */
      video {
        max-width: none !important;
        max-height: none !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        z-index: -100 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      /* Force A-Frame canvas to be perfectly aligned */
      .a-canvas {
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      @keyframes ar-scan-line {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(280px);
        }
      }
      .ar-scanner-line {
        animation: ar-scan-line 3s ease-in-out infinite !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      styleEl.remove();
    };
  }, []);

  // 1. Sequentially load script tags to ensure A-Frame loads before MindAR
  useEffect(() => {
    const loadScript = (url: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
          resolve(true); // Skip reloading if it already exists in the document
          return;
        }
        const script = document.createElement("script");
        script.src = url;
        script.async = false; // Preserve execution ordering
        script.onload = () => resolve(true);
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    Promise.all([
      loadScript("https://aframe.io/releases/1.5.0/aframe.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js")
    ])
      .then(() => {
        setScriptsLoaded(true);
        console.log("A-Frame and MindAR external scripts loaded successfully.");
      })
      .catch((err) => console.error("Error loading AR dependencies:", err));

    return () => {
      console.log("Unmounting Multi-Target Scanner: Executing deep cleanup controls...");

      // Stop tracking engine systems
      const sceneEl = document.querySelector('a-scene') as any;
      if (sceneEl && sceneEl.systems && sceneEl.systems['mindar-image-system']) {
        try {
          sceneEl.systems['mindar-image-system'].stop();
        } catch (err) {
          console.warn("Could not stop MindAR system tracks:", err);
        }
      }

      // Explicitly pause and clear all running video elements to halt sound tracks
      const allVideos = document.querySelectorAll("video");
      allVideos.forEach((v) => {
        try {
          v.pause();
          v.src = "";
          v.load();
        } catch (e) {
          console.warn("Failed to stop video resource track:", e);
        }

        // Shut off active web-camera tracks (turns off phone webcam indicator)
        if (v.srcObject) {
          const stream = v.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            console.log(`Stopping webcam hardware track: ${track.label}`);
            track.stop();
          });
        }
      });

      // Erase injected MindAR/A-Frame elements and overlays from the body context
      const mindarUI = document.querySelectorAll(".mindar-ui-overlay");
      mindarUI.forEach((el) => el.remove());

      const aframeElements = document.querySelectorAll(".a-canvas, .a-loader-title, .a-enter-vr");
      aframeElements.forEach((el) => el.remove());

      // Reset inline and class layouts modified by A-Frame/MindAR to restore normal scrolling and layout
      const cleanAllLayouts = () => {
        console.log("Restoring document scroll layout parameters...");
        
        // Remove properties from body
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("height");
        document.body.style.removeProperty("width");
        document.body.style.removeProperty("margin");
        document.body.style.removeProperty("padding");
        document.body.classList.remove("a-body");
        
        // Remove properties from html documentElement
        document.documentElement.style.removeProperty("overflow");
        document.documentElement.style.removeProperty("height");
        document.documentElement.style.removeProperty("width");
        document.documentElement.style.removeProperty("margin");
        document.documentElement.style.removeProperty("padding");
        document.documentElement.classList.remove("a-html");

        // Force browser layout reflow with scroll enabled
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
      };

      // Call immediately on unmount
      cleanAllLayouts();

      // Trigger delayed cleanup steps to catch asynchronous A-Frame thread style re-injections
      setTimeout(cleanAllLayouts, 100);
      setTimeout(cleanAllLayouts, 300);
      setTimeout(cleanAllLayouts, 800);
      setTimeout(cleanAllLayouts, 1500);
    };
  }, []);

  // 2. Fetch all active video frame targets from the database
  const { data: frames = [], isLoading, error: dbError } = useQuery({
    queryKey: ["active_video_frames"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_frames" as any)
        .select("*")
        .order("created_at", { ascending: true }); // Chronological!

      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // 3. Register targetFound and targetLost events independently for each frame asset
  useEffect(() => {
    if (!scriptsLoaded || !frames || frames.length === 0) return;

    console.log(`Initializing event tracking for ${frames.length} active frame items...`);
    const cleanups: (() => void)[] = [];

    frames.forEach((frame, index) => {
      const anchor = document.getElementById(`targetAnchor-${index}`);

      if (anchor) {
        const handleFound = () => {
          console.log(`[Multi-Scanner] Target detected: "${frame.frame_name}" (Index: ${index}). Open popup player.`);
          setActiveTargetIndex(index);
          setDetectedFrame(frame);
        };

        const handleLost = () => {
          console.log(`[Multi-Scanner] Target lost: "${frame.frame_name}" (Index: ${index}).`);
          setActiveTargetIndex((prev) => (prev === index ? null : prev));
        };

        anchor.addEventListener("targetFound", handleFound);
        anchor.addEventListener("targetLost", handleLost);

        cleanups.push(() => {
          anchor.removeEventListener("targetFound", handleFound);
          anchor.removeEventListener("targetLost", handleLost);
        });
      }
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [scriptsLoaded, frames]);

  const totalError = dbError instanceof Error ? dbError.message : dbError ? String(dbError) : null;

  // Intercept immediately if the query has finished and no active target frames are found
  if (!isLoading && frames.length === 0) {
    return (
      <div className="w-screen h-screen absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-bounce">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No active target frames found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Please add a frame asset from the dashboard management tab before launching the scanner.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-full border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-transform active:scale-95 flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render Loader screen until dependencies and data are completely loaded
  if (!scriptsLoaded || isLoading) {
    return (
      <div className="w-screen h-screen absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-white p-6">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-[100] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Exit Scanner
        </button>
        <Loader2 className="animate-spin h-10 w-10 text-primary mb-4" />
        <p className="text-sm font-medium tracking-wide">Booting AR Lens...</p>
        <p className="text-xs text-muted-foreground mt-2">Sequential multi-target scripts loading.</p>
      </div>
    );
  }

  // Render Database Query Error fallback UI
  if (totalError) {
    return (
      <div className="w-screen h-screen absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">Scanner Initialization Failed</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{totalError}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm transition-transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }
  // Grab the compiled multi-target mind collection URL from the first active database record (parsing our combined format)
  const rawTargetUrl = frames[0]?.target_mind_url;
  const multiTargetSrc = rawTargetUrl ? (rawTargetUrl.includes("|") ? rawTargetUrl.split("|")[0] : rawTargetUrl) : "";

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] bg-black overflow-visible">
      {/* Upper Control Bar (Exit navigation) */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-[10000] p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-2 text-sm font-semibold"
        title="Exit Scanner"
      >
        <ArrowLeft size={18} /> Exit
      </button>

      {/* Floating Status Display */}
      <div className="absolute top-4 right-4 z-[10000] bg-black/60 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-[11px] text-white/90 font-mono tracking-wide uppercase font-semibold">
          Multi-Target Active ({frames.length} Frame{frames.length > 1 ? "s" : ""})
        </span>
      </div>

      {/* Dynamic glassmorphic scanning box guide overlay - hidden when target is active */}
      <div className={`ar-guide-fade absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-[9000] ${
        activeTargetIndex !== null ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}>
        <div className="relative w-64 h-[280px] flex items-center justify-center">
          {/* Glassmorphic Box container */}
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px] border border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-2xl">
            <Camera className="w-8 h-8 text-primary mb-3 animate-pulse" />
            <p className="text-white font-semibold text-sm tracking-wide font-sans">Align Photo Frame</p>
            <p className="text-white/40 text-[10px] mt-2 leading-relaxed max-w-[180px] font-sans">
              Point your camera at the physical photo target frame to unlock your gift video
            </p>
          </div>

          {/* Bracket Corners */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-xl"></div>

          {/* Glowing Animated Scanning Line */}
          <div className="ar-scanner-line absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_rgba(235,116,98,0.6)]"></div>
        </div>
        <p className="text-white/60 font-body text-xs font-semibold tracking-wider mt-6 animate-pulse uppercase">
          LENS ACTIVE • SEARCHING TARGETS
        </p>
      </div>

      {/* Multi-Target MindAR Engine Canvas */}
      <a-scene
        mindar-image={`imageTargetSrc: ${multiTargetSrc}; autoStart: true;`}
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
      >
        <a-camera position="0 0 0" look-controls="enabled: false" />

        {/* Sequential mapping of targets (we keep these empty because we project in React pop-up!) */}
        {frames.map((frame, index) => (
          <a-entity
            key={frame.id}
            mindar-image-target={`targetIndex: ${index}`}
            id={`targetAnchor-${index}`}
          />
        ))}
      </a-scene>

      {/* Fullscreen Video Player Pop-up in exact natural uploaded ratio with active camera background */}
      {detectedFrame && (
        <div className="fixed inset-0 z-[100000] bg-black/10 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-black/85 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-4 flex flex-col items-center">
            {/* Header Bar */}
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <h4 className="text-white font-display text-sm font-bold truncate max-w-[150px]">
                  {detectedFrame.frame_name}
                </h4>
              </div>
              <button
                onClick={() => setDetectedFrame(null)}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all font-semibold text-xs flex items-center gap-1 active:scale-95 shadow-md"
              >
                ✕ Close Player
              </button>
            </div>

            {/* Video Container (block layout, immune to mobile height collapse) */}
            <div className="w-full border border-white/10 rounded-xl overflow-hidden bg-black/60 shadow-inner">
              <video
                src={detectedFrame.video_url}
                autoPlay
                controls
                playsInline
                preload="auto"
                className="w-full h-auto block max-h-[50vh] rounded-xl"
                style={{ display: "block" }}
              />
            </div>

            {/* Glowing bottom tag */}
            <p className="text-white/40 text-[9px] font-sans mt-3 uppercase tracking-widest animate-pulse">
              Zero Gifts • Premium AR Experience
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanFramePage;
