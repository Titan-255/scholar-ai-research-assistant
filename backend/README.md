# AI Research Assistant Backend (Phase 5 AWS S3 Storage Integration)

This repository contains the production-ready FastAPI backend architecture for the **AI Research Assistant**.

In Phase 5, we migrated the document storage layer from the local filesystem to **Amazon S3** (using `boto3`), leveraging a clean abstract storage layer (`StorageProvider`) to support future cloud migrations with zero API changes.

---

## 📂 Project Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── deps.py        # get_current_user dependency injection
│   │   └── v1/
│   │       └── routes/
│   │           ├── auth.py        # POST /api/v1/auth/register, /login, /refresh, etc.
│   │           ├── users.py       # GET /api/v1/users/me, PUT /me, change password
│   │           ├── upload.py      # POST /api/v1/upload (Protected) - now uploads to S3
│   │           ├── files.py       # GET, DELETE, download /api/v1/files/* (Protected) - pre-signed S3 URLs
│   │           └── health.py      # GET /api/v1/health (Public)
│   ├── core/
│   │   ├── config.py      # Pydantic env settings configuration (AWS S3 configs included)
│   │   ├── database.py    # SQLAlchemy session maker & SQLite/Postgres connect rules
│   │   ├── security.py    # Password hashing (bcrypt) & JWT token builders
│   │   ├── logging.py     # Central logger handler configuration
│   │   └── constants.py   # Global constants and message templates
│   ├── services/
│   │   ├── auth_service.py   # Signup, login, password resets, and session refreshes
│   │   ├── user_service.py   # User updates & password credential shifts
│   │   ├── upload_service.py # Upload file pipelines utilizing StorageService
│   │   ├── file_service.py   # Database file metadata registry
│   │   └── storage/          # SOLID Storage Abstraction
│   │       ├── __init__.py
│   │       ├── provider.py   # StorageProvider abstract class, LocalStorageProvider, S3StorageProvider
│   │       └── service.py    # StorageService orchestrator
│   ├── repositories/
│   │   └── file_repository.py # Database operations for UploadedFile models
│   ├── utils/
│   │   ├── validators.py  # PDF size and extension rules validation
│   │   └── helpers.py     # Filename sanitization to prevent traversal
│   ├── models/
│   │   ├── user.py        # SQLAlchemy User model class definition
│   │   ├── uploaded_file.py # Extended with S3 metadata tracking columns
│   │   └── schemas/
│   │       ├── auth.py    # Pydantic request models for auth endpoints
│   │       ├── user.py    # User response, update, and password change schemas
│   │       ├── upload.py  # Standardised file metadata schemas
│   │       └── responses.py # API Envelope standard response schemas
│   ├── middleware/
│   │   ├── error_handler.py  # Custom global Exception routing
│   │   └── request_logger.py # Request duration performance loggers
│   └── main.py            # FastAPI main entrypoint
├── tests/                 # Pytest integration tests suites (25 tests passing)
├── requirements.txt       # Requirements dependencies definition
├── .env                   # Environment configurations file
└── README.md
```

---

## ⚙️ Environment Variables

The backend loads S3 configuration from your `.env` file. If AWS S3 credentials are not set, it falls back to `LocalStorageProvider` automatically.

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `APP_NAME` | Application name | `"AI Research Assistant Backend"` |
| `DATABASE_URL` | Database connection string | `"sqlite:///./ai_research_assistant.db"` |
| `AWS_ACCESS_KEY_ID` | IAM User Access Key ID | `"AKIAIOSFODNN7EXAMPLE"` |
| `AWS_SECRET_ACCESS_KEY` | IAM User Secret Access Key | `"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"` |
| `AWS_REGION` | AWS Bucket Region name | `"us-east-1"` |
| `AWS_S3_BUCKET` | AWS S3 Bucket Name | `"ai-research-assistant-vault"` |
| `AWS_ENDPOINT_URL` | S3 endpoint override (optional) | `"http://localhost:4566"` (for LocalStack) |

---

## ☁️ AWS S3 Account Setup & Integration Guide

### 1. Create S3 Bucket
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Navigate to the **S3 Console** and click **Create bucket**.
3. Set **Bucket name** (e.g. `ai-research-assistant-vault`) and choose your preferred **Region**.
4. Keep **Block all public access** checked (**IMPORTANT**: The bucket must remain private; access is controlled via backend pre-signed temporary URLs).
5. Leave other settings as default and click **Create bucket**.

### 2. IAM Policy Setup
Create a secure IAM policy allowing read/write/delete operations on your bucket:
1. Navigate to the **IAM Console** -> **Policies** -> **Create policy**.
2. Click the **JSON** tab and paste the following policy:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "VisualEditor0",
               "Effect": "Allow",
               "Action": [
                   "s3:PutObject",
                   "s3:GetObject",
                   "s3:ListBucket",
                   "s3:DeleteObject"
               ],
               "Resource": [
                   "arn:aws:s3:::ai-research-assistant-vault",
                   "arn:aws:s3:::ai-research-assistant-vault/*"
               ]
           }
       ]
   }
   ```
3. Click **Next: Tags** -> **Next: Review**, name it `AIResearchAssistantStoragePolicy`, and click **Create policy**.

### 3. IAM User Creation
1. Go to the **IAM Console** -> **Users** -> **Add users**.
2. Name the user (e.g. `scholar-ai-storage-user`).
3. Select **Access key - Programmatic access** under AWS credential type.
4. Under permissions, select **Attach existing policies directly** and search for `AIResearchAssistantStoragePolicy`.
5. Complete user creation and copy the **Access Key ID** and **Secret Access Key** into your `.env` file.

### 4. Optional: AWS CLI Setup
To inspect your S3 buckets locally:
1. Run `aws configure` in your terminal.
2. Enter your IAM User credentials.
3. List objects:
   ```bash
   aws s3 ls s3://ai-research-assistant-vault --recursive
   ```

---

## 🛠️ Local Development & Installation

1. **Activate Virtual Environment**:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run Migrations**:
   ```bash
   alembic upgrade head
   ```
4. **Start the Dev Server**:
   ```bash
   uvicorn app.main:app --reload
   ```

---

## 🧪 Testing

The test suite covers **25 integration tests** (100% success) covering:
- Authentication & JWT Token issuance/refreshes.
- Local Storage fallbacks.
- S3 upload, delete, and pre-signed temporary link generation.
- User metadata isolation checks.

To run the test suite:
```bash
python -m pytest
```
Output:
```text
======================== 25 passed, 1 warning in 7.08s ========================
```
