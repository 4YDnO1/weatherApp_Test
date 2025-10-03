import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

// Too complex already for test task
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/weather'

type Weather = {
  id: number
  observed_at: string
  lat?: number | null
  lon?: number | null
  temperature_c: number | null
  wind_speed_ms: number | null
  pressure_hpa: number | null
  humidity_pct: number | null
}
// interface Props {
//   from: string;
//   to: string;
//   latFromProps: number;
//   lonFromProps: number;
// }
interface DataErrors {
  draftLat?: string;
  draftLon?: string;
  from?: string;
  to?: string;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function App() {
  const [lat, setLat] = useState<string>('54.9044')
  const [lon, setLon] = useState<string>('52.3154')
  const [draftLat, setDraftLat] = useState<string>(lat);
  const [draftLon, setDraftLon] = useState<string>(lon);

  const [errors, setErrors] = useState<DataErrors>({});

  const [from, setFrom] = useState<string>(''); // formatDate(new Date(Date.now() - 7 * 86400000))
  const [to, setTo] = useState<string>(''); // formatDate(new Date())

  const [lastData, setLastData] = useState<Weather | null>(null);
  const [recentData, setRecentData] = useState<Weather[]>([]);
  const [rangeData, setRangeData] = useState<Weather[] | null>(null);

  const [preferredChartData, setPreferredChartData] = useState<string>("recent");

  const [loading, setLoading] = useState({
    last: false,
    chart: false
  });
  
  const handleLatInput = (e: FormEvent<HTMLInputElement>) => {
    const newLat = parseFloat(e.currentTarget.value);
    if (
      parseFloat(draftLat) != newLat &&
      draftLat.length == e.currentTarget.value.length
    ) {
      setLat(e.currentTarget.value);
    }
    setDraftLat(newLat < 90 && newLat > -90 ? e.currentTarget.value : '');
  };
  const handleLonInput = (e: FormEvent<HTMLInputElement>) => {
    const newLon = parseFloat(e.currentTarget.value);
    if (
      parseFloat(draftLon) != newLon &&
      draftLon.length == e.currentTarget.value.length
    ) {
      setLon(e.currentTarget.value);
    }
    setDraftLon(newLon < 180 && newLon > -180 ? e.currentTarget.value : '');
  };
  const handleBlur = () => {
    const checkNewLat = parseFloat(draftLat);
    const checkNewLon = parseFloat(draftLon);
    if (
      !isNaN(checkNewLat) && !isNaN(checkNewLon)
      && (checkNewLat !== parseFloat(lat) || checkNewLon !== parseFloat(lon))
    ) {
      setLat(draftLat);
      setLon(draftLon);
    }
  };
  const handleEnterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const handlePreferredChange = (e: React.FormEvent<HTMLInputElement>) => {
    const name = e.currentTarget.name;
    if (name == "preferRecentData") {
      setPreferredChartData("recent");
    } else if (name == "preferRangeData") {
      setPreferredChartData("range");
    }
  }


  const loadLast = async (controller: AbortController) => {
    if (!lat || !lon) return;
    setLoading(prev => ({ ...prev, last: true }));
    try {
      const response = await axios.get(`${API_BASE}/last`, { 
        params: { lat, lon },
        signal: controller.signal
      });
      setLastData(response.data);
    } catch (error) {
      console.error('Error loading last weather data:', error);
    } finally {
      setLoading(prev => ({ ...prev, last: false }));
    }
  };
  const loadRecent = async (controller: AbortController) => {
    if (!lat || !lon) return;
    setLoading(prev => ({ ...prev, chart: true }));
    try {
      const response = await axios.get(`${API_BASE}/recent`, { 
        params: { lat, lon },
        signal: controller.signal
      });
      setRecentData(response.data);
    } catch (error) {
      console.error('Error loading recent weather data:', error);
    } finally {
      setLoading(prev => ({ ...prev, chart: false }));
    }
  };
  const loadRange = async (controller: AbortController) => {
    if (!lat || !lon || !to || !from) return;
    setLoading(prev => ({ ...prev, chart: true }));
    try {
      const response = await axios.get(`${API_BASE}/range`, {
        params: { from, to, lat, lon },
        signal: controller.signal
      });
      setRangeData(response.data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Range load error:', error);
      }
    } finally {
      setLoading(prev => ({ ...prev, chart: false }));
    }
  };

  // First load: last data (~15 mins)
  useEffect(() => {
    const controller = new AbortController();
    loadLast(controller);
    return () => controller.abort();
  }, [lat, lon])

  // Async load: 50 recent
  useEffect(() => {
    if (preferredChartData == "recent") {
      const controller = new AbortController();
      loadRecent(controller);
      return () => controller.abort();
    }
  }, [lat, lon, preferredChartData])
  
  // Load range when dates or location change
  useEffect(() => {
    if (preferredChartData == "range") {
      const controller = new AbortController();
      loadRange(controller);
      return () => controller.abort();
    }
  }, [from, to, lat, lon, preferredChartData])

  const chartData = useMemo(() => {
    const data = rangeData && rangeData.length > 0 && preferredChartData == "range" ? rangeData : recentData
    return [...data].reverse().map(d => ({
      time: new Date(d.observed_at).toLocaleString(),
      temperature: d.temperature_c,
      pressure: d.pressure_hpa,
      wind:  d.wind_speed_ms ? Math.round(d.wind_speed_ms * 100) / 100: null,
      humidity: d.humidity_pct,
    }))
  }, [rangeData, recentData])

  // const triggerFetch = async () => {
  //   try {
  //       axios.get(`${API_BASE}/last`, { params: { lat, lon }}).then(r => setLastData(r.data)).catch(() => {})
  //   } catch { }
  // }
  // const triggerLoadRecent = async () => {
  //   try {
  //       axios.get(`${API_BASE}/recent`, { params: { lat, lon }}).then(r => setRecentData(r.data)).catch(() => {})
  //   } catch {  }
  // }

  return (
    <div className="animate-fade-in flex flex-col w-full max-w-4xl gap-4 sm:gap-6">
      {/* Compact Header */}
      <div className="weather-card p-4 sm:p-6 text-center bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
        <h1 className="text-2xl sm:text-3xl font-bold m-0 text-white">
          🌤️ Weather Dashboard
        </h1>
        <p className="text-sm sm:text-base opacity-90 mt-1 sm:mt-2 text-white">
          Historical weather data and trends
        </p>
      </div>

      {/* Compact Location Input */}
      <div className="weather-card p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">📍 Location</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Latitude
            </label>
            <input 
              className="form-input"
              type="number" 
              min={-90} 
              max={90} 
              step="0.0001" 
              value={draftLat}
              data-state={draftLat == '' ? 'error' : parseFloat(draftLat) !== parseFloat(lat) ? "changed" : "success"}
              onInput={handleLatInput} 
              onKeyDown={handleEnterKeyDown} 
              onBlur={handleBlur}
              placeholder="Enter latitude..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Longitude
            </label>
            <input 
              className="form-input"
              type="number" 
              min={-180} 
              max={180} 
              step="0.0001" 
              value={draftLon}
              data-state={draftLon == '' ? 'error' : parseFloat(draftLon) !== parseFloat(lon) ? "changed" : "success"}
              onInput={handleLonInput} 
              onKeyDown={handleEnterKeyDown} 
              onBlur={handleBlur}
              placeholder="Enter longitude..."
            />
          </div>
        </div>
        
        {lastData && !loading.last && (
          <div className="p-2 bg-blue-50 rounded-lg text-sm text-gray-600">
            📍 Rounded to: {lastData.lat}, {lastData.lon} (API limits)
          </div>
        )}
      </div>

      {/* Compact Weather Cards */}
      {lastData && !loading.last ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="weather-metric-card bg-gradient-to-br from-amber-500 to-orange-600">
            <div className="text-lg mb-1">🌡️</div>
            <div className="text-xl font-bold">
              {lastData.temperature_c ?? '—'}°C
            </div>
            <div className="text-xs opacity-90">Temperature</div>
          </div>
          
          <div className="weather-metric-card bg-gradient-to-br from-emerald-500 to-green-600">
            <div className="text-lg mb-1">💨</div>
            <div className="text-xl font-bold">
              {lastData.wind_speed_ms ? Math.round(lastData.wind_speed_ms*100) / 100 : '—'} m/s
            </div>
            <div className="text-xs opacity-90">Wind</div>
          </div>
          
          <div className="weather-metric-card bg-gradient-to-br from-blue-500 to-blue-600">
            <div className="text-lg mb-1">🔽</div>
            <div className="text-xl font-bold">
              {lastData.pressure_hpa ?? '—'} hPa
            </div>
            <div className="text-xs opacity-90">Pressure</div>
          </div>
          
          <div className="weather-metric-card bg-gradient-to-br from-cyan-500 to-teal-600">
            <div className="text-lg mb-1">💧</div>
            <div className="text-xl font-bold">
              {lastData.humidity_pct ?? '—'}%
            </div>
            <div className="text-xs opacity-90">Humidity</div>
          </div>
        </div>
      ) : (
        <div className="weather-card p-6 text-center animate-pulse-slow">
          <div className="text-base text-gray-600">
            ⏳ Loading weather data...
          </div>
        </div>
      )}
      
      {lastData && !loading.last && (
        <div className="weather-card p-3">
          <div className="text-xs text-gray-600">
            📅 Last observed: {new Date(lastData.observed_at).toLocaleString()}
          </div>
        </div>
      )}

      {/* Compact Chart Controls */}
      <div className="weather-card p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">📊 Charts</h3>
        
        <div className="space-y-4">
          {/* Radio Group */}
          <div className="radio-group w-full sm:w-auto">
            <div className="radio-option">
              <input 
                type="radio" 
                checked={preferredChartData === "recent"} 
                name='preferRecentData' 
                id='preferRecentData' 
                onChange={handlePreferredChange}
              />
              <label htmlFor="preferRecentData">📈 Recent</label>
            </div>
            
            <div className="radio-option">
              <input 
                type="radio" 
                checked={preferredChartData === "range"} 
                name='preferRangeData' 
                id='preferRangeData' 
                onChange={handlePreferredChange}
              />
              <label htmlFor="preferRangeData">📅 Range</label>
            </div>
          </div>

          {/* Date Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">From Date</label>
              <input 
                className="form-input w-full"
                type="date" 
                value={from} 
                max={to || undefined}
                onChange={e => {
                  setFrom(e.target.value)
                  if (e.target.value && to) setPreferredChartData("range");
                }} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">To Date</label>
              <input 
                className="form-input w-full"
                type="date" 
                value={to} 
                min={from || undefined}
                onChange={e => {
                  setTo(e.target.value)
                  if (e.target.value && from) setPreferredChartData("range");
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compact Chart Container */}
      <div className="chart-container p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 10, right: 15, bottom: 10, left: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="time" 
              minTickGap={30}
              fontSize={10}
              stroke="#64748b"
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              fontSize={10}
              stroke="#64748b"
              label={{ 
                value: 'm/s / °C', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#64748b', fontSize: '10px' }
              }} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              fontSize={10}
              stroke="#64748b"
              label={{ 
                value: 'hPa / %', 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle', fill: '#64748b', fontSize: '10px' }
              }} 
            />
            {chartData && (preferredChartData === "range" || !loading.chart) && (
              <>
                <Tooltip 
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    color: '#1f2937'
                  }}
                  labelStyle={{
                    color: '#1f2937',
                    fontWeight: '500'
                  }}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false} 
                  name="Temperature (°C)" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="pressure" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false} 
                  name="Pressure (hPa)" 
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="wind" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false} 
                  name="Wind (m/s)" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  dot={false} 
                  name="Humidity (%)" 
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>

        {loading.chart && (
          <div className="loading-overlay animate-fade-in">
            <div className="text-center">
              <div className="text-xl mb-1">⏳</div>
              <div className="text-sm">Loading chart...</div>
            </div>
          </div>
        )}
        
        {preferredChartData === "range" && (!to || !from) && !loading.chart && (
          <div className="loading-overlay">
            <div className="text-center">
              <div className="text-xl mb-1">📅</div>
              <div className="text-sm">Select date range</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App;