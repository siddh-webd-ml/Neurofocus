# NeuroFocus

NeuroFocus is a browser extension that helps users stay focused by modifying web content in real time based on their goal, instead of blocking entire websites.

## Problem

Modern platforms such as YouTube, Reddit, and X are designed for engagement, which often leads to distraction, irrelevant recommendations, and reduced productivity.

## Solution

NeuroFocus transforms these platforms into goal-oriented environments by filtering content intelligently and guiding user behavior.

## How It Works

1. The user enters a goal (for example: DSA, Machine Learning)
2. The system analyzes content on the page in real time
3. Content is classified into:
   - Relevant
   - Semi-relevant
   - Irrelevant
4. The UI updates dynamically:
   - Relevant content is highlighted
   - Semi-relevant content is lightly blurred and shows a “Continue Anyway” prompt
   - Irrelevant content is strongly blurred or hidden

## Tech Stack

- JavaScript (ES6)
- Chrome Extension APIs (Manifest V3)
- DOM manipulation and MutationObserver
- Gemini API (for intent expansion and content scoring)
- CSS for visual effects

## Key Features

- Real-time content filtering
- Goal-based browsing
- AI-assisted relevance detection
- Continuous page monitoring
- Distraction removal (Shorts, sidebars, etc.)
- Behavior-aware interaction prompts
- Focus timer with notifications
- Multi-platform support (YouTube, Reddit, X)

## Architecture

User Input (Goal)
→ Content Script (Controller)
→ Context Engine (Relevance Analysis)
→ DOM Engine (Page Modification)
→ UI Engine (User Interaction)
→ Background (Timer, API, Badge)

## Installation

1. Clone the repository
   git clone https://github.com/siddh-webd-ml/Neurofocus

2. Open Chrome and go to:
   chrome://extensions/

3. Enable Developer Mode

4. Click “Load unpacked”

5. Select the project folder

## Usage

1. Open the extension
2. Enter your goal
3. Enable focus mode
4. Browse with filtered content

## Privacy

All processing happens locally. No personal data is stored or transmitted, except for optional API-based content analysis.

## Future Improvements

- Improved personalization
- Support for additional platforms
- Custom filtering rules
- Performance optimization

## Acknowledgement

This project was built during a hackathon to explore practical ways to reduce digital distraction and improve focus.

## Statement

We do not block the internet — we refine it.
