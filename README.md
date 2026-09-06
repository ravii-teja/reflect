# Reflect — Private Personal AI Journaling & Reflection Space

> Built for the **Cloud Run AI Hackathon / Challenge**  
> Service Label: `dev-tutorial=cloud-run-ai-challenge`  
> Live Public App URL: [https://ais-pre-tqhihiyv6tcpt5ljvbcxo7-196996826426.asia-east1.run.app](https://ais-pre-tqhihiyv6tcpt5ljvbcxo7-196996826426.asia-east1.run.app)

---

## 🌟 Overview & Product Vision

**Reflect** is an enterprise-grade, privacy-first personal AI journaling and reflection workspace. Designed with a calming, tactile **"Natural Tones"** visual identity, Reflect provides a sanctuary for focused thinking, deep problem-solving, and continuous self-awareness.

Unlike generic chatbots, Reflect offers:
1. **Multi-Turn Socratic Thinking**: Grounded, reflective conversation with Gemini that acts as a sounding board rather than a hasty answering machine.
2. **Structured Reflection Synthesis**: Automatically digests dialogue threads into core themes, executive summaries, key decisions, open loops, and future probing questions.
3. **Semantic Personal Memory with Zero-Knowledge E2EE**: Client-side AES-GCM-256 encryption ensures personal breakthroughs and goals remain confidential, while offering contextual continuity across future reflection sessions.
4. **Strict Cloud Firestore Partitioning**: Absolute multi-tenant isolation under `/users/{userId}/*` enforced by cryptographic token claim validation and hardened Firestore security rules.
5. **Live Observability & Security Audit Matrix**: Built-in runtime defense testing that verifies token-only claim extraction, IDOR boundaries, rate limiting, and zero secret leakage.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS (Natural Tones design system), Lucide Icons | Responsive single-screen 12-column thinking dashboard and modal dialogs |
| **Backend** | Node.js, Express, TypeScript (`tsx` in dev, `esbuild` bundled CJS in prod) | Secure server proxy, API rate limiting, token claim verification |
| **AI Engine** | Google Gen AI SDK (`@google/genai`), Gemini 2.5 Flash | Server-side reflection generation, structured output schema, dialogue continuity |
| **Authentication** | Firebase Authentication (Google Sign-In, Verified Tokens) | Secure identity provider with token claims validation |
| **Database** | Google Cloud Firestore (Database ID: `ai-studio-reflect-86bb1722-fdae-4406-b5d8-592426ee33a5`) | Fully isolated user documents, conversations, reflections, and encrypted memories |
| **Hosting & Compute**| Google Cloud Run | Scalable, serverless container deployment with zero secret exposure |
| **Cryptography** | Web Crypto API (SubtleCrypto) | Client-side AES-GCM 256-bit encryption with PBKDF2 passphrase derivation |

---

## 🚀 Deployment Guide to Google Cloud Run

Follow these steps to deploy **Reflect** to Google Cloud Run with the mandatory `dev-tutorial=cloud-run-ai-challenge` label.

### 1. Prerequisites
- Google Cloud SDK (`gcloud`) installed and authenticated:
  ```bash
  gcloud auth login
  gcloud config set project her-journel
  ```
- Enable required Google Cloud services:
  ```bash
  gcloud services enable run.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com
  ```

---

## 🔐 Deploy All Secrets via GitHub Secrets

To ensure zero secrets are ever exposed in source control, Reflect uses **GitHub Secrets** and **GitHub Actions** (`.github/workflows/deploy.yml`).

### 1. Immediate Remediation for Exposed Google API Key
If a Google API key was previously detected publicly:
1. **Rotate Compromised Key**: Navigate to **[Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials?project=her-journel)**.
2. Select the exposed key and click **Regenerate / Delete**.
3. Create or configure a new API Key for client Firebase Auth & Firestore:
   - **Application restrictions**: Set to **Websites (HTTP referrers)** and restrict to your Cloud Run domain (`https://*.run.app/*`) and local development URLs (`http://localhost:*`).
   - **API restrictions**: Select **Restrict key** and restrict strictly to:
     - `Firebase Authentication API`
     - `Cloud Firestore API`
     *(Do NOT enable Generative Language API, Compute Engine, or administrative APIs on this key)*.

### 2. Configure Google Secret Manager (GSM) & GitHub Secrets

Reflect supports zero-knowledge secret isolation using **Google Secret Manager (GSM)** and **GitHub Secrets**.

#### Storing Secrets in Google Secret Manager

You can store both your server API keys and your complete `firebase-applet-config.json` payload inside Google Secret Manager:

1. **Create the Gemini API Key secret**:
   ```bash
   gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
   echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
   ```

2. **Create the Firebase Applet Config secret**:
   ```bash
   gcloud secrets create FIREBASE_APPLET_CONFIG --replication-policy="automatic"
   # Upload the full firebase-applet-config.json content as a secret version:
   gcloud secrets versions add FIREBASE_APPLET_CONFIG --data-file=firebase-applet-config.json
   ```

3. **Can `firebase-applet-config.json` be accessed once stored in Google Secret Manager?**
   **Yes!** The Reflect backend automatically resolves Firebase configuration across multiple access patterns:
   - **Environment Variable Injection (Recommended)**: Cloud Run binds the secret to an environment variable via `--set-secrets="FIREBASE_APPLET_CONFIG=FIREBASE_APPLET_CONFIG:latest"`. The Express server parses the JSON payload at startup and serves the client configuration to the browser via `/api/config/firebase` and `<script window.__FIREBASE_CONFIG__>`.
   - **Secret Volume Mount**: Cloud Run can mount the secret directly as a file inside the container:
     `--update-secrets="/secrets/firebase-applet-config.json=FIREBASE_APPLET_CONFIG:latest"`. The server automatically reads `/secrets/firebase-applet-config.json` if present.
   - **Discrete Secrets**: You can also store `FIREBASE_API_KEY` individually in Secret Manager and bind it via `--set-secrets="FIREBASE_API_KEY=FIREBASE_API_KEY:latest"`.

#### GitHub Repository Secrets (for CI/CD)
In your GitHub repository, go to **Settings > Secrets and variables > Actions > Repository secrets** and add:

| Secret Name | Description | Where It's Used |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key | Cloud Run runtime (`server.ts`), never exposed to browser |
| `FIREBASE_API_KEY` | Rotated Firebase / Google Web API Key | Injected into client bundle via `VITE_FIREBASE_API_KEY` during build |
| `GCP_SA_KEY` | Service Account JSON key with Cloud Run Admin, Secret Manager Secret Accessor roles | Authenticates GitHub Actions to deploy to Google Cloud |
| `FIREBASE_TOKEN` | *(Optional)* Firebase CI token | Used by `firebase-tools` to deploy `firestore.rules` |

### 3. Automated GitHub Actions Deployment
Whenever you push to `main` (or run manually via `workflow_dispatch`):
1. **Secret Scanning Barrier**: Scans the codebase to ensure zero hardcoded secrets or `AIzaSy...` keys exist in git-tracked files.
2. **Bundle Build**: Builds the frontend assets without committing secrets.
3. **Cloud Run Deploy**: Deploys the unified container to Cloud Run, mounting secrets directly from Google Secret Manager or GitHub Secrets.

### 4. Local Development
For local testing, create a `.env` file (which is strictly ignored by `.gitignore`):
```env
GEMINI_API_KEY="your_gemini_api_key"
VITE_FIREBASE_API_KEY="your_restricted_firebase_api_key"
```

---

### Manual Deploy to Cloud Run with Google Secret Manager
Deploy directly using Google Secret Manager bindings:

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

Once deployment completes, Cloud Run will output your live URL:
```
Service URL: https://reflect-<hash>.asia-east1.run.app
```

---

## 🔒 Firestore Security Rules (`firestore.rules`)

The application enforces zero-trust data access. Every user document and nested subcollection is strictly accessible only by the verified token owner (`request.auth.uid == userId`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated and is the owner
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Root user document
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      
      // Conversations subcollection
      match /conversations/{conversationId} {
        allow read, write: if isOwner(userId);
        
        // Messages subcollection
        match /messages/{messageId} {
          allow read, write: if isOwner(userId);
        }
      }
      
      // Reflections subcollection
      match /reflections/{reflectionId} {
        allow read, write: if isOwner(userId);
      }
      
      // Memories subcollection
      match /memories/{memoryId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Default deny all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

To deploy rules directly with Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 📱 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server (serves Express backend + Vite on port 3000)
npm run dev

# 3. Type check & Lint
npm run lint

# 4. Build for production
npm run build
```

---

## 📋 Hackathon Submission Packet

### 1. Mandatory Service Details
- **Project Name**: Reflect — Enterprise Personal AI Journaling
- **Live Cloud Run URL**: `https://ais-pre-tqhihiyv6tcpt5ljvbcxo7-196996826426.asia-east1.run.app`
- **Cloud Run Service Label**: `dev-tutorial=cloud-run-ai-challenge`
- **Target Region**: `asia-east1`

### 2. Brief Technology Description
> **How Firebase, Firestore, Cloud Run, and Gemini are used:**
> - **Google Cloud Run**: Serves as the high-performance, autoscaling container runtime hosting the unified Express server and Vite application. It guarantees that `GEMINI_API_KEY` remains strictly confidential on the server, while proxying authenticated API requests and serving static assets with sub-second cold starts.
> - **Firebase Auth**: Manages identity verification. The Express server rejects all client-supplied UIDs and extracts identity exclusively from verified JWT bearer claims.
> - **Google Cloud Firestore**: Persists hierarchical user data (`/users/{userId}/...`) across conversations, synthesized reflections, and memories. Access is protected by comprehensive security rules that enforce zero cross-user access (IDOR defense).
> - **Google Gemini (Gemini 2.5 Flash)**: Powers the conversational reasoning engine. It executes multi-turn Socratic inquiry with recalled memory context, and performs structured JSON reflection synthesis into summaries, key decisions, insights, and open loops.

### 3. Ready-to-Use Social Post
Copy and paste this social post for your LinkedIn / Twitter / X / Blog demo submission:

> 🚀 Excited to submit **Reflect** for the Cloud Run AI Challenge!
>
> Reflect is an enterprise-grade, privacy-first personal AI journaling and reflection workspace. Designed with a calming "Natural Tones" visual identity, Reflect helps you think through complex problems, extract key decisions, and synthesize lasting insights.
>
> 🔑 **How we built it:**
> ⚡ **Cloud Run**: Serverless container execution hosting our full-stack Express + React application with zero secret leakage.
> 🧠 **Gemini (via @google/genai)**: Socratic conversational sounding board and structured JSON synthesis.
> 🛡️ **Firebase & Cloud Firestore**: Strict user-partitioned persistence with locked-down security rules and client-side AES-GCM-256 E2EE for personal memories.
>
> Check out the live app: https://ais-pre-tqhihiyv6tcpt5ljvbcxo7-196996826426.asia-east1.run.app
>
> #AccelerateAIwithCloudRun #GoogleCloud #CloudRun #Firebase #GeminiAI
