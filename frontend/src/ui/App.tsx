import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './components/LanguageSwitcher'

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
  const { t } = useTranslation();
  
  const [lat, setLat] = useState<string>('54.9044')
  const [lon, setLon] = useState<string>('52.3154')
  const [draftLat, setDraftLat] = useState<string>(lat);
  const [draftLon, setDraftLon] = useState<string>(lon);
  const [citySearch, setCitySearch] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [geoLocationStatus, setGeoLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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

  // Reverse geocoding to get location name from coordinates
  const reverseGeocode = async (lat: string, lon: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        // Extract city and country from the result
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.municipality || address.county;
        const country = address.country;
        
        if (city && country) {
          setCitySearch(`${city}, ${country}`);
        } else if (country) {
          // If no city, use the first part of display_name with country
          const locationPart = data.display_name.split(',')[0];
          setCitySearch(`${locationPart}, ${country}`);
        } else {
          // Fallback to first two parts of display_name
          const locationName = data.display_name.split(',').slice(0, 2).join(', ');
          setCitySearch(locationName);
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Don't show error to user for reverse geocoding, just keep the search field as is
    }
  };

  // Geolocation functionality
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoLocationStatus('error');
      return;
    }

    setGeoLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLat = position.coords.latitude.toFixed(4);
        const newLon = position.coords.longitude.toFixed(4);
        setLat(newLat);
        setLon(newLon);
        setDraftLat(newLat);
        setDraftLon(newLon);
        setGeoLocationStatus('success');
        
        // Update city search field with location name
        await reverseGeocode(newLat, newLon);
        
        setTimeout(() => setGeoLocationStatus('idle'), 3000);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeoLocationStatus('error');
        setTimeout(() => setGeoLocationStatus('idle'), 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // City search functionality using OpenStreetMap Nominatim API
  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat).toFixed(4);
        const newLon = parseFloat(result.lon).toFixed(4);
        
        setLat(newLat);
        setLon(newLon);
        setDraftLat(newLat);
        setDraftLon(newLon);
        
        // Update search field with found location name
        const locationName = result.display_name.split(',').slice(0, 2).join(', ');
        setCitySearch(locationName);
      } else {
        // We'll show alert messages in English for now since they're used immediately
        // In a real app, we'd use a proper notification system
        alert('City not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('City search error:', error);
      alert('Error searching for city. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCitySearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCitySearch();
    }
  };


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
        <div className="flex justify-between items-start mb-4">
          <div></div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold m-0 text-black">
              🌤️ {t('header.title')}
            </h1>
            <p className="text-sm sm:text-base opacity-90 mt-1 sm:mt-2 text-black">
              {t('header.subtitle')}
            </p>
          </div>
          <div className="language-switcher-header">
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Compact Location Input */}
      <div className="weather-card p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">📍 {t('location.title')}</h3>
        
        {/* City Search */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                className="form-input w-full"
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                onKeyDown={handleCitySearchKeyDown}
                placeholder={t('location.citySearchPlaceholder')}
                disabled={isSearching}
              />
            </div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleCitySearch}
              disabled={isSearching || !citySearch.trim()}
            >
              {isSearching ? `⏳ ${t('common.searching')}` : `🔍 ${t('location.searchButton')}`}
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleGetCurrentLocation}
              disabled={geoLocationStatus === 'loading'}
            >
              {geoLocationStatus === 'loading' ? `⏳ ${t('common.locating')}` : 
               geoLocationStatus === 'success' ? `✓ ${t('common.located')}` :
               geoLocationStatus === 'error' ? `⚠ ${t('common.error')}` : `📍 ${t('location.myLocationButton')}`}
            </button>
          </div>
          
          {geoLocationStatus === 'error' && (
            <p className="text-sm text-red-600 mt-2">
              ⚠ {t('location.geolocationError')}
            </p>
          )}
        </div>
        
        {/* Manual Coordinates */}
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('location.coordinatesManual')}</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {t('location.latitude')}
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
              placeholder={t('location.latitudePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {t('location.longitude')}
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
              placeholder={t('location.longitudePlaceholder')}
            />
          </div>
        </div>
        
        {lastData && !loading.last && (
          <div className="p-2 bg-blue-50 rounded-lg text-sm text-gray-600">
            📍 {t('location.roundedTo')} {lastData.lat}, {lastData.lon} {t('location.apiLimits')}
          </div>
        )}
      </div>

      {/* Compact Weather Cards */}
      {lastData && !loading.last ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="weather-metric-card bg-gradient-to-br from-amber-500 to-orange-600">
            <div className="text-lg mb-1">🌡️</div>
            <div className="text-xl font-bold">
              {lastData.temperature_c ?? '—'}{t('charts.temperatureUnit')}
            </div>
            <div className="text-xs opacity-90">{t('weather.temperature')}</div>
          </div>
          
          <div className="weather-metric-card bg-gradient-to-br from-emerald-500 to-green-600">
            <div className="text-lg mb-1">💨</div>
            <div className="text-xl font-bold">
              {lastData.wind_speed_ms ? Math.round(lastData.wind_speed_ms*100) / 100 : '—'} {t('charts.windUnit')}
            </div>
            <div className="text-xs opacity-90">{t('weather.wind')}</div>
          </div>
          
          <div className="weather-metric-card bg-gradient-to-br from-blue-500 to-blue-600">
            <div className="text-lg mb-1">🔽</div>
            <div className="text-xl font-bold">
              {lastData.pressure_hpa ?? '—'} {t('charts.pressureUnit')}
            </div>
            <div className="text-xs opacity-90">{t('weather.pressure')}</div>
          </div>
          
          <div className="weather-metric-card bg-gradient-to-br from-cyan-500 to-teal-600">
            <div className="text-lg mb-1">💧</div>
            <div className="text-xl font-bold">
              {lastData.humidity_pct ?? '—'}{t('charts.humidityUnit')}
            </div>
            <div className="text-xs opacity-90">{t('weather.humidity')}</div>
          </div>
        </div>
      ) : (
        <div className="weather-card p-6 text-center animate-pulse-slow">
          <div className="text-base text-gray-600">
            ⏳ {t('weather.loadingWeatherData')}
          </div>
        </div>
      )}
      
      {lastData && !loading.last && (
        <div className="weather-card p-3">
          <div className="text-xs text-gray-600">
            📅 {t('weather.lastObserved')} {new Date(lastData.observed_at).toLocaleString()}
          </div>
        </div>
      )}

      {/* Compact Chart Controls */}
      <div className="weather-card p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">📊 {t('charts.title')}</h3>
        
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
              <label htmlFor="preferRecentData">📈 {t('charts.recent')}</label>
            </div>
            
            <div className="radio-option">
              <input 
                type="radio" 
                checked={preferredChartData === "range"} 
                name='preferRangeData' 
                id='preferRangeData' 
                onChange={handlePreferredChange}
              />
              <label htmlFor="preferRangeData">📅 {t('charts.range')}</label>
            </div>
          </div>

          {/* Date Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('charts.fromDate')}</label>
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
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('charts.toDate')}</label>
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
                value: t('charts.leftAxisLabel'), 
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
                value: t('charts.rightAxisLabel'), 
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
                  name={`${t('weather.temperature')} (${t('charts.temperatureUnit')})`} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="pressure" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false} 
                  name={`${t('weather.pressure')} (${t('charts.pressureUnit')})`} 
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="wind" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false} 
                  name={`${t('weather.wind')} (${t('charts.windUnit')})`} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  dot={false} 
                  name={`${t('weather.humidity')} (${t('charts.humidityUnit')})`} 
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>

        {loading.chart && (
          <div className="loading-overlay animate-fade-in">
            <div className="text-center">
              <div className="text-xl mb-1">⏳</div>
              <div className="text-sm">{t('charts.loadingChart')}</div>
            </div>
          </div>
        )}
        
        {preferredChartData === "range" && (!to || !from) && !loading.chart && (
          <div className="loading-overlay">
            <div className="text-center">
              <div className="text-xl mb-1">📅</div>
              <div className="text-sm">{t('charts.selectDateRange')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App;