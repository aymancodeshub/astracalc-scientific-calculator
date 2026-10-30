/* ===============================================================
   ASTRACALC — Scientific calculator engine + accessible interface
   No eval(), no Function(), no external libraries.
   Expressions are parsed with precedence-aware recursive parsing.
   =============================================================== */
"use strict";

// ---------------------------------------------------------------
// 1. PURE MATH ENGINE — can be unit-tested without a web browser
// ---------------------------------------------------------------
const AstraCalcMath = (() => {
  const FUNCTIONS = new Set([
    "sin", "cos", "tan", "asin", "acos", "atan",
    "sqrt", "ln", "log", "log2", "exp", "pow10", "inv", "abs"
  ]);
  const CONSTANTS = new Set(["π", "e", "Ans", "M"]);
  const BINARY_OPERATORS = new Set(["+", "-", "*", "/", "^", "mod", "nCr", "nPr"]);
  const NAMED_TOKENS = [
    "pow10", "log2", "sqrt", "asin", "acos", "atan", "sin", "cos", "tan",
    "exp", "inv", "abs", "log", "ln", "nCr", "nPr", "mod", "Ans", "π", "e", "M"
  ];
  const PRECEDENCE = Object.freeze({
    "+": 10, "-": 10,
    "*": 20, "/": 20, mod: 20,
    nCr: 25, nPr: 25,
    "^": 40
  });
  const DEGREE_FACTOR = Math.PI / 180;

  class CalculationError extends Error {
    constructor(message) {
      super(message);
      this.name = "CalculationError";
    }
  }

  function assertFinite(value) {
    if (!Number.isFinite(value)) {
      throw new CalculationError("Result is undefined or too large");
    }
    return Object.is(value, -0) ? 0 : value;
  }

  function tokenize(input) {
    const tokens = [];
    let index = 0;
    while (index < input.length) {
      const source = input.slice(index);
      if (/^\s/.test(source)) { index++; continue; }

      // 'E' is scientific notation (for example 1.2E-3), not Euler's e.
      const match = source.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:E[+\-]?\d+)?/);
      if (match) {
        // A second adjacent numeric token means malformed input (e.g. 2..3).
        if (tokens.at(-1)?.type === "number") {
          throw new CalculationError("Malformed number: check decimal points");
        }
        const value = Number(match[0]);
        tokens.push({ type: "number", value: assertFinite(value) });
        index += match[0].length;
        continue;
      }

      const name = NAMED_TOKENS.find(token => source.startsWith(token));
      if (name) {
        tokens.push({
          type: FUNCTIONS.has(name) ? "function" : CONSTANTS.has(name) ? "constant" : "operator",
          value: name
        });
        index += name.length;
        continue;
      }

      const char = source[0];
      if (char === "(" || char === ")") {
        tokens.push({ type: "parenthesis", value: char });
      } else if ("+-*/^!%".includes(char)) {
        tokens.push({ type: "operator", value: char });
      } else {
        throw new CalculationError(`Invalid character: ${char}`);
      }
      index++;
    }
    return tokens;
  }

  function factorial(value) {
    if (!Number.isInteger(value) || value < 0) {
      throw new CalculationError("Factorial needs a non-negative integer");
    }
    if (value > 170) throw new CalculationError("Maximum supported factorial is 170!");
    let result = 1;
    for (let i = 2; i <= value; i++) result *= i;
    return assertFinite(result);
  }

  function validateCountingArguments(n, r) {
    if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
      throw new CalculationError("nCr and nPr require integers with 0 ≤ r ≤ n");
    }
    if (n > 1000) throw new CalculationError("Maximum supported n for nCr/nPr is 1000");
  }

  function combinations(n, r) {
    validateCountingArguments(n, r);
    let result = 1;
    const count = Math.min(r, n - r);
    for (let i = 1; i <= count; i++) {
      result = (result * (n - count + i)) / i;
      assertFinite(result);
    }
    return assertFinite(result);
  }

  function permutations(n, r) {
    validateCountingArguments(n, r);
    let result = 1;
    for (let i = 0; i < r; i++) {
      result *= n - i;
      assertFinite(result);
    }
    return result;
  }

  function runFunction(name, x, angleMode) {
    const rad = angleMode === "DEG" ? x * DEGREE_FACTOR : x;
    const outputAngle = value => angleMode === "DEG" ? value / DEGREE_FACTOR : value;
    let result;

    switch (name) {
      case "sin": result = Math.sin(rad); break;
      case "cos": result = Math.cos(rad); break;
      case "tan":
        if (Math.abs(Math.cos(rad)) < 1e-12) throw new CalculationError("Tangent is undefined at this angle");
        result = Math.tan(rad);
        break;
      case "asin":
        if (x < -1 || x > 1) throw new CalculationError("asin requires a value from −1 to 1");
        result = outputAngle(Math.asin(x)); break;
      case "acos":
        if (x < -1 || x > 1) throw new CalculationError("acos requires a value from −1 to 1");
        result = outputAngle(Math.acos(x)); break;
      case "atan": result = outputAngle(Math.atan(x)); break;
      case "sqrt":
        if (x < 0) throw new CalculationError("Square root requires a non-negative number");
        result = Math.sqrt(x); break;
      case "ln":
        if (x <= 0) throw new CalculationError("ln requires a positive number");
        result = Math.log(x); break;
      case "log":
        if (x <= 0) throw new CalculationError("log requires a positive number");
        result = Math.log10(x); break;
      case "log2":
        if (x <= 0) throw new CalculationError("log₂ requires a positive number");
        result = Math.log2(x); break;
      case "exp": result = Math.exp(x); break;
      case "pow10": result = 10 ** x; break;
      case "inv":
        if (x === 0) throw new CalculationError("Cannot divide by zero");
        result = 1 / x; break;
      case "abs": result = Math.abs(x); break;
      default: throw new CalculationError(`Unknown function: ${name}`);
    }
    // Avoid showing tiny floating-point artifacts such as cos(90°) = 6.1e-17.
    // Only snap trigonometric results near exact 90° multiples, not all tiny results.
    if (["sin", "cos", "tan"].includes(name) && Math.abs(result) < 1e-15 &&
        Math.abs(rad / (Math.PI / 2) - Math.round(rad / (Math.PI / 2))) < 1e-12) {
      result = 0;
    }
    return assertFinite(result);
  }

  function runBinary(operator, left, right) {
    switch (operator) {
      case "+": return assertFinite(left + right);
      case "-": return assertFinite(left - right);
      case "*": return assertFinite(left * right);
      case "/":
        if (right === 0) throw new CalculationError("Cannot divide by zero");
        return assertFinite(left / right);
      case "^": return assertFinite(left ** right);
      case "mod":
        if (right === 0) throw new CalculationError("Cannot divide by zero");
        return assertFinite(left % right);
      case "nCr": return combinations(left, right);
      case "nPr": return permutations(left, right);
      default: throw new CalculationError(`Unknown operator: ${operator}`);
    }
  }

  function evaluate(expression, options = {}) {
    if (typeof expression !== "string" || !expression.trim()) {
      throw new CalculationError("Enter an expression first");
    }
    if (expression.length > 500) throw new CalculationError("Expression is too long");
    const { angleMode = "DEG", ans = 0, memory = 0 } = options;
    if (angleMode !== "DEG" && angleMode !== "RAD") {
      throw new CalculationError("Invalid angle mode");
    }
    const tokens = tokenize(expression);
    let cursor = 0;
    const peek = () => tokens[cursor];
    const take = () => tokens[cursor++];
    const isPrimaryStart = t => t && (
      t.type === "number" || t.type === "constant" || t.type === "function" ||
      (t.type === "parenthesis" && t.value === "(")
    );

    function parsePrefix() {
      const token = take();
      if (!token) throw new CalculationError("Incomplete expression");
      if (token.type === "number") return token.value;
      if (token.type === "constant") {
        switch (token.value) {
          case "π": return Math.PI;
          case "e": return Math.E;
          case "Ans": return assertFinite(ans);
          case "M": return assertFinite(memory);
        }
      }
      if (token.type === "operator" && (token.value === "+" || token.value === "-")) {
        const value = parseExpression(35); // power binds more tightly than unary minus
        return token.value === "-" ? assertFinite(-value) : value;
      }
      if (token.type === "function") {
        const bracket = take();
        if (!bracket || bracket.value !== "(") {
          throw new CalculationError(`Use parentheses after ${token.value}`);
        }
        const value = parseExpression(0);
        const closing = take();
        if (!closing || closing.value !== ")") throw new CalculationError("Missing closing parenthesis");
        return runFunction(token.value, value, angleMode);
      }
      if (token.type === "parenthesis" && token.value === "(") {
        const value = parseExpression(0);
        const closing = take();
        if (!closing || closing.value !== ")") throw new CalculationError("Missing closing parenthesis");
        return value;
      }
      throw new CalculationError("Expected a number, constant, or function");
    }

    function parseExpression(minPrecedence) {
      let left = parsePrefix();
      while (peek()) {
        const next = peek();
        if (next.type === "operator" && (next.value === "!" || next.value === "%")) {
          if (60 < minPrecedence) break;
          take();
          left = next.value === "!" ? factorial(left) : assertFinite(left / 100);
          continue;
        }

        // Adjacent values imply multiplication: 2π, 3sin(30), (2+3)(4+5).
        const implicit = isPrimaryStart(next);
        const operator = implicit ? "*" : (next.type === "operator" && BINARY_OPERATORS.has(next.value) ? next.value : null);
        if (!operator) break;
        const precedence = PRECEDENCE[operator];
        if (precedence < minPrecedence) break;
        if (!implicit) take();
        // Exponentiation is right-associative: 2^3^2 = 2^(3^2).
        const right = parseExpression(operator === "^" ? precedence : precedence + 1);
        left = runBinary(operator, left, right);
      }
      return left;
    }

    const answer = parseExpression(0);
    if (cursor !== tokens.length) {
      throw new CalculationError("Unexpected symbol or extra closing parenthesis");
    }
    return assertFinite(answer);
  }

  function formatNumber(value) {
    assertFinite(value);
    if (value === 0) return "0";
    const abs = Math.abs(value);
    // 12 significant digits removes common binary float noise without hiding scale.
    const rounded = Number(value.toPrecision(12));
    if (abs >= 1e12 || abs < 1e-8) {
      const parts = rounded.toExponential(8).split("e");
      return `${Number(parts[0])}e${Number(parts[1]) >= 0 ? "+" : ""}${Number(parts[1])}`;
    }
    return String(rounded);
  }

  function prettyExpression(expression) {
    return String(expression)
      .replace(/asin\(/g, "sin⁻¹(")
      .replace(/acos\(/g, "cos⁻¹(")
      .replace(/atan\(/g, "tan⁻¹(")
      .replace(/sqrt\(/g, "√(")
      .replace(/log2\(/g, "log₂(")
      .replace(/pow10\(/g, "10^(")
      .replace(/exp\(/g, "e^(")
      .replace(/inv\(/g, "1/(")
      .replace(/\*/g, "×")
      .replace(/\//g, "÷")
      .replace(/-/g, "−")
      .replace(/nCr/g, " nCr ")
      .replace(/nPr/g, " nPr ")
      .replace(/mod/g, " mod ");
  }

  return Object.freeze({ evaluate, tokenize, formatNumber, prettyExpression, CalculationError });
})();

// Node.js exports are strictly for independent logic testing; browsers use the UI below.
if (typeof module !== "undefined" && module.exports) module.exports = AstraCalcMath;

// ---------------------------------------------------------------
// 2. INTERFACE — state, input, live result, history, memory, themes
// ---------------------------------------------------------------
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);
    const ui = {
      expression: $("expression"),
      result: $("result"),
      hint: $("displayHint"),
      angleIndicator: $("angleIndicator"),
      memoryIndicator: $("memoryIndicator"),
      history: $("historyList"),
      clearHistory: $("clearHistory"),
      historyShortcut: $("historyShortcut"),
      themeToggle: $("themeToggle"),
      copyResult: $("copyResult"),
      toast: $("toast")
    };

    const KEYS = Object.freeze({
      history: "astracalc-v1-history",
      memory: "astracalc-v1-memory",
      mode: "astracalc-v1-angle-mode",
      theme: "astracalc-v1-theme"
    });
    const MAX_EXPRESSION = 240;
    const MAX_HISTORY = 40;
    let toastTimer;

    function load(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (_) { return fallback; }
    }
    function save(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (_) { /* Calculator works even if browser storage is unavailable. */ }
    }

    const storedHistory = load(KEYS.history, []);
    const storedMemory = load(KEYS.memory, null);
    const state = {
      expression: "",
      angleMode: load(KEYS.mode, "DEG") === "RAD" ? "RAD" : "DEG",
      lastAnswer: 0,
      lastDisplayedValue: 0,
      justEvaluated: false,
      error: null,
      memory: Number.isFinite(storedMemory) ? storedMemory : null,
      history: Array.isArray(storedHistory) ? storedHistory.filter(entry =>
        entry && typeof entry.expression === "string" &&
        typeof entry.value === "number" && Number.isFinite(entry.value) &&
        entry.expression.length <= MAX_EXPRESSION
      ).slice(0, MAX_HISTORY) : []
    };

    function notify(message) {
      clearTimeout(toastTimer);
      ui.toast.textContent = message;
      ui.toast.classList.add("visible");
      toastTimer = setTimeout(() => ui.toast.classList.remove("visible"), 2400);
    }

    function compute(expression = state.expression) {
      return AstraCalcMath.evaluate(expression, {
        angleMode: state.angleMode,
        ans: state.lastAnswer,
        memory: state.memory ?? 0
      });
    }

    function renderExpression() {
      // textContent avoids interpreting user input as HTML.
      ui.expression.textContent = AstraCalcMath.prettyExpression(state.expression) || "0";
      const caret = document.createElement("span");
      caret.className = "caret";
      caret.setAttribute("aria-hidden", "true");
      ui.expression.appendChild(caret);
      ui.expression.scrollLeft = ui.expression.scrollWidth;
    }

    function render() {
      renderExpression();
      ui.result.classList.toggle("is-error", Boolean(state.error));
      if (state.error) {
        ui.result.textContent = "Error";
        ui.hint.textContent = state.error;
      } else if (!state.expression) {
        ui.result.textContent = "0";
        ui.hint.textContent = "Ready for your next big idea.";
        state.lastDisplayedValue = 0;
      } else {
        try {
          state.lastDisplayedValue = compute();
          ui.result.textContent = AstraCalcMath.formatNumber(state.lastDisplayedValue);
          ui.hint.textContent = state.justEvaluated ? "Calculation complete ✓" : "Real-time precision preview";
        } catch (_) {
          state.lastDisplayedValue = null;
          ui.result.textContent = "—";
          ui.hint.textContent = "Continue entering your expression";
        }
      }
      ui.angleIndicator.textContent = `${state.angleMode} MODE`;
      ui.memoryIndicator.hidden = state.memory === null;
      document.querySelectorAll("[data-mode]").forEach(button => {
        const active = button.dataset.mode === state.angleMode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }

    function endsWithOperand(expression) {
      return /(?:\d|π|e|\)|!|%|Ans|M)$/.test(expression);
    }

    function insert(text) {
      if (state.expression.length + text.length > MAX_EXPRESSION) {
        notify("Maximum expression length reached");
        return;
      }
      state.error = null;

      if (state.justEvaluated) {
        // Operators and postfix operations continue from the last answer.
        // Numbers, functions and constants begin a new calculation.
        const isContinuation = ["+", "-", "*", "/", "^", "^2", "!", "%", "mod", "nCr", "nPr"].includes(text);
        state.expression = isContinuation ? "Ans" : "";
        state.justEvaluated = false;
      }

      const current = state.expression;
      if (text === ".") {
        if (/E[+\-]?$/.test(current)) return;
        // Only one decimal point per numeric literal.
        const tail = current.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:E[+\-]?\d+)?$/)?.[0] || "";
        if (tail.includes(".") || tail.includes("E")) return;
        state.expression += tail ? "." : "0.";
      } else if (["+", "-", "*", "/", "^", "mod", "nCr", "nPr"].includes(text)) {
        if (!current) {
          if (text !== "-") return;
          state.expression = "-";
        } else if (current.endsWith("(") && text === "-") {
          state.expression += text; // Negative value inside parentheses: 5+(-3)
        } else if (/E$/.test(current) && (text === "+" || text === "-")) {
          state.expression += text;
        } else if (/E[+\-]$/.test(current)) {
          if (text === "+" || text === "-") state.expression = current.slice(0, -1) + text;
          else return;
        } else if (/[+*/^\-]$/.test(current) || /(?:mod|nCr|nPr)$/.test(current)) {
          if (text === "-" && !/[+\-]$/.test(current)) {
            state.expression += "-"; // e.g. 2^-3 or 2*-4
          } else {
            // Replace trailing binary operator instead of accumulating operators.
            state.expression = current.replace(/(?:mod|nCr|nPr|[+*/^\-])$/, text);
          }
        } else if (endsWithOperand(current)) {
          state.expression += text;
        } else {
          return;
        }
      } else if (text === ")") {
        const opened = (current.match(/\(/g) || []).length;
        const closed = (current.match(/\)/g) || []).length;
        if (opened > closed && endsWithOperand(current)) state.expression += ")";
        else return;
      } else if (["!", "%", "^2"].includes(text)) {
        if (!endsWithOperand(current)) return;
        state.expression += text;
      } else if (/^\d$/.test(text) && current === "0") {
        state.expression = text;
      } else {
        state.expression += text;
      }
      render();
    }

    function clearAll() {
      state.expression = "";
      state.justEvaluated = false;
      state.error = null;
      render();
    }

    function deleteLast() {
      if (state.error) { state.error = null; }
      state.justEvaluated = false;
      const atomicTokens = [
        "pow10(", "log2(", "sqrt(", "asin(", "acos(", "atan(",
        "sin(", "cos(", "tan(", "exp(", "inv(", "abs(",
        "log(", "ln(", "nCr", "nPr", "mod", "Ans", "^2"
      ];
      const match = atomicTokens.find(token => state.expression.endsWith(token));
      state.expression = state.expression.slice(0, -((match || " ").length));
      render();
    }

    function toggleSign() {
      state.error = null;
      if (state.justEvaluated) {
        state.expression = "Ans";
        state.justEvaluated = false;
      }
      const current = state.expression;
      if (!current) { state.expression = "-"; render(); return; }

      // Toggle the final signed literal, not the entire arithmetic expression.
      const wrapped = current.match(/\(-((?:\d+(?:\.\d*)?|\.\d+)(?:E[+\-]?\d+)?)\)$/);
      if (wrapped) {
        state.expression = current.slice(0, -wrapped[0].length) + wrapped[1];
      } else {
        const number = current.match(/((?:\d+(?:\.\d*)?|\.\d+)(?:E[+\-]?\d+)?)$/);
        if (number) {
          const prefix = current.slice(0, -number[1].length);
          state.expression = prefix + "(-" + number[1] + ")";
        } else {
          // Applies to constants or completed bracketed expressions.
          state.expression = current.startsWith("-(") && current.endsWith(")")
            ? current.slice(2, -1) : `-(${current})`;
        }
      }
      render();
    }

    function exponent() {
      if (state.justEvaluated) {
        state.expression = String(state.lastAnswer).replace("e", "E");
        state.justEvaluated = false;
      }
      const tail = state.expression.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:E[+\-]?\d+)?$/)?.[0];
      if (tail && !tail.includes("E")) {
        state.expression += "E";
        state.error = null;
        render();
      } else {
        notify("Enter a number before EXP (example: 1.5E3)");
      }
    }

    function addToHistory(expression, value) {
      state.history.unshift({ expression, value, time: Date.now() });
      state.history = state.history.slice(0, MAX_HISTORY);
      save(KEYS.history, state.history);
      renderHistory();
    }

    function calculate() {
      try {
        const expression = state.expression;
        const value = compute();
        addToHistory(expression, value);
        state.lastAnswer = value;
        state.expression = "Ans";
        state.justEvaluated = true;
        state.error = null;
        render();
        // Preserve original evaluated expression visually until the next action.
        ui.expression.textContent = AstraCalcMath.prettyExpression(expression);
        ui.result.textContent = AstraCalcMath.formatNumber(value);
        ui.hint.textContent = "Calculation complete ✓";
      } catch (error) {
        state.error = error instanceof Error ? error.message : "Invalid expression";
        render();
      }
    }

    function valueForMemory() {
      if (!state.expression) return state.lastAnswer;
      return compute();
    }

    function handleMemory(action) {
      try {
        switch (action) {
          case "memory-clear":
            state.memory = null;
            notify("Memory cleared");
            break;
          case "memory-recall":
            if (state.memory === null) { notify("Memory is empty"); return; }
            insert("M");
            notify("Stored value inserted");
            break;
          case "memory-store":
            state.memory = valueForMemory();
            notify("Value saved to memory");
            break;
          case "memory-add":
            const newSum = (state.memory ?? 0) + valueForMemory();
            if (!Number.isFinite(newSum)) throw new Error("Memory overflow");
            state.memory = newSum;
            notify("Added to memory");
            break;
          case "memory-subtract":
            const newDifference = (state.memory ?? 0) - valueForMemory();
            if (!Number.isFinite(newDifference)) throw new Error("Memory overflow");
            state.memory = newDifference;
            notify("Subtracted from memory");
            break;
        }
        save(KEYS.memory, state.memory);
        render();
      } catch (error) { notify(error.message || "Cannot use incomplete expression"); }
    }

    function renderHistory() {
      ui.history.replaceChildren();
      ui.clearHistory.disabled = state.history.length === 0;
      if (!state.history.length) {
        const empty = document.createElement("div");
        empty.className = "empty-history";
        const symbol = document.createElement("span");
        symbol.className = "empty-history-icon";
        symbol.textContent = "↺";
        const copy = document.createElement("span");
        copy.textContent = "Your calculations will appear here.";
        empty.append(symbol, copy);
        ui.history.appendChild(empty);
        return;
      }
      state.history.forEach((entry, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "history-item";
        button.dataset.historyIndex = String(index);
        button.title = "Click to restore this calculation";
        const expression = document.createElement("span");
        expression.className = "history-expression";
        expression.textContent = AstraCalcMath.prettyExpression(entry.expression);
        const answer = document.createElement("span");
        answer.className = "history-result";
        answer.textContent = `= ${AstraCalcMath.formatNumber(entry.value)}`;
        button.append(expression, answer);
        ui.history.appendChild(button);
      });
    }

    function handleAction(action) {
      switch (action) {
        case "clear": clearAll(); break;
        case "delete": deleteLast(); break;
        case "sign": toggleSign(); break;
        case "equals": calculate(); break;
        case "exponent": exponent(); break;
        default:
          if (action.startsWith("memory-")) handleMemory(action);
      }
    }

    // Event delegation handles all calculator and memory buttons.
    document.querySelectorAll("[data-insert], [data-action]").forEach(button => {
      button.addEventListener("click", () => {
        if (button.dataset.insert !== undefined) insert(button.dataset.insert);
        else handleAction(button.dataset.action);
      });
    });

    document.querySelectorAll("[data-mode]").forEach(button => {
      button.addEventListener("click", () => {
        state.angleMode = button.dataset.mode;
        save(KEYS.mode, state.angleMode);
        state.error = null;
        render();
      });
    });

    ui.history.addEventListener("click", event => {
      const button = event.target.closest("[data-history-index]");
      if (!button) return;
      const entry = state.history[Number(button.dataset.historyIndex)];
      if (!entry) return;
      // History uses Ans / memory references at their original current values.
      // Restore the recorded RESULT as a stable numeric literal instead.
      state.expression = Number(entry.value).toString().replace("e", "E");
      state.justEvaluated = false;
      state.error = null;
      render();
      notify("History result restored");
    });

    ui.clearHistory.addEventListener("click", () => {
      state.history = [];
      save(KEYS.history, state.history);
      renderHistory();
      notify("History cleared");
    });

    ui.historyShortcut.addEventListener("click", () => {
      $("historyPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
      $("historyTitle").setAttribute("tabindex", "-1");
      $("historyTitle").focus({ preventScroll: true });
    });

    ui.themeToggle.addEventListener("click", () => {
      const next = document.body.dataset.theme === "dark" ? "light" : "dark";
      document.body.dataset.theme = next;
      ui.themeToggle.setAttribute("aria-label", `Switch to ${next === "dark" ? "light" : "dark"} theme`);
      save(KEYS.theme, next);
    });

    ui.copyResult.addEventListener("click", async () => {
      if (state.lastDisplayedValue === null || state.error) {
        notify("Finish an expression to copy its result");
        return;
      }
      const result = AstraCalcMath.formatNumber(state.lastDisplayedValue);
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard API unavailable");
        await navigator.clipboard.writeText(result);
        notify("Result copied!");
      } catch (_) {
        // Works for many file:// and non-HTTPS browser contexts.
        const field = document.createElement("textarea");
        field.value = result;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const worked = document.execCommand("copy");
        field.remove();
        notify(worked ? "Result copied!" : "Copy not available in this browser");
      }
    });

    document.addEventListener("keydown", event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target.closest("input, textarea, [contenteditable='true']")) return;
      let handled = true;
      const key = event.key;
      if (/^\d$/.test(key) || [".", "+", "-", "*", "/", "^", "(", ")", "%", "!"].includes(key)) {
        insert(key);
      } else if (key === "Enter" || key === "=") {
        calculate();
      } else if (key === "Backspace") {
        deleteLast();
      } else if (key === "Escape" || key === "Delete") {
        clearAll();
      } else if (key === "F9") {
        toggleSign();
      } else if (key === "p" || key === "P") {
        insert("π");
      } else if (key === "e") {
        insert("e");
      } else if (key === "E") {
        exponent();
      } else {
        handled = false;
      }
      if (handled) event.preventDefault();
    });

    const storedTheme = load(KEYS.theme, "dark");
    document.body.dataset.theme = storedTheme === "light" ? "light" : "dark";
    ui.themeToggle.setAttribute("aria-label", `Switch to ${document.body.dataset.theme === "dark" ? "light" : "dark"} theme`);
    renderHistory();
    render();
  });
}
