document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('appContainer');
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');
    const btnSearch = document.getElementById('btnSearch');
    const searchPanel = document.getElementById('searchPanel');
    const searchClose = document.querySelector('.JFEJ-search-close');
    const searchBackdrop = document.querySelector('.JFEJ-search-backdrop');
    const btnTheme = document.getElementById('btnTheme');
    const themeLabel = document.getElementById('themeLabel');
    const accountActions = document.getElementById('plusAccountActions');
    const teacherManagement = document.getElementById('teacher-account-management');
    const studentAccountForm = document.getElementById('student-account-form');
    const studentAccountList = document.getElementById('student-account-list');
    const studentAccountEmpty = document.getElementById('student-account-empty');
    const studentCredentials = document.getElementById('student-account-credentials');
    const quickLogoutButton = document.getElementById('btn-quick-logout');
    const deleteAccountButton = document.getElementById('btn-delete-account');
    const currentUserRaw = sessionStorage.getItem('jfej_current_user');
    const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    const savedTheme = localStorage.getItem('JFEJ-theme') || 'light';
    const normalizeSearchText = (value) => value
        .toLocaleLowerCase('fr')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const searchableContacts = [
        {
            name: 'Lucas Bernard',
            initials: 'LB',
            preview: 'Tu as avancé sur le devoir de physique ?',
            messages: [
                'Tu as avancé sur le devoir de physique ?',
                "Oui, je viens de terminer l'exercice 4. Je t'envoie ma méthode !"
            ],
            color: 'violet'
        },
        {
            name: 'Sarah K.',
            initials: 'SK',
            preview: 'On se retrouve au CDI ?',
            messages: [
                'On se retrouve au CDI à la pause de 10h ?',
                "Oui, je t'attends devant l'entrée."
            ],
            color: 'rose'
        },
        {
            name: 'Emma Petit',
            initials: 'EP',
            preview: 'Merci pour la fiche de révision !',
            messages: [
                'Merci pour la fiche de révision !',
                "Avec plaisir, j'ajouterai la partie sur la génétique demain."
            ],
            color: 'blue'
        },
        {
            name: 'Yanis Moreau',
            initials: 'YM',
            preview: 'Tu peux m’aider pour le code Python ?',
            messages: [
                'Tu peux m’aider pour le code Python ?',
                "Bien sûr ! Envoie-moi l'énoncé et on regarde ça ensemble."
            ],
            color: 'orange'
        }
    ];

    const setTheme = (theme) => {
        const isDark = theme === 'dark';
        document.body.classList.toggle('dark-mode', isDark);
        document.body.classList.toggle('light-mode', !isDark);
        
        if (btnTheme) {
            btnTheme.setAttribute('aria-pressed', String(isDark));
            const icon = btnTheme.querySelector('.JFEJ-plus-action-icon');
            if (icon) icon.textContent = isDark ? '☀️' : '🌙';
        }
        
        const plusCardIcon = document.querySelector('.JFEJ-plus-options .JFEJ-plus-card-icon');
        if (plusCardIcon) {
            plusCardIcon.textContent = isDark ? '☀️' : '🌙';
        }
        
        if (themeLabel) {
            themeLabel.textContent = isDark ? 'Passer au mode clair' : 'Passer au mode sombre';
        }
        localStorage.setItem('JFEJ-theme', theme);
    };
    setTheme(savedTheme);

    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            setTheme(currentTheme);
        });
    }

    if (accountActions && currentUser) accountActions.hidden = false;

    if (teacherManagement && studentAccountForm && studentAccountList && currentUser?.role === 'teacher') {
        teacherManagement.hidden = false;
        const studentSearch = document.getElementById('student-search');
        const studentSearchResults = document.getElementById('student-search-results');
        const studentSearchStatus = document.getElementById('student-search-status');

        const getUsers = () => {
            let users;
            try {
                users = JSON.parse(localStorage.getItem('jfej_users') || '[]');
            } catch {
                throw new Error('Les données des comptes sont illisibles.');
            }
            if (!Array.isArray(users)) throw new Error('Les comptes enregistrés sont illisibles.');
            return users;
        };

        const getTeacherSpecialty = () => {
            const specialties = Array.isArray(currentUser.specialite)
                ? currentUser.specialite.filter(Boolean)
                : currentUser.specialite ? [currentUser.specialite] : [];
            return specialties.length === 1 ? specialties[0] : '';
        };
        const normalizeSpecialtyName = (specialty) => {
            const normalized = normalizeSearchText(String(specialty || ''))
                .replace(/[()]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            return normalized === 'mathematiques' || normalized === 'mathematique' ? 'maths' : normalized;
        };
        const getStudentSpecialties = (student) => {
            const specialties = Array.isArray(student.specialite)
                ? student.specialite
                : student.specialite ? [student.specialite] : [];
            return specialties.filter((specialty, index) => specialties.findIndex(
                (other) => normalizeSpecialtyName(other) === normalizeSpecialtyName(specialty)
            ) === index);
        };

        const renderStudentAccounts = () => {
            const teacherEmail = currentUser.email.trim().toLowerCase();
            const students = getUsers().filter(
                (user) => user.role === 'student' && user.createdBy === teacherEmail
            );
            studentAccountList.replaceChildren();
            if (studentAccountEmpty) studentAccountEmpty.hidden = students.length > 0;

            students.forEach((student) => {
                const item = document.createElement('li');
                const username = document.createElement('span');
                const password = document.createElement('span');
                const removeButton = document.createElement('button');
                username.className = 'JFEJ-student-account-username';
                username.textContent = student.username;
                password.className = 'JFEJ-student-account-password';
                password.textContent = `Mot de passe : ${student.password || 'Non disponible'}`;
                removeButton.type = 'button';
                removeButton.textContent = 'Supprimer';
                removeButton.setAttribute('aria-label', `Supprimer le compte ${student.username}`);
                removeButton.addEventListener('click', () => {
                    if (!window.confirm(`Supprimer le compte élève « ${student.username} » ?`)) return;
                    try {
                        const remainingUsers = getUsers().filter(
                            (user) => !(user.role === 'student'
                                && user.createdBy === teacherEmail
                                && user.username?.toLowerCase() === student.username.toLowerCase())
                        );
                        localStorage.setItem('jfej_users', JSON.stringify(remainingUsers));
                        renderStudentAccounts();
                    } catch (error) {
                        window.alert(error instanceof Error ? error.message : 'Impossible de supprimer ce compte élève.');
                    }
                });
                item.append(username, password, removeButton);
                studentAccountList.append(item);
            });
        };

        studentAccountForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!studentAccountForm.reportValidity()) return;

            try {
                const usernameInput = document.getElementById('student-username');
                const studentClassInput = document.getElementById('student-class');
                const username = usernameInput.value.trim();
                const users = getUsers();
                const teacherSpecialty = getTeacherSpecialty();
                if (!teacherSpecialty) {
                    window.alert('Votre compte doit être associé à une seule spécialité avant de créer des comptes élèves.');
                    return;
                }
                if (users.some((user) => user.role === 'student'
                    && user.username?.toLowerCase() === username.toLowerCase())) {
                    usernameInput.setCustomValidity('Ce nom d’utilisateur est déjà utilisé.');
                    usernameInput.reportValidity();
                    usernameInput.setCustomValidity('');
                    return;
                }

                if (!window.crypto?.getRandomValues) {
                    window.alert('La génération sécurisée des mots de passe n’est pas disponible dans ce navigateur.');
                    return;
                }

                const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
                const rejectionLimit = Math.floor(256 / alphabet.length) * alphabet.length;
                let password = '';
                while (password.length < 8) {
                    const bytes = new Uint8Array(16);
                    window.crypto.getRandomValues(bytes);
                    bytes.forEach((byte) => {
                        if (byte < rejectionLimit && password.length < 8) {
                            password += alphabet[byte % alphabet.length];
                        }
                    });
                }

                const teacherEmail = currentUser.email.trim().toLowerCase();
                const newStudent = {
                    role: 'student',
                    username,
                    password,
                    prenom: username,
                    nom: '',
                    classe: studentClassInput?.value || 'Élève',
                    specialite: [teacherSpecialty],
                    bio: '',
                    createdBy: teacherEmail
                };
                users.push(newStudent);
                localStorage.setItem('jfej_users', JSON.stringify(users));

                if (studentCredentials) {
                    studentCredentials.textContent = `Compte créé. Nom d’utilisateur : ${username} — Mot de passe provisoire : ${password}. Remettez ces identifiants à l’élève.`;
                    studentCredentials.hidden = false;
                }
                studentAccountForm.reset();
                renderStudentAccounts();
                if (studentSearch?.value.trim()) renderStudentSearchResults();
            } catch (error) {
                window.alert(error instanceof Error ? error.message : 'Impossible de créer ce compte élève.');
            }
        });

        const renderStudentSearchResults = () => {
            if (!studentSearch || !studentSearchResults || !studentSearchStatus) return;
            studentSearchResults.replaceChildren();
            const query = normalizeSearchText(studentSearch.value.trim());
            const teacherSpecialty = getTeacherSpecialty();
            if (!teacherSpecialty) {
                studentSearchStatus.textContent = 'Votre compte doit avoir une seule spécialité pour ajouter des élèves à un groupe.';
                return;
            }
            if (!query) {
                studentSearchStatus.textContent = 'Saisissez un nom ou un nom d’utilisateur pour rechercher un élève.';
                return;
            }

            const matchingStudents = getUsers()
                .filter((user) => user.role === 'student')
                .filter((student) => normalizeSearchText([
                    student.username,
                    student.prenom,
                    student.nom
                ].filter(Boolean).join(' ')).includes(query))
                .sort((first, second) => (first.username || '').localeCompare(second.username || '', 'fr'));

            if (!matchingStudents.length) {
                studentSearchStatus.textContent = 'Aucun élève trouvé.';
                return;
            }
            studentSearchStatus.textContent = `${matchingStudents.length} élève${matchingStudents.length > 1 ? 's' : ''} trouvé${matchingStudents.length > 1 ? 's' : ''}.`;

            matchingStudents.forEach((student) => {
                const item = document.createElement('li');
                const identity = document.createElement('div');
                const name = document.createElement('strong');
                const details = document.createElement('span');
                const addButton = document.createElement('button');
                const specialties = getStudentSpecialties(student);
                const isAlreadyEnrolled = specialties.some(
                    (specialty) => normalizeSpecialtyName(specialty) === normalizeSpecialtyName(teacherSpecialty)
                );
                const hasTwoSpecialties = specialties.length >= 2;
                name.textContent = `${student.prenom || student.username || 'Élève'}${student.nom ? ` ${student.nom}` : ''}`;
                details.textContent = `${student.username ? `@${student.username}` : 'Identifiant manquant'} · ${
                    specialties.length ? specialties.join(', ') : 'Aucune spécialité attribuée'
                }`;
                identity.className = 'JFEJ-student-search-identity';
                identity.append(name, details);
                addButton.type = 'button';
                addButton.className = 'JFEJ-plus-action';
                addButton.disabled = isAlreadyEnrolled || hasTwoSpecialties;
                addButton.textContent = isAlreadyEnrolled
                    ? 'Déjà dans ma spé'
                    : hasTwoSpecialties
                        ? '2 spécialités déjà attribuées'
                        : `Ajouter à ${teacherSpecialty}`;
                addButton.addEventListener('click', () => {
                    try {
                        const users = getUsers();
                        const matchingStudent = users.find((user) => user.role === 'student'
                            && user.username?.trim().toLocaleLowerCase('fr') === student.username?.trim().toLocaleLowerCase('fr'));
                        if (!matchingStudent) {
                            studentSearchStatus.textContent = 'Ce compte élève n’existe plus.';
                            renderStudentSearchResults();
                            return;
                        }
                        const currentSpecialties = getStudentSpecialties(matchingStudent);
                        if (currentSpecialties.some(
                            (specialty) => normalizeSpecialtyName(specialty) === normalizeSpecialtyName(teacherSpecialty)
                        )) {
                            studentSearchStatus.textContent = `${matchingStudent.username} est déjà inscrit à votre spécialité.`;
                            renderStudentSearchResults();
                            return;
                        }
                        if (currentSpecialties.length >= 2) {
                            studentSearchStatus.textContent = `${matchingStudent.username} a déjà deux spécialités.`;
                            renderStudentSearchResults();
                            return;
                        }
                        matchingStudent.specialite = [...currentSpecialties, teacherSpecialty];
                        localStorage.setItem('jfej_users', JSON.stringify(users));
                        studentSearchStatus.textContent = `${matchingStudent.username} a été ajouté à votre spécialité : ${teacherSpecialty}.`;
                        renderStudentSearchResults();
                    } catch (error) {
                        window.alert(error instanceof Error ? error.message : 'Impossible d’ajouter cet élève à votre spécialité.');
                    }
                });
                item.append(identity, addButton);
                studentSearchResults.append(item);
            });
        };
        studentSearch?.addEventListener('input', () => {
            try {
                renderStudentSearchResults();
            } catch (error) {
                window.alert(error instanceof Error ? error.message : 'Impossible de rechercher des comptes élèves.');
            }
        });
        try {
            renderStudentSearchResults();
        } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Impossible de charger la recherche des élèves.');
        }

        try {
            renderStudentAccounts();
        } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Impossible de charger les comptes élèves.');
        }
    }

    const administratorManagement = document.getElementById('administrator-management');
    if (administratorManagement && currentUser?.role === 'administrator') {
        administratorManagement.hidden = false;
        if (deleteAccountButton) deleteAccountButton.hidden = true;

        const allowlistForm = document.getElementById('teacher-allowlist-form');
        const allowlistInput = document.getElementById('teacher-allowlist-email');
        const allowlistList = document.getElementById('teacher-allowlist-list');
        const allowlistStatus = document.getElementById('teacher-allowlist-status');
        const reportMetrics = document.getElementById('admin-report-metrics');
        const specialtyReport = document.getElementById('admin-specialty-report');
        const userReport = document.getElementById('admin-user-report');

        const readAdminUsers = () => {
            let users;
            try {
                users = JSON.parse(localStorage.getItem('jfej_users') || '[]');
            } catch {
                throw new Error('Les données des comptes sont illisibles.');
            }
            if (!Array.isArray(users)) throw new Error('Les comptes enregistrés sont illisibles.');
            return users;
        };
        const readAllowlist = () => {
            let emails;
            try {
                emails = JSON.parse(localStorage.getItem('jfej_allowed_teacher_emails') || '[]');
            } catch {
                throw new Error('La liste des e-mails autorisés est illisible.');
            }
            if (!Array.isArray(emails)) throw new Error('La liste des e-mails autorisés est illisible.');
            return [...new Set(emails.map((email) => String(email).trim().toLowerCase()).filter(Boolean))].sort();
        };
        const makeReportItem = (label, value) => {
            const item = document.createElement('li');
            const name = document.createElement('span');
            const count = document.createElement('strong');
            name.textContent = label;
            count.textContent = String(value);
            item.append(name, count);
            return item;
        };
        const renderTeacherAllowlist = (users) => {
            const allowedEmails = readAllowlist();
            allowlistList.replaceChildren();
            if (!allowedEmails.length) {
                const empty = document.createElement('li');
                empty.textContent = 'Aucun e-mail autorisé pour le moment.';
                allowlistList.append(empty);
                return;
            }

            allowedEmails.forEach((email) => {
                const item = document.createElement('li');
                const detail = document.createElement('span');
                const removeButton = document.createElement('button');
                const registered = users.some((user) => user.role === 'teacher' && user.email?.trim().toLowerCase() === email);
                detail.textContent = `${email} — ${registered ? 'compte créé' : 'en attente d’inscription'}`;
                removeButton.type = 'button';
                removeButton.className = 'JFEJ-plus-action';
                removeButton.textContent = 'Retirer';
                removeButton.setAttribute('aria-label', `Retirer l’autorisation pour ${email}`);
                removeButton.addEventListener('click', () => {
                    if (!window.confirm(`Retirer l’autorisation de connexion pour ${email} ?`)) return;
                    try {
                        const nextEmails = readAllowlist().filter((allowedEmail) => allowedEmail !== email);
                        localStorage.setItem('jfej_allowed_teacher_emails', JSON.stringify(nextEmails));
                        renderTeacherAllowlist(readAdminUsers());
                        allowlistStatus.textContent = `Autorisation retirée pour ${email}.`;
                    } catch (error) {
                        window.alert(error instanceof Error ? error.message : 'Impossible de modifier la liste.');
                    }
                });
                item.append(detail, removeButton);
                allowlistList.append(item);
            });
        };
        const renderAdminReport = (users) => {
            const teachers = users.filter((user) => user.role === 'teacher');
            const students = users.filter((user) => user.role === 'student');
            const specialties = new Map();
            const registeredEmails = new Set(teachers.map((teacher) => teacher.email?.trim().toLowerCase()));
            const allowedEmails = readAllowlist();
            const pendingEmails = allowedEmails.filter((email) => !registeredEmails.has(email));
            const metrics = [
                ['Comptes', users.filter((user) => ['teacher', 'student'].includes(user.role)).length],
                ['Élèves', students.length],
                ['Professeurs', teachers.length],
                ['E-mails autorisés en attente', pendingEmails.length]
            ];
            reportMetrics.replaceChildren();
            metrics.forEach(([label, value]) => {
                const card = document.createElement('div');
                const name = document.createElement('span');
                const count = document.createElement('strong');
                card.className = 'JFEJ-admin-metric';
                name.textContent = label;
                count.textContent = String(value);
                card.append(name, count);
                reportMetrics.append(card);
            });

            users.filter((user) => ['teacher', 'student'].includes(user.role)).forEach((user) => {
                const values = Array.isArray(user.specialite) ? user.specialite : user.specialite ? [user.specialite] : [];
                [...new Set(values.map((value) => String(value).trim()).filter(Boolean))].forEach((specialty) => {
                    specialties.set(specialty, (specialties.get(specialty) || 0) + 1);
                });
            });

            specialtyReport.replaceChildren();
            if (!specialties.size) specialtyReport.append(makeReportItem('Aucune spécialité renseignée', 0));
            [...specialties.entries()].sort(([first], [second]) => first.localeCompare(second, 'fr')).forEach(([name, count]) => {
                specialtyReport.append(makeReportItem(name, count));
            });

            userReport.replaceChildren();
            if (!teachers.length && !students.length) {
                const empty = document.createElement('p');
                empty.className = 'JFEJ-admin-empty';
                empty.textContent = 'Aucun compte professeur ou élève n’est enregistré.';
                userReport.append(empty);
                return;
            }

            const studentsByTeacher = new Map();
            const unassignedStudents = [];
            students.forEach((student) => {
                const creatorEmail = student.createdBy?.trim().toLowerCase();
                const teacher = teachers.find((item) => item.email?.trim().toLowerCase() === creatorEmail);
                if (!teacher) {
                    unassignedStudents.push(student);
                    return;
                }
                if (!studentsByTeacher.has(teacher)) studentsByTeacher.set(teacher, []);
                studentsByTeacher.get(teacher).push(student);
            });

            const appendStudents = (container, groupedStudents) => {
                const list = document.createElement('ul');
                list.className = 'JFEJ-admin-student-list';
                if (!groupedStudents.length) {
                    const empty = document.createElement('li');
                    empty.className = 'JFEJ-admin-student-empty';
                    empty.textContent = 'Aucun compte élève créé par ce professeur.';
                    list.append(empty);
                }
                groupedStudents
                    .slice()
                    .sort((first, second) => (first.username || '').localeCompare(second.username || '', 'fr'))
                    .forEach((student) => {
                        const item = document.createElement('li');
                        const name = document.createElement('strong');
                        const username = document.createElement('span');
                        const className = document.createElement('span');
                        name.className = 'JFEJ-admin-student-name';
                        name.textContent = student.prenom || student.username || 'Élève sans nom';
                        username.className = 'JFEJ-admin-student-username';
                        username.textContent = `@${student.username || 'identifiant manquant'}`;
                        className.className = 'JFEJ-admin-student-class';
                        className.textContent = student.classe && student.classe !== 'Élève'
                            ? student.classe
                            : 'Classe non renseignée';
                        item.append(name, username, className);
                        list.append(item);
                    });
                container.append(list);
            };

            teachers
                .slice()
                .sort((first, second) => (`${first.prenom || ''} ${first.nom || ''}`).localeCompare(`${second.prenom || ''} ${second.nom || ''}`, 'fr'))
                .forEach((teacher) => {
                    const card = document.createElement('article');
                    const header = document.createElement('div');
                    const avatar = document.createElement('span');
                    const identity = document.createElement('div');
                    const name = document.createElement('h5');
                    const email = document.createElement('p');
                    const details = document.createElement('div');
                    const specialty = document.createElement('span');
                    const studentCount = document.createElement('span');
                    const studentsHeading = document.createElement('h6');
                    const teacherStudents = studentsByTeacher.get(teacher) || [];
                    const teacherName = `${teacher.prenom || ''} ${teacher.nom || ''}`.trim() || 'Professeur';
                    const specialtiesValue = Array.isArray(teacher.specialite)
                        ? teacher.specialite.filter(Boolean).join(', ')
                        : teacher.specialite || 'Spécialité non renseignée';
                    card.className = 'JFEJ-admin-teacher-card';
                    header.className = 'JFEJ-admin-teacher-header';
                    avatar.className = 'JFEJ-admin-teacher-avatar';
                    avatar.setAttribute('aria-hidden', 'true');
                    avatar.textContent = `${teacher.prenom?.[0] || ''}${teacher.nom?.[0] || ''}`.toUpperCase() || 'P';
                    identity.className = 'JFEJ-admin-teacher-identity';
                    name.textContent = teacherName;
                    email.textContent = teacher.email || 'E-mail non renseigné';
                    identity.append(name, email);
                    header.append(avatar, identity);
                    details.className = 'JFEJ-admin-teacher-details';
                    specialty.className = 'JFEJ-admin-specialty-badge';
                    specialty.textContent = `Spécialité : ${specialtiesValue}`;
                    studentCount.className = 'JFEJ-admin-student-count';
                    studentCount.textContent = `${teacherStudents.length} élève${teacherStudents.length > 1 ? 's' : ''}`;
                    details.append(specialty, studentCount);
                    studentsHeading.className = 'JFEJ-admin-students-heading';
                    studentsHeading.textContent = 'Élèves créés par ce professeur';
                    card.append(header, details, studentsHeading);
                    appendStudents(card, teacherStudents);
                    userReport.append(card);
                });

            if (unassignedStudents.length) {
                const card = document.createElement('article');
                const heading = document.createElement('h5');
                const note = document.createElement('p');
                card.className = 'JFEJ-admin-teacher-card is-unassigned';
                heading.textContent = 'Élèves sans professeur associé';
                note.textContent = 'Le compte créateur est absent ou n’est plus enregistré.';
                card.append(heading, note);
                appendStudents(card, unassignedStudents);
                userReport.append(card);
            }
        };
        const refreshAdminPanel = () => {
            const users = readAdminUsers();
            renderTeacherAllowlist(users);
            renderAdminReport(users);
        };

        allowlistForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!allowlistForm.reportValidity()) return;
            const email = allowlistInput.value.trim().toLowerCase();
            try {
                const users = readAdminUsers();
                if (email === currentUser.email?.trim().toLowerCase()) {
                    allowlistStatus.textContent = 'L’adresse de l’administrateur ne peut pas être ajoutée comme professeur.';
                    return;
                }
                const existing = readAllowlist();
                if (existing.includes(email)) {
                    allowlistStatus.textContent = 'Cette adresse est déjà autorisée.';
                    return;
                }
                existing.push(email);
                localStorage.setItem('jfej_allowed_teacher_emails', JSON.stringify(existing));
                allowlistForm.reset();
                allowlistStatus.textContent = `L’adresse ${email} peut maintenant créer un compte professeur et se connecter.`;
                renderTeacherAllowlist(users);
                renderAdminReport(users);
            } catch (error) {
                window.alert(error instanceof Error ? error.message : 'Impossible de mettre à jour les autorisations.');
            }
        });

        try {
            refreshAdminPanel();
        } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Impossible de charger les rapports administrateur.');
        }
    }

    quickLogoutButton?.addEventListener('click', () => {
        if (!window.confirm('Voulez-vous vraiment vous déconnecter ?')) return;
        sessionStorage.removeItem('jfej_current_user');
        window.location.href = document.body.dataset.logoutUrl || '../../JFEJ/HTML/profil.html';
    });

    deleteAccountButton?.addEventListener('click', () => {
        if (!currentUser) return;
        if (currentUser.role === 'administrator') {
            window.alert('Le compte administrateur local ne peut pas être supprimé depuis cette interface.');
            return;
        }
        const confirmed = window.confirm(
            'Voulez-vous vraiment supprimer votre compte ? Cette action est définitive et supprimera vos informations enregistrées sur cet appareil.'
        );
        if (!confirmed) return;

        const usersRaw = localStorage.getItem('jfej_users');
        if (usersRaw === null) {
            window.alert("Impossible de trouver les comptes enregistrés. Votre compte n'a pas été supprimé.");
            return;
        }

        const users = JSON.parse(usersRaw);
        if (!Array.isArray(users)) {
            window.alert("Les données des comptes sont illisibles. Votre compte n'a pas été supprimé.");
            return;
        }

        const identity = currentUser.role === 'student'
            ? currentUser.username?.trim().toLowerCase()
            : currentUser.email?.trim().toLowerCase();
        const remainingUsers = users.filter((user) => {
            if (user.role !== currentUser.role) return true;
            const userIdentity = user.role === 'student'
                ? user.username?.trim().toLowerCase()
                : user.email?.trim().toLowerCase();
            return userIdentity !== identity;
        });
        if (!identity || remainingUsers.length === users.length) {
            window.alert("Votre compte n'a pas été trouvé dans les comptes enregistrés.");
            return;
        }

        localStorage.setItem('jfej_users', JSON.stringify(remainingUsers));
        sessionStorage.removeItem('jfej_current_user');
        window.location.replace(
            document.body.dataset.accountHomeUrl || '../../JFEJ/HTML/index.html'
        );
    });

    if (currentUser) {
        const firstName = currentUser.role === 'student'
            ? currentUser.username || 'Élève'
            : currentUser.prenom || 'Professeur';
        const lastName = currentUser.nom || '';
        const avatar = document.querySelector('.JFEJ-user .JFEJ-avatar');
        const username = document.querySelector('.JFEJ-user .JFEJ-username');
        const userRole = document.querySelector('.JFEJ-user .JFEJ-userrole');

        if (avatar) {
            avatar.textContent = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
            if (/^#[0-9a-f]{6}$/i.test(currentUser.profileColor || '')) {
                avatar.style.background = currentUser.profileColor;
            }
        }
        if (username) username.textContent = `${firstName} ${lastName}`.trim();
        if (userRole) userRole.textContent = currentUser.role === 'administrator'
            ? 'Administrateur'
            : currentUser.role === 'teacher'
                ? 'Professeur'
                : currentUser.classe || 'Élève';
    }

    const specialtyList = document.getElementById('userSpecialties');
    if (specialtyList) {
        const specialtyAliases = {
            'Mathématiques': 'Mathématique',
            'Physique': 'Physique-Chimie',
            'SVT': 'Science de la Vie et de la Terre',
            'SES': 'Sciences Économiques et Sociales (SES)',
            'HGGSP': 'Histoire-Géographie, Géopolitique et Sciences Politiques(HGGSP)',
            'HLP': 'Humanités, Littérature et Philosophie (HLP)',
            'LLCER': 'Langues, littératures et cultures étrangères et régionales (LLCER - Anglais)',
            'LLCER Anglais': 'Langues, littératures et cultures étrangères et régionales (LLCER - Anglais)'
        };
        const specialties = currentUser
            ? (Array.isArray(currentUser.specialite) ? currentUser.specialite : currentUser.specialite ? [currentUser.specialite] : [])
            : [];
        const specialtyDetails = specialties.filter(Boolean).map((specialty) => {
            const name = specialtyAliases[specialty] || specialty;
            if (name.includes('NSI')) return { name: 'NSI', icon: '{ }', style: 'club-nsi' };
            if (name.includes('Math')) return { name: 'Mathématiques', icon: '∑', style: 'club-maths' };
            if (name.includes('Physique')) return { name: 'Physique-Chimie', icon: '⚛', style: 'club-physique' };
            if (name.includes('Terre') || name.includes('SVT')) return { name: 'SVT', icon: '♧', style: 'club-svt' };
            if (name.includes('Économiques') || name.includes('(SES)')) return { name: 'SES', icon: '€', style: 'club-ses' };
            if (name.includes('Géopolitique') || name.includes('HGGSP')) return { name: 'HGGSP', icon: '🌍', style: 'club-hggsp' };
            if (name.includes('Humanités') || name.includes('(HLP)')) return { name: 'HLP', icon: '✎', style: 'club-hlp' };
            if (name.includes('LLCER')) return { name: 'LLCER', icon: '文', style: 'club-llcer' };
            return { name, icon: '📚', style: 'club-other' };
        });

        specialtyList.replaceChildren();
        if (specialtyDetails.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'JFEJ-clubs-empty';
            emptyMessage.textContent = currentUser
                ? 'Aucune spécialité renseignée dans votre compte.'
                : 'Connectez-vous et choisissez vos spécialités depuis votre compte.';
            specialtyList.append(emptyMessage);
        } else {
            specialtyDetails.forEach(({ name, icon, style }) => {
                const groupButton = document.createElement('button');
                groupButton.className = 'JFEJ-contact';
                groupButton.type = 'button';
                groupButton.setAttribute('data-message-contact', '');
                groupButton.dataset.name = `Groupe ${name}`;
                groupButton.dataset.initials = name.slice(0, 3).toUpperCase();
                groupButton.dataset.class = `Spécialité ${name}`;
                groupButton.dataset.specialties = name;
                groupButton.dataset.status = 'online';
                groupButton.dataset.profileBio = `Canal de discussion et d'entraide dédié à la spécialité ${name}.`;
                groupButton.dataset.color = 'blue';
                groupButton.dataset.messageOne = `Bienvenue sur le canal du groupe ${name} !`;
                groupButton.dataset.messageTwo = `Partagez vos exercices et posez vos questions ici.`;

                const iconElement = document.createElement('span');
                iconElement.className = `JFEJ-contact-avatar ${style}`;
                iconElement.setAttribute('aria-hidden', 'true');
                iconElement.textContent = icon;

                const copyElement = document.createElement('span');
                copyElement.className = 'JFEJ-contact-copy';
                const strongElement = document.createElement('strong');
                strongElement.textContent = `Groupe ${name}`;
                const smallElement = document.createElement('small');
                smallElement.textContent = `Discussion de spécialité`;
                copyElement.append(strongElement, smallElement);

                groupButton.append(iconElement, copyElement);
                specialtyList.append(groupButton);
            });
        }
    }

    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            appContainer.classList.toggle('is-collapsed');
            btnToggleSidebar.textContent = appContainer.classList.contains('is-collapsed') ? '▶' : '◀';
        });
    }

    if (btnSearch && searchPanel) {
        const searchInput = searchPanel.querySelector('.JFEJ-search-input');
        let suggestions = searchPanel.querySelector('.JFEJ-search-suggestions');

        if (searchInput && !suggestions) {
            suggestions = document.createElement('div');
            suggestions.className = 'JFEJ-search-suggestions';
            suggestions.id = 'searchSuggestions';
            suggestions.setAttribute('role', 'region');
            suggestions.setAttribute('aria-label', 'Suggestions de recherche');
            suggestions.setAttribute('aria-live', 'polite');
            suggestions.setAttribute('aria-hidden', 'true');
            suggestions.inert = true;
            searchInput.setAttribute('aria-controls', suggestions.id);
            searchInput.insertAdjacentElement('afterend', suggestions);
        }

        const messageUrl = (name) => `Messages.html?contact=${encodeURIComponent(name)}`;

        const createResult = (contact, title, detail, kind, index) => {
            const link = document.createElement('a');
            link.className = 'JFEJ-search-result';
            link.href = messageUrl(contact.name);
            link.style.setProperty('--result-index', String(index));
            link.dataset.profileName = contact.name;
            link.dataset.profileInitials = contact.initials;
            link.dataset.profileClass = contact.className || 'Élève';
            link.dataset.profileSpecialties = contact.specialties || 'Aucune spécialité';
            link.dataset.profileStatus = contact.status || 'online';
            link.dataset.profileBio = contact.bio || 'Aucune biographie renseignée.';
            link.dataset.profileColor = contact.color || 'violet';

            const avatar = document.createElement('span');
            avatar.className = `JFEJ-search-result-avatar avatar-${contact.color}`;
            avatar.setAttribute('aria-hidden', 'true');
            avatar.textContent = contact.initials;

            const copy = document.createElement('span');
            copy.className = 'JFEJ-search-result-copy';
            const titleElement = document.createElement('strong');
            titleElement.textContent = title;
            const detailElement = document.createElement('span');
            detailElement.textContent = detail;
            copy.append(titleElement, detailElement);

            const type = document.createElement('span');
            type.className = 'JFEJ-search-result-type';
            type.textContent = kind;
            link.append(avatar, copy, type);
            return link;
        };

        const updateSuggestions = () => {
            if (!searchInput || !suggestions) return;
            const query = normalizeSearchText(searchInput.value.trim());
            suggestions.replaceChildren();

            if (!query) {
                suggestions.classList.remove('is-visible');
                suggestions.setAttribute('aria-hidden', 'true');
                suggestions.inert = true;
                return;
            }

            const people = searchableContacts.filter((contact) => normalizeSearchText(contact.name).includes(query));
            const discussions = searchableContacts.flatMap((contact) => contact.messages
                .filter((message) => normalizeSearchText(message).includes(query))
                .map((message) => ({ contact, message })))
                .slice(0, 4);
            let resultIndex = 0;

            const appendGroup = (label, results, createItem) => {
                if (results.length === 0) return;
                const group = document.createElement('section');
                group.className = 'JFEJ-search-result-group';
                const heading = document.createElement('h3');
                heading.textContent = label;
                const list = document.createElement('div');
                list.className = 'JFEJ-search-result-list';
                results.forEach((result) => {
                    list.append(createItem(result, resultIndex));
                    resultIndex += 1;
                });
                group.append(heading, list);
                suggestions.append(group);
            };

            appendGroup('Personnes', people, (contact, index) => createResult(
                contact,
                contact.name,
                contact.preview,
                'Profil',
                index
            ));
            appendGroup('Discussions', discussions, ({ contact, message }, index) => createResult(
                contact,
                contact.name,
                message,
                'Message',
                index
            ));

            if (resultIndex === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.className = 'JFEJ-search-empty';
                emptyMessage.textContent = 'Aucun utilisateur ou message trouvé.';
                suggestions.append(emptyMessage);
            }

            suggestions.classList.add('is-visible');
            suggestions.setAttribute('aria-hidden', 'false');
            suggestions.inert = false;
        };

        const setSearchOpen = (isOpen, restoreFocus = false) => {
            searchPanel.classList.toggle('is-open', isOpen);
            searchPanel.setAttribute('aria-hidden', String(!isOpen));
            searchPanel.inert = !isOpen;
            btnSearch.setAttribute('aria-expanded', String(isOpen));
            if (searchBackdrop) searchBackdrop.classList.toggle('is-open', isOpen);

            if (isOpen) {
                updateSuggestions();
                searchInput?.focus();
            } else if (restoreFocus) {
                btnSearch.focus();
            }
        };

        setSearchOpen(false);
        searchInput?.addEventListener('input', updateSuggestions);

        btnSearch.addEventListener('click', (e) => {
            e.preventDefault();
            setSearchOpen(!searchPanel.classList.contains('is-open'));
        });

        searchClose?.addEventListener('click', () => setSearchOpen(false, true));
        searchBackdrop?.addEventListener('click', () => setSearchOpen(false, true));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchPanel.classList.contains('is-open')) {
                setSearchOpen(false, true);
            }
        });
    }

    const initMessaging = () => {
        const messageContacts = document.querySelectorAll('[data-message-contact]');
        if (messageContacts.length === 0) return;

        const profilePanel = document.getElementById('contactProfilePanel');
        const profileToggle = document.getElementById('btnToggleProfilePanel');
        const profileClose = document.getElementById('btnCloseProfilePanel');
        const contactsToggle = document.getElementById('btnShowContacts');
        const contactsPanel = document.querySelector('.JFEJ-contacts-panel');
        const conversationPanel = document.querySelector('.JFEJ-conversation');
        const messagesApp = document.querySelector('.JFEJ-messages-app');
        const profileFriendBtn = document.getElementById('profilePanelFriendBtn');
        const profileName = document.getElementById('profileName');
        const profileAvatar = document.getElementById('profileAvatar');
        const profileClass = document.getElementById('profileClass');
        const profileSpecialties = document.getElementById('profileSpecialties');
        const profileStatus = document.getElementById('profileStatus');
        const profileStatusDot = document.getElementById('profileStatusDot');
        const profileBio = document.getElementById('profileBio');
        const conversationName = document.getElementById('conversationName');
        const conversationAvatar = document.getElementById('conversationAvatar');
        const conversationStatus = document.getElementById('conversationStatus');
        const conversationStatusDot = document.getElementById('conversationStatusDot');
        const messageAuthor = document.getElementById('messageAuthor');
        const messageAvatar = document.getElementById('messageAvatar');
        const incomingMessage = document.getElementById('incomingMessage');
        const replyMessage = document.getElementById('replyMessage');

        const showMobilePanel = (panel) => {
            if (!panel || !messagesApp || !window.matchMedia('(max-width: 650px)').matches) return;
            const panelIndex = Array.from(messagesApp.children).indexOf(panel);
            if (panelIndex >= 0) {
                messagesApp.scrollTo({ left: panelIndex * messagesApp.clientWidth, behavior: 'smooth' });
            }
        };

        messageContacts.forEach((contact) => {
            const nameElement = contact.querySelector('.JFEJ-contact-copy strong');
            const avatarElement = contact.querySelector('.JFEJ-contact-avatar');
            const safeProfileName = contact.dataset.profileName || contact.dataset.name || nameElement?.textContent.trim() || 'Inconnu';
            const safeProfileInitials = contact.dataset.profileInitials || contact.dataset.initials || (safeProfileName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '??');
            const safeProfileClass = contact.dataset.profileClass || contact.dataset.class || 'Élève';
            const safeProfileSpecialties = contact.dataset.profileSpecialties || contact.dataset.specialties || 'Aucune spécialité';
            const safeProfileStatus = contact.dataset.profileStatus || contact.dataset.status || 'online';
            const safeProfileBio = contact.dataset.profileBio || contact.dataset.bio || 'Aucune biographie renseignée.';
            const safeProfileColor = contact.dataset.profileColor || contact.dataset.color || 'violet';

            contact.dataset.profileName = safeProfileName;
            contact.dataset.profileInitials = safeProfileInitials;
            contact.dataset.profileClass = safeProfileClass;
            contact.dataset.profileSpecialties = safeProfileSpecialties;
            contact.dataset.profileStatus = safeProfileStatus;
            contact.dataset.profileBio = safeProfileBio;
            contact.dataset.profileColor = safeProfileColor;
        });

        const updateProfilePanelVisibility = (isVisible) => {
            if (!profilePanel) return;
            profilePanel.classList.toggle('is-open', isVisible);
            profilePanel.classList.toggle('is-hidden', !isVisible);
            if (messagesApp) messagesApp.classList.toggle('has-profile-panel', isVisible);
            if (profileToggle) {
                profileToggle.textContent = isVisible ? 'Masquer le profil' : 'Profil';
                profileToggle.setAttribute('aria-expanded', String(isVisible));
            }
            showMobilePanel(isVisible ? profilePanel : conversationPanel);
        };

        const updateFriendButton = (name) => {
            if (!profileFriendBtn) return;
            const friends = JSON.parse(localStorage.getItem('jfej_friends') || '[]');
            profileFriendBtn.textContent = friends.some((friend) => friend.name === name) ? '✓ Ami ajouté' : '+ Ajouter en amis';
        };

        const setContact = (contact) => {
            const { profileName: name, profileInitials: initials, profileClass: className, profileSpecialties: specialties, profileStatus: status, profileBio: bio, profileColor: color, messageOne, messageTwo } = contact.dataset;
            const isOnline = status === 'online';
            const presenceText = isOnline ? 'En ligne' : 'Hors ligne';
            const isGroup = !!(contact.closest('.JFEJ-club-list') || contact.dataset.profileGroup === 'true');

            messageContacts.forEach((item) => {
                const isSelected = item === contact;
                item.classList.toggle('is-selected', isSelected);
                item.setAttribute('aria-pressed', String(isSelected));
            });

            if (profileName) {
                profileName.textContent = name;
                profileName.dataset.profileName = name;
                profileName.dataset.profileInitials = initials;
                profileName.dataset.profileClass = className;
                profileName.dataset.profileSpecialties = specialties;
                profileName.dataset.profileStatus = status;
                profileName.dataset.profileBio = bio;
                profileName.dataset.profileColor = color;
            }
            if (profileToggle) {
                profileToggle.disabled = isGroup;
                updateProfilePanelVisibility(!isGroup && profilePanel?.classList.contains('is-open'));
            }
            if (profileClass) profileClass.textContent = className;
            if (profileSpecialties) profileSpecialties.textContent = specialties;
            if (profileStatus) profileStatus.textContent = presenceText;
            if (profileStatusDot) profileStatusDot.classList.toggle('is-online', isOnline);
            if (profileBio) profileBio.textContent = bio;

            if (conversationName) {
                conversationName.textContent = name;
                conversationName.dataset.profileName = name;
                conversationName.dataset.profileInitials = initials;
                conversationName.dataset.profileClass = className;
                conversationName.dataset.profileSpecialties = specialties;
                conversationName.dataset.profileStatus = status;
                conversationName.dataset.profileBio = bio;
                conversationName.dataset.profileColor = color;
            }
            if (conversationStatus) conversationStatus.textContent = presenceText;
            if (conversationStatusDot) conversationStatusDot.classList.toggle('is-online', isOnline);

            if (messageAuthor) {
                messageAuthor.textContent = name;
                messageAuthor.dataset.profileName = name;
                messageAuthor.dataset.profileInitials = initials;
                messageAuthor.dataset.profileClass = className;
                messageAuthor.dataset.profileSpecialties = specialties;
                messageAuthor.dataset.profileStatus = status;
                messageAuthor.dataset.profileBio = bio;
                messageAuthor.dataset.profileColor = color;
            }
            if (incomingMessage) incomingMessage.textContent = messageOne || 'Bienvenue dans la conversation !';
            if (replyMessage) replyMessage.textContent = messageTwo || 'Envoyez un message pour commencer.';

            const contactAvatar = contact.querySelector('.JFEJ-contact-avatar');
            [profileAvatar, conversationAvatar, messageAvatar].forEach((avatar) => {
                if (!avatar) return;
                const textSpan = avatar.querySelector('span:not(.JFEJ-presence)') || avatar;
                if (textSpan && textSpan !== avatar) textSpan.textContent = initials;
                else avatar.childNodes[0].nodeValue = initials;

                avatar.className = avatar.className.replace(/avatar-\w+|club-\w+/g, '').trim();
                if (contactAvatar) {
                    const matchedClass = Array.from(contactAvatar.classList).find(c => c.startsWith('avatar-') || c.startsWith('club-'));
                    if (matchedClass) avatar.classList.add(matchedClass);
                }
                const presence = avatar.querySelector('.JFEJ-presence');
                if (presence) presence.classList.toggle('is-online', isOnline);
            });
        };

        if (profileToggle) {
            profileToggle.addEventListener('click', () => {
                const shouldOpen = !profilePanel?.classList.contains('is-open');
                if (profileToggle.disabled) return;
                updateProfilePanelVisibility(shouldOpen);
            });
        }

        profileClose?.addEventListener('click', () => updateProfilePanelVisibility(false));
        contactsToggle?.addEventListener('click', () => showMobilePanel(contactsPanel));

        messagesApp?.addEventListener('scroll', () => {
            if (!window.matchMedia('(max-width: 650px)').matches) return;
            window.requestAnimationFrame(() => {
                const activePanelIndex = Math.round(messagesApp.scrollLeft / messagesApp.clientWidth);
                const isProfileVisible = messagesApp.children[activePanelIndex] === profilePanel;
                profilePanel?.classList.toggle('is-open', isProfileVisible);
                profilePanel?.classList.toggle('is-hidden', !isProfileVisible);
                if (profileToggle) {
                    profileToggle.textContent = isProfileVisible ? 'Masquer le profil' : 'Profil';
                    profileToggle.setAttribute('aria-expanded', String(isProfileVisible));
                }
            });
        });

        window.addEventListener('resize', () => {
            if (window.matchMedia('(max-width: 650px)').matches) {
                showMobilePanel(profilePanel?.classList.contains('is-open') ? profilePanel : conversationPanel);
            }
        });

        if (profileFriendBtn) {
            profileFriendBtn.addEventListener('click', () => {
                const activeName = profileName?.textContent?.trim() || 'Inconnu';
                const friends = JSON.parse(localStorage.getItem('jfej_friends') || '[]');
                const exists = friends.some((friend) => friend.name === activeName);
                if (exists) {
                    const nextFriends = friends.filter((friend) => friend.name !== activeName);
                    localStorage.setItem('jfej_friends', JSON.stringify(nextFriends));
                    profileFriendBtn.textContent = '+ Ajouter en amis';
                    return;
                }
                friends.push({ name: activeName, addedAt: new Date().toISOString() });
                localStorage.setItem('jfej_friends', JSON.stringify(friends));
                profileFriendBtn.textContent = '✓ Ami ajouté';
            });
        }

        messageContacts.forEach((contact) => {
            contact.addEventListener('click', () => {
                const isGroup = !!(contact.closest('.JFEJ-club-list') || contact.dataset.profileGroup === 'true');
                setContact(contact);
                if (isGroup) {
                    updateProfilePanelVisibility(false);
                    profileToggle.disabled = true;
                    return;
                }
                profileToggle.disabled = false;
                updateProfilePanelVisibility(false);
                showMobilePanel(conversationPanel);
            });
        });

        const requestedContact = new URLSearchParams(window.location.search).get('contact');
        const selectedContact = Array.from(messageContacts).find((contact) => (
            normalizeSearchText(contact.dataset.profileName || contact.dataset.name || '') === normalizeSearchText(requestedContact || '')
        )) || messageContacts[0];

        if (selectedContact) {
            setContact(selectedContact);
            const selectedIsGroup = !!(selectedContact.closest('.JFEJ-club-list') || selectedContact.dataset.profileGroup === 'true');
            profileToggle.disabled = selectedIsGroup;
            updateProfilePanelVisibility(false);
        } else {
            if (profileToggle) profileToggle.disabled = true;
            updateProfilePanelVisibility(false);
        }
    };

    initMessaging();

});