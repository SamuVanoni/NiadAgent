FROM python:3.10-slim
WORKDIR /usr/src/app

# Instala ffmpeg (necessário para o Whisper processar áudio)
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

EXPOSE 5000
CMD [ "python", "app/main.py" ]