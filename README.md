# Guardian Bridge 🛡️

**Guardian Bridge** is a high-stakes **Crisis Response Orchestrator** designed to bridge the critical gap between a citizen's emergency report and professional response services. It acts as a "mission control" for real-time incident management, using AI to transform raw human intent into actionable intelligence.

## 🚀 Features

-   **AI-Powered Crisis Analysis:** Uses **Gemini 3 Flash** to instantly analyze emergency reports from text or photos.
-   **Instant Triage:** Automatically extracts incident type, severity (Low to Critical), and concise descriptions.
-   **Life-Saving Guidance:** Generates immediate, actionable steps for reporters while waiting for professional help.
-   **Real-Time Orchestration:** Built on **Firebase Firestore** for instant data synchronization across all users.
-   **Live Map View:** Interactive Google Map with color-coded markers based on severity.
-   **Collaborative Network:** Role-based access for Reporters and Responders to manage the incident lifecycle.

## 🛠️ Tech Stack

-   **Frontend:** React 19, Tailwind CSS 4, Motion
-   **AI Engine:** Google Gemini 3 Flash (Text & Vision)
-   **Backend:** Firebase (Auth & Firestore)
-   **Mapping:** Google Maps Platform (Advanced Markers)
-   **Icons:** Lucide React

## 🚦 Getting Started

### Prerequisites

-   Node.js 18+
-   Google Cloud Project with **Maps JavaScript API** enabled
-   Firebase Project
-   Gemini API Key

### Environment Variables

Create a `.env` file in the root directory and add the following:

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_PLATFORM_KEY=your_google_maps_api_key
```

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/sbalaramaraju/Guardian-Bridge.git
    cd Guardian-Bridge
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## 🛡️ Security

This project uses **Firebase Security Rules** to ensure that:
-   Reporters can only create incidents and view their own profiles.
-   Responders can manage incident statuses and view the full crisis network.
-   PII is strictly protected and only accessible to authorized users.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.
