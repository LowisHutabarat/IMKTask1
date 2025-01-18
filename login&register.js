// Pengguna valid tetap (bisa diubah di sini)
const validUsers = [
  { username: "admin", password: "12345" }, // Admin default
  { username: "user", password: "userpass" }, // Pengguna default
];

// Fungsi untuk login
function handleLogin() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const user = validUsers.find(
    (u) => u.username === username && u.password === password
  );
  const errorMessage = document.getElementById("loginErrorMessage");

  if (user) {
    alert(`Halo ${user.username}!`);
    // Redirect ke halaman lain, misalnya:
    window.location.href = "dashboard.html";
  } else {
    errorMessage.style.display = "block";
  }
}

// Fungsi untuk register
function handleRegister() {
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;
  const registerMessage = document.getElementById("registerMessage");

  if (validUsers.find((u) => u.username === username)) {
    alert("Username sudah digunakan.");
    window.location.href = "index.html";
  } else {
    // Tambahkan pengguna baru ke daftar validUsers
    validUsers.push({ username, password });
    registerMessage.style.display = "block";

    // Reset form dan kembali ke login setelah beberapa detik
    setTimeout(() => {
      registerMessage.style.display = "none";
      switchToLogin();
    }, 2000);
  }
}

// Fungsi untuk beralih ke form register
function switchToRegister() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
}

// Fungsi untuk beralih ke form login
function switchToLogin() {
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
}
