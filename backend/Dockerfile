FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create simulated data directory
RUN mkdir -p data

COPY . .

# Ensure initial ML model generates on boot if missing
RUN python models/train_model.py

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
