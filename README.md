# Grievance Redressal Portal

A web-based Grievance Redressal Portal developed as a college minor project to help citizens report issues, track complaint status, and communicate with concerned departments through a single platform.

## Project Type

College Minor Project

## Problem Statement

In many local governance systems, citizens face delays and confusion while reporting civic issues such as water supply problems, streetlight failures, sanitation concerns, and emergency incidents. Existing processes are often manual, fragmented, or difficult to track.

This project provides a centralized digital portal where complaints can be submitted, monitored, and managed by different authorities.

## Objectives

- Build a unified platform for grievance registration and tracking.
- Improve transparency between citizens and authorities.
- Provide role-based dashboards for citizens, officers, and emergency responders.
- Support multilingual interaction for better accessibility.
- Integrate AI-assisted features for faster categorization and response support.

## Key Features

### Citizen Features

- Register and log in securely.
- Submit grievances with category and details.
- Track complaint status in real time.
- Access chat support and notifications.
- Use health and assistance modules (symptom checker, reminders, follow-up tools).

### Officer/Authority Features

- View and manage assigned complaints.
- Update complaint status and actions taken.
- Review analytics and reports.
- Coordinate with emergency and support teams.

### Emergency and Support Features

- SOS alert module for urgent situations.
- Location-aware emergency coordination.
- Basic medical support modules.

### Additional Modules

- Notice interpretation support.
- Face blur utility for privacy-sensitive uploads.
- Recipe, workout, and health-plan utilities (project extension modules).

## Technology Stack

### Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Reusable UI components

### Backend

- Python (Flask)
- REST API endpoints

### AI/Utility Integrations

- Gemini APIs for selected interpretation and assistant workflows
- Optional voice/chat support modules

## Project Structure

```text
app/                Next.js routes and pages
components/         Shared UI and feature components
backend/            Python backend services
lib/, utils/, hooks/ Utility functions and helpers
public/             Static assets, service worker, manifest
scripts/            Utility and test scripts
```

## Installation and Setup

### Prerequisites

- Node.js 18+
- Python 3.8+
- npm or pnpm

### Steps

1. Clone the repository:

```bash
git clone https://github.com/SoloLeveling2022/Grievance-Redressal-Portal.git
cd "Grivence Portal Minor"
```

2. Install frontend dependencies:

```bash
npm install
# or
pnpm install
```

3. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
cd ..
```

4. Create environment file (`.env.local`) in root:

```env
GEMINI_API_KEY=your_gemini_api_key
PY_BACKEND_URL=http://localhost:5000
VOICE_API_KEY=your_voice_api_key
```

5. Run the project:

Terminal 1 (frontend):

```bash
npm run dev
```

Terminal 2 (backend):

```bash
cd backend
python app.py
```

6. Open in browser:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Main User Roles

- Citizen: files complaints, tracks updates, and communicates with support.
- Officer/Authority: reviews, assigns, and resolves grievances.
- Emergency/Police Team: handles alerts and urgent incidents.
- Admin (optional): monitors overall activity and analytics.

## Academic Scope

This minor project demonstrates:

- Full-stack web application development
- API integration between Next.js and Flask services
- Role-based dashboard design
- Basic AI-enabled assistance workflows
- Accessibility and multilingual support considerations

## Limitations

- Some integrations are prototype-level and require production hardening.
- Advanced telephony/voice features may require external paid services.
- Security, deployment, and scaling are currently configured for development/demo usage.

## Future Enhancements

- Add more Indian language support.
- Improve automated grievance routing accuracy.
- Add SMS/WhatsApp status updates.
- Deploy with production-grade authentication and monitoring.
- Introduce district/state-level analytics dashboards.

## License

This project is licensed under the MIT License.

## Contributors

Developed as a college minor project by the student team.