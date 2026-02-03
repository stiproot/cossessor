FROM python:3.12-slim AS base

FROM base AS deps

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

FROM deps AS runtime

WORKDIR /app

COPY src/ .

ENV PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python

EXPOSE 8001

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
