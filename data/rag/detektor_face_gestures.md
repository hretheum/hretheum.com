---
slug: detektor_face_gestures
brand: hretheum
industry: AIOriginals
accent: "#0ea5e9"
role: Realtime CV + Home Automation
location: Remote • Warsaw
period: "2025 – ongoing"
tags:
  - Face Recognition
  - Gestures
  - mmWave
  - Home Assistant
  - Voice
  - Realtime
hero:
  title: "DETEKTOR — FACE & GESTURE INTERFACE FOR THE HOME"
  subtitle: "mmWave presence gating, camera for faces & gestures, voice interplay, privacy‑first."
  summary: "Presence comes from mmWave sensors; the camera focuses on who and what — faces and gestures. The home reacts instantly with voice and automations, without staring at feeds."
  metric:
    label: "Gesture→action latency"
    value: "|presence| GATE[Presence gate]
  CAM[Camera] --> BUF[Lossless buffer]
  BUF --> INF[Face and gesture inference GPU]
  GATE --> EVT[Event bus]
  INF --> EVT
  EVT --> HA[Home Assistant]
  HA --> DEV[Lights / Media / Devices]
  HA --> VA[Voice assistant]
  EVT --> TSDB[TimescaleDB]
  TSDB --> GRAF[Grafana]
```

### Reference kit

- **Buffer & capture** — `services/rtsp-capture/`, `services/frame-buffer-v2/`
- **Events & storage** — `services/frame-events/`, `services/timescaledb/`
- **Observability** — `monitoring/`, `grafana/`, `prometheus.yml`
- **HA bridge** — MQTT/WebSocket integration (automations, voice)
- **Gesture processor** — customize the sample processor for a small, explainable gesture set

## WHY IT WORKS

Presence is done by the right sensor (mmWave). The camera is freed to understand identity and intent. Deterministic rules in HA combine signals safely, while voice confirms or offers alternatives. Privacy stays top‑of‑mind: events over pixels, local‑first processing, and short retention.

## NEXT ITERATIONS

1. Expand gesture set with per‑room context and voice confirmation thresholds.
2. On‑device models with NN accelerators for ultra‑low latency and privacy.
3. Feedback loop to fine‑tune false accept/reject rates per household.
