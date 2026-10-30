<div align="center">

# ✨ AstraCalc

### Advanced Scientific Calculator

**A beautiful, responsive scientific calculator built with HTML, CSS, and Vanilla JavaScript.**

_A clean interface. Powerful calculations. No frameworks required._

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Responsive](https://img.shields.io/badge/Responsive-Design-8B5CF6?style=for-the-badge)

</div>

---

## 📸 Preview

### Desktop · Dark Theme

![AstraCalc desktop preview](desktop-preview.png)

<details>
<summary><b>☀️ View Light Theme</b></summary>

![AstraCalc light theme](light-preview.png)

</details>

<details>
<summary><b>📱 View Mobile Layout</b></summary>

<img src="mobile-preview.png" alt="AstraCalc mobile layout" width="380" />

</details>

## 🚀 About the Project

**AstraCalc** is an advanced scientific calculator created as a front-end mini project. It combines an aesthetic user interface with an expression-parsing math engine, helping users perform everyday arithmetic and more complex mathematical operations in a single workspace.

The project is made using **only HTML, CSS, and Vanilla JavaScript**—no frameworks, build tools, or external JavaScript libraries are needed.

## 🌟 Features

- **Modern, responsive UI:** Comfortable layouts for desktop, tablet, and mobile screens.
- **Dark and light themes:** Switch themes with a single click; the preference is remembered.
- **Basic arithmetic:** Addition, subtraction, multiplication, division, and parentheses.
- **Scientific functions:** `sin`, `cos`, `tan`, inverse trigonometric functions, `sqrt`, `ln`, `log`, `log₂`, `eˣ`, `10ˣ`, reciprocal, and absolute value.
- **More math operations:** Powers, squares, factorials, percentages, modulo, permutations (`nPr`), and combinations (`nCr`).
- **DEG / RAD mode:** Choose degree or radian input for trigonometry.
- **Mathematical constants:** π, Euler's number `e`, and the previous answer (`Ans`).
- **Live result preview:** See results as you form a valid expression.
- **Calculation history:** Review up to 40 recent calculations and restore previous results.
- **Memory controls:** `MC`, `MR`, `M+`, `M−`, and `MS`.
- **Keyboard support:** Use the calculator without constantly clicking buttons.
- **Copy result:** Copy the displayed answer to the clipboard.
- **Saved preferences:** History, memory, theme, and angle mode are stored locally in your browser.
- **Error handling:** Provides feedback for invalid expressions and undefined operations.

## 🛠️ Tech Stack

| Technology | Purpose |
| --- | --- |
| **HTML5** | Semantic markup and calculator layout |
| **CSS3** | Aesthetic UI, themes, animations, and responsive styling |
| **JavaScript (ES6+)** | Expression parser, scientific calculations, and user interactions |
| **localStorage** | Local history, memory, and preference persistence |

## 📂 Project Structure

```text
astracalc-scientific-calculator/
├── index.html          # App structure
├── style.css           # Styling, layouts, themes, animations
├── script.js           # Calculator math engine and UI logic
├── desktop-preview.png # Desktop screenshot
├── light-preview.png   # Light theme screenshot
├── mobile-preview.png  # Mobile screenshot
└── README.md           # Project documentation
```

## ⚙️ Getting Started

### Option 1: Run Locally

1. Download or clone this repository.
2. Open the project folder.
3. Double-click **`index.html`** to launch it in your browser.

That's it! There is **no installation, npm, backend, or API key** required.

### Option 2: Clone with Git

```bash
git clone https://github.com/YOUR_USERNAME/astracalc-scientific-calculator.git
cd astracalc-scientific-calculator
```

Then open `index.html` in a browser, or use **Live Server** in VS Code.

> Replace `YOUR_USERNAME` with your GitHub username after creating the repository.

## 🧮 Try These Calculations

| Input | Expected result | Notes |
| --- | ---: | --- |
| `25 + 15 * 2` | `55` | Operator precedence |
| `(8 + 2) * 5` | `50` | Parentheses |
| `sin(30)` | `0.5` | In **DEG** mode |
| `cos(0)` | `1` | In DEG or RAD mode |
| `sqrt(144)` | `12` | Square root |
| `2^10` | `1024` | Exponentiation |
| `5!` | `120` | Factorial |
| `log(1000)` | `3` | Base-10 logarithm |
| `5nCr2` | `10` | Combinations |
| `2π` | `≈ 6.283185307` | Implicit multiplication |

**Tip:** Click the `DEG` / `RAD` toggle when working with trigonometric expressions. For example, `sin(30)` is `0.5` in DEG mode but differs in RAD mode.

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `0–9` | Enter numbers |
| `+`, `-`, `*`, `/` | Basic operations |
| `^` | Power |
| `(` and `)` | Parentheses |
| `.` | Decimal point |
| `%` | Percent |
| `!` | Factorial |
| `Enter` or `=` | Calculate |
| `Backspace` | Delete last entry |
| `Esc` or `Delete` | Clear current expression |
| `F9` | Change sign |
| `P` | Insert π |
| `e` | Insert Euler's number |
| `E` | Start scientific-notation exponent |

## 🧠 How It Works

The JavaScript math engine uses **tokenization and a precedence-aware expression parser**, rather than relying on `eval()` or `Function()`.

1. **Input:** The user enters an arithmetic or scientific expression.
2. **Tokenization:** Numbers, constants, functions, brackets, and operators are identified.
3. **Parsing:** The expression is evaluated with correct operator precedence and grouping.
4. **Validation:** Undefined operations and invalid domains produce clear errors.
5. **Output:** The answer appears on-screen, and confirmed calculations are added to the history.

The history and settings are saved using the browser's `localStorage`, so they remain available after a normal page reload in the same browser and site context.

## 🌐 Deploy for Free with GitHub Pages

1. Create a public GitHub repository named `astracalc-scientific-calculator`.
2. Upload the files from this project to the **root** of the repository.
3. Go to **Settings → Pages** in your GitHub repository.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the **`main`** branch and **`/(root)`**, then click **Save**.
6. Once GitHub finishes publishing, open the GitHub Pages URL shown in the Pages settings.

Your site URL will typically look like:

```text
https://YOUR_USERNAME.github.io/astracalc-scientific-calculator/
```

## 🔮 Future Improvements

- [ ] Editable expression cursor and paste support
- [ ] User-configurable precision
- [ ] Export calculation history
- [ ] Additional scientific and statistical functions
- [ ] Automated unit tests and CI workflow

## 🤝 Contributions

Have an idea to make AstraCalc better? Feel free to fork the repository, make improvements, and open a pull request.

## 📌 Project Information

- **Project:** AstraCalc — Advanced Scientific Calculator
- **Category:** Front-End Development / Mini Project
- **Language:** HTML, CSS, JavaScript
- **Dependencies:** None

---

<div align="center">

**Built with curiosity, creativity, and JavaScript.** ✨

If you find this project useful, consider giving the repository a ⭐!

</div>
