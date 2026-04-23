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
  after.innerHTML = "Preparing concept...";
  status.textContent = "Uploading your space...";

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
      after.innerHTML = "Upload failed.";
      status.textContent = "Upload failed. Try another image.";
      return;
    }

    status.textContent = "Generating ATHR concept direction...";

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: cloudData.secure_url }),
    });

    const data = await res.json();

    if (!res.ok || !data.image) {
      console.error(data);
      after.innerHTML = "Generation failed.";
      status.textContent = "Generation failed. Please retry.";
      return;
    }

    after.innerHTML = `<img src="${data.image}" alt="ATHR concept preview">`;
    status.textContent = "Concept ready. Share your goals on WhatsApp to continue.";
  } catch (err) {
    console.error(err);
    after.innerHTML = "Something went wrong.";
    status.textContent = "A network issue occurred. Please retry.";
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
  const afterWrap = slider.querySelector(".ba-after-wrap");
  const handle = slider.querySelector(".ba-handle");
  if (!afterWrap || !handle) return;

  let dragging = false;

  const setPosition = (clientX) => {
    const rect = slider.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const percentage = (x / rect.width) * 100;
    afterWrap.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
    handle.setAttribute("aria-valuenow", `${Math.round(percentage)}`);
  };

  const onPointerMove = (event) => {
    if (!dragging) return;
    setPosition(event.clientX);
  };

  slider.addEventListener("pointerdown", (event) => {
    dragging = true;
    slider.setPointerCapture(event.pointerId);
    setPosition(event.clientX);
  });

  slider.addEventListener("pointermove", onPointerMove);

  slider.addEventListener("pointerup", (event) => {
    dragging = false;
    slider.releasePointerCapture(event.pointerId);
  });

  slider.addEventListener("keydown", (event) => {
    const current = Number(handle.getAttribute("aria-valuenow"));
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = event.key === "ArrowRight" ? current + 2 : current - 2;
    const bounded = Math.max(0, Math.min(100, next));
    afterWrap.style.width = `${bounded}%`;
    handle.style.left = `${bounded}%`;
    handle.setAttribute("aria-valuenow", `${Math.round(bounded)}`);
  });
}

document.querySelectorAll("[data-before-after]").forEach(setupBeforeAfter);

const heroShell = document.querySelector(".hero-shell");
if (heroShell && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  heroShell.addEventListener("mousemove", (event) => {
    const rect = heroShell.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
    heroShell.style.transform = `perspective(1200px) rotateX(${-y * 0.35}deg) rotateY(${x * 0.35}deg)`;
  });

  heroShell.addEventListener("mouseleave", () => {
    heroShell.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
  });
}
