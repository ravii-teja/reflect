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

### 2. Environment Configuration
Create your `.env` file (or provide secrets via Cloud Run):
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
NODE_ENV=production
```

### 3. Deploy to Cloud Run
Run the deployment command directly from the project directory. Ensure the service label is included:

```bash
gcloud run deploy reflect \
  --source . \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your_gemini_api_key_here",NODE_ENV="production" \
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
