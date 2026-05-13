FROM ghcr.io/osgeo/gdal:ubuntu-small-3.8.5

RUN apt-get update && \
    apt-get install -y python3-pip python3-dev curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /worker

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python3", "-c", "print('Worker pronto. Invocado pela API via subprocess.')"]
