from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    # 1. Remove exact duplicate rows
    df = df.drop_duplicates()
    
    # 2. Clean Text Columns (Remove quotes and standardize)
    if 'Name' in df.columns:
        # Remove any non-alphabetic characters (like quotes) and capitalize
        df['Name'] = df['Name'].astype(str).str.replace(r'[^a-zA-Z\s]', '', regex=True).str.strip().str.title()
        
    if 'Gender' in df.columns:
        # Standardize gender to just M, F, or Unknown
        df['Gender'] = df['Gender'].astype(str).str.upper().str.strip()
        df['Gender'] = df['Gender'].apply(lambda x: 'M' if x.startswith('M') else ('F' if x.startswith('F') else 'Unknown'))
        
    if 'Grade' in df.columns:
        # Extract just the number from grades (e.g., "Grade 11" -> "11")
        df['Grade'] = df['Grade'].astype(str).str.extract(r'(\d+)').fillna("Unknown")

    # 3. Clean Numeric Columns & Handle Missing Values
    numeric_cols = ['Math', 'Science', 'English'] 
    for col in numeric_cols:
        if col in df.columns:
            # Strip words like "marks", convert to numeric, fill missing with 0
            df[col] = df[col].astype(str).str.replace(r'[^\d.]', '', regex=True)
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            
    df = df.fillna("Unknown")

    # 4. Recalculate the Total column strictly using the cleaned subject scores
    existing_numeric = [col for col in numeric_cols if col in df.columns]
    if existing_numeric:
        df['Total'] = df[existing_numeric].sum(axis=1)

    cleaned_data = df.to_dict(orient="records")
    
    return {
        "filename": file.filename,
        "total_rows": len(df),
        "data": cleaned_data
    }