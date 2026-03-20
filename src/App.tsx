import { useState, useRef, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuth, useIncidents } from './hooks';
import { analyzeIncident, analyzeImageIncident } from './services/geminiService';
import { Incident, Location, UserProfile } from './types';
import { Shield, AlertTriangle, MapPin, Camera, Send, LogIn, LogOut, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Header } from './components/Header';
import { IncidentList } from './components/IncidentList';

const API_KEY = 
  process.env.GOOGLE_MAPS_PLATFORM_KEY || 
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || 
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const maskKey = (key: string) => {
  if (!key) return 'Not Found';
  if (key.length < 8) return 'Invalid Length';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

const DEFAULT_CENTER = { lat: 37.42, lng: -122.08 };

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || "";
      const errorStack = this.state.error?.stack || "";
      const isApiError = errorMsg.includes('ApiNotActivatedMapError') || 
                         errorMsg.includes('Script error') ||
                         errorMsg.includes('AuthFailure') ||
                         errorMsg.includes('InvalidKeyMapError') ||
                         document.body.innerText.includes('ApiNotActivatedMapError') ||
                         document.body.innerText.includes('AuthFailure') ||
                         document.body.innerText.includes('InvalidKeyMapError');
      
      return (
        <div className="flex items-center justify-center h-screen bg-zinc-950 p-6 text-center">
          <div className="max-w-lg w-full bg-zinc-900 border border-red-500/20 rounded-2xl p-8 shadow-2xl overflow-hidden">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-4">
              {isApiError ? "Google Maps Configuration Required" : "Something went wrong"}
            </h2>
            
            <div className="text-zinc-400 text-sm mb-6 leading-relaxed space-y-4">
              {isApiError ? (
                <>
                  <p>The <strong>Maps JavaScript API</strong> is either not enabled, restricted, or the API key is invalid.</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-left">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Detected Key:</p>
                      <code className="text-xs text-emerald-400 font-mono">{maskKey(API_KEY)}</code>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-left">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Origin:</p>
                      <code className="text-xs text-blue-400 font-mono truncate block" title={window.location.origin}>
                        {window.location.origin.replace(/^https?:\/\//, '')}
                      </code>
                    </div>
                  </div>

                  <div className="text-left bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                    <p className="text-xs font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">Troubleshooting Steps:</p>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-emerald-500 shrink-0 border border-zinc-800">1</div>
                        <p className="text-[11px] text-zinc-300">
                          <strong>Verify Key:</strong> Ensure <code>GOOGLE_MAPS_PLATFORM_KEY</code> in <strong>Secrets</strong> matches your key exactly.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-emerald-500 shrink-0 border border-zinc-800">2</div>
                        <p className="text-[11px] text-zinc-300">
                          <strong>Allow Origin:</strong> In <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener" className="text-emerald-400 hover:underline">Cloud Console</a>, add <code>{window.location.origin}/*</code> to your key's website restrictions.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-emerald-500 shrink-0 border border-zinc-800">3</div>
                        <p className="text-[11px] text-zinc-300">
                          <strong>Enable API:</strong> Ensure <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" rel="noopener" className="text-emerald-400 hover:underline">Maps JavaScript API</a> is enabled.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-left bg-zinc-950 p-4 rounded-xl border border-zinc-800 overflow-auto max-h-40">
                  <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-widest">Error Details:</p>
                  <p className="text-xs font-mono text-zinc-300 mb-4">{errorMsg}</p>
                  {errorStack && (
                    <pre className="text-[10px] text-zinc-500 font-mono leading-tight">
                      {errorStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-all"
              >
                Reload
              </button>
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="flex-1 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all"
              >
                Try Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MapContent({ 
  currentLocation, 
  incidents, 
  selectedIncident, 
  setSelectedIncident, 
  updateIncidentStatus, 
  profile 
}: { 
  currentLocation: Location, 
  incidents: Incident[], 
  selectedIncident: Incident | null, 
  setSelectedIncident: (i: Incident | null) => void,
  updateIncidentStatus: (id: string, status: Incident['status']) => void,
  profile: any
}) {
  const map = useMap();
  const apiIsLoaded = useApiIsLoaded();

  // Extremely defensive check to prevent getRootNode error
  if (!apiIsLoaded || !map) return null;

  return (
    <>
      {/* User Location */}
      {currentLocation && (
        <AdvancedMarker position={currentLocation}>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative z-10" />
          </div>
        </AdvancedMarker>
      )}

      {/* Incidents */}
      {incidents.map((incident) => (
        incident.location && (
          <AdvancedMarker
            key={incident.id}
            position={incident.location}
            onClick={() => setSelectedIncident(incident)}
          >
            <Pin 
              background={
                incident.severity === 'critical' ? '#ef4444' : 
                incident.severity === 'high' ? '#f97316' : 
                '#10b981'
              } 
              glyphColor="#fff"
              borderColor="rgba(0,0,0,0.2)"
            />
          </AdvancedMarker>
        )
      ))}

      {selectedIncident && (
        <InfoWindow
          position={selectedIncident.location}
          onCloseClick={() => setSelectedIncident(null)}
        >
          <div className="p-2 max-w-xs text-zinc-900">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                selectedIncident.severity === 'critical' ? 'bg-red-100 text-red-700' :
                selectedIncident.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {selectedIncident.severity}
              </span>
              <h4 className="text-xs font-bold">{selectedIncident.type}</h4>
            </div>
            <p className="text-[10px] text-zinc-600 mb-3 leading-relaxed">{selectedIncident.description}</p>
            
            {selectedIncident.actions && selectedIncident.actions.length > 0 && (
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 mb-3">
                <p className="text-[8px] font-bold text-emerald-800 uppercase tracking-wider mb-1">Life-Saving Actions</p>
                <ul className="space-y-1">
                  {selectedIncident.actions.map((action, i) => (
                    <li key={i} className="text-[9px] text-emerald-700 flex gap-1 items-start">
                      <span className="mt-1 w-1 h-1 bg-emerald-400 rounded-full shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {profile?.role !== 'reporter' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => updateIncidentStatus(selectedIncident.id!, 'dispatched')}
                  className="flex-1 py-1 bg-zinc-900 text-white text-[9px] font-bold rounded hover:bg-zinc-800 transition-colors"
                >
                  Dispatch
                </button>
                <button 
                  onClick={() => updateIncidentStatus(selectedIncident.id!, 'resolved')}
                  className="flex-1 py-1 bg-emerald-600 text-white text-[9px] font-bold rounded hover:bg-emerald-500 transition-colors"
                >
                  Resolve
                </button>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function App() {
  const { user, profile, loading: authLoading } = useAuth();
  const { incidents, loading: incidentsLoading } = useIncidents(!!user);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportInput, setReportInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState<Location>(DEFAULT_CENTER);
  const [analyzing, setAnalyzing] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [mapErrorDetected, setMapErrorDetected] = useState(false);

  // Detect AuthFailure or other map errors that don't throw React errors
  useEffect(() => {
    const checkErrors = () => {
      const bodyText = document.body.innerText;
      if (bodyText.includes('AuthFailure') || 
          bodyText.includes('InvalidKeyMapError') || 
          bodyText.includes('ApiNotActivatedMapError')) {
        setMapErrorDetected(true);
      }
    };

    const interval = setInterval(checkErrors, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Geolocation error:", error)
      );
    }
  }, []);

  const handleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const handleSignOut = () => signOut(auth);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportInput.trim() || !user) return;

    setAnalyzing(true);
    try {
      const analyzedData = await analyzeIncident(reportInput, currentLocation);
      await addDoc(collection(db, 'incidents'), {
        ...analyzedData,
        reporterId: user.uid,
        timestamp: serverTimestamp(),
      });
      setReportInput('');
      setReporting(false);
    } catch (error) {
      console.error("Reporting error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setAnalyzing(true);
      try {
        const analyzedData = await analyzeImageIncident(base64, file.type, currentLocation);
        await addDoc(collection(db, 'incidents'), {
          ...analyzedData,
          reporterId: user.uid,
          timestamp: serverTimestamp(),
        });
        setReporting(false);
      } catch (error) {
        console.error("Image reporting error:", error);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateIncidentStatus = async (id: string, status: Incident['status']) => {
    if (!profile || profile.role === 'reporter') return;
    const docRef = doc(db, 'incidents', id);
    await updateDoc(docRef, { status });
  };

  if (!hasValidKey || mapErrorDetected) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 font-sans p-6 overflow-auto">
        <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
          <Shield className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">
            {mapErrorDetected ? "Google Maps Authentication Failed" : "Google Maps API Key Required"}
          </h2>
          
          <div className="text-zinc-400 mb-8 text-sm leading-relaxed space-y-4">
            <p>
              {mapErrorDetected 
                ? "The API key was found, but Google Maps rejected it. This usually happens due to website restrictions or an inactive API."
                : "To enable the life-saving bridge between human intent and crisis response, please configure your Google Maps API key."}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-left">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Detected Key:</p>
                <code className="text-xs text-emerald-400 font-mono">{maskKey(API_KEY)}</code>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-left">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Origin:</p>
                <code className="text-xs text-blue-400 font-mono truncate block" title={window.location.origin}>
                  {window.location.origin.replace(/^https?:\/\//, '')}
                </code>
              </div>
            </div>
          </div>

          <div className="text-left space-y-4 mb-8 bg-zinc-950 p-6 rounded-xl border border-zinc-800">
            <p className="text-xs font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2 mb-4">Troubleshooting Steps:</p>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-emerald-500 shrink-0 border border-zinc-800">1</div>
              <p className="text-xs text-zinc-300">
                <strong>Verify Key:</strong> Ensure <code>GOOGLE_MAPS_PLATFORM_KEY</code> in <strong>Secrets</strong> matches your key exactly.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-emerald-500 shrink-0 border border-zinc-800">2</div>
              <p className="text-xs text-zinc-300">
                <strong>Allow Origin:</strong> In <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener" className="text-emerald-400 hover:underline">Cloud Console</a>, add <code>{window.location.origin}/*</code> to your key's website restrictions.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-emerald-500 shrink-0 border border-zinc-800">3</div>
              <p className="text-xs text-zinc-300">
                <strong>Enable API:</strong> Ensure <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" rel="noopener" className="text-emerald-400 hover:underline">Maps JavaScript API</a> is enabled.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-all"
            >
              Reload App
            </button>
            {mapErrorDetected && (
              <button 
                onClick={() => setMapErrorDetected(false)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all"
              >
                Try Anyway
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
        <Header 
          user={user} 
          profile={profile} 
          onSignIn={handleSignIn} 
          onSignOut={handleSignOut} 
        />

        {/* Main Content */}
        <main className="flex-1 relative flex overflow-hidden">
          {/* Sidebar / List View */}
          <AnimatePresence mode="wait">
            {(view === 'list' || window.innerWidth > 1024) && (
              <motion.aside 
                initial={{ x: -400 }}
                animate={{ x: 0 }}
                exit={{ x: -400 }}
                className="w-full lg:w-96 border-r border-zinc-800 bg-zinc-900/30 flex flex-col z-40"
              >
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Active Incidents</h2>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-mono">LIVE</span>
                  </div>
                </div>
                <IncidentList 
                  incidents={incidents}
                  loading={incidentsLoading}
                  selectedIncidentId={selectedIncident?.id}
                  onIncidentSelect={(incident) => {
                    setSelectedIncident(incident);
                    setView('map');
                  }}
                />
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Map View */}
          <div className="flex-1 relative">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                {...({
                  defaultCenter: DEFAULT_CENTER,
                  center: currentLocation,
                  defaultZoom: 13,
                  mapId: "GUARDIAN_BRIDGE_MAP",
                  internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
                  style: { width: '100%', height: '100%' },
                  disableDefaultUI: true,
                  gestureHandling: 'greedy'
                } as any)}
              >
                <MapContent 
                  currentLocation={currentLocation}
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  setSelectedIncident={setSelectedIncident}
                  updateIncidentStatus={updateIncidentStatus}
                  profile={profile}
                />
              </Map>
            </APIProvider>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button 
                onClick={() => setView(view === 'map' ? 'list' : 'map')}
                aria-label={view === 'map' ? "Switch to List View" : "Switch to Map View"}
                className="lg:hidden p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl text-zinc-400 hover:text-white transition-all"
              >
                <Activity className="w-6 h-6" aria-hidden="true" />
              </button>
              <button 
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    });
                  }
                }}
                aria-label="Center Map on My Location"
                className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl text-zinc-400 hover:text-white transition-all"
              >
                <MapPin className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            {/* Report Button */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg px-6">
              <AnimatePresence>
                {reporting ? (
                  <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-2xl"
                  >
                    <form onSubmit={handleReport} className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Report Crisis</h3>
                        <button 
                          type="button"
                          onClick={() => setReporting(false)}
                          aria-label="Cancel Report"
                          className="text-zinc-500 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                      <textarea
                        id="incident-description"
                        value={reportInput}
                        onChange={(e) => setReportInput(e.target.value)}
                        placeholder="Describe the situation... (e.g., 'Car accident at the intersection, smoke visible, two people injured')"
                        aria-label="Incident Description"
                        className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/50 resize-none placeholder:text-zinc-700"
                        autoFocus
                      />
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-sm font-medium cursor-pointer transition-all">
                          <Camera className="w-4 h-4" aria-hidden="true" />
                          Upload Photo
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" aria-label="Upload Incident Photo" />
                        </label>
                        <button 
                          disabled={analyzing || !reportInput.trim()}
                          aria-label="Submit Emergency Report"
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
                        >
                          {analyzing ? (
                            <>
                              <Activity className="w-4 h-4 animate-spin" aria-hidden="true" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" aria-hidden="true" />
                              Submit Report
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Report Emergency"
                    onClick={() => {
                      if (!user) {
                        handleSignIn();
                      } else {
                        setReporting(true);
                      }
                    }}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl text-lg font-bold shadow-2xl shadow-emerald-900/40 flex items-center justify-center gap-3 border border-emerald-400/20"
                  >
                    <AlertTriangle className="w-6 h-6" aria-hidden="true" />
                    Report Emergency
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Footer / Status Bar */}
        <footer className="h-8 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between px-6 text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>SYSTEMS NOMINAL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              <span>GEMINI 3.1 FLASH ACTIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{new Date().toLocaleTimeString([], { hour12: false })} UTC</span>
            </div>
            <span>v1.0.4-STABLE</span>
          </div>
        </footer>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #27272a;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #3f3f46;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
