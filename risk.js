const WEIGHTS = {
  crowd: 0.30,
  alerts: 0.25,
  air: 0.20,
  temperature: 0.15,
  sensorHealth: 0.10
};

const clamp01 = (x) => Math.min(1, Math.max(0, x));

function factorRisks(s) {
  return {
    crowd: clamp01((s.crowdPercent - 60) / 40),
    alerts: clamp01(s.activeAlerts / 3),
    air: clamp01((s.aqi - 50) / 250),
    temperature: clamp01((s.temperatureC - 32) / 13),
    sensorHealth: clamp01(1 - s.sensorsOnline / s.sensorsTotal)
  };
}

function threatLevel(score) {
  if (score >= 80) return "EMERGENCY";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

function computeRisk(s) {
  const f = factorRisks(s);
  const contributions = {};
  let score = 0;
  for (const key of Object.keys(WEIGHTS)) {
    contributions[key] = Math.round(f[key] * WEIGHTS[key] * 100);
    score += f[key] * WEIGHTS[key] * 100;
  }
  if (s.emergencyActive) score = Math.max(score, 80);
       // 2 or more active alerts can never show as a low score.
     if (s.activeAlerts >= 2) score = Math.max(score, 60);
  score = Math.round(score);
  return { score, level: threatLevel(score), contributions };
}

function simulateSensors(prev) {
  const drift = (v, step, min, max) =>
    Math.min(max, Math.max(min, v + (Math.random() * 2 - 1) * step));
  return {
    temperatureC: Math.round(drift(prev.temperatureC, 1.5, 24, 42)),
    crowdPercent: Math.round(drift(prev.crowdPercent, 8, 10, 100)),
    aqi: Math.round(drift(prev.aqi, 15, 20, 300)),
    activeAlerts: prev.activeAlerts,
    emergencyActive: prev.emergencyActive,
    sensorsOnline: prev.sensorsOnline,
    sensorsTotal: prev.sensorsTotal
  };
}
