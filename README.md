<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1W0wiMUjfahTe7KULxv2K4UXBlTd2lamn

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
 
Environment variables
---------------------
- Copy `.env.example` to `.env.local` and set your API keys. Example variables:

```
DOUBAO_API_KEY=your_doubao_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Do NOT commit `.env.local` with real secret keys to source control.
