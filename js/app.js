// js/app.js

(() => {
    const STORAGE_KEY = "receipt_editor_state_v1";

    // Page elements
    const backBtn = document.getElementById("backBtn");

    const titleText = document.getElementById("titleText");
    const amountText = document.getElementById("amountText");
    const fiatText = document.getElementById("fiatText");
    const dateText = document.getElementById("dateText");
    const networkText = document.getElementById("networkText");
    const txHashText = document.getElementById("txHashText");
    const txLink = document.getElementById("txLink");

    // Modal elements
    const overlay = document.getElementById("editorOverlay");
    const closeBtn = document.getElementById("editorClose");
    const form = document.getElementById("editorForm");
    const realBackBtn = document.getElementById("realBackBtn");
    const resetBtn = document.getElementById("resetBtn");

    // Inputs
    const fTitle = document.getElementById("fTitle");
    const fSign = document.getElementById("fSign");
    const fAmount = document.getElementById("fAmount");
    const fCurrency = document.getElementById("fCurrency");
    const fFiat = document.getElementById("fFiat");
    const fDate = document.getElementById("fDate");
    const fTime = document.getElementById("fTime");
    const fNetwork = document.getElementById("fNetwork");
    const fTxText = document.getElementById("fTxText");
    const fTxUrl = document.getElementById("fTxUrl");

    // ---------- helpers ----------
    function openEditor() {
        overlay.hidden = false;
        overlay.setAttribute("aria-hidden", "false");
        setTimeout(() => fAmount.focus(), 50);
    }

    function closeEditor() {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
    }

    function normalizeNumberInput(value) {
        if (!value) return "";
        return String(value)
            .trim()
            .replace(/\s+/g, "")
            .replace(",", ".");
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

    function formatDateRu(dateStr, timeStr) {
        if (!dateStr && !timeStr) return "";
        try {
            if (dateStr) {
                const [y, m, d] = dateStr.split("-").map(Number);
                const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
                const datePart = new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "long",
                }).format(dt);
                return timeStr ? `${datePart} в ${timeStr}` : datePart;
            }
            return timeStr || "";
        } catch {
            return "";
        }
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
        const amountRaw = amountText.textContent.trim(); // "+97.31 USDT"
        const fiatRaw = fiatText.textContent.trim();     // "7 683.55 ₽"

        const signMatch = amountRaw.match(/^([+-])/);
        const sign = signMatch ? signMatch[1] : "+";

        const numberPart = amountRaw.replace(/[^\d.,]/g, " ").trim().split(/\s+/)[0] || "";
        const currencyPart = amountRaw.replace(/[+-\d\s.,]/g, "").trim() || "USDT";

        const fiatNum = normalizeNumberInput(fiatRaw.replace(/[^\d.,\s]/g, "").trim());

        return {
            title: titleText.textContent.trim() || "Получены средства",
            sign,
            amount: normalizeNumberInput(numberPart),
            currency: currencyPart,
            fiat: fiatNum,
            date: "",
            time: "",
            dateText: dateText.textContent.trim(),
            network: networkText.textContent.trim() || "TRON",
            txText: txHashText.textContent.trim(),
            txUrl: txLink.getAttribute("href") || "",
        };
    }

    function applyStateToPage(state) {
        // title
        if (typeof state.title === "string" && state.title.trim()) {
            titleText.textContent = state.title.trim();
        }

        // amount
        const sgn = state.sign === "-" ? "-" : "+";
        const amt = formatUsdt(state.amount);
        const cur = (state.currency || "USDT").trim() || "USDT";
        if (amt) amountText.textContent = `${sgn}${amt} ${cur}`;

        // fiat
        const fiat = formatMoneyRu(state.fiat);
        if (fiat) fiatText.textContent = `${fiat} ₽`;

        // date
        const prettyDate = (state.date || state.time)
            ? formatDateRu(state.date, state.time)
            : (state.dateText || "");
        if (prettyDate) dateText.textContent = prettyDate;

        // network
        if (typeof state.network === "string" && state.network.trim()) {
            networkText.textContent = state.network.trim();
        }

        // tx
        if (typeof state.txText === "string" && state.txText.trim()) {
            txHashText.textContent = state.txText.trim();
        }

        const url = (state.txUrl || "").trim();
        txLink.setAttribute("href", url.length ? url : "#");
    }

    function fillForm(state) {
        fTitle.value = state.title || "Получены средства";
        fSign.value = state.sign === "-" ? "-" : "+";
        fAmount.value = state.amount || "";
        fCurrency.value = state.currency || "USDT";
        fFiat.value = state.fiat || "";
        fDate.value = state.date || "";
        fTime.value = state.time || "";
        fNetwork.value = state.network || "TRON";
        fTxText.value = state.txText || "";
        fTxUrl.value = state.txUrl || "";
    }

    function getFormState(prevState) {
        const next = { ...prevState };

        next.title = (fTitle.value || "").trim();

        next.sign = fSign.value === "-" ? "-" : "+";
        next.amount = normalizeNumberInput(fAmount.value);
        next.currency = (fCurrency.value || "USDT").trim();
        next.fiat = normalizeNumberInput(fFiat.value);

        next.date = fDate.value || "";
        next.time = fTime.value || "";
        if (next.date || next.time) next.dateText = "";

        next.network = (fNetwork.value || "TRON").trim();
        next.txText = (fTxText.value || "").trim();
        next.txUrl = (fTxUrl.value || "").trim();

        return next;
    }

    // ---------- init ----------
    const pageState = readStateFromPage();
    const saved = loadState();
    let state = saved ? { ...pageState, ...saved } : { ...pageState };

    applyStateToPage(state);

    // ---------- events ----------
    backBtn.addEventListener("click", () => {
        // всегда открываем форму с актуальным state
        const currentSaved = loadState();
        state = currentSaved ? { ...pageState, ...currentSaved } : { ...pageState };
        fillForm(state);
        openEditor();
    });

    closeBtn.addEventListener("click", closeEditor);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeEditor();
    });

    document.addEventListener("keydown", (e) => {
        if (!overlay.hidden && e.key === "Escape") closeEditor();
    });

    realBackBtn.addEventListener("click", () => {
        doRealBack();
    });

    resetBtn.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEY);
        state = readStateFromPage();
        applyStateToPage(state);
        fillForm(state);
    });

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
})();