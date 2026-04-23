async function generatePreview() {
  const input = document.getElementById("imageInput");
  const before = document.getElementById("beforePreview");
  const after = document.getElementById("afterPreview");

  if (!input.files || !input.files[0]) {
    alert("Upload an image first.");
    return;
  }

  const file = input.files[0];
  const localUrl = URL.createObjectURL(file);

  before.innerHTML = `<img src="${localUrl}" alt="Uploaded preview">`;
  after.innerHTML = "Uploading...";

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
      return;
    }

    const imageUrl = cloudData.secure_url;
    after.innerHTML = "Generating ATHR preview...";

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    });

    const data = await res.json();

    if (!res.ok || !data.image) {
      console.error(data);
      after.innerHTML = "Generation failed.";
      return;
    }

    after.innerHTML = `<img src="${data.image}" alt="ATHR generated preview">`;
  } catch (err) {
    console.error(err);
    after.innerHTML = "Something went wrong.";
  }
}

window.generatePreview = generatePreview;

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

const heroShell = document.querySelector(".hero-shell");
if (heroShell && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  heroShell.addEventListener("mousemove", (event) => {
    const rect = heroShell.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    heroShell.style.transform = `perspective(1400px) rotateX(${-y * 0.3}deg) rotateY(${x * 0.3}deg)`;
  });

  heroShell.addEventListener("mouseleave", () => {
    heroShell.style.transform = "perspective(1400px) rotateX(0deg) rotateY(0deg)";
  });
}
