// js/app.js
(() => {
    const STORAGE_KEY = "receipt_editor_state_v2";

    // Page
    const backBtn = document.getElementById("backBtn");

    const titleText = document.getElementById("titleText");
    const amountText = document.getElementById("amountText");
    const fiatText = document.getElementById("fiatText");
    const dateText = document.getElementById("dateText");

    const networkIcon = document.getElementById("networkIcon");
    const networkText = document.getElementById("networkText");

    const txHashText = document.getElementById("txHashText");

    // Modal
    const overlay = document.getElementById("editorOverlay");
    const closeX = document.getElementById("editorClose");
    const closeOnlyBtn = document.getElementById("closeOnlyBtn");
    const realBackBtn = document.getElementById("realBackBtn");
    const form = document.getElementById("editorForm");
    const modal = document.getElementById("editorModal");

    // Inputs
    const fTitle = document.getElementById("fTitle");
    const fAmount = document.getElementById("fAmount");
    const fCurrency = document.getElementById("fCurrency");
    const fFiat = document.getElementById("fFiat");
    const fDateText = document.getElementById("fDateText");
    const fNetworkIcon = document.getElementById("fNetworkIcon");
    const fNetworkName = document.getElementById("fNetworkName");
    const fTxText = document.getElementById("fTxText");

    // ---------- Keyboard / VisualViewport fix ----------
    function updateViewportVars() {
        const vv = window.visualViewport;
        const vvh = vv ? vv.height : window.innerHeight;

        let kb = 0;
        if (vv) {
            const diff = window.innerHeight - vv.height - vv.offsetTop;
            kb = Math.max(0, diff);
        }

        document.documentElement.style.setProperty("--vvh", `${vvh}px`);
        document.documentElement.style.setProperty("--kb", `${kb}px`);
    }

    function enableViewportListeners() {
        updateViewportVars();
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", updateViewportVars);
            window.visualViewport.addEventListener("scroll", updateViewportVars);
        }
        window.addEventListener("resize", updateViewportVars);
    }

    function disableViewportListeners() {
        if (window.visualViewport) {
            window.visualViewport.removeEventListener("resize", updateViewportVars);
            window.visualViewport.removeEventListener("scroll", updateViewportVars);
        }
        window.removeEventListener("resize", updateViewportVars);
        document.documentElement.style.removeProperty("--vvh");
        document.documentElement.style.removeProperty("--kb");
    }

    function ensureActiveFieldVisible() {
        const el = document.activeElement;
        if (!el) return;
        if (!modal.contains(el)) return;

        setTimeout(() => {
            try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
        }, 80);
    }

    // ---------- Helpers ----------
    function openEditor() {
        overlay.hidden = false;
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        enableViewportListeners();
        updateViewportVars();

        setTimeout(() => fTitle.focus(), 50);
    }

    function closeEditor() {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        disableViewportListeners();
    }

    function normalizeNumberInput(value) {
        if (!value) return "";
        return String(value).trim().replace(/\s+/g, "").replace(",", ".");
    }

    function formatMoneyRu(value, fractionDigits = 2) {
        const n = Number(value);
        if (!Number.isFinite(n)) return "";
        return new Intl.NumberFormat("ru-RU", {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        }).format(n);
    }

    function formatUsdt(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return "";
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);
    }

    function doRealBack() {
        const tg = window.Telegram && window.Telegram.WebApp;
        if (tg && typeof tg.close === "function") {
            tg.close();
            return;
        }
        window.history.back();
    }

    function loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function readStateFromPage() {
        const title = titleText.textContent.trim() || "Получены средства";

        const amountRaw = amountText.textContent.trim(); // "+97.31 USDT"
        const amountNum = normalizeNumberInput(
            amountRaw.replace(/[^\d.,]/g, " ").trim().split(/\s+/)[0] || ""
        );
        const currency = (amountRaw.replace(/[+\d\s.,]/g, "").trim() || "USDT");

        const fiatRaw = fiatText.textContent.trim(); // "7 683.55 ₽"
        const fiatNum = normalizeNumberInput(fiatRaw.replace(/[^\d.,\s]/g, "").trim());

        const dateStr = dateText.textContent.trim();

        const netName = networkText.textContent.trim() || "TRON";
        const iconSrc = (networkIcon.getAttribute("src") || "assets/icons/Trx.svg");
        const iconFile = iconSrc.split("/").pop() || "Trx.svg";

        const txStr = txHashText.textContent.trim();

        return {
            title,
            amount: amountNum,
            currency,
            fiat: fiatNum,
            dateText: dateStr,
            networkName: netName,
            networkIconFile: iconFile,
            txText: txStr,
        };
    }

    function applyStateToPage(state) {
        if (state.title && state.title.trim()) titleText.textContent = state.title.trim();

        const amt = formatUsdt(state.amount);
        const cur = (state.currency || "USDT").trim() || "USDT";
        if (amt) amountText.textContent = `+${amt} ${cur}`;

        const fiat = formatMoneyRu(state.fiat);
        if (fiat) fiatText.textContent = `${fiat} ₽`;

        if (state.dateText && state.dateText.trim()) dateText.textContent = state.dateText.trim();

        if (state.networkName && state.networkName.trim()) networkText.textContent = state.networkName.trim();

        if (state.networkIconFile && state.networkIconFile.trim()) {
            networkIcon.setAttribute("src", `assets/icons/${state.networkIconFile.trim()}`);
        }

        if (state.txText && state.txText.trim()) txHashText.textContent = state.txText.trim();
    }

    function fillForm(state) {
        fTitle.value = state.title || "Получены средства";
        fAmount.value = state.amount || "";
        fCurrency.value = state.currency || "USDT";
        fFiat.value = state.fiat || "";
        fDateText.value = state.dateText || "";
        fNetworkIcon.value = state.networkIconFile || "Trx.svg";
        fNetworkName.value = state.networkName || "TRON";
        fTxText.value = state.txText || "";
    }

    function getFormState(prevState) {
        const next = { ...prevState };
        next.title = (fTitle.value || "").trim();
        next.amount = normalizeNumberInput(fAmount.value);
        next.currency = (fCurrency.value || "USDT").trim();
        next.fiat = normalizeNumberInput(fFiat.value);
        next.dateText = (fDateText.value || "").trim();
        next.networkIconFile = (fNetworkIcon.value || "Trx.svg").trim();
        next.networkName = (fNetworkName.value || "").trim() || prevState.networkName || "TRON";
        next.txText = (fTxText.value || "").trim();
        return next;
    }

    // ---------- Init ----------
    const pageState = readStateFromPage();
    const saved = loadState();
    let state = saved ? { ...pageState, ...saved } : { ...pageState };

    applyStateToPage(state);

    // ---------- Events ----------
    backBtn.addEventListener("click", () => {
        const currentSaved = loadState();
        state = currentSaved ? { ...pageState, ...currentSaved } : { ...pageState };
        fillForm(state);
        openEditor();
    });

    closeX.addEventListener("click", closeEditor);
    closeOnlyBtn.addEventListener("click", closeEditor);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeEditor();
    });

    document.addEventListener("keydown", (e) => {
        if (!overlay.hidden && e.key === "Escape") closeEditor();
    });

    realBackBtn.addEventListener("click", () => {
        doRealBack();
    });

    form.addEventListener("focusin", ensureActiveFieldVisible);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const currentSaved = loadState();
        const current = currentSaved ? { ...pageState, ...currentSaved } : { ...pageState };

        const next = getFormState(current);
        applyStateToPage(next);
        saveState(next);

        state = next;
        closeEditor();
    });

    // авто-подсказка названия сети по выбранной иконке (если поле пустое)
    fNetworkIcon.addEventListener("change", () => {
        const name = (fNetworkName.value || "").trim();
        if (name.length) return;

        const file = (fNetworkIcon.value || "").toLowerCase();

        if (file.includes("trx")) fNetworkName.value = "TRON";
        else if (file.includes("ton")) fNetworkName.value = "TON";
        else if (file.includes("bep")) fNetworkName.value = "BEP20";
        else if (file.includes("spl")) fNetworkName.value = "SPL";
        else if (file.includes("erc")) fNetworkName.value = "ERC20";
    });
})();