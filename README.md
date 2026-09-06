# Reflect — Private Personal AI Journaling & Reflection Space

> **Live Product:** [https://ireflect.ai.studio/](https://ireflect.ai.studio/)  
> **Developer:** [Ravi Teja](https://www.linkedin.com/in/raviiteja/)  
> **Cloud Run Service Label:** `dev-tutorial=cloud-run-ai-challenge`

[![Google Cloud Run](https://img.shields.io/badge/Google%20Cloud-Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 🌟 Overview

**Reflect** is an enterprise-grade, privacy-first personal AI journaling and reflection workspace. Designed with a calming "Natural Tones" visual aesthetic, Reflect acts as a contemplative sounding board for focused thinking, deep problem-solving, emotional awareness, and continuous self-discovery.

Unlike standard chatbots, Reflect guides you through structured introspection—transforming stream-of-consciousness thoughts into crystallized decisions, emotional arcs, and an encrypted personal memory bank.

---

## ✨ Key Features

- **🧠 Socratic Thinking Partner**: Multi-turn conversational reasoning powered by Google Gemini (`@google/genai`, Gemini 2.5 Flash), designed to challenge assumptions and ask thoughtful questions rather than rushing to answers.
- **🎙️ Speech-to-Text Voice Journaling**: Native real-time voice capture enables natural stream-of-consciousness journaling hands-free.
- **📝 Structured Synthesis & Emotional Mapping**: Synthesizes open-ended dialogue into summaries, core themes, key decisions, open loops, and an emotional breakdown (valence, intensity, somatic takeaways, and underlying needs).
- **🔒 Zero-Knowledge Memory Vault**: Client-side **AES-GCM-256** encryption using the Web Crypto API guarantees that personal goals and breakthroughs stay confidential on your device.
- **🌿 Git-Style Reflection History**: Interactive GitHub-style contribution graph and commit-log timeline that turns personal reflection into a tangible habit of growth.
- **📈 Dynamic Behavioral Insights**: Real-time analysis of mental energy, recurring themes, and self-awareness trends over time.
- **🛡️ Multi-Tenant Isolation & Security Audit**: Strict user document partitioning (`/users/{userId}/*`) on Cloud Firestore, verified JWT token claims, and a built-in live security audit matrix.

---

## 🏗️ Architecture & Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons | Responsive single-screen thinking dashboard, modals, and tabs |
| **Backend** | Node.js, Express, TypeScript | Secure API proxy, JWT claim verification, and rate limiting |
| **AI Reasoning** | Google Gen AI SDK (`@google/genai`), Gemini 2.5 Flash | Socratic dialogue, memory retrieval, and structured reflection synthesis |
| **Identity & Database** | Firebase Authentication & Google Cloud Firestore | Token-based authentication and user-partitioned document storage |
| **Cryptography** | Web Crypto API (`SubtleCrypto`) | Client-side AES-GCM 256-bit encryption with PBKDF2 key derivation |
| **Cloud Hosting** | Google Cloud Run | Serverless, autoscaling full-stack container deployment |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ & npm
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
- Firebase Project with Authentication & Firestore enabled

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/ravii-teja/reflect.git
cd reflect

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Populate `.env` with your keys:
```env
GEMINI_API_KEY="your_gemini_api_key"
VITE_FIREBASE_API_KEY="your_firebase_web_api_key"
```

### 3. Run Locally
```bash
# Start development server (serves Express backend + Vite on port 3000)
npm run dev

# Build for production
npm run build
```

---

## ☁️ Deployment to Google Cloud Run

Reflect is built for seamless serverless deployment on Google Cloud Run with secret management via Google Secret Manager (GSM).

```bash
gcloud run deploy reflect \
  --source . \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,FIREBASE_APPLET_CONFIG=FIREBASE_APPLET_CONFIG:latest" \
  --set-env-vars NODE_ENV="production" \
  --labels dev-tutorial=cloud-run-ai-challenge
```

---

## 🔒 Security & Data Privacy

- **Zero Secret Leakage**: `GEMINI_API_KEY` stays strictly on the server and is never transmitted to the browser.
- **Client-Side E2EE**: Memory Vault entries can be encrypted client-side using device-derived or user-passphrase AES-GCM keys.
- **Firestore Security Rules**: Strict token owner verification ensures no user can read or write data outside `/users/{request.auth.uid}/*`.
- **Runtime Security Testing**: Interactive security drawer tests token tampering, IDOR rejection, and rate limits in real time.

---

## 🔗 Links & Developer

- **Product URL:** [https://ireflect.ai.studio/](https://ireflect.ai.studio/)
- **Cloud Run URL:** [https://ais-pre-tqhihiyv6tcpt5ljvbcxo7-196996826426.asia-east1.run.app](https://ais-pre-tqhihiyv6tcpt5ljvbcxo7-196996826426.asia-east1.run.app)
- **Developer:** Bankupalli Ravi Teja  
  - LinkedIn: [linkedin.com/in/raviiteja](https://www.linkedin.com/in/raviiteja/)
  - GitHub: [@ravii-teja](https://github.com/ravii-teja)
