const WHATSAPP_LINK = "https://wa.me/201151891310?text=Hello%20ATHR%2C%20I%20want%20a%20concept%20for%20my%20space.";

async function generatePreview() {
  const input = document.getElementById("imageInput");
  const before = document.getElementById("beforePreview");
  const after = document.getElementById("afterPreview");
  const status = document.getElementById("previewStatus");

  if (!input.files || !input.files[0]) {
    alert("Upload an image first.");
    return;
  }

  const file = input.files[0];
  const localUrl = URL.createObjectURL(file);
  before.innerHTML = `<img src="${localUrl}" alt="Uploaded space preview">`;
  after.innerHTML = "Preparing concept direction...";
  status.textContent = "Uploading your image securely...";

  const showGracefulFallback = () => {
    after.innerHTML = `
      <div class="preview-fallback">
        <p>Live preview is temporarily unavailable.</p>
        <p>Send your photo on WhatsApp and we’ll create a curated ATHR direction manually.</p>
      </div>
    `;
    status.innerHTML = `Live preview is temporarily unavailable. <a href="${WHATSAPP_LINK}" target="_blank" rel="noopener noreferrer">Continue on WhatsApp</a>.`;
  };

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "athr_unsigned");

    const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dv7yrzdff/image/upload", {
      method: "POST",
      body: formData,
    });

    const cloudData = await cloudRes.json();

    if (!cloudData.secure_url) {
      console.error(cloudData);
      showGracefulFallback();
      return;
    }

    status.textContent = "Generating ATHR concept direction...";

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: cloudData.secure_url }),
    });

    const data = await res.json();

    if (!res.ok || !data.image) {
      console.error(data);
      showGracefulFallback();
      return;
    }

    const src = data.image.startsWith("http") || data.image.startsWith("data:")
      ? data.image
      : `data:image/png;base64,${data.image}`;

    after.innerHTML = `<img src="${src}" alt="ATHR concept preview output">`;
    status.textContent = "Concept preview generated. Send your goals and dimensions on WhatsApp for next steps.";
  } catch (error) {
    console.error(error);
    showGracefulFallback();
  }
}

window.generatePreview = generatePreview;

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

function setupBeforeAfter(slider) {
  const handle = slider.querySelector(".ba-handle");
  if (!handle) return;

  const initial = Number(slider.dataset.initial || 52);
  let reveal = Number.isFinite(initial) ? Math.max(0, Math.min(100, initial)) : 52;
  let dragging = false;

  const setReveal = (value) => {
    reveal = Math.max(0, Math.min(100, value));
    slider.style.setProperty("--reveal", `${reveal}%`);
    handle.style.left = `${reveal}%`;
    handle.setAttribute("aria-valuenow", `${Math.round(reveal)}`);
  };

  const setFromClientX = (clientX) => {
    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setReveal((x / rect.width) * 100);
  };

  setReveal(reveal);

  slider.addEventListener("pointerdown", (event) => {
    dragging = true;
    slider.setPointerCapture(event.pointerId);
    setFromClientX(event.clientX);
  });

  slider.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    setFromClientX(event.clientX);
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    if (slider.hasPointerCapture(event.pointerId)) {
      slider.releasePointerCapture(event.pointerId);
    }
  };

  slider.addEventListener("pointerup", endDrag);
  slider.addEventListener("pointercancel", endDrag);
  slider.addEventListener("lostpointercapture", () => {
    dragging = false;
  });

  handle.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setReveal(reveal + (event.key === "ArrowRight" ? 2 : -2));
  });
}

document.querySelectorAll("[data-before-after]").forEach(setupBeforeAfter);

const heroShell = document.querySelector(".hero-shell");
if (heroShell && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  heroShell.addEventListener("mousemove", (event) => {
    const rect = heroShell.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 6;
    heroShell.style.transform = `perspective(1200px) rotateX(${-y * 0.25}deg) rotateY(${x * 0.25}deg)`;
  });

  heroShell.addEventListener("mouseleave", () => {
    heroShell.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
  });
}

function setupVideoPlaceholder(videoId, placeholderId) {
  const video = document.getElementById(videoId);
  const placeholder = document.getElementById(placeholderId);
  if (!video || !placeholder) return;

  const hidePlaceholder = () => {
    placeholder.style.display = "none";
  };

  const showPlaceholder = () => {
    placeholder.style.display = "grid";
  };

  video.addEventListener("loadeddata", hidePlaceholder);
  video.addEventListener("canplay", hidePlaceholder);
  video.addEventListener("error", showPlaceholder);

  if (!video.currentSrc) {
    showPlaceholder();
  }
}

setupVideoPlaceholder("heroReel", "heroPlaceholder");
setupVideoPlaceholder("futureReel", "reelPlaceholder");
