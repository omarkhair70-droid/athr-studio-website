async function generatePreview() {
  const input = document.getElementById("imageInput");
  const before = document.getElementById("beforePreview");
  const after = document.getElementById("afterPreview");
  const status = document.getElementById("previewStatus");

  if (!input || !before || !after || !status || !input.files || !input.files[0]) {
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
      <div class="fallback-copy">
        <p>Live preview is temporarily unavailable.</p>
        <p>Send your photo on WhatsApp and we’ll create a curated ATHR direction manually.</p>
      </div>
    `;
    status.textContent = "Live preview is temporarily unavailable. Continue via WhatsApp for curated concept delivery.";
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

    after.innerHTML = `<img src="${data.image}" alt="ATHR concept preview output">`;
    status.textContent = "Concept preview generated. Share your goals on WhatsApp for next-step development.";
  } catch (error) {
    console.error(error);
    showGracefulFallback();
  }
}

window.generatePreview = generatePreview;


function markMediaReady(node) {
  if (!node) return;
  node.classList.add("media-loaded");
}

document.querySelectorAll("img").forEach((img, index) => {
  img.loading = index < 2 ? "eager" : "lazy";
  img.decoding = "async";
  if (img.complete) markMediaReady(img);
  img.addEventListener("load", () => markMediaReady(img));
  img.addEventListener("error", () => {
    const mediaCard = img.closest("figure");
    if (mediaCard) mediaCard.classList.add("is-hidden");
  });
});

document.querySelectorAll("video").forEach((video) => {
  video.preload = video.id === "heroReel" ? "metadata" : video.preload;
  video.addEventListener("loadeddata", () => markMediaReady(video));
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

const storyStage = document.getElementById("storyStage");
if (storyStage) {
  const lineOne = storyStage.querySelector(".line-1");
  const lineTwo = storyStage.querySelector(".line-2");

  const updateStoryProgress = () => {
    const rect = storyStage.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const start = viewportHeight * 0.9;
    const end = viewportHeight * 0.2;
    const progress = (start - rect.top) / (start - end);
    const bounded = Math.max(0, Math.min(1, progress));

    storyStage.style.setProperty("--story-progress", bounded.toFixed(3));

    if (lineOne) lineOne.classList.toggle("visible", bounded > 0.22);
    if (lineTwo) lineTwo.classList.toggle("visible", bounded > 0.62);
  };

  updateStoryProgress();
  window.addEventListener("scroll", updateStoryProgress, { passive: true });
  window.addEventListener("resize", updateStoryProgress);
}

function setupBeforeAfter(slider) {
  const handle = slider.querySelector(".ba-handle");
  const beforeImage = slider.querySelector(".ba-image.before");
  const afterImage = slider.querySelector(".ba-image.after");
  if (!handle || !beforeImage || !afterImage) return;

  const initial = Number(slider.dataset.initial || 52);
  const beforePosition = slider.dataset.beforePosition || "50% 50%";
  const afterPosition = slider.dataset.afterPosition || "50% 50%";

  beforeImage.style.objectPosition = beforePosition;
  afterImage.style.objectPosition = afterPosition;

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
    if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
  };

  slider.addEventListener("pointerup", endDrag);
  slider.addEventListener("pointercancel", endDrag);
  slider.addEventListener("lostpointercapture", () => { dragging = false; });

  handle.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setReveal(reveal + (event.key === "ArrowRight" ? 2 : -2));
  });
}

document.querySelectorAll("[data-before-after]").forEach(setupBeforeAfter);

function setupReel(videoId, placeholderId) {
  const video = document.getElementById(videoId);
  const placeholder = placeholderId ? document.getElementById(placeholderId) : null;
  if (!video) return;

  const revealVideo = () => {
    video.style.display = "block";
    markMediaReady(video);
    if (placeholder) placeholder.style.display = "none";
    video.play().catch(() => {});
  };

  const showFallback = () => {
    const wrap = video.closest(".reel-video-wrap");
    if (wrap) {
      wrap.classList.add("is-hidden");
      return;
    }

    video.classList.add("is-hidden");
    if (placeholder) placeholder.classList.add("is-hidden");
  };

  if (video.readyState >= 2) {
    revealVideo();
  } else {
    video.addEventListener("loadeddata", revealVideo, { once: true });
    video.addEventListener("error", showFallback, { once: true });
  }
}

setupReel("futureReel");

function cleanupConceptSection() {
  const concepts = document.querySelector("#direction-concepts .reel-images-grid");
  if (!concepts) return;

  const visibleCards = [...concepts.children].filter((el) => !el.classList.contains("is-hidden"));
  if (visibleCards.length === 0) {
    const section = document.getElementById("direction-concepts");
    if (section) section.classList.add("is-hidden");
  }
}

window.setTimeout(cleanupConceptSection, 600);

if (window.matchMedia("(min-width: 1025px)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const cursorLight = document.createElement("div");
  cursorLight.className = "cursor-light";
  document.body.appendChild(cursorLight);

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  const animateLight = () => {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    cursorLight.style.left = `${currentX}px`;
    cursorLight.style.top = `${currentY}px`;
    requestAnimationFrame(animateLight);
  };

  document.body.classList.add("cursor-active");
  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });
  animateLight();
}


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
