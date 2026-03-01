<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16zqwLbqSf01FotTBFjJ6e5bMEXKxZqKo

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `API_KEY` in `.env` to your Gemini API key. See [.env.example](.env.example) for reference.
3. Run the app:
   `npm run dev`

## Deployment

### Docker

You can run the application using Docker and Docker Compose.

1. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Set your `API_KEY` in the `.env` file.
3. Build and start the container:
   ```bash
   docker-compose up -d --build
   ```
4. Access the app at `http://localhost:3000`.

### CI/CD Pipeline

The project includes a GitHub Actions workflow `.github/workflows/deploy.yml` that automatically runs on pushes to the `main` branch. It performs the following steps:
- Installs dependencies using `bun`.
- Builds the application.
- Runs the test suite.

### Nginx Configuration

An `nginx.conf` is provided as a starting point if you wish to serve the built static assets using Nginx. It includes configuration to handle Single Page Application (SPA) routing.
