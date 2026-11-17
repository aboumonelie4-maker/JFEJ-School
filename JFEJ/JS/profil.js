// ==========================================
// JFEJ School - Script de la page de Profil
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  const loggedView = document.getElementById("profile-logged-view");
  const guestView = document.getElementById("profile-guest-view");
  const currentUserRaw = sessionStorage.getItem("jfej_current_user");

  if (!currentUserRaw) {
    const loginRequiredUrl = document.body.dataset.loginRequiredUrl;
    if (loginRequiredUrl) {
      window.location.replace(loginRequiredUrl);
      return;
    }

    // Si aucun utilisateur n'est connecté : afficher l'écran invité
    if (loggedView) loggedView.style.display = "none";
    if (guestView) guestView.style.display = "block";
    return;
  }

  // Utilisateur connecté
  if (loggedView) loggedView.style.display = "flex";
  if (guestView) guestView.style.display = "none";

  const user = JSON.parse(currentUserRaw);
  renderUserProfile(user);
  initializeSpecialtySelection(user);

  // Gestion du formulaire d'édition
  const editForm = document.getElementById("profile-edit-form");
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveProfileChanges(user);
    });
  }
  const confirmSpecialtiesButton = document.getElementById("btn-confirm-specialites");
  if (confirmSpecialtiesButton) {
    confirmSpecialtiesButton.addEventListener("click", () => confirmSpecialties(user));
  }

  const avatarColorInput = document.getElementById("edit-avatar-color");
  if (avatarColorInput) {
    avatarColorInput.addEventListener("input", () => applyProfileColor(avatarColorInput.value));
  }

  // Boutons de déconnexion rapide
  const quickLogoutBtn = document.getElementById("btn-quick-logout");
  if (quickLogoutBtn) {
    quickLogoutBtn.addEventListener("click", performLogout);
  }

  const navAuthBtn = document.getElementById("nav-auth-btn");
  if (navAuthBtn) {
    navAuthBtn.addEventListener("click", (e) => {
      e.preventDefault();
      performLogout();
    });
  }
});

// Affiche les informations de l'utilisateur sur la page
function renderUserProfile(user) {
  const prenom = user.prenom || "Élève";
  const nom = user.nom || "";
  const accountIdentifier = user.role === "student"
    ? user.username || ""
    : user.email || "";
  const classe = user.classe || "1ère Générale";
  const specialites = normalizeSpecialties(user.specialite);
  const bio = user.bio || "";

  // 1. Initiales pour l'avatar
  const pInit = prenom.charAt(0).toUpperCase();
  const nInit = nom.charAt(0).toUpperCase() || "J";
  const avatarElem = document.getElementById("avatar-initials");
  if (avatarElem) {
    avatarElem.textContent = `${pInit}${nInit}`;
    avatarElem.style.background = normalizeProfileColor(user.profileColor);
  }

  const avatarColorInput = document.getElementById("edit-avatar-color");
  if (avatarColorInput) avatarColorInput.value = normalizeProfileColor(user.profileColor);

  // 2. En-tête
  const nameElem = document.getElementById("profile-display-name");
  if (nameElem) nameElem.textContent = `${prenom} ${nom}`.trim();

  const emailElem = document.getElementById("profile-display-email");
  if (emailElem) emailElem.textContent = accountIdentifier;

  const badgeClasse = document.getElementById("badge-classe");
  if (badgeClasse) {
    badgeClasse.textContent = `${classe}`;
    badgeClasse.hidden = user.role === "teacher";
  }

  const badgeSpe = document.getElementById("badge-specialite");
  if (badgeSpe) {
    badgeSpe.textContent = specialites.length ? specialites.map(getShortSpecialtyName).join(", ") : "Aucune";
  }

  // 3. Détails
  setElementText("info-prenom", prenom);
  setElementText("info-nom", nom);
  setElementText("info-email", accountIdentifier);
  setElementText("info-classe", classe);
  const classInfo = document.getElementById("info-class-item");
  if (classInfo) classInfo.hidden = user.role === "teacher";
  setElementText("info-specialite", specialites.length ? specialites.join(", ") : "Aucune spécialité");

  // 4. Pré-remplissage du formulaire d'édition
  const editBio = document.getElementById("edit-bio");
  if (editBio) editBio.value = bio;

  getSpecialtySelects().forEach((select, index) => {
    select.value = specialites[index] || "";
  });

  const editClasse = document.getElementById("edit-classe");
  if (editClasse && classe) {
    if (classe.startsWith("1ère")) editClasse.value = "1ère";
    else if (classe.startsWith("Terminale")) editClasse.value = "Terminale";
    else editClasse.value = classe;
  }
}

// Sauvegarde des modifications
function saveProfileChanges(currentUser) {
  const newBio = document.getElementById("edit-bio").value.trim();
  const specialtySelects = getSpecialtySelects();
  const newSpe = specialtySelects.map((select) => select.value).filter(Boolean);
  const newClasse = document.getElementById("edit-classe").value;
  const avatarColorInput = document.getElementById("edit-avatar-color");
  const requiredSpecialtyCount = getSpecialtyLimit(newClasse);

  if (newSpe.length !== requiredSpecialtyCount || new Set(newSpe).size !== newSpe.length) {
    const specialtyHelp = document.getElementById("specialite-help");
    if (specialtyHelp) {
      specialtyHelp.textContent = currentUser.role === "teacher"
        ? "Sélectionnez exactement une spécialité."
        : requiredSpecialtyCount
          ? `Sélectionnez exactement ${requiredSpecialtyCount} spécialité(s) différentes pour cette classe.`
          : "En Seconde, aucune spécialité n'est à choisir.";
    }
    specialtySelects.find((select) => !select.value)?.focus();
    return;
  }

  currentUser.bio = newBio;
  currentUser.specialite = newSpe;
  currentUser.classe = newClasse;
  currentUser.profileColor = normalizeProfileColor(avatarColorInput?.value);

  persistUserProfile(currentUser);
  renderUserProfile(currentUser);

  alert("Votre profil a été mis à jour avec succès !");
}

function confirmSpecialties(currentUser) {
  const specialtySelects = getSpecialtySelects();
  const newClasse = document.getElementById("edit-classe").value;
  const newSpecialties = specialtySelects.map((select) => select.value).filter(Boolean);
  const avatarColorInput = document.getElementById("edit-avatar-color");
  const requiredCount = getSpecialtyLimit(newClasse);
  const specialtyHelp = document.getElementById("specialite-help");

  if (newSpecialties.length !== requiredCount || new Set(newSpecialties).size !== newSpecialties.length) {
    if (specialtyHelp) {
      specialtyHelp.textContent = currentUser.role === "teacher"
        ? "Choisissez une seule spécialité avant de confirmer."
        : requiredCount
          ? `Choisissez ${requiredCount} spécialité(s) différentes avant de confirmer.`
          : "En Seconde, aucune spécialité n'est à choisir.";
    }
    specialtySelects.find((select) => !select.value)?.focus();
    return;
  }

  currentUser.classe = newClasse;
  currentUser.specialite = newSpecialties;
  currentUser.profileColor = normalizeProfileColor(avatarColorInput?.value);
  persistUserProfile(currentUser);
  renderUserProfile(currentUser);
  if (specialtyHelp) specialtyHelp.textContent = "Vos spécialités ont été confirmées.";
  alert("Vos spécialités ont été confirmées.");
}

function persistUserProfile(currentUser) {
  sessionStorage.setItem("jfej_current_user", JSON.stringify(currentUser));

  const users = JSON.parse(localStorage.getItem("jfej_users") || "[]");
  const userIndex = users.findIndex((user) => {
    if (user.role !== currentUser.role) return false;
    const identity = user.role === "student" ? user.username : user.email;
    const currentIdentity = currentUser.role === "student" ? currentUser.username : currentUser.email;
    return identity?.toLowerCase() === currentIdentity?.toLowerCase();
  });
  if (userIndex !== -1) {
    users[userIndex] = currentUser;
    localStorage.setItem("jfej_users", JSON.stringify(users));
  }
}

function normalizeProfileColor(color) {
  return /^#[0-9a-f]{6}$/i.test(color || "") ? color : "#8a63e8";
}

function applyProfileColor(color) {
  const normalizedColor = normalizeProfileColor(color);
  const avatar = document.getElementById("avatar-initials");
  const navigationAvatar = document.querySelector(".JFEJ-user .JFEJ-avatar");
  if (avatar) avatar.style.background = normalizedColor;
  if (navigationAvatar) navigationAvatar.style.background = normalizedColor;
}

// Déconnexion
function performLogout() {
  if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
    sessionStorage.removeItem("jfej_current_user");
    window.location.href = document.body.dataset.logoutUrl || "index.html";
  }
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function normalizeSpecialties(specialties) {
  const values = Array.isArray(specialties) ? specialties : specialties ? [specialties] : [];
  const aliases = {
    NSI: "Numérique et Sciences Informatiques (NSI)",
    "Mathématiques": "Mathématique",
    Physique: "Physique-Chimie",
    SVT: "Science de la Vie et de la Terre",
    SES: "Sciences Économiques et Sociales (SES)",
    HGGSP: "Histoire-Géographie, Géopolitique et Sciences Politiques(HGGSP)",
    HLP: "Humanités, Littérature et Philosophie (HLP)",
    LLCER: "Langues, littératures et cultures étrangères et régionales (LLCER - Anglais)",
    "LLCER Anglais": "Langues, littératures et cultures étrangères et régionales (LLCER - Anglais)"
  };
  return values.filter(Boolean).map((value) => aliases[value] || value);
}

function getSpecialtyLimit(classe) {
  if (classe === "Professeur") return 1;
  if (classe === "Seconde") return 0;
  if (classe.startsWith("1ère")) return 3;
  if (classe.startsWith("Terminale")) return 2;
  return 0;
}

function getShortSpecialtyName(specialty) {
  if (specialty.includes("NSI")) return "NSI";
  if (specialty.includes("Math")) return "Mathématiques";
  if (specialty.includes("Physique")) return "Physique-Chimie";
  if (specialty.includes("SVT") || specialty.includes("Terre")) return "SVT";
  if (specialty.includes("Économiques") || specialty.includes("(SES)")) return "SES";
  if (specialty.includes("Géopolitique") || specialty.includes("HGGSP")) return "HGGSP";
  if (specialty.includes("Humanités") || specialty.includes("(HLP)")) return "HLP";
  if (specialty.includes("LLCER")) return "LLCER";
  return specialty;
}

function getSpecialtySelects() {
  return [1, 2, 3]
    .map((number) => document.getElementById(`edit-specialite-${number}`))
    .filter(Boolean);
}

function initializeSpecialtySelection(user) {
  const classSelect = document.getElementById("edit-classe");
  const specialtySelects = getSpecialtySelects();
  const specialtyHelp = document.getElementById("specialite-help");
  if (!classSelect || specialtySelects.length === 0 || !specialtyHelp) return;
  const isTeacher = user.role === "teacher";
  if (isTeacher) {
    classSelect.value = "Professeur";
    classSelect.disabled = true;
  }
  const classGroup = document.getElementById("edit-class-group");
  if (classGroup) classGroup.hidden = isTeacher;

  const updateSpecialtyOptions = (clearSelection) => {
    const limit = getSpecialtyLimit(classSelect.value);
    specialtySelects.forEach((select, index) => {
      const field = select.closest(".specialite-field");
      if (clearSelection || index >= limit) select.value = "";
      select.disabled = index >= limit;
      select.required = index < limit;
      if (field) field.hidden = index >= limit;
    });
    specialtyHelp.textContent = isTeacher
      ? "Choisissez une seule spécialité, quelle que soit la classe enseignée."
      : limit
        ? `Sélectionnez exactement ${limit} spécialité(s) (${limit === 3 ? "Première" : "Terminale"}).`
        : "En Seconde, aucune spécialité n'est à choisir.";
  };

  classSelect.addEventListener("change", () => updateSpecialtyOptions(true));
  specialtySelects.forEach((changedSelect) => changedSelect.addEventListener("change", () => {
    const selected = specialtySelects.map((select) => select.value).filter(Boolean);
    const limit = getSpecialtyLimit(classSelect.value);
    if (new Set(selected).size !== selected.length) {
      changedSelect.value = "";
      specialtyHelp.textContent = "Chaque menu doit contenir une spécialité différente.";
    } else {
      specialtyHelp.textContent = `Sélectionnées : ${selected.length}/${limit}.`;
    }
  }));

  updateSpecialtyOptions(false);
}
