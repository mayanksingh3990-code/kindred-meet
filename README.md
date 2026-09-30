# 🌻 Kindred Meet — Simple Video Calls with Hugging Face AI Subtitles

A clean, serene, accessible video meeting app designed specifically for **grandparents / seniors** and **kids**, now supercharged with **Hugging Face AI Real-Time Speech Translation**.

---

## ✨ What's New: Hugging Face AI Subtitles & Simpler UI

### 🤖 1. Real-Time AI Speech Translation & Captions
- **Dual-Language Live Subtitles**: As people talk, their voice is captured and translated in real-time into the chosen language (Spanish, Hindi, French, German, Chinese, Japanese, Arabic, etc.).
- **Hugging Face Inference API Integration**: Powered by NLLB-200 (`facebook/nllb-200-distilled-600M` & multilingual models) with automatic smart fallback.
- **Crystal-Clear Display**: Shows the large translated text plus the original spoken sentence directly under the video.

### 🎨 2. Simplified, Calmer, Accessible Design
- **Zero Clutter**: Clean, peaceful slate and cream palettes designed to reduce cognitive load and visual fatigue.
- **Large 1-Tap Family Cards**: Tap *Grandma Rose*, *Grandpa Joe*, or *Mom & Dad* to start calling with zero configuration.
- **Giant Clear Controls**: Unmistakable buttons for Mic, Camera, AI Subtitles, Audio Volume Booster, and Hang Up.
- **100% Reliable In-App Hang Up**: Friendly confirmation dialog (*"End this call? [Keep Talking] [Yes, Hang Up]"*) that cleanly releases camera and microphone resources.

---

## 🚀 Quick Start

### 1. Run the Server
```bash
npm start
```

### 2. (Optional) Set Hugging Face Token
To use your private Hugging Face Inference quota:
```bash
export HUGGINGFACE_API_KEY="hf_your_token_here"
npm start
```
*(If no token is provided, Kindred Meet will automatically use free translation so it works out-of-the-box!)*

### 3. Open in Browser
- **Local machine**: [http://localhost:3000](http://localhost:3000)
- **Family tablet / phone / laptop**: `http://<YOUR_LOCAL_IP>:3000`
