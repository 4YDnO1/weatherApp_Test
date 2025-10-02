import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

// Too complex already for test task
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';

import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api'

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
      const response = await axios.get(`${API_BASE}/weather/last`, { 
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
      const response = await axios.get(`${API_BASE}/weather/recent`, { 
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
      const response = await axios.get(`${API_BASE}/weather/range`, {
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
  //       axios.get(`${API_BASE}/weather/last`, { params: { lat, lon }}).then(r => setLastData(r.data)).catch(() => {})
  //   } catch { }
  // }
  // const triggerLoadRecent = async () => {
  //   try {
  //       axios.get(`${API_BASE}/weather/recent`, { params: { lat, lon }}).then(r => setRecentData(r.data)).catch(() => {})
  //   } catch {  }
  // }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: '100%', maxWidth: 800, padding: 16, fontFamily: 'system-ui, Arial' }}>
      <h2>Weather</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <label>
          Lat: <input className='coordinate-input' type="number" min={-90} max={90} step="0.0001" value={draftLat}
            data-state={draftLat == '' ? 'error' : parseFloat(draftLat) !== parseFloat(lat)? "changed" : "success"}
            onInput={handleLatInput} onKeyDown={handleEnterKeyDown} onBlur={handleBlur} style={{ width: 120 }}
          />
        </label>
        <label>
          Lon: <input className='coordinate-input' type="number" min={-180} max={180} step="0.0001" value={draftLon}
            data-state={draftLon == '' ? 'error' : parseFloat(draftLon) !== parseFloat(lon) ? "changed" : "success"}
            onInput={handleLonInput} onKeyDown={handleEnterKeyDown} onBlur={handleBlur} style={{ width: 120 }} />
        </label>
        {/* <button onClick={triggerFetch}>Fetch now</button> */}
        {lastData && !loading.last && (
          <span>Rounded to the closest: {lastData.lat} {lastData.lon} (API limits)</span>  
        )}
      </div>
      {lastData && !loading.last ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div><strong>Observed:</strong> {new Date(lastData.observed_at).toLocaleString()}</div>
          <div><strong>Temp:</strong> {lastData.temperature_c ?? '—'} °C</div>
          <div><strong>Wind:</strong> {lastData.wind_speed_ms ? Math.round(lastData.wind_speed_ms*100) / 100 : '—'} m/s</div>
          <div><strong>Pressure:</strong> {lastData.pressure_hpa ?? '—'} hPa</div>
          <div><strong>Humidity:</strong> {lastData.humidity_pct ?? '—'} %</div>
        </div>
      ) : (
        <div>Loading latset weather data... </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8}}>
        <input type="radio" checked={preferredChartData == "recent"} name='preferRecentData' id='preferRecentData' onChange={handlePreferredChange} radioGroup='preferredData'/>
        <label htmlFor="preferRecentData">Recent</label>
        
        <input type="radio" checked={preferredChartData == "range"}  name='preferRangeData' id='preferRangeData' onChange={handlePreferredChange} radioGroup='preferredData'/>
        <label htmlFor="preferRangeData">Range</label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center'}}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center'}}>
            From: <input type="date" value={from} max={to || undefined}
            onChange ={e => {
              setFrom(e.target.value)
              if (e.target.value && to) setPreferredChartData("range");
            }} />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center'}}>
            To: <input type="date" value={to} min={from || undefined}
            onChange={e => {
              setTo(e.target.value)
              if (e.target.value && from) setPreferredChartData("range");
            }} />
          </label>
        </div>
      </div> 

      <div style={{position: 'relative', maxHeight: 600, maxWidth: '100%',  display: 'flex', flexGrow: 1, flexDirection: 'column', border: '1px solid #1094c9', borderRadius: 8, overflow: 'hidden'}}>
        <div style={{flexGrow: 1, padding: 8}}>

          <ResponsiveContainer width="100%" height="100%">
          
            <LineChart data={chartData} width={6700} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" minTickGap={32} />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'm/s / °C', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" color='#3498db' label={{ value: 'hPa / %', angle: 90, position: 'insideRight' }} />
              {chartData && (preferredChartData == "range" || !loading.chart) && <>
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#e74c3c" dot={false} name="Temperature" />
                <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="#035a94" dot={false} name="Pressure" />
                <Line yAxisId="left" type="monotone" dataKey="wind" stroke="#2ecc71" dot={false} name="Wind" />
                <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#FFC0CB" strokeWidth={2} dot={false} name="Humidity" />
              </>}
            </LineChart>
            
          </ResponsiveContainer>

        </div>
        {(loading.chart) ? (
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            width: '100%', height: '100%', backgroundColor: "rgba(0,0,0,0.2)", backdropFilter: 'blur(1.2px)'}}>
              Loading Chart Data ...
            </div>
        ) : preferredChartData == "range" && (!to || !from) && (
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          width: '100%', height: '100%', backgroundColor: "rgba(0,0,0,0.2)", backdropFilter: 'blur(1.2px)'}}>
            Select correct Dates 'From' and 'To ' ...
          </div>
        )}
      </div>
    </div>
  )
} 

export default App;