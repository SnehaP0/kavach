async function log(e) {
  e.preventDefault();
  const username = document.getElementById("mail").value;
  const password = document.getElementById("pass").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Failed to log in");
    }
    window.location.href = "/dashboard";
  } catch (error) {
    console.log("Error:", error);
    alert(error.message);
  }
}

const btn = document.getElementById("submit-btn"); // match your HTML id
if (btn) btn.addEventListener("click", log);