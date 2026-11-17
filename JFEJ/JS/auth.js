// ==========================================
// JFEJ School - Gestion de l'Authentification (Auth)
// Démonstration pédagogique avec localStorage
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggles();

  const loginForm = document.getElementById("login-form");
  const setupRequested = new URLSearchParams(window.location.search).has("initialiser-admin");
  if (loginForm && setupRequested) {
    try {
      const users = readLocalUsers();
      const adminExists = users.some((user) => user.role === "administrator");
      if (adminExists) {
        showAlert(document.getElementById("auth-alert"), "Un administrateur existe déjà sur ce navigateur.", "error");
        loginForm.addEventListener("submit", handleLogin);
        window.history.replaceState(null, "", window.location.pathname);
      } else {
        const identifierInput = document.getElementById("identifier");
        const passwordInput = document.getElementById("password");
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const identifierLabel = document.querySelector('label[for="identifier"]');
        const passwordLabel = document.querySelector('label[for="password"]');
        if (identifierInput) {
          identifierInput.type = "email";
          identifierInput.placeholder = "administrateur@lycee.fr";
          identifierInput.autocomplete = "email";
        }
        if (identifierLabel) identifierLabel.textContent = "E-mail administrateur";
        if (passwordLabel) passwordLabel.textContent = "Mot de passe administrateur (12 caractères minimum)";
        if (passwordInput) {
          passwordInput.minLength = 12;
          passwordInput.autocomplete = "new-password";
        }
        if (submitButton) submitButton.textContent = "Initialiser et se connecter";
        document.querySelector(".auth-footer")?.setAttribute("hidden", "");
        document.querySelector(".actions .btn-cta")?.setAttribute("hidden", "");
        loginForm.addEventListener("submit", handleAdminSetup);
      }
    } catch (error) {
      showAlert(document.getElementById("auth-alert"), error.message, "error");
      loginForm.addEventListener("submit", handleLogin);
    }
  } else if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    document.querySelectorAll("#registration-student-details input, #registration-student-details select")
      .forEach((field) => { field.disabled = true; });
    registerForm.addEventListener("submit", handleRegister);
  }

  updateNavbarAuthStatus();
});

function readLocalUsers() {
  let users;
  try {
    users = JSON.parse(localStorage.getItem("jfej_users") || "[]");
  } catch {
    throw new Error("Les données des comptes sont illisibles.");
  }
  if (!Array.isArray(users)) throw new Error("Les comptes enregistrés sont illisibles.");
  return users;
}

function readAllowedTeacherEmails() {
  let emails;
  try {
    emails = JSON.parse(localStorage.getItem("jfej_allowed_teacher_emails") || "[]");
  } catch {
    throw new Error("La liste des e-mails autorisés est illisible.");
  }
  if (!Array.isArray(emails)) throw new Error("La liste des e-mails autorisés est illisible.");
  return emails.map((email) => String(email).trim().toLowerCase());
}

function handleAdminSetup(e) {
  e.preventDefault();
  const alertBox = document.getElementById("auth-alert");
  const form = document.getElementById("login-form");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const email = document.getElementById("identifier").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  try {
    const users = readLocalUsers();
    if (users.some((user) => user.role === "administrator")) {
      showAlert(alertBox, "Un administrateur existe déjà sur ce navigateur.", "error");
      return;
    }
    if (users.some((user) => user.email?.trim().toLowerCase() === email)) {
      showAlert(alertBox, "Cette adresse e-mail est déjà utilisée.", "error");
      return;
    }

    const administrator = {
      role: "administrator",
      email,
      password,
      prenom: "Administrateur",
      nom: "",
      classe: "Administration",
      specialite: [],
      bio: ""
    };
    users.push(administrator);
    localStorage.setItem("jfej_users", JSON.stringify(users));
    if (localStorage.getItem("jfej_allowed_teacher_emails") === null) {
      localStorage.setItem("jfej_allowed_teacher_emails", "[]");
    }
    sessionStorage.setItem("jfej_current_user", JSON.stringify(administrator));
    window.location.href = "../../../The_Site/HTML/Plus.html";
  } catch (error) {
    showAlert(alertBox, error instanceof Error ? error.message : "Impossible d’initialiser l’administrateur.", "error");
  }
}

// Bouton œil pour voir/masquer le mot de passe
function initPasswordToggles() {
  document.querySelectorAll(".toggle-pwd-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
        btn.setAttribute("aria-label", "Masquer le mot de passe");
      } else {
        input.type = "password";
        btn.textContent = "👁️";
        btn.setAttribute("aria-label", "Afficher le mot de passe");
      }
    });
  });
}

// Traitement de la connexion
function handleLogin(e) {
  e.preventDefault();
  const alertBox = document.getElementById("auth-alert");
  const identifierInput = document.getElementById("identifier");
  const passwordInput = document.getElementById("password");

  const identifier = identifierInput.value.trim();
  const password = passwordInput.value;
  let users;
  try {
    users = readLocalUsers();
  } catch (error) {
    showAlert(alertBox, error instanceof Error ? error.message : "Impossible de lire les comptes.", "error");
    return;
  }
  const isEmail = identifier.includes("@");
  const normalizedIdentifier = identifier.toLocaleLowerCase("fr");
  const foundUser = users.find((user) => {
    if (user.password !== password) return false;
    return isEmail
      ? ["teacher", "administrator"].includes(user.role) && user.email?.toLocaleLowerCase("fr") === normalizedIdentifier
      : user.role === "student" && user.username?.toLocaleLowerCase("fr") === normalizedIdentifier;
  });

  if (foundUser) {
    if (foundUser.role === "teacher") {
      try {
        if (!readAllowedTeacherEmails().includes(normalizedIdentifier)) {
          showAlert(alertBox, "Cette adresse e-mail n’a pas été autorisée par l’administrateur.", "error");
          return;
        }
      } catch (error) {
        showAlert(alertBox, error instanceof Error ? error.message : "Impossible de vérifier l’autorisation.", "error");
        return;
      }
    }
    const displayName = foundUser.role === "student"
      ? foundUser.username
      : foundUser.role === "administrator" ? "l’administrateur" : foundUser.prenom;
    showAlert(alertBox, `Ravi de vous revoir, ${displayName} ! Redirection vers The Site...`, "success");
    sessionStorage.setItem("jfej_current_user", JSON.stringify(foundUser));

    setTimeout(() => {
      window.location.href = foundUser.role === "administrator"
        ? "../../../The_Site/HTML/Plus.html"
        : "../../../The_Site/HTML/Mon%20compte.html";
    }, 1000);
  } else {
    showAlert(alertBox, "E-mail/nom d’utilisateur ou mot de passe incorrect.", "error");
  }
}

function handleRegister(e) {
  e.preventDefault();
  const alertBox = document.getElementById("auth-alert");
  const registerForm = document.getElementById("register-form");
  if (!registerForm.checkValidity()) {
    registerForm.reportValidity();
    return;
  }

  const prenom = document.getElementById("prenom").value.trim();
  const nom = document.getElementById("nom").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const specialite = document.getElementById("teacher-specialty").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const terms = document.getElementById("terms");

  if (terms && !terms.checked) {
    showAlert(alertBox, "Veuillez accepter la charte d'utilisation.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showAlert(alertBox, "Les deux mots de passe ne correspondent pas.", "error");
    return;
  }

  if (password.length < 8) {
    showAlert(alertBox, "Le mot de passe doit comporter au moins 8 caractères.", "error");
    return;
  }

  let users;
  try {
    users = readLocalUsers();
  } catch (error) {
    showAlert(alertBox, error instanceof Error ? error.message : "Impossible de lire les comptes.", "error");
    return;
  }

  if (specialite === "Admin") {
    const administrator = users.find((user) => user.role === "administrator"
      && user.email?.trim().toLowerCase() === email
      && user.password === password);
    if (!administrator) {
      showAlert(alertBox, "Connexion administrateur impossible : vérifiez les identifiants du compte administrateur déjà créé.", "error");
      return;
    }

    sessionStorage.setItem("jfej_current_user", JSON.stringify(administrator));
    showAlert(alertBox, "Connexion administrateur réussie. Redirection vers l’administration...", "success");
    setTimeout(() => {
      window.location.href = "../../../The_Site/HTML/Plus.html";
    }, 1000);
    return;
  }

  let allowedTeacherEmails;
  try {
    allowedTeacherEmails = readAllowedTeacherEmails();
  } catch (error) {
    showAlert(alertBox, error instanceof Error ? error.message : "Impossible de lire les autorisations professeur.", "error");
    return;
  }
  if (!allowedTeacherEmails.includes(email)) {
    showAlert(alertBox, "Cette adresse e-mail n’a pas été autorisée par l’administrateur.", "error");
    return;
  }
  const existingUser = users.find((user) => user.email?.toLowerCase() === email);

  if (existingUser) {
    showAlert(alertBox, "Cette adresse e-mail possède déjà un compte.", "error");
    return;
  }

  const newUser = {
    role: "teacher",
    prenom,
    nom,
    email,
    password,
    classe: "Professeur",
    specialite: [specialite],
    bio: ""
  };
  users.push(newUser);
  localStorage.setItem("jfej_users", JSON.stringify(users));
  sessionStorage.setItem("jfej_current_user", JSON.stringify(newUser));

  showAlert(alertBox, `Compte professeur créé avec succès ! Bienvenue ${newUser.prenom}. Redirection vers The Site...`, "success");

  setTimeout(() => {
    window.location.href = "../../../The_Site/HTML/Mon%20compte.html";
  }, 1200);
}

// Affichage des notifications
function showAlert(alertBox, message, type) {
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.className = `auth-alert ${type}`;
}

// Mise à jour de l'état de connexion dans la topbar
function updateNavbarAuthStatus() {
  const currentUserRaw = sessionStorage.getItem("jfej_current_user");
  const ctaBtn = document.querySelector(".btn-cta");
  if (!ctaBtn) return;

  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const jfejDirectoryIndex = pathSegments.findIndex((segment) => segment.toLowerCase() === "jfej");
  const projectPrefix = jfejDirectoryIndex < 0
    ? ""
    : "../".repeat(pathSegments.length - jfejDirectoryIndex - 1);
  const profilPath = `${projectPrefix}JFEJ/HTML/profil.html`;

  if (currentUserRaw) {
    const user = JSON.parse(currentUserRaw);
    const displayName = user.role === "student"
      ? user.username
      : user.role === "administrator" ? "Administrateur" : user.prenom;
    if (window.location.pathname.includes("profil.html")) {
      ctaBtn.textContent = "Déconnexion";
      ctaBtn.href = "#logout";
      ctaBtn.addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.removeItem("jfej_current_user");
        window.location.href = "index.html";
      });
    } else {
      ctaBtn.textContent = user.role === "administrator" ? "Administration" : `Mon Profil (${displayName})`;
      ctaBtn.href = user.role === "administrator"
        ? `${projectPrefix}The_Site/HTML/Plus.html`
        : profilPath;
    }
  }
}
