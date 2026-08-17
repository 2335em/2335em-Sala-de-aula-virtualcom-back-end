"use strict";

/* ============================================================
   SALA VIRTUAL
   JavaScript principal
   HTML + CSS + JavaScript puro
   ============================================================ */


/* ============================================================
   01. CONFIGURAÇÕES
   ============================================================ */

const CONFIG = Object.freeze({

    PAGES: {
        LOGIN: "index.html",
        PROFESSOR: "pages/professor.html",
        ESTUDANTE: "pages/estudante.html"
    },

    STORAGE_KEYS: {
        SESSION: "sala_virtual_session",
        PROFILE: "sala_virtual_profile",
        TEACHER_PROFILE: "sala_virtual_teacher_profile"
    }

});

const API_URL = 'http://localhost:3000/api';

async function authFetch(url, options = {}) {
    const session = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION);
    let token = '';
    if (session) {
        try {
            const parsed = JSON.parse(session);
            token = parsed.token || '';
        } catch (error) {
            token = '';
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION);
        window.location.href = CONFIG.PAGES.LOGIN;
        throw new Error('Sessão expirada');
    }

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const mensagem = data.error || data.message || `Falha na comunicação: Status ${response.status}`;
        throw new Error(mensagem);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}


/* ============================================================
    02. ESTADO GLOBAL
    ============================================================ */

const state = {

    classes: [],

    materials: [],

    announcements: [],

    selectedClassId: null

};


/* ============================================================
   04. UTILITÁRIOS
   ============================================================ */

function qs(selector, parent = document) {
    return parent.querySelector(selector);
}


function qsa(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function generateId(prefix = "item") {

    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

}


function isProfessorPage() {

    return document.body?.dataset?.userType === "professor";

}


function isStudentPage() {

    return document.body?.dataset?.userType === "estudante";

}


function isLoginPage() {

    return Boolean(
        document.getElementById("login-page")
    );

}


function navigateToSection(sectionName) {

    const sections =
        qsa("[data-page-section]");


    if (!sections.length) {
        return;
    }


    const target =
        qs(`[data-page-section="${sectionName}"]`) ||
        qs('[data-page-section="inicio"]');


    sections.forEach((section) => {

        const active =
            section === target;

        section.hidden =
            !active;

        section.classList.toggle(
            "active-section",
            active
        );

    });


    const links =
        qsa(".nav-link");

    links.forEach((link) => {

        const active =
            link.dataset.section ===
            target.id;

        link.classList.toggle(
            "active",
            active
        );

    });


    if (
        window.location.hash !==
        `#${target.id}`
    ) {

        history.replaceState(
            null,
            "",
            `#${target.id}`
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ============================================================
    05. STORAGE
    ============================================================ */

function readStorage(key, fallback = null) {

    try {

        const data =
            localStorage.getItem(key);

        if (!data) {
            return fallback;
        }

        const parsed =
            JSON.parse(data);

        return parsed;

    } catch (error) {

        console.warn(
            `Não foi possível ler ${key}.`,
            error
        );

        return fallback;
    }

}


function writeStorage(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn(
            `Não foi possível salvar ${key}.`,
            error
        );

    }

}


/* ============================================================
    06. CARREGAR DADOS
    ============================================================ */

async function loadData() {

    try {

        const [classes, materials, announcements] =
            await Promise.all([
                authFetch(`${API_URL}/classes`),
                authFetch(`${API_URL}/materials`),
                authFetch(`${API_URL}/announcements`)
            ]);

        state.classes = Array.isArray(classes) ? classes : [];
        state.materials = Array.isArray(materials) ? materials : [];
        state.announcements = Array.isArray(announcements) ? announcements : [];

    } catch (error) {

        console.error('Erro ao carregar dados:', error);
        state.classes = [];
        state.materials = [];
        state.announcements = [];

    }

}

/* ============================================================
    07. LOGIN
    ============================================================ */

async function initLogin() {

    const loginForm =
        qs("#login-form") || document.querySelector("form");

    if (!loginForm) {
        console.error("ERRO CRÍTICO: Formulário de login não encontrado no HTML!");
    }


    const profileButtons =
        qsa(".profile-option");

    const passwordInput =
        qs("#password");

    const passwordToggle =
        qs("#toggle-password");

    const message =
        qs("#login-message");

    const perfilInput =
        qs("#perfil-selecionado");

    let perfilSelecionado = "";


    function hideMessage() {

        if (!message) {
            return;
        }

        message.hidden = true;
        message.textContent = "";

    }


    function showMessage(text) {

        if (!message) {
            return;
        }

        message.textContent = text;
        message.hidden = false;

    }


    function setPerfil(perfil) {

        perfilSelecionado = perfil;

        if (perfilInput) {
            perfilInput.value = perfil;
        }

        profileButtons.forEach((button) => {

            const isActive =
                button.dataset.profile === perfil;

            button.classList.toggle(
                "ativo",
                isActive
            );

            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );

        });

        hideMessage();

    }


    profileButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const perfil =
                    button.dataset.profile;

                if (!perfil) {
                    return;
                }

                setPerfil(perfil);

            }
        );

    });


    if (passwordToggle && passwordInput) {

        passwordToggle.addEventListener(
            "click",
            () => {

                const isPassword =
                    passwordInput.type === "password";


                passwordInput.type =
                    isPassword
                        ? "text"
                        : "password";


                passwordToggle.textContent =
                    isPassword
                        ? "Ocultar"
                        : "Mostrar";


                passwordToggle.setAttribute(
                    "aria-label",
                    isPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                );


                passwordToggle.setAttribute(
                    "aria-pressed",
                    String(isPassword)
                );


                passwordInput.focus();

            }
        );

    }


    if (passwordInput) {

        passwordInput.addEventListener(
            "input",
            hideMessage
        );

    }


    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const password =
                    passwordInput?.value.trim() || "";

                const perfil =
                    perfilSelecionado ||
                    document.getElementById('perfil-selecionado')?.value ||
                    'PROFESSOR';

                console.log("Iniciando submit. Perfil:", perfil, "Senha informada:", Boolean(password));

                if (!perfilSelecionado && !document.getElementById('perfil-selecionado')?.value) {

                    showMessage(
                        "Selecione um perfil para continuar."
                    );

                    return;
                }

                if (!password) {

                    showMessage(
                        "Digite a senha."
                    );

                    passwordInput?.focus();

                    return;
                }

                try {

                    const response = await fetch('http://localhost:3000/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ role: perfil, password })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        const mensagem = data.error || data.message || `Falha na comunicação: Status ${response.status}`;
                        showMessage(mensagem);
                        return;
                    }

                    localStorage.setItem(
                        CONFIG.STORAGE_KEYS.SESSION,
                        JSON.stringify({
                            token: data.token,
                            user: data.user
                        })
                    );

                    const userRole = (data.user?.role || perfil).toUpperCase();
                    const destPage = (userRole === 'TEACHER' || userRole === 'PROFESSOR')
                        ? (typeof CONFIG !== 'undefined' && CONFIG.PAGES?.PROFESSOR ? CONFIG.PAGES.PROFESSOR : 'professor.html')
                        : (typeof CONFIG !== 'undefined' && CONFIG.PAGES?.ESTUDANTE ? CONFIG.PAGES.ESTUDANTE : 'estudante.html');

                    console.log("Navegando para:", destPage);
                    window.location.assign(destPage);

                } catch (error) {

                    showMessage("Falha na rede ou servidor offline. Detalhe: " + error.message);

                }
            }
        );
    }

}


/* ============================================================
   08. PROTEÇÃO BÁSICA DE PÁGINAS
   ============================================================ */

function validateDashboardAccess() {

    if (
        !isProfessorPage() &&
        !isStudentPage()
    ) {

        return;

    }


    const session =
        readStorage(
            CONFIG.STORAGE_KEYS.SESSION,
            null
        );


    console.log("Validando acesso. Página:", isProfessorPage() ? "professor" : "estudante", "Sessão:", session ? "encontrada" : "ausente");


    if (!session || !session.user) {

        console.warn("Acesso bloqueado: sessão ausente ou inválida.");
        redirectToLogin();

        return false;
    }


    const userRole = (session.user.role || "").toLowerCase();
    const expectedRole = isProfessorPage()
        ? "teacher"
        : "student";

    if (userRole !== expectedRole) {

        console.warn("Acesso bloqueado: role incompatível. Esperado:", expectedRole, "Recebido:", userRole);
        redirectToLogin();

        return false;
    }


    return true;

}


/* ============================================================
    09. SAIR
    ============================================================ */

function setupLogoutHandlers() {

    const logoutButtons =
        qsa("[data-logout]");


    logoutButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const dialog =
                    qs("#modal-logout");

                if (dialog) {
                    openDialog(dialog);
                }

            }
        );

    });


    const confirmButton =
        qs("#confirm-logout");

    if (!confirmButton) {
        return;
    }


    confirmButton.addEventListener(
        "click",
        () => {

            try {

                localStorage.removeItem(
                    CONFIG.STORAGE_KEYS.SESSION
                );

            } catch (error) {

                console.warn(
                    "Não foi possível limpar a sessão.",
                    error
                );

            }


            redirectToLogin();

        }
    );

}


function redirectToLogin() {

    window.location.href =
        isLoginPage()
            ? CONFIG.PAGES.LOGIN
            : "../" + CONFIG.PAGES.LOGIN;

}


/* ============================================================
   10. NAVEGAÇÃO DO DASHBOARD
   ============================================================ */

function initNavigation() {

    const sections =
        qsa("[data-page-section]");

    const links =
        qsa(".nav-link");


    if (!sections.length) {
        return;
    }


    function getSectionName() {

        const hash =
            window.location.hash.replace("#", "");

        return hash || "inicio";

    }


    function showSection(sectionName) {

        const requested =
            qs(
                `[data-page-section="${sectionName}"]`
            );


        const target =
            requested ||
            qs(
                `[data-page-section="inicio"]`
            );


        sections.forEach((section) => {

            const active =
                section === target;

            section.hidden =
                !active;

            section.classList.toggle(
                "active-section",
                active
            );

        });


        links.forEach((link) => {

            const active =
                link.dataset.section ===
                target.id;

            link.classList.toggle(
                "active",
                active
            );

        });


        if (
            window.location.hash !==
            `#${target.id}`
        ) {

            history.replaceState(
                null,
                "",
                `#${target.id}`
            );

        }

    }


    links.forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                showSection(
                    link.dataset.section ||
                    "inicio"
                );

            }
        );

    });


    qsa("[data-navigate-section]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.navigateSection;

                    if (!section) {
                        return;
                    }

                    showSection(section);

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }
            );

        });


    window.addEventListener(
        "hashchange",
        () => {
            showSection(
                getSectionName()
            );
        }
    );


    showSection(
        getSectionName()
    );

}


/* ============================================================
   11. RENDERIZAÇÃO DAS TURMAS
   ============================================================ */

function getClassById(id) {

    return state.classes.find(
        (item) => item.id === id
    ) || null;

}


function renderClasses() {

    const containers =
        qsa('[data-list="classes"]');


    if (!containers.length) {
        return;
    }


    const html =
        state.classes.length
            ? state.classes.map(
                (item) => {

                    return `
                        <article class="class-card">

                            <div class="class-card-header">

                                <div>

                                    <h3 class="class-card-title">
                                        ${escapeHTML(item.name)}
                                    </h3>

                                    <p class="class-card-school">
                                        ${escapeHTML(item.school || "Escola não informada")}
                                    </p>

                                </div>

                            </div>

                            <p class="class-card-description">
                                ${escapeHTML(item.description || "Sem descrição cadastrada.")}
                            </p>

                            <div class="class-card-footer">
                                <button
                                    type="button"
                                    class="secondary-button"
                                    data-class-action="view"
                                    data-class-id="${escapeHTML(item.id)}"
                                >
                                    Acessar
                                </button>
                                ${isProfessorPage() ? `
                                    <span class="class-card-actions">
                                        <button
                                            type="button"
                                            class="secondary-button"
                                            data-class-action="edit"
                                            data-class-id="${escapeHTML(item.id)}"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            class="secondary-button"
                                            data-class-action="delete"
                                            data-class-id="${escapeHTML(item.id)}"
                                        >
                                            Excluir
                                        </button>
                                    </span>
                                ` : ""}
                            </div>

                        </article>
                    `;

                }
            ).join("")
            : createEmptyState(
                "Nenhuma turma cadastrada",
                "Crie sua primeira turma para começar a organizar suas aulas."
            );


    containers.forEach(
        (container) => {

            container.innerHTML =
                html;

        }
    );


    attachClassActions();

}


function renderStudentClasses() {

    const containers =
        qsa('[data-list="student-classes"]');


    if (!containers.length) {
        return;
    }


    const html =
        state.classes.length
            ? state.classes.map(
                (item) => {

                    return `
                        <article class="class-card">

                            <div class="class-card-header">

                                <div>

                                    <h3 class="class-card-title">
                                        ${escapeHTML(item.name)}
                                    </h3>

                                    <p class="class-card-school">
                                        ${escapeHTML(item.school || "Escola não informada")}
                                    </p>

                                </div>

                            </div>

                            <p class="class-card-description">
                                ${escapeHTML(item.description || "Sem descrição cadastrada.")}
                            </p>

                            <div class="class-card-footer">

                                <span class="class-card-meta">
                                    Sala Virtual
                                </span>

                                <button
                                    type="button"
                                    class="secondary-button"
                                    data-class-action="view"
                                    data-class-id="${escapeHTML(item.id)}"
                                >
                                    Acessar
                                </button>

                            </div>

                        </article>
                    `;

                }
            ).join("")
            : createEmptyState(
                "Nenhuma turma disponível",
                "As turmas disponibilizadas pelo professor aparecerão aqui."
            );


    containers.forEach(
        (container) => {

            container.innerHTML =
                html;

        }
    );


    attachClassActions();

}


function attachClassActions() {
    qsa("[data-class-action]")
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    const classId = button.dataset.classId;
                    const action = button.dataset.classAction;
                    const turma = getClassById(classId);
                    if (!turma) {
                        return;
                    }
                    if (action === "delete") {
                        deleteClass(classId);
                        return;
                    }
                    if (action === "edit") {
                        openClassEditor(classId);
                        return;
                    }
                    if (action === "view") {
                        state.selectedClassId = classId;
                        showToast(
                            `${turma.name} acessada.`,
                            "success"
                        );
                        navigateToSection("materiais");
                        renderMaterials();
                        renderStudentMaterials();
                        renderAnnouncements();
                        renderStudentAnnouncements();
                        atualizarEstatisticasGlobais();
                        return;
                    }
                }
            );
        });
}
async function deleteClass(classId) {
    const turma = getClassById(classId);
    if (!turma || !isProfessorPage()) {
        return;
    }


    if (state.selectedClassId === classId) {
        state.selectedClassId = null;
    }


    try {

        await authFetch(`${API_URL}/classes/${classId}`, {
            method: 'DELETE'
        });

        state.classes = state.classes.filter(
            (item) => item.id !== classId
        );

        state.materials = state.materials.filter(
            (item) => item.classId !== classId
        );

        state.announcements = state.announcements.filter(
            (item) => {
                const targetIds =
                    getAnnouncementTargetClassIds(
                        item.turmasAlvo
                    );

                return !targetIds.includes(
                    classId
                );
            }
        );

        renderClasses();
        renderStudentClasses();
        renderMaterials();
        renderStudentMaterials();
        renderAnnouncements();
        renderStudentAnnouncements();
        atualizarEstatisticasGlobais();
        refreshMaterialFilter();
        showToast("Turma excluída com sucesso.", "success");

    } catch (error) {

        showToast(error.message || "Erro ao excluir turma.", "error");

    }

}
function openClassEditor(classId) {
    const dialog = qs("#class-dialog");
    const form = qs("#class-form");
    const turma = getClassById(classId);
    if (!dialog || !form || !turma || !isProfessorPage()) {
        return;
    }
    form.dataset.editingClassId = turma.id;
    qs("#class-dialog-title").textContent = "Editar turma";
    qs("#class-name").value = turma.name || "";
    qs("#class-school").value = turma.school || "";
    qs("#class-description").value = turma.description || "";
    openDialog(dialog);
}


/* ============================================================
   12. CRIAÇÃO DE TURMA
   ============================================================ */

function initClassActions() {

    if (!isProfessorPage()) {

        return;

    }


    const dialog =
        qs("#class-dialog");

    const form =
        qs("#class-form");


    qsa('[data-action="new-class"]')
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {
                    if (!dialog) {
                        showToast(
                            "A área de criação de turmas não está disponível nesta página."
                        );
                        return;
                    }
                    resetForm(form);
                    delete form.dataset.editingClassId;
                    const title = qs("#class-dialog-title");
                    if (title) {
                        title.textContent = "Criar turma";
                    }
                    openDialog(dialog);
                }
            );

        });


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!isProfessorPage()) {
                return;
            }


            const name =
                qs("#class-name")?.value.trim();

            const school =
                qs("#class-school")?.value.trim();

            const description =
                qs("#class-description")?.value.trim();


            if (!name) {

                showToast(
                    "Digite o nome da turma."
                );

                return;
            }


            try {

                const editingClassId = form.dataset.editingClassId;
                if (editingClassId) {

                    const turma = getClassById(editingClassId);
                    if (turma) {
                        turma.name = name;
                        turma.school = school || "Escola não informada";
                        turma.description = description || "Nova turma criada na Sala Virtual.";
                    }
                    delete form.dataset.editingClassId;

                    await authFetch(`${API_URL}/classes/${editingClassId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ name, school: school || "Escola não informada", description: description || "Nova turma criada na Sala Virtual." })
                    });

                    renderClasses();
                    renderStudentClasses();
                    atualizarEstatisticasGlobais();
                    refreshMaterialFilter();
                    closeDialog(dialog);
                    showToast("Turma atualizada com sucesso.", "success");
                    return;
                }

                const response = await authFetch(`${API_URL}/classes`, {
                    method: 'POST',
                    body: JSON.stringify({ name, school: school || "Escola não informada", description: description || "Nova turma criada na Sala Virtual." })
                });

                if (response && response.id) {
                    state.classes.push(response);
                }

                renderClasses();
                renderStudentClasses();
                atualizarEstatisticasGlobais();
                refreshMaterialFilter();
                closeDialog(dialog);
                showToast(
                    "Turma criada com sucesso.",
                    "success"
                );

            } catch (error) {

                showToast(error.message || "Erro ao salvar turma.", "error");

            }

        }
    );

}


/* ============================================================
    13. MATERIAIS
    ============================================================ */

async function deleteAnnouncement(id) {

    const announcement =
        state.announcements.find(
            (item) => item.id === id
        );

    if (!announcement || !isProfessorPage()) {
        return;
    }


    try {

        await authFetch(`${API_URL}/announcements/${id}`, {
            method: 'DELETE'
        });

        state.announcements =
            state.announcements.filter(
                (item) => item.id !== id
            );

        renderAnnouncements();
        renderStudentAnnouncements();
        atualizarEstatisticasGlobais();

        showToast(
            "Aviso excluído com sucesso.",
            "success"
        );

    } catch (error) {

        showToast(error.message || "Erro ao excluir aviso.", "error");

    }

}


function attachAnnouncementActions() {

    qsa("[data-announcement-action]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.announcementId;

                    const action =
                        button.dataset.announcementAction;


                    if (action === "delete") {

                        deleteAnnouncement(id);

                    }

                }
            );

        });

}


async function deleteMaterial(id) {

    const material =
        state.materials.find(
            (item) => item.id === id
        );

    if (!material || !isProfessorPage()) {
        return;
    }


    try {

        await authFetch(`${API_URL}/materials/${id}`, {
            method: 'DELETE'
        });

        state.materials =
            state.materials.filter(
                (item) => item.id !== id
            );

        renderMaterials();
        renderStudentMaterials();
        atualizarEstatisticasGlobais();

        showToast(
            "Material excluído com sucesso.",
            "success"
        );

    } catch (error) {

        showToast(error.message || "Erro ao excluir material.", "error");

    }

}


async function downloadMaterial(id) {

    const material =
        state.materials.find(
            (item) => item.id === id
        );

    if (!material) {
        return;
    }


    try {

        const session = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION);
        let token = '';
        if (session) {
            try {
                const parsed = JSON.parse(session);
                token = parsed.token || '';
            } catch (error) {
                token = '';
            }
        }

        const headers = {
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_URL}/materials/${id}/download`, {
            headers
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || `Falha no download: Status ${response.status}`);
        }

        const disposition = response.headers.get('Content-Disposition');
        let filename = 'material_baixado';
        if (disposition && disposition.includes('filename=')) {
            filename = disposition.split('filename=')[1].replace(/["']/g, '');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast(
            "Download iniciado.",
            "success"
        );

    } catch (error) {

        showToast(error.message || "Erro ao baixar material.", "error");

    }

}


function getMaterialTargetClassIds(turmasAlvo) {

    if (!Array.isArray(turmasAlvo)) {

        return [];

    }


    return turmasAlvo.filter(
        (id) => typeof id === "string" && id.trim()
    );

}


function getMaterialTargetClassNames(turmasAlvo) {

    const ids =
        getMaterialTargetClassIds(
            turmasAlvo
        );

    if (!ids.length) {
        return "";
    }


    const names =
        ids.map(
            (id) => {
                const turma =
                    getClassById(id);

                return turma
                    ? turma.name
                    : null;

            }
        ).filter(
            (name) => Boolean(name)
        );


    return names.join(", ");

}


function populateMaterialClasses() {

    const container =
        qs("#material-classes-container");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    const classes =
        state.classes.length
            ? state.classes
            : [];


    if (!classes.length) {
        container.innerHTML =
            "Nenhuma turma cadastrada. Crie uma turma primeiro.";

        return;
    }


    classes.forEach(
        (turma) => {

            const wrapper =
                document.createElement(
                    "label"
                );

            wrapper.className =
                "checkbox-item";


            const checkbox =
                document.createElement(
                    "input"
                );

            checkbox.type =
                "checkbox";

            checkbox.value =
                turma.id;

            checkbox.name =
                "material-classes";


            const text =
                document.createElement(
                    "span"
                );

            text.textContent =
                turma.name;


            wrapper.appendChild(
                checkbox
            );

            wrapper.appendChild(
                text
            );

            container.appendChild(
                wrapper
            );

        }
    );

}


function getMaterialIconHTML() {

    const basePath =
        window.location.pathname.includes('/pages/')
            ? '../'
            : './';

    const iconSrc =
        `${basePath}assets/images/6802306.png`;

    return `
        <div class="material-icon-container">
            <img
                src="${iconSrc}"
                alt="Ícone do Material"
                class="material-icon-img"
            />
        </div>
    `;

}


function renderMaterials() {

    const containers =
        qsa('[data-list="materials"]');


    if (!containers.length) {
        return;
    }


    const materials =
        state.selectedClassId
            ? state.materials.filter(
                (item) => item.classId === state.selectedClassId
            )
            : state.materials;


    const html =
        materials.length
            ? materials.map(
                (item) => {

                    const turma =
                        getClassById(
                            item.classId
                        );


                    return `
                        <article class="material-card">

                            ${getMaterialIconHTML()}

                            <div class="material-card-content">

                                <strong>
                                    ${escapeHTML(item.title)}
                                </strong>

                                <p>
                                    ${escapeHTML(item.description || "Sem descrição.")}
                                </p>

                                ${
                                    turma
                                        ? `<p>${escapeHTML(turma.name)}</p>`
                                        : ""
                                }

                            </div>

                            <div class="material-card-action">

                                ${
                                    item.type === "link" && item.url
                                        ? `
                                            <a
                                                class="secondary-button"
                                                href="${escapeHTML(item.url)}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Abrir
                                            </a>
                                        `
                                        : item.type === "arquivo" && item.url
                                            ? `
                                                <button
                                                    type="button"
                                                    class="secondary-button"
                                                    data-material-action="download"
                                                    data-material-id="${escapeHTML(item.id)}"
                                                >
                                                    Baixar
                                                </button>
                                            `
                                            : `
                                                <button
                                                    type="button"
                                                    class="secondary-button"
                                                    data-material-action="view"
                                                    data-material-id="${escapeHTML(item.id)}"
                                                >
                                                    Visualizar
                                                </button>
                                            `
                                }

                                ${
                                    isProfessorPage()
                                        ? `
                                            <button
                                                type="button"
                                                class="danger-button"
                                                data-material-action="delete"
                                                data-material-id="${escapeHTML(item.id)}"
                                                aria-label="Excluir material ${escapeHTML(item.title)}"
                                            >
                                                Excluir
                                            </button>
                                        `
                                        : ""
                                }

                            </div>

                        </article>
                    `;

                }
            ).join("")
            : createEmptyState(
                "Nenhum material disponível",
                "Os materiais cadastrados aparecerão nesta área."
            );


    containers.forEach(
        (container) => {

            container.innerHTML =
                html;

        }
    );


    attachMaterialActions();

}


function renderStudentMaterials() {

    const containers =
        qsa('[data-list="student-materials"]');


    if (!containers.length) {
        return;
    }


    renderMaterialCollection(
        containers
    );

}


function renderMaterialCollection(containers) {

    const materials =
        state.selectedClassId
            ? state.materials.filter(
                (item) => item.classId === state.selectedClassId
            )
            : state.materials;


    const html =
        materials.length
            ? materials.map(
                (item) => {

                    const turma =
                        getClassById(item.classId);


                    return `
                        <article class="material-card">

                            ${getMaterialIconHTML()}

                            <div class="material-card-content">

                                <strong>
                                    ${escapeHTML(item.title)}
                                </strong>

                                <p>
                                    ${escapeHTML(item.description || "Sem descrição.")}
                                </p>

                                ${
                                    turma
                                        ? `<p>${escapeHTML(turma.name)}</p>`
                                        : ""
                                }

                            </div>

                            <div class="material-card-action">

                                ${
                                    item.type === "link" && item.url
                                        ? `
                                            <a
                                                class="secondary-button"
                                                href="${escapeHTML(item.url)}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Abrir
                                            </a>
                                        `
                                        : item.type === "arquivo" && item.url
                                            ? `
                                                <button
                                                    type="button"
                                                    class="secondary-button"
                                                    data-material-action="download"
                                                    data-material-id="${escapeHTML(item.id)}"
                                                >
                                                    Baixar
                                                </button>
                                            `
                                            : `
                                                <button
                                                    type="button"
                                                    class="secondary-button"
                                                    data-material-action="view"
                                                    data-material-id="${escapeHTML(item.id)}"
                                                >
                                                    Visualizar
                                                </button>
                                            `
                                }

                                ${
                                    isProfessorPage()
                                        ? `
                                            <button
                                                type="button"
                                                class="danger-button"
                                                data-material-action="delete"
                                                data-material-id="${escapeHTML(item.id)}"
                                                aria-label="Excluir material ${escapeHTML(item.title)}"
                                            >
                                                Excluir
                                            </button>
                                        `
                                        : ""
                                }

                            </div>

                        </article>
                    `;

                }
            ).join("")
            : createEmptyState(
                "Nenhum material disponível",
                "Os materiais adicionados pelo professor aparecerão aqui."
            );


    containers.forEach(
        (container) => {

            container.innerHTML =
                html;

        }
    );


    attachMaterialActions();

}


function attachMaterialActions() {

    qsa("[data-material-action]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.materialId;

                    const action =
                        button.dataset.materialAction;

                    const material =
                        state.materials.find(
                            (item) =>
                                item.id === id
                        );


                    if (!material) {
                        return;
                    }


                    if (action === "delete") {

                        deleteMaterial(id);
                        return;

                    }


                    if (action === "download") {

                        downloadMaterial(id);
                        return;

                    }


                    showToast(
                        `${material.title} selecionado.`,
                        "success"
                    );

                }
            );

        });

}


/* ============================================================
   14. MODAL DE MATERIAL
   ============================================================ */

function initMaterialActions() {

    if (!isProfessorPage()) {

        return;

    }


    const dialog =
        qs("#material-dialog");

    const form =
        qs("#material-form");


    qsa('[data-action="new-material"]')
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    if (!isProfessorPage()) {
                        return;
                    }


                    if (!dialog) {
                        return;
                    }


                    resetForm(form);

                    populateMaterialClasses();

                    openDialog(dialog);

                }
            );

        });


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const title =
                qs("#material-title")?.value.trim();

            const description =
                qs("#material-description")?.value.trim();

            const type =
                qs("#material-type")?.value ||
                "arquivo";

            const file =
                qs("#material-file")?.files?.[0] ||
                null;

            const url =
                qs("#material-url")?.value.trim();


            if (!title) {

                showToast(
                    "Digite o título do material."
                );

                return;
            }


            if (
                type === "link" &&
                !url
            ) {

                showToast(
                    "Informe o link do material."
                );

                return;
            }


            const checkedBoxes =
                qsa(
                    '#material-classes-container input[type="checkbox"]:checked'
                );

            const turmasAlvo =
                checkedBoxes.map(
                    (checkbox) => checkbox.value
                );


            if (!turmasAlvo.length) {

                showToast(
                    "Por favor, selecione a turma."
                );

                return;
            }


            try {

                let response;
                const session = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION);
                let token = '';
                if (session) {
                    try {
                        const parsed = JSON.parse(session);
                        token = parsed.token || '';
                    } catch (error) {
                        token = '';
                    }
                }

                if (file) {
                    const formData = new FormData();
                    formData.append('title', title);
                    formData.append('description', description || "Material disponibilizado pelo professor.");
                    formData.append('type', type);
                    formData.append('classId', turmasAlvo[0] || state.selectedClassId || state.classes[0]?.id || "");
                    formData.append('file', file);

                    response = await fetch(`${API_URL}/materials`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });
                } else {
                    response = await authFetch(`${API_URL}/materials`, {
                        method: 'POST',
                        body: JSON.stringify({
                            title,
                            description: description || "Material disponibilizado pelo professor.",
                            type,
                            url: type === "link" ? url : "",
                            classId: turmasAlvo[0] || state.selectedClassId || state.classes[0]?.id || "",
                            turmasAlvo,
                            fileName: ""
                        })
                    });
                }

                const data = file ? await response.json() : response;

                if (!response.ok) {
                    const mensagem = (data && data.message) || `Falha na comunicação: Status ${response.status}`;
                    throw new Error(mensagem);
                }

                if (data && data.id) {
                    state.materials.push(data);
                }

                renderMaterials();
                renderStudentMaterials();
                atualizarEstatisticasGlobais();
                closeDialog(dialog);
                showToast(
                    "Material adicionado com sucesso.",
                    "success"
                );

            } catch (error) {

                showToast(error.message || "Erro ao adicionar material.", "error");

            }

        }
    );

}


/* ============================================================
   15. AVISOS
   ============================================================ */

function renderAnnouncements() {

    const containers =
        qsa('[data-list="announcements"]');


    if (!containers.length) {
        return;
    }


    const validClasses =
        Array.isArray(state.classes)
            ? state.classes
            : [];

    const validAnnouncements =
        Array.isArray(state.announcements)
            ? state.announcements
            : [];


    const filtered =
        state.selectedClassId
            ? validAnnouncements.filter(
                (item) => item.classId === state.selectedClassId
            )
            : validAnnouncements;


    const html =
        filtered.length
            ? filtered.map(
                (item) => {

                    const badges =
                        getAnnouncementTargetBadges(
                            item.turmasAlvo,
                            validClasses
                        );

                    return `
                        <article class="announcement-card">

                            <div class="announcement-card-header">

                                <div>

                                    <h3 class="announcement-title">
                                        ${escapeHTML(item.title)}
                                    </h3>

                                    <p class="announcement-content">
                                        ${escapeHTML(item.content)}
                                    </p>

                                    ${badges}

                                </div>

                                <span class="announcement-date">
                                    ${escapeHTML(item.date)}
                                </span>

                            </div>

                            ${
                                isProfessorPage()
                                    ? `
                                        <div class="announcement-card-actions">
                                            <button
                                                type="button"
                                                class="danger-button"
                                                data-announcement-action="delete"
                                                data-announcement-id="${escapeHTML(item.id)}"
                                                aria-label="Excluir aviso ${escapeHTML(item.title)}"
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    `
                                    : ""
                            }

                        </article>
                    `;

                }
            ).join("")
            : createEmptyState(
                "Nenhum aviso publicado",
                "Os avisos publicados pelo professor aparecerão aqui."
            );


    containers.forEach(
        (container) => {

            container.innerHTML =
                html;

        }
    );

    attachAnnouncementActions();

}


function renderStudentAnnouncements() {

    const containers =
        qsa('[data-list="student-announcements"]');


    if (!containers.length) {
        return;
    }


    const validClasses =
        Array.isArray(state.classes)
            ? state.classes
            : [];

    const validAnnouncements =
        Array.isArray(state.announcements)
            ? state.announcements
            : [];


    const filteredAnnouncements =
        state.selectedClassId
            ? validAnnouncements.filter(
                (item) => {
                    const targetIds =
                        getAnnouncementTargetClassIds(
                            item.turmasAlvo
                        );

                    return targetIds.includes(
                        state.selectedClassId
                    );
                }
            )
            : validAnnouncements;


    const html =
        filteredAnnouncements.length
            ? filteredAnnouncements.map(
                (item) => {

                    const badges =
                        getAnnouncementTargetBadges(
                            item.turmasAlvo,
                            validClasses
                        );

                    return `
                        <article class="announcement-card">

                            <div class="announcement-card-header">

                                <div>

                                    <h3 class="announcement-title">
                                        ${escapeHTML(item.title)}
                                    </h3>

                                    <p class="announcement-content">
                                        ${escapeHTML(item.content)}
                                    </p>

                                    ${badges}

                                </div>

                                <span class="announcement-date">
                                    ${escapeHTML(item.date)}
                                </span>

                            </div>

                        </article>
                    `;

                }
            ).join("")
            : createEmptyState(
                "Nenhum aviso disponível",
                "Os avisos do professor aparecerão nesta área."
            );


    containers.forEach(
        (container) => {

            container.innerHTML =
                html;

        }
    );

}


function getAnnouncementTargetClassIds(turmasAlvo) {

    if (!Array.isArray(turmasAlvo)) {

        return [];

    }


    return turmasAlvo.filter(
        (id) => typeof id === "string" && id.trim()
    );

}


function getAnnouncementTargetBadges(turmasAlvo, classes = []) {

    const ids =
        getAnnouncementTargetClassIds(
            turmasAlvo
        );

    if (!ids.length) {
        return "";
    }


    const classMap =
        Array.isArray(classes)
            ? classes.reduce(
                (map, turma) => {
                    map[turma.id] =
                        turma.name;

                    return map;

                },
                {}
            )
            : {};


    const badges =
        ids.map(
            (id) => {

                const name =
                    classMap[id];

                if (!name) {
                    return "";
                }

                return `
                    <span class="badge-turma">
                        ${escapeHTML(name)}
                    </span>
                `;

            }
        ).filter(
            (badge) => Boolean(badge)
        );


    return badges.join("");

}


function populateAnnouncementClasses() {

    const container =
        qs("#announcement-classes-container");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    const classes =
        state.classes.length
            ? state.classes
            : [];


    if (!classes.length) {
        container.innerHTML =
            createEmptyState(
                "Nenhuma turma disponível",
                "Cadastre turmas antes de publicar avisos."
            );

        return;
    }


    classes.forEach(
        (turma) => {

            const wrapper =
                document.createElement(
                    "label"
                );

            wrapper.className =
                "checkbox-item";


            const checkbox =
                document.createElement(
                    "input"
                );

            checkbox.type =
                "checkbox";

            checkbox.value =
                turma.id;

            checkbox.name =
                "announcement-classes";


            const text =
                document.createElement(
                    "span"
                );

            text.textContent =
                turma.name;


            wrapper.appendChild(
                checkbox
            );

            wrapper.appendChild(
                text
            );

            container.appendChild(
                wrapper
            );

        }
    );

}


/* ============================================================
    16. MODAL DE AVISOS
    ============================================================ */

function initAnnouncementActions() {

    if (!isProfessorPage()) {

        return;

    }


    const dialog =
        qs("#announcement-dialog");

    const form =
        qs("#announcement-form");


    qsa('[data-action="new-announcement"]')
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    if (!isProfessorPage()) {
                        return;
                    }


                    if (!dialog) {
                        return;
                    }


                    resetForm(form);

                    populateAnnouncementClasses();

                    openDialog(dialog);

                }
            );

        });


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const title =
                qs("#announcement-title")?.value.trim();

            const content =
                qs("#announcement-content")?.value.trim();


            if (!title) {

                showToast(
                    "Digite o título do aviso."
                );

                return;
            }


            if (!content) {

                showToast(
                    "Digite a mensagem do aviso."
                );

                return;
            }


            const checkedBoxes =
                qsa(
                    '#announcement-classes-container input[type="checkbox"]:checked'
                );

            const turmasAlvo =
                checkedBoxes.map(
                    (checkbox) => checkbox.value
                );


            if (!turmasAlvo.length) {

                showToast(
                    "Selecione pelo menos uma turma."
                );

                return;
            }


            try {

                const response = await authFetch(`${API_URL}/announcements`, {
                    method: 'POST',
                    body: JSON.stringify({
                        title,
                        content,
                        classId: turmasAlvo[0] || state.selectedClassId || state.classes[0]?.id || "",
                        turmasAlvo
                    })
                });

                if (response && response.id) {
                    state.announcements.unshift(response);
                }

                renderAnnouncements();
                renderStudentAnnouncements();
                atualizarEstatisticasGlobais();
                closeDialog(dialog);
                showToast(
                    "Aviso publicado com sucesso.",
                    "success"
                );

            } catch (error) {

                showToast(error.message || "Erro ao publicar aviso.", "error");

            }

        }
    );

}


/* ============================================================
    16B. PERFIL DO PROFESSOR
    ============================================================ */

function loadTeacherProfile() {

    if (!isProfessorPage()) {

        return;

    }


    const profile =
        readStorage(
            CONFIG.STORAGE_KEYS.TEACHER_PROFILE,
            {
                name: "Professor",
                email: "",
                discipline: "",
                degree: "",
                bio: "",
                avatar: ""
            }
        ) || {
            name: "Professor",
            email: "",
            discipline: "",
            degree: "",
            bio: "",
            avatar: ""
        };


    const nameEl =
        qs("#prof-name");

    const emailEl =
        qs("#prof-email");

    const disciplineEl =
        qs("#prof-discipline");

    const degreeEl =
        qs("#prof-degree");

    const bioEl =
        qs("#prof-bio");

    const avatarPreview =
        qs("#profile-avatar-preview");

    const userNameEl =
        qs("#header-prof-name");


    if (nameEl) {
        nameEl.value =
            profile.name || "";
    }

    if (emailEl) {
        emailEl.value =
            profile.email || "";
    }

    if (disciplineEl) {
        disciplineEl.value =
            profile.discipline || "";
    }

    if (degreeEl) {
        degreeEl.value =
            profile.degree || "";
    }

    if (bioEl) {
        bioEl.value =
            profile.bio || "";
    }


    if (avatarPreview) {
        avatarPreview.src =
            profile.avatar || "";
    }

    const headerAvatar =
        qs("#header-profile-avatar");

    if (headerAvatar) {
        headerAvatar.src =
            profile.avatar || "../assets/default-avatar.png";
    }


    if (userNameEl) {
        userNameEl.textContent =
            profile.name || "Professor";
    }


    const btnRemove =
        qs("#btn-remove-avatar");

    if (btnRemove) {
        btnRemove.style.display =
            profile.avatar ? "" : "none";
    }

}


function saveTeacherProfile(event) {

    event.preventDefault();


    const name =
        qs("#prof-name")?.value.trim() || "";

    const email =
        qs("#prof-email")?.value.trim() || "";

    const discipline =
        qs("#prof-discipline")?.value.trim() || "";

    const degree =
        qs("#prof-degree")?.value.trim() || "";

    const bio =
        qs("#prof-bio")?.value.trim() || "";

    const avatarPreview =
        qs("#profile-avatar-preview");

    const avatar =
        avatarPreview?.src || "";


    const profile = {

        name,

        email,

        discipline,

        degree,

        bio,

        avatar

    };


    writeStorage(
        CONFIG.STORAGE_KEYS.TEACHER_PROFILE,
        profile
    );


    loadTeacherProfile();


    showToast(
        "Perfil atualizado com sucesso.",
        "success"
    );

}


function initAvatarUpload() {

    const chooseBtn =
        qs("#btn-choose-avatar");

    const fileInput =
        qs("#input-avatar-file");

    const preview =
        qs("#profile-avatar-preview");

    const removeBtn =
        qs("#btn-remove-avatar");


    if (!chooseBtn || !fileInput) {
        return;
    }


    chooseBtn.addEventListener(
        "click",
        () => {
            fileInput.click();
        }
    );


    fileInput.addEventListener(
        "change",
        (event) => {

            const file =
                event.target.files?.[0];

            if (!file || !preview) {
                return;
            }


            const reader =
                new FileReader();

            reader.onload =
                (e) => {
                    preview.src =
                        e.target.result;

                    if (removeBtn) {
                        removeBtn.style.display =
                            "";
                    }
                };

            reader.readAsDataURL(
                file
            );

        }
    );


    if (removeBtn) {

        removeBtn.addEventListener(
            "click",
            () => {

                fileInput.value = "";

                preview.src = "";

                removeBtn.style.display =
                    "none";

            }
        );

    }

}


/* ============================================================
    17. PERFIL
    ============================================================ */

function initProfileActions() {

    const editButtons =
        qsa(
            '[data-action="edit-profile"]'
        );


    editButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    if (!isProfessorPage()) {
                        return;
                    }


                    navigateToSection(
                        "perfil-section"
                    );

                    loadTeacherProfile();

                }
            );

        }
    );


    const form =
        qs("#profile-form");

    if (form) {

        form.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();

                saveTeacherProfile(event);

            }
        );

    }


    initAvatarUpload();

}


/* ============================================================
   18. PESQUISA DE MATERIAIS — PROFESSOR
   ============================================================ */

function initMaterialSearch() {

    const input =
        qs("#material-search");


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        () => {

            const term =
                input.value
                    .trim()
                    .toLowerCase();


            const filtered =
                state.materials.filter(
                    (item) => {

                        const title =
                            String(
                                item.title || ""
                            ).toLowerCase();

                        const description =
                            String(
                                item.description || ""
                            ).toLowerCase();

                        const matchesTerm =
                            title.includes(term) ||
                            description.includes(term);

                        const matchesClass =
                            !state.selectedClassId ||
                            item.classId === state.selectedClassId;

                        return matchesTerm && matchesClass;

                    }
                );


            renderFilteredMaterials(
                filtered
            );

        }
    );

}


function renderFilteredMaterials(materials) {

    const containers =
        qsa('[data-list="materials"]');


    if (!containers.length) {
        return;
    }


    const html =
        materials.length
            ? materials.map(
                (item) => {

                    return `
                        <article class="material-card">

                            ${getMaterialIconHTML()}

                            <div class="material-card-content">

                                <strong>
                                    ${escapeHTML(item.title)}
                                </strong>

                                <p>
                                    ${escapeHTML(item.description || "")}
                                </p>

                            </div>

                            <div class="material-card-action">

                                ${
                                    item.type === "link" && item.url
                                        ? `
                                            <a
                                                class="secondary-button"
                                                href="${escapeHTML(item.url)}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Abrir
                                            </a>
                                        `
                                        : item.type === "arquivo" && item.fileName
                                            ? `
                                                <a
                                                    class="secondary-button"
                                                    href="${escapeHTML(item.url || item.fileName)}"
                                                    download="${escapeHTML(item.fileName)}"
                                                >
                                                    Baixar
                                                </a>
                                            `
                                            : `
                                                <button
                                                    type="button"
                                                    class="secondary-button"
                                                    data-material-action="view"
                                                    data-material-id="${escapeHTML(item.id)}"
                                                >
                                                    Visualizar
                                                </button>
                                            `
                                }

                                ${
                                    isProfessorPage()
                                        ? `
                                            <button
                                                type="button"
                                                class="danger-button"
                                                data-material-action="delete"
                                                data-material-id="${escapeHTML(item.id)}"
                                                aria-label="Excluir material ${escapeHTML(item.title)}"
                                            >
                                                Excluir
                                            </button>
                                        `
                                        : ""
                                }

                            </div>

                        </article>
                    `;

                }
            ).join("")
            : createEmptyState(
                "Nenhum resultado encontrado",
                "Tente pesquisar por outro termo."
            );


    containers.forEach(
        (container) => {

            container.innerHTML =
                html;

        }
    );


    attachMaterialActions();

}


/* ============================================================
   19. PESQUISA DE MATERIAIS — ESTUDANTE
   ============================================================ */

function initStudentMaterialSearch() {

    const input =
        qs("#student-material-search");


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        () => {

            const term =
                input.value
                    .trim()
                    .toLowerCase();


            const filtered =
                state.materials.filter(
                    (item) => {

                        const text =
                            `
                            ${item.title || ""}
                            ${item.description || ""}
                            `
                                .toLowerCase();

                        const matchesTerm =
                            text.includes(term);

                        const matchesClass =
                            !state.selectedClassId ||
                            item.classId === state.selectedClassId;

                        return matchesTerm && matchesClass;

                    }
                );


            const containers =
                qsa(
                    '[data-list="student-materials"]'
                );


            renderFilteredStudentMaterials(
                filtered,
                containers
            );

        }
    );

}


function renderFilteredStudentMaterials(
    materials,
    containers
) {

    const html =
        materials.length
            ? materials.map(
                (item) => {

                    return `
                        <article class="material-card">

                            ${getMaterialIconHTML()}

                            <div class="material-card-content">

                                <strong>
                                    ${escapeHTML(item.title)}
                                </strong>

                                <p>
                                    ${escapeHTML(item.description || "")}
                                </p>

                            </div>

                            <div class="material-card-action">

                                ${
                                    item.type === "link" && item.url
                                        ? `
                                            <a
                                                class="secondary-button"
                                                href="${escapeHTML(item.url)}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Abrir
                                            </a>
                                        `
                                        : item.type === "arquivo" && item.fileName
                                            ? `
                                                <a
                                                    class="secondary-button"
                                                    href="${escapeHTML(item.url || item.fileName)}"
                                                    download="${escapeHTML(item.fileName)}"
                                                >
                                                    Baixar
                                                </a>
                                            `
                                            : `
                                                <button
                                                    type="button"
                                                    class="secondary-button"
                                                    data-material-action="view"
                                                    data-material-id="${escapeHTML(item.id)}"
                                                >
                                                    Visualizar
                                                </button>
                                            `
                                }

                            </div>

                        </article>
                    `;

                }
            ).join("")
            : createEmptyState(
                "Nenhum resultado encontrado",
                "Tente pesquisar por outro termo."
            );


    containers.forEach(
        (container) => {

            container.innerHTML =
                html;

        }
    );


    attachMaterialActions();

}


/* ============================================================
   20. FILTRO DE MATERIAL POR TURMA
   ============================================================ */

function initMaterialFilter() {

    const select =
        qs("#material-filter");


    if (!select) {
        return;
    }


    populateClassFilter(
        select
    );


    select.addEventListener(
        "change",
        () => {

            const value =
                select.value;


            if (value === "all") {

                renderMaterials();

                return;
            }


            const filtered =
                state.materials.filter(
                    (item) =>
                        item.classId === value
                );


            renderFilteredMaterials(
                filtered
            );

        }
    );

}


function populateClassFilter(select) {

    select.innerHTML = "";

    const allOption =
        document.createElement("option");

    allOption.value =
        "all";

    allOption.textContent =
        "Todas as turmas";

    select.appendChild(
        allOption
    );


    state.classes.forEach(
        (item) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item.id;

            option.textContent =
                item.name;

            select.appendChild(
                option
            );

        }
    );

}


function refreshMaterialFilter() {

    const select =
        qs("#material-filter");

    if (!select) {
        return;
    }


    const currentValue =
        select.value;

    populateClassFilter(select);


    const exists =
        currentValue === "all" ||
        state.classes.some(
            (item) => item.id === currentValue
        );

    if (exists) {
        select.value =
            currentValue;
    }

}


/* ============================================================
    21. ATUALIZAÇÃO DOS INDICADORES
    ============================================================ */

function atualizarEstatisticasGlobais() {

    const turmasArray =
        Array.isArray(state.classes)
            ? state.classes
            : [];

    const materiaisArray =
        Array.isArray(state.materials)
            ? state.materials
            : [];

    const avisosArray =
        Array.isArray(state.announcements)
            ? state.announcements
            : [];


    const countTurmas =
        qs("#count-turmas");

    const countMateriais =
        qs("#count-materiais");

    const countAvisos =
        qs("#count-avisos");


    if (countTurmas) {
        countTurmas.textContent =
            turmasArray.length;
    }

    if (countMateriais) {
        countMateriais.textContent =
            materiaisArray.length;
    }

    if (countAvisos) {
        countAvisos.textContent =
            avisosArray.length;
    }


    qsa('[data-stat="classes"]')
        .forEach(
            (element) => {
                element.textContent =
                    turmasArray.length;
            }
        );

    qsa('[data-stat="materials"]')
        .forEach(
            (element) => {
                element.textContent =
                    materiaisArray.length;
            }
        );

    qsa('[data-stat="announcements"]')
        .forEach(
            (element) => {
                element.textContent =
                    avisosArray.length;
            }
        );

    qsa('[data-stat="student-classes"]')
        .forEach(
            (element) => {
                element.textContent =
                    turmasArray.length;
            }
        );

    qsa('[data-stat="student-materials"]')
        .forEach(
            (element) => {
                element.textContent =
                    materiaisArray.length;
            }
        );

    qsa('[data-stat="student-announcements"]')
        .forEach(
            (element) => {
                element.textContent =
                    avisosArray.length;
            }
        );


    const profileClasses =
        qs("#student-profile-classes");

    if (profileClasses) {
        profileClasses.textContent =
            turmasArray.length;
    }

}


/* ============================================================
   22. ESTADOS VAZIOS
   ============================================================ */

function createEmptyState(
    title,
    description
) {

    return `
        <div class="empty-state">

            <span
                class="empty-state-icon"
                aria-hidden="true"
            >
                SV
            </span>

            <h3>
                ${escapeHTML(title)}
            </h3>

            <p>
                ${escapeHTML(description)}
            </p>

        </div>
    `;

}


/* ============================================================
   23. TOAST
   ============================================================ */

function showToast(
    message,
    type = "default"
) {

    const container =
        qs("#toast-container");


    if (!container) {

        console.info(
            message
        );

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast";


    if (type === "success") {

        toast.style.borderColor =
            "rgba(55, 109, 61, 0.20)";

        toast.style.background =
            "#f2f8f1";

        toast.style.color =
            "#245f38";

    }


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    window.setTimeout(
        () => {

            toast.remove();

        },
        3500
    );

}


/* ============================================================
   24. MODAIS
   ============================================================ */

function initDialogs() {

    qsa("[data-close-dialog]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const dialog =
                        button.closest("dialog");

                    closeDialog(
                        dialog
                    );

                }
            );

        });


    qsa("dialog")
        .forEach((dialog) => {

            dialog.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target ===
                        dialog
                    ) {

                        closeDialog(
                            dialog
                        );

                    }

                }
            );

        });

}


function openDialog(dialog) {

    if (!dialog) {
        return;
    }


    if (
        typeof dialog.showModal ===
        "function"
    ) {

        dialog.showModal();

    } else {

        dialog.setAttribute(
            "open",
            ""
        );

    }

}


function closeDialog(dialog) {

    if (!dialog) {
        return;
    }


    if (
        typeof dialog.close ===
        "function"
    ) {

        dialog.close();

    } else {

        dialog.removeAttribute(
            "open"
        );

    }

}


/* ============================================================
   25. FORMULÁRIOS
   ============================================================ */

function resetForm(form) {

    if (!form) {
        return;
    }

    form.reset();

}


/* ============================================================
   26. CARREGAMENTO DO PERFIL
   ============================================================ */

function initStudentProfile() {

    if (!isStudentPage()) {
        return;
    }


    const studentName =
        qs("#student-name");

    const profileName =
        qs("#student-profile-name");


    /*
     * Como ainda não existe uma conta individual
     * de estudante, mantemos um nome genérico.
     */

    if (studentName) {

        studentName.textContent =
            "Estudante";

    }


    if (profileName) {

        profileName.textContent =
            "Estudante";

    }

}


/* ============================================================
   27. CHECAGEM DE LINKS E REFERÊNCIAS
   ============================================================ */

function checkRequiredElements() {

    if (isLoginPage()) {

        const requiredSelectors = [

            "#login-form",
            "#password",
            "#login-button",
            "#login-message"

        ];


        requiredSelectors.forEach(
            (selector) => {

                if (!qs(selector)) {

                    console.warn(
                        `Elemento esperado não encontrado: ${selector}`
                    );

                }

            }
        );

    }


    if (
        isProfessorPage() ||
        isStudentPage()
    ) {

        const optionalSelectors = [

            ".dashboard-header",
            ".dashboard-main",
            ".main-navigation",
            "[data-logout]",
            "#toast-container"

        ];


        optionalSelectors.forEach(
            (selector) => {

                if (!qs(selector)) {

                    console.warn(
                        `Elemento esperado não encontrado: ${selector}`
                    );

                }

            }
        );

    }

}


/* ============================================================
    28. INICIALIZAÇÃO DO DASHBOARD
    ============================================================ */

function initQuickActions() {

    if (!isProfessorPage()) {

        return;

    }


    const quickClass =
        qs("#btn-quick-class");

    const quickMaterial =
        qs("#btn-quick-material");

    const quickAnnouncement =
        qs("#btn-quick-announcement");


    if (quickClass) {

        quickClass.addEventListener(
            "click",
            () => {
                navigateToSection("turmas");
                setTimeout(
                    () => {
                        const dialog =
                            qs("#class-dialog");

                        if (dialog) {
                            openDialog(dialog);
                        }

                    },
                    150
                );
            }
        );

    }


    if (quickMaterial) {

        quickMaterial.addEventListener(
            "click",
            () => {
                navigateToSection("materiais");
                setTimeout(
                    () => {
                        const dialog =
                            qs("#material-dialog");

                        if (dialog) {
                            openDialog(dialog);
                        }

                    },
                    150
                );
            }
        );

    }


    if (quickAnnouncement) {

        quickAnnouncement.addEventListener(
            "click",
            () => {
                navigateToSection("avisos");
                setTimeout(
                    () => {
                        const dialog =
                            qs("#announcement-dialog");

                        if (dialog) {
                            openDialog(dialog);
                        }

                    },
                    150
                );
            }
        );

    }

}


async function initDashboard() {

    if (
        !isProfessorPage() &&
        !isStudentPage()
    ) {

        return;
    }


    if (
        !validateDashboardAccess()
    ) {

        return;
    }


    await loadData();


    setupLogoutHandlers();

    initNavigation();

    initDialogs();

    initClassActions();

    initMaterialActions();

    initAnnouncementActions();

    initProfileActions();

    loadTeacherProfile();

    initQuickActions();

    initMaterialSearch();

    initStudentMaterialSearch();

    initMaterialFilter();

    initStudentProfile();


    renderClasses();

    renderStudentClasses();

    renderMaterials();

    renderStudentMaterials();

    renderAnnouncements();

    renderStudentAnnouncements();

    atualizarEstatisticasGlobais();

}


/* ============================================================
   29. INICIALIZAÇÃO GERAL
   ============================================================ */

async function initializeApplication() {

    checkRequiredElements();


    if (isLoginPage()) {

        initLogin();

        return;

    }


    await loadData();

    initDashboard();

}


/* ============================================================
   30. INICIALIZAÇÃO SEGURA
   ============================================================ */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            initializeApplication().catch((error) => {
                console.error('Erro na inicialização:', error);
            });
        },
        { once: true }
    );

} else {

    initializeApplication().catch((error) => {
        console.error('Erro na inicialização:', error);
    });

}