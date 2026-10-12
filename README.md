<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00F5FF,50:7B2FFF,100:FF2E97&height=220&section=header&text=JOB%20TRACKER&fontSize=70&fontColor=ffffff&fontAlignY=38&desc=AI-Powered%20Job%20Search%20Command%20Center&descSize=20&descAlignY=60&animation=fadeIn" alt="Job Tracker banner" width="100%" />

<a href="https://github.com/gomezdevelops/job-tracker">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&duration=3000&pause=800&color=00F5FF&center=true&vCenter=true&width=700&lines=Track+every+application.;Analyze+every+job+description.;Match+your+resume+to+any+role.;Prepare+smarter+with+AI." alt="Typing animation" />
</a>

<br/>

![React](https://img.shields.io/badge/React-0D1117?style=for-the-badge&logo=react&logoColor=00F5FF)
![Vite](https://img.shields.io/badge/Vite-0D1117?style=for-the-badge&logo=vite&logoColor=B84DFF)
![FastAPI](https://img.shields.io/badge/FastAPI-0D1117?style=for-the-badge&logo=fastapi&logoColor=00F5FF)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-0D1117?style=for-the-badge&logo=postgresql&logoColor=7B9FFF)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-0D1117?style=for-the-badge&logo=tailwindcss&logoColor=00F5FF)
![OpenAI](https://img.shields.io/badge/OpenAI-0D1117?style=for-the-badge&logo=openai&logoColor=FF2E97)

![Status](https://img.shields.io/badge/status-local%20development-7B2FFF?style=flat-square&labelColor=0D1117)
![Deployment](https://img.shields.io/badge/deployment-planned-FF2E97?style=flat-square&labelColor=0D1117)
![Python](https://img.shields.io/badge/python-3.11+-00F5FF?style=flat-square&labelColor=0D1117&logo=python&logoColor=00F5FF)
![License](https://img.shields.io/badge/license-not%20specified-555?style=flat-square&labelColor=0D1117)

<br/>

**A full-stack job application management platform.**
Track applications, organize your job search, analyze job descriptions, compare your resume against job requirements, and use AI-powered tools to prepare for your next opportunity.

<br/>

[**⚡ Features**](#-features) · [**🧠 AI Engine**](#-ai-engine) · [**🛠 Tech Stack**](#-tech-stack) · [**🚀 Quick Start**](#-quick-start) · [**🔐 Security**](#-security-considerations) · [**🗺 Roadmap**](#-roadmap)

</div>

---

## 🌐 Overview

Job Tracker helps job seekers manage the entire application process from a single dashboard. It combines **application tracking, resume management, job description intelligence, interview preparation, reminders, and analytics** in one application.

The platform supports both **rule-based job analysis** and **AI-powered career assistance** through the OpenAI API.

<table>
<tr>
<td width="25%" align="center"><h3>📋</h3><b>Track</b><br/><sub>Applications, statuses, priorities, follow-ups</sub></td>
<td width="25%" align="center"><h3>🔍</h3><b>Analyze</b><br/><sub>Job descriptions, skill gaps, resume matches</sub></td>
<td width="25%" align="center"><h3>🤖</h3><b>Generate</b><br/><sub>Tailored resume tips and cover letters</sub></td>
<td width="25%" align="center"><h3>🎯</h3><b>Prepare</b><br/><sub>Interview questions and insights</sub></td>
</tr>
</table>

---

## ⚡ Features

### 🔐 Authentication & Security
- User registration and login
- JWT-based authentication
- Protected application and resume management endpoints
- Authenticated API requests from the frontend
- Environment-based configuration for secrets and credentials

### 📋 Job Application Management
- Create, view, update, and delete job applications
- Track application statuses throughout the recruitment process
- Assign priorities to applications
- Search applications by relevant information
- Filter and sort applications
- Manage application details, including job descriptions and related information

### 🗂 Application Board
- Organize job applications in a visual board
- Move applications between stages using drag and drop
- Update application progress visually
- Keep track of opportunities at different recruitment stages

### 📊 Dashboard & Analytics
- View application statistics in a centralized dashboard
- Monitor application status distributions
- Analyze application trends
- Review job search progress and activity
- Identify areas where your job search may need improvement

### 📄 Resume Management
- Upload resumes in PDF format
- Extract text from uploaded resumes
- Download stored resumes
- Set a default resume
- Track resume file sizes and matching history
- Reuse resume content for job matching and AI-powered tools

### 🎯 Resume Matching
Compare resume content against a job description to evaluate how well a candidate aligns with a role.

- Resume and job description comparison
- Match score analysis
- Identification of relevant strengths
- Detection of missing or underrepresented skills
- Suggestions for improving resume relevance
- Match history for reviewing previous analyses

### 🧬 Job Description Intelligence
Extract useful information from job descriptions using rule-based analysis and AI assistance.

| Extracted Insight | Extracted Insight |
|---|---|
| Job summaries | Technologies and tools |
| Key responsibilities | Important keywords |
| Required skills | Experience requirements |
| Preferred skills | Seniority level |
| Education requirements | Work mode, where specified |

Results can be **cached** and revisited through analysis history. Users can refresh an analysis when needed.

### 🧩 Resume Skill Gap Analysis
- Compare resume skills with required job skills
- Identify missing or underrepresented skills
- Highlight areas that may need improvement
- Support more focused learning and resume updates

### ✍️ AI Resume Tailoring
- Create a role-specific professional summary
- Identify skills to emphasize
- Extract relevant ATS keywords
- Highlight missing keywords
- Suggest improvements to experience descriptions
- Recommend changes to resume organization and content

> [!IMPORTANT]
> Suggestions should be reviewed and verified before being added to a resume. The application should not be used to claim qualifications or experience that a candidate does not have.

### 💌 AI Cover Letter Generation
- Create a professional cover letter
- Customize the content for a company and role
- Generate a suggested subject line
- Identify the main points highlighted in the letter

### 🎤 AI Interview Preparation
- Technical, behavioral, and role-specific interview questions
- Explanations of why each question matters
- Preparation tips for each question
- Guidance based on identified skill gaps

### 💡 AI Application Insights
- Summarize application activity
- Identify positive patterns and highlight areas for improvement
- Recommend follow-up actions
- Suggest ways to improve application conversion
- Help organize interview preparation and application deadlines

### 🚦 AI Priority Recommendations
Receive contextual recommendations for prioritizing job applications, based on:

- Current application status
- Time since application
- Pending follow-ups
- Resume match score
- Urgency of the next action

The system returns a **suggested priority, urgency level, reasoning, and recommended actions**.

### 🔔 Notifications & Reminders
- Notification center with unread count
- Notification dropdown
- Mark notifications as read
- Navigate to related application details
- Track follow-ups and upcoming interviews
- Review reminders that require attention

### 📅 Follow-Up Management
- Track follow-up dates
- Identify follow-ups that are due
- Keep track of upcoming interviews
- Organize next steps for active applications

### 🧮 Bulk Application Management
- Select multiple applications
- Update application statuses in bulk
- Change priorities in bulk
- Delete selected applications

### 🕒 Timeline & Application History
- Review application activity over time
- Track changes and important events
- Keep relevant application information organized

---

## 🧠 AI Engine

Job Tracker integrates with the OpenAI API using the **official Python SDK** and the **Responses API**.

```mermaid
flowchart LR
    A[⚛️ React Frontend] -->|Axios + JWT| B[🚀 FastAPI Backend]
    B --> C[(🐘 PostgreSQL)]
    B --> D[📄 Resume Storage]
    B --> E[🧬 Rule-Based Analysis]
    B --> F[🤖 AI Service Layer]
    F -->|Responses API| G[✨ OpenAI]
```

The AI service layer provides functions for:

| Capability | Capability |
|---|---|
| 🧬 Job description analysis | 💌 Cover letter generation |
| 🎯 Resume matching | 💡 Application insights |
| ✍️ Resume tailoring | 🎤 Interview preparation |
| 🚦 Application priority recommendations | |

The application also includes **rule-based job description analysis**, allowing supported analysis functionality to work without an AI API call.

> [!NOTE]
> AI-powered features require a valid OpenAI API key and sufficient API credits. OpenAI API usage is billed separately from ChatGPT subscriptions.

---

## 🛠 Tech Stack

<table>
<tr>
<td valign="top" width="25%">

**🖥 Frontend**
- React
- Vite
- JavaScript
- React Router
- Axios
- Tailwind CSS
- Recharts

</td>
<td valign="top" width="25%">

**⚙️ Backend**
- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT authentication
- Uvicorn

</td>
<td valign="top" width="25%">

**🤖 AI & Documents**
- OpenAI Python SDK
- OpenAI Responses API
- PDF text extraction

</td>
<td valign="top" width="25%">

**🧰 Dev Tools**
- Git and GitHub
- Python virtual environments
- npm
- FastAPI Swagger docs

</td>
</tr>
</table>

---

## 📁 Project Structure

```text
job-tracker/
├── backend/
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── uploads/
│   ├── .env.example
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   └── pages/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
└── README.md
```

> The structure above highlights the main application directories. Individual files and modules may evolve as development continues.

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.11 or another version supported by the project's dependencies
- **Node.js** and npm
- **PostgreSQL**
- **Git**
- *(Optional)* An **OpenAI API key**, required only for AI-powered features

### 1️⃣ Clone the repository

```bash
git clone https://github.com/gomezdevelops/job-tracker.git
cd job-tracker
```

### 2️⃣ Configure the backend

```powershell
cd backend
```

Create and activate a virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```powershell
python -m pip install -r requirements.txt
```

Create a local environment file from the example:

```powershell
Copy-Item .env.example .env
```

Edit `backend/.env` with your local configuration:

```dotenv
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/job_tracker

JWT_SECRET=REPLACE_WITH_A_SECURE_RANDOM_SECRET
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-5-mini
```

Replace the example database credentials with your actual local PostgreSQL configuration and generate a secure random value for `JWT_SECRET`. If you do not intend to use AI features, leave `OPENAI_API_KEY` empty.

> [!CAUTION]
> Never commit your real `.env` file, API keys, database passwords, or JWT secrets to GitHub.

### 3️⃣ Create the PostgreSQL database

Create a PostgreSQL database named `job_tracker`, or update `DATABASE_URL` to match your existing database. Make sure PostgreSQL is running before starting the backend.

### 4️⃣ Apply database migrations

From the `backend` directory:

```powershell
alembic upgrade head
```

### 5️⃣ Start the backend

```powershell
uvicorn app.main:app --reload
```

| Service | URL |
|---|---|
| API | `http://127.0.0.1:8000` |
| Swagger Docs | `http://127.0.0.1:8000/docs` |

### 6️⃣ Start the frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Vite will display the local development URL, usually `http://localhost:5173`. Open it in your browser.

> [!NOTE]
> The current frontend API client uses `http://127.0.0.1:8000` as its base URL. This works for local development. A configurable API URL will be needed when deploying the frontend and backend separately.

---

## ⚙️ Configuration Reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used for signing JWTs |
| `JWT_ALGORITHM` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time in minutes |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `OPENAI_MODEL` | Model used for AI requests |

Keep production secrets in the hosting provider's environment variable settings rather than in source control.

---

## ✅ Development & Verification

<details>
<summary><b>View local verification checklist</b></summary>

<br/>

The application has been tested locally with the following checks:

- [x] Frontend production build
- [x] Backend Python compilation
- [x] Alembic migration state and schema consistency checks
- [x] Authentication and application API endpoints
- [x] Resume upload and PDF text extraction
- [x] Notification functionality
- [x] Job description intelligence and caching
- [x] Resume matching
- [x] Live OpenAI API connection
- [x] AI job description analysis
- [x] AI resume matching and tailoring
- [x] AI cover letter generation
- [x] AI interview preparation
- [x] AI application insights
- [x] AI application priority recommendations

These checks reflect local development verification. They do not imply that the application has been deployed to a production environment or undergone a complete production security audit.

</details>

---

## 🛰 Current Deployment Status

The application is currently **developed and tested locally**. Production deployment is planned.

Deployment preparation will need to account for:

- Hosted PostgreSQL
- A production API host for FastAPI
- Frontend hosting
- Production CORS configuration
- Secure environment variables
- Persistent storage for uploaded resumes
- Database migrations and backups
- A configurable frontend API URL

> [!WARNING]
> The existing local upload directory should not be treated as permanent storage in an environment where files may be removed during restarts or redeployments.

---

## 🔐 Security Considerations

- 🔑 Never expose OpenAI API keys in frontend code
- 🙈 Never commit `.env` files containing secrets
- 🧬 Use a secure JWT signing secret in production
- 🌍 Restrict CORS to trusted frontend origins
- 📎 Validate uploaded files and enforce appropriate size limits
- 🔒 Use HTTPS in production
- 👤 Apply appropriate authorization checks to user-owned resources
- 📄 Protect uploaded resumes and extracted resume content as private data
- 💾 Configure database backups before relying on the application for long-term tracking

---

## 🗺 Roadmap

- [ ] Production deployment and automated deployment workflows
- [ ] Configurable API endpoints for multiple environments
- [ ] Persistent object storage for resumes
- [ ] Automated testing and continuous integration
- [ ] More advanced analytics and reporting
- [ ] Improved AI response formatting and validation
- [ ] Additional export options for application data
- [ ] Enhanced production monitoring and error reporting

---

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. 🍴 Fork the repository
2. 🌿 Create a feature branch
3. 🛠 Implement and test your changes
4. 💬 Commit your changes with a descriptive message
5. 🚀 Open a pull request describing the improvement

---

## 📜 License

No license has been specified yet. Unless a license is added to this repository, all rights remain with the copyright holder and others should not assume they have permission to redistribute or modify the project.

---

## 👤 Author

<div align="center">

**Abin Gomez**

[![GitHub](https://img.shields.io/badge/GitHub-@gomezdevelops-0D1117?style=for-the-badge&logo=github&logoColor=00F5FF)](https://github.com/gomezdevelops)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Abin%20Gomez-0D1117?style=for-the-badge&logo=linkedin&logoColor=7B9FFF)](https://linkedin.com/in/abingomez)

<br/>

*Built to make job searching more organized, measurable, and efficient.*

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:FF2E97,50:7B2FFF,100:00F5FF&height=120&section=footer" alt="footer" width="100%" />

</div>
