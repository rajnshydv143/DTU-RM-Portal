# DTU Recruitment Manager (RM) Portal 🎓

A full-stack Student Data Pipeline and filtering interface built for the DTU Technical Assessment. This application automatically sanitizes raw student datasets and provides a real-time, high-performance dashboard for recruiters to shortlist candidates.

## 🎥 Video Demonstration
[**Click here to watch the Demo Video**](https://drive.google.com/file/d/1Z_KA7vd20j7HhD8awxC_P57Ksq09P9hD/view?usp=sharing)

## 🚀 Features & UI Functionality
* **Dynamic Score Filter:** A range slider that instantly updates the active shortlist and recalculates live statistics.
* **Debar System:** Toggle candidates as 'Debarred' to instantly exclude them from the exportable shortlist and metrics, while keeping them visible for easy reversal.
* **Smart Search & Pagination:** Search across all candidate attributes instantly, rendering 50 rows per page to maintain browser performance.
* **CSV Export:** One-click download of the final, filtered shortlist.

## 🧹 Data Cleaning Logic
The backend utilizes Python (`pandas`) to process the CSV upon upload:
1. **Deduplication:** Drops exact duplicate rows automatically.
2. **Text Standardization:** Uses Regex to strip special characters from names, standardizes gender formatting, and extracts raw numbers from grades (e.g., "Grade 11" to "11").
3. **Numeric Sanitization:** Removes stray text (like "marks") from subject columns, enforces numeric types, and imputes missing scores with `0`.
4. **Recalculation:** Overrides the raw CSV `Total` column by strictly recalculating the sum of the sanitized subject scores to ensure absolute data integrity.

## 🛠️ Local Setup Instructions

### 1. Backend Setup (FastAPI)
Open a terminal and navigate to the `backend` folder:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install fastapi uvicorn pandas python-multipart
uvicorn main:app --reload
```

### 2. Frontend Setup (React/Vite)
Open a second, separate terminal and navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm install axios
npm run dev
```
Access the portal in your browser at `http://localhost:5173`.
