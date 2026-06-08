# 🧠 QPG — AI Question Paper Generator

Generate high-quality multiple-choice question papers on any topic in seconds, powered by **OpenRouter AI**. Supports GPT-4o, Claude, Gemini, Llama, and 100+ other models via a single API key.

---

## ✨ Features

- **OpenRouter-powered MCQ generation** — switch model with one env var
- **10 quick-topic chips** (Python, React, DSA, SQL, ML, and more)
- **3 difficulty levels** — Easy, Medium, Hard
- **4 question counts** — 5, 10, 15, 20 questions
- **Full quiz experience** — live progress bar, timer, floating submit
- **Animated score screen** — ring counter, grade badge, per-question review
- **Persistent storage** — past papers in `db.json`; best scores tracked
- **Dark / Light mode** toggle (persisted to `localStorage`)
- **Framer Motion** transitions throughout

---

## 🏗 Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 19 + Vite 6 |
| Styling  | Tailwind CSS v4 + CSS Variables |
| Animation| Framer Motion |
| HTTP     | Axios |
| Toasts   | React Hot Toast |
| Routing  | React Router v7 |
| Backend  | Node.js + Express.js |
| AI       | OpenRouter API (OpenAI-compatible) |
| Storage  | JSON file (`db.json`) |
| IDs      | nanoid |

---

## 📁 Project Structure

```
question-paper-generator/
├── backend/
│   ├── server.js            ← Express app, port 5000
│   ├── .env                 ← API key (create from .env.example)
│   ├── db.json              ← JSON database for saved papers
│   └── routes/
│       ├── generate.js      ← POST /api/generate → calls OpenRouter
│       └── papers.js        ← CRUD for saved papers
│
└── frontend/
    ├── index.html
    ├── vite.config.js       ← Vite + proxy to :5000
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/axios.js
        ├── components/      ← Navbar, QuestionCard, Timer, etc.
        ├── pages/           ← Home, Quiz, Score
        ├── hooks/           ← useQuiz, useTimer
        └── utils/storage.js
```

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js **18+** (native `fetch` required — no extra packages needed)
- An **OpenRouter API key** — get one free at [openrouter.ai/keys](https://openrouter.ai/keys)

---

### 1. Unzip the project

```bash
unzip question-paper-generator.zip
cd question-paper-generator
```

---

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your key:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=5000
```

Start the backend:

```bash
npm run dev    # development (auto-restart)
npm start      # production
```

---

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**.

---

## 🤖 Supported Models (via `OPENROUTER_MODEL`)

| Model ID | Speed | Cost | Notes |
|----------|-------|------|-------|
| `openai/gpt-4o-mini` | Fast | Low | Default — great for MCQs |
| `openai/gpt-4o` | Fast | Medium | Higher accuracy |
| `anthropic/claude-3.5-sonnet` | Fast | Medium | Excellent explanations |
| `anthropic/claude-3-haiku` | Very Fast | Very Low | Budget option |
| `google/gemini-flash-1.5` | Very Fast | Very Low | Good alternative |
| `meta-llama/llama-3.1-8b-instruct:free` | Fast | **Free** | Free tier |

Browse all models at [openrouter.ai/models](https://openrouter.ai/models).

---

## 🔑 .env Example

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=5000
```

---

## 📜 NPM Scripts

### Backend (`/backend`)

| Command       | Description                         |
|---------------|-------------------------------------|
| `npm run dev` | Start with `--watch` (auto-restart) |
| `npm start`   | Start in production mode            |

### Frontend (`/frontend`)

| Command           | Description                       |
|-------------------|-----------------------------------|
| `npm run dev`     | Start Vite dev server (port 5173) |
| `npm run build`   | Build for production to `dist/`   |
| `npm run preview` | Preview production build          |

---

## 🌐 API Endpoints

| Method | Endpoint           | Description                           |
|--------|--------------------|---------------------------------------|
| GET    | `/api/health`      | Health check                          |
| POST   | `/api/generate`    | Generate MCQs via OpenRouter          |
| GET    | `/api/papers`      | Fetch all saved papers                |
| POST   | `/api/papers`      | Save a new paper                      |
| PATCH  | `/api/papers/:id`  | Update best score + increment attempts|
| DELETE | `/api/papers/:id`  | Delete a paper                        |

### POST `/api/generate` body

```json
{
  "topic": "React Hooks",
  "difficulty": "medium",
  "count": 10
}
```

---

## 🐛 Troubleshooting

**"OPENROUTER_API_KEY is not configured"**
→ Create `.env` inside the `backend/` folder (not the project root).

**HTTP 402 / insufficient credits**
→ Add credits at [openrouter.ai/credits](https://openrouter.ai/credits), or switch to a free model.

**HTTP 404 / model not found**
→ Check your `OPENROUTER_MODEL` value matches exactly what's listed at [openrouter.ai/models](https://openrouter.ai/models).

**"Failed to parse AI response"**
→ Some models occasionally add extra text. Try `openai/gpt-4o-mini` or `anthropic/claude-3.5-sonnet` for most reliable JSON output.

**Port already in use**
→ Set `PORT=5001` in `.env` and update `vite.config.js` proxy target to match.

---

## 📄 License

MIT — free to use, modify, and distribute.
