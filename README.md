<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🗳️ E-14 Real-time Auditor

**E-14 Real-time Auditor** is an advanced election auditing dashboard designed to visualize, monitor, and analyze electoral acts (such as E-14 forms) in real-time. It provides a robust pipeline for detecting anomalies, arithmetic fraud, and physical alterations (like erasures or amendments) on electoral documents using AI vision models.

## 📖 System Description

The application acts as a central **Control Center** that processes incoming electoral forms via a simulated data ingestion pipeline. It integrates seamlessly with Gemini API for deep forensic and strategic analysis of the documents.

### Key Modules:
- **🎛️ Control Center (Dashboard):** Real-time monitoring of the E-14 ingestion process. Displays key metrics like queue size, processed documents, CPU load, and fraud detection rates.
- **📡 Architecture & Live Logs:** Visualizes the data flow from ingestion (e.g., WhatsApp bots / ClawdBot) to processing queues (Redis), analysis (Gemini/Ryzen), and storage (PocketBase).
- **🕵️ Manual Forensic Audit:** Allows users to manually upload specific E-14 forms for deep-dive forensic analysis using Google's generative AI models to detect physical tampering and validate arithmetic consistency.
- **🗄️ Data Lake:** A comprehensive view of historical records, export tools, and long-term storage integration.

## 🏗️ Implementation Details

The project is built as a modern, high-performance Single Page Application (SPA).

- **Frontend Framework:** React 19 + TypeScript, powered by Vite for rapid development and optimized builds.
- **Styling & UI:** Tailwind CSS (configured via standard class names in the components) for a responsive, dark-mode focused UI. Icons are provided by `lucide-react`.
- **Data Visualization:** `recharts` is utilized for rendering real-time metrics and charts.
- **AI Integration:** Leverages the official `@google/genai` SDK to process images and infer text or physical alterations (e.g., "Tachones" or "Enmendaduras").
- **Testing:** Uses `bun test` along with `@testing-library/react` and `happy-dom` for fast and reliable component testing.

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher) or **Bun**
- A **Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/))

### Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   # or using bun
   bun install
   ```

2. **Configure Environment:**
   Copy the example environment file and add your Gemini API Key.
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and set `VITE_GEMINI_API_KEY=your_api_key_here` (or `API_KEY` as per your `.env.example`).*

3. **Start the Development Server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```
   Access the app at `http://localhost:5173`.

### 🐳 Docker Deployment

You can quickly deploy the application using Docker and Docker Compose.

1. Ensure your `.env` file is set up with your `API_KEY`.
2. Build and start the container:
   ```bash
   docker-compose up -d --build
   ```
3. Access the application at `http://localhost:3000`.

### 🛠️ CI/CD Pipeline

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically runs on pushes to the `main` branch. The pipeline:
- Installs dependencies using `bun`.
- Builds the production-ready application.
- Runs the test suite to ensure code quality.

## 📜 License & Security
Ensure your `.env` file is never committed. Review the architecture to properly secure your PocketBase and Redis instances in a production environment.
