import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

type Reading = {
  id: number
  observed_at: string
  lat?: number | null
  lon?: number | null
  temperature_c: number | null
  wind_speed_ms: number | null
  pressure_hpa: number | null
  humidity_pct: number | null
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function App() {
  const [lat, setLat] = useState<string>('55.7558')
  const [lon, setLon] = useState<string>('37.6173')
  const [last, setLast] = useState<Reading | null>(null)
  const [recent, setRecent] = useState<Reading[]>([])
  const [from, setFrom] = useState<string>(formatDate(new Date(Date.now() - 7 * 86400000)))
  const [to, setTo] = useState<string>(formatDate(new Date()))
  const [rangeData, setRangeData] = useState<Reading[] | null>(null)

  // First load: last
  useEffect(() => {
    axios.get(`${API_BASE}/weather/last`, { params: { lat, lon }})
      .then(r => setLast(r.data))
      .catch(() => {})
  }, [lat, lon])

  // Async load: 50 recent
  useEffect(() => {
    axios.get(`${API_BASE}/weather/recent`, { params: { limit: 50, lat, lon }})
      .then(r => setRecent(r.data))
      .catch(() => {})
  }, [lat, lon])

  // Load range when dates or location change
  useEffect(() => {
    const controller = new AbortController()
    axios.get(`${API_BASE}/weather/range`, { params: { from, to, lat, lon }, signal: controller.signal })
      .then(r => setRangeData(r.data))
      .catch(() => {})
    return () => controller.abort()
  }, [from, to, lat, lon])

  const chartData = useMemo(() => {
    const data = rangeData && rangeData.length > 0 ? rangeData : recent
    return [...data].reverse().map(d => ({
      time: new Date(d.observed_at).toLocaleString(),
      temperature: d.temperature_c,
      pressure: d.pressure_hpa,
      wind: d.wind_speed_ms,
      humidity: d.humidity_pct,
    }))
  }, [rangeData, recent])

  const triggerFetch = async () => {
    try {
        axios.get(`${API_BASE}/weather/last`, { params: { lat, lon }}).then(r => setLast(r.data)).catch(() => {})
        axios.get(`${API_BASE}/weather/recent`, { params: { limit: 50, lat, lon }}).then(r => setRecent(r.data)).catch(() => {})
    } catch {

    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16, fontFamily: 'system-ui, Arial' }}>
      <h2>Weather</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <label>
          Lat: <input type="number" step="0.0001" value={lat} onChange={e => setLat(e.target.value)} style={{ width: 120 }} />
        </label>
        <label>
          Lon: <input type="number" step="0.0001" value={lon} onChange={e => setLon(e.target.value)} style={{ width: 120 }} />
        </label>
        <button onClick={triggerFetch}>Fetch now</button>
      </div>
      {last ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div><strong>Observed:</strong> {new Date(last.observed_at).toLocaleString()}</div>
          <div><strong>Temp:</strong> {last.temperature_c ?? '—'} °C</div>
          <div><strong>Wind:</strong> {last.wind_speed_ms ?  last.wind_speed_ms : '—'} m/s</div>
          <div><strong>Pressure:</strong> {last.pressure_hpa ?? '—'} hPa</div>
          <div><strong>Humidity:</strong> {last.humidity_pct ?? '—'} %</div>
        </div>
      ) : (
        <div>Loading last reading…</div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label>
          From: <input type="date" value={from} onChange ={e => setFrom(e.target.value)} />
        </label>
        <label>
          To: <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </label>
      </div>

      <div style={{ width: '100%', height: 360, border: '1px solid #ddd', borderRadius: 8, padding: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" minTickGap={32} />
            <YAxis yAxisId="left" orientation="left" label={{ value: ' % / m/s / °C', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" color='#3498db' label={{ value: 'hPa', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#e74c3c" dot={false} name="Temperature" />
            <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="#3498db" dot={false} name="Pressure" />
            <Line yAxisId="left" type="monotone" dataKey="wind" stroke="#2ecc71" dot={false} name="Wind" />
            <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#FFC0CB" dot={false} name="Humidity" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 