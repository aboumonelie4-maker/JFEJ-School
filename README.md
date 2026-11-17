# Projets

Ce dépôt contient 1 projets divisé en 2 fichiers  :

- `JFEJ/` : la page d'accueil et de présentation du site
- `The_Site/` : le site même ou il est possible de communiquer avec ses amis , profs et directeurs

## Structure du dépôt

```text
.
├── JFEJ/
│   ├── CSS/
│   │   ├── common.css
│   │   ├── description.css
│   │   ├── index.css
│   │   ├── profil.css
│   │   └── vie-scolaire.css
│   ├── HTML/
│   │   ├── description.html
│   │   ├── index.html
│   │   ├── profil.html
│   │   └── vie-scolaire.html
│   ├── JS/
│   │   ├── auth.js
│   │   ├── interactive.js
│   │   ├── navigation.js
│   │   └── profil.js
│   ├── Page d'inscription/
│   │   ├── CSS/
│   │   │   └── Page d'inscription.css
│   │   └── html/
│   │       └── Inscription.html
│   ├── Page de Connexion/
│   │   ├── CSS/
│   │   │   └── Page de connexion.css
│   │   └── HTML/
│   │       └── Page de connexion.html
│   └── lalé1bo.jpg
├── The_Site/
│   ├── CSS/
│   │   ├── Accueil.css
│   │   ├── Mon_compte.css
│   │   ├── Mur_du_lycée.css
│   │   ├── Plus.css
│   │   └── Recherche.css
│   ├── HTML/
│   │   ├── Accueil.html
│   │   ├── Mon compte.html
│   │   ├── Mur _du _lycée.html
│   │   ├── Plus.html
│   │   └── Recherche.html
│   └── JS/
│       └── The_Site.js
└── README.md
```

Les deux projets restent séparés. Ouvrez le fichier HTML depuis le dossier de leur projet respectif.

## Administration locale (prototype)

Les comptes professeur ne peuvent plus s’inscrire ni se connecter tant que leur adresse n’a pas été autorisée par l’administrateur. L’administrateur se connecte avec son e-mail et son mot de passe dans le même formulaire de connexion que les professeurs. Le formulaire d’inscription professeur propose aussi « Admin » comme raccourci : cette option authentifie uniquement un compte `administrator` existant avec le même e-mail et mot de passe; elle ne peut pas créer ou promouvoir un compte. Pour initialiser le premier administrateur sur un navigateur vierge, ouvrir la page de connexion avec le paramètre `?initialiser-admin`, puis utiliser les champs habituels d’e-mail et de mot de passe. Cette initialisation n’est disponible que tant qu’aucun compte `administrator` n’existe dans `jfej_users`; elle n’ajoute pas de nouvel écran de connexion.

Une fois connecté, l’administrateur ouvre « Plus » pour gérer `jfej_allowed_teacher_emails` et consulter les comptes, spécialités et lien de création (`createdBy`) actuellement enregistrés. La classe peut être conservée pour chaque élève, mais le panneau d’administration ne présente pas d’onglet ou de classement par classe : les professeurs ne sont pas rattachés à une classe. Les rapports sont limités aux données présentes dans le stockage local du navigateur.

**Limite essentielle :** il s’agit seulement d’un prototype. `localStorage` est modifiable par l’utilisateur, les mots de passe y sont en clair, et le rôle de la session peut être falsifié. L’URL d’initialisation n’est pas un mécanisme de sécurité. Ne pas utiliser ce système pour des données réelles ou confidentielles.

## Repères pour migrer vers une vraie base de données

L’état actuel est principalement dans `localStorage["jfej_users"]` : les objets possèdent un rôle (`teacher`, `student` ou `administrator`), un e-mail ou nom d’utilisateur, un mot de passe en clair, et des champs `classe`, `specialite` et `createdBy`. La liste `specialite` d’un élève sert aussi de liste de groupes auxquels il est inscrit : la création par un professeur l’inscrit dans la spécialité de ce professeur, et un autre professeur peut retrouver le compte et l’ajouter à sa spécialité jusqu’à deux spécialités au total. Les autorisations professeur sont dans `localStorage["jfej_allowed_teacher_emails"]`. Les comptes n’ont pas d’identifiant stable et les relations sont surtout des chaînes de caractères : générer des UUID et migrer les références avant de supprimer l’ancien stockage. Ne jamais copier les mots de passe en clair dans la base ; imposer une réinitialisation ou migrer vers des hachages Argon2id/bcrypt depuis un environnement de confiance.

Modèle relationnel de départ suggéré :

- `users(id, role, email_normalized, username_normalized, password_hash, first_name, last_name, bio, created_at, updated_at)` avec unicité des e-mails/noms d’utilisateur et rôles validés côté serveur.
- `teacher_email_allowlist(email_normalized, created_by_admin_id, created_at, revoked_at)` pour l’autorisation préalable des professeurs ; vérifier cette table côté serveur à l’inscription **et** à chaque connexion.
- `classes(id, name, school_year)` et `student_class_enrollments(student_id, class_id, starts_at, ends_at)` pour représenter l’appartenance d’un élève à une classe au fil du temps.
- `specialties(id, code, name)`, `student_specialties(student_id, specialty_id, class_id)` et `teacher_specialties(teacher_id, specialty_id)` ; imposer qu’un professeur ait au plus une spécialité, rattachée au professeur et non à une classe. Un professeur de spécialité intervient dans toutes les classes du lycée : ne pas ajouter de relation professeur-classe ni filtrer ses groupes par classe.
- `teacher_student_accounts(teacher_id, student_id, created_at)` pour remplacer `createdBy` par une clé étrangère ; conserver ce lien pour les rapports de création sans le confondre avec l’inscription courante en classe.
- `friendships(user_id, friend_id, status, created_at)` et, si la messagerie devient persistante, `groups`, `group_members` et `messages` avec clés étrangères.
- `audit_events(id, actor_user_id, action, target_type, target_id, created_at)` pour tracer les autorisations et actions d’administration.

Fournir ensuite une API serveur (par exemple `POST /admin/teacher-allowlist`, `DELETE /admin/teacher-allowlist/:email` et `GET /admin/reports/*`). Chaque route doit vérifier l’identité et le rôle administrateur côté serveur, les données des rapports doivent être agrégées depuis les relations SQL, et les sessions doivent utiliser des cookies `HttpOnly`, `Secure` et `SameSite`. Le masquage de l’interface ou une propriété `role` envoyée par le navigateur ne constitue jamais une autorisation.
