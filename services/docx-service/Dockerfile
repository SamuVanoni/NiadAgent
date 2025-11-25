FROM python:3.11-slim

# Install LibreOffice for DOCX->PDF conversion
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-core libreoffice-writer libreoffice-common libreoffice-java-common \
    libreoffice-style-breeze libreoffice-style-elementary \
    fonts-dejavu-core \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./app /app
COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r /app/requirements.txt

EXPOSE 8090

CMD ["python", "-u", "/app/main.py"]
