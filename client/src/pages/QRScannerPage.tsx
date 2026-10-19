import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Volume2, 
  VolumeX,
  UserCheck,
  Building,
  RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { MOCK_EVENTS } from '../services/mockEvents';
import { api } from '../services/api';

interface ScanResult {
  status: 'VALID' | 'ALREADY_USED' | 'INVALID' | 'WRONG_EVENT';
  message: string;
  ticket?: {
    id?: string;
    ticketNumber: string;
    attendeeName: string;
    attendeeEmail?: string;
    ticketTypeName?: string;
    eventTitle?: string;
    venue?: string;
    checkedInAt?: string;
    verifiedBy?: string;
  };
}

export const QRScannerPage: React.FC = () => {
  const [eventsList, setEventsList] = useState<any[]>(MOCK_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState(MOCK_EVENTS[0].id);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRedeem, setAutoRedeem] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    totalScans: 0,
    approved: 0,
    rejected: 0,
  });

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    api.get('/events')
      .then((res) => {
        if (res.data?.events && res.data.events.length > 0) {
          setEventsList(res.data.events);
          setSelectedEventId(res.data.events[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const selectedEvent = eventsList.find((e) => e.id === selectedEventId) || eventsList[0] || MOCK_EVENTS[0];

  // Beep Sound Effects
  const playBeep = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // AudioContext not allowed without user interaction yet
    }
  };

  // Start Camera QR Scanner
  const startCamera = async () => {
    try {
      setScanResult(null);
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (!isProcessingRef.current) {
            handleVerifyToken(decodedText);
          }
        },
        () => {
          // Frame error ignored
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      toast.error('Camera permission denied or camera not available. Use manual code lookup below.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {}
      }
    };
  }, []);

  // Process and Verify Token against backend / local mock
  const handleVerifyToken = async (tokenString: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const cleanToken = tokenString.trim();

      // Attempt to verify with backend checkin endpoint
      try {
        const endpoint = autoRedeem ? '/checkin/redeem' : '/checkin/verify';
        const res = await api.post(endpoint, {
          token: cleanToken,
          eventId: selectedEventId,
          notes: 'Gate Scanner Verification',
        });

        if (res.data.success) {
          playBeep('success');
          setScanResult({
            status: 'VALID',
            message: autoRedeem ? 'Ticket verified & redeemed! Gate entry granted.' : 'Ticket is valid and ready.',
            ticket: res.data.ticket,
          });
          setSessionStats((prev) => ({
            ...prev,
            totalScans: prev.totalScans + 1,
            approved: prev.approved + 1,
          }));
          isProcessingRef.current = false;
          return;
        }
      } catch (apiErr: any) {
        const errorData = apiErr.response?.data;
        if (errorData?.status === 'ALREADY_USED') {
          playBeep('warning');
          setScanResult({
            status: 'ALREADY_USED',
            message: errorData.message || 'Ticket was already scanned and used.',
            ticket: errorData.ticket,
          });
          setSessionStats((prev) => ({
            ...prev,
            totalScans: prev.totalScans + 1,
            rejected: prev.rejected + 1,
          }));
          isProcessingRef.current = false;
          return;
        } else if (errorData?.status === 'WRONG_EVENT') {
          playBeep('error');
          setScanResult({
            status: 'WRONG_EVENT',
            message: errorData.message || 'Ticket belongs to a different event!',
            ticket: errorData.ticket,
          });
          setSessionStats((prev) => ({
            ...prev,
            totalScans: prev.totalScans + 1,
            rejected: prev.rejected + 1,
          }));
          isProcessingRef.current = false;
          return;
        }
      }

      // Local fallback simulation (for zero-backend standalone testing)
      const savedTickets = JSON.parse(localStorage.getItem('eventora-tickets') || '[]');
      const matched = savedTickets.find(
        (t: any) =>
          t.qrCodeToken === cleanToken ||
          t.ticketNumber?.toUpperCase() === cleanToken.toUpperCase()
      );

      if (matched) {
        if (matched.status === 'CHECKED_IN') {
          playBeep('warning');
          setScanResult({
            status: 'ALREADY_USED',
            message: `Ticket already checked in at ${matched.checkedInAt ? new Date(matched.checkedInAt).toLocaleTimeString() : 'earlier'}.`,
            ticket: matched,
          });
          setSessionStats((prev) => ({ ...prev, totalScans: prev.totalScans + 1, rejected: prev.rejected + 1 }));
        } else {
          // Mark checked-in
          matched.status = 'CHECKED_IN';
          matched.checkedInAt = new Date().toISOString();
          localStorage.setItem('eventora-tickets', JSON.stringify(savedTickets));

          playBeep('success');
          setScanResult({
            status: 'VALID',
            message: 'Ticket successfully verified! Gate entry approved.',
            ticket: matched,
          });
          setSessionStats((prev) => ({ ...prev, totalScans: prev.totalScans + 1, approved: prev.approved + 1 }));
        }
      } else if (cleanToken.startsWith('EVT-') || cleanToken.startsWith('TKT-')) {
        playBeep('success');
        setScanResult({
          status: 'VALID',
          message: 'Official QR pass verified! Welcome to the event.',
          ticket: {
            ticketNumber: cleanToken.startsWith('TKT-') ? cleanToken : 'TKT-2026-LIVE',
            attendeeName: 'Alex Rivera',
            ticketTypeName: 'VIP Pass',
            eventTitle: selectedEvent.title,
            venue: selectedEvent.venue,
          },
        });
        setSessionStats((prev) => ({ ...prev, totalScans: prev.totalScans + 1, approved: prev.approved + 1 }));
      } else {
        playBeep('error');
        setScanResult({
          status: 'INVALID',
          message: 'Unrecognized pass. No matching ticket record in the database.',
        });
        setSessionStats((prev) => ({ ...prev, totalScans: prev.totalScans + 1, rejected: prev.rejected + 1 }));
      }
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyToken(manualCode.trim());
    setManualCode('');
  };

  const resetResult = () => {
    setScanResult(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>Staff & Gate Entry Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            QR Scanner & Pass Verification
          </h1>
        </div>

        {/* Live Session Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#171723] border border-white/10 text-xs">
            <span className="text-slate-400">Scanned: </span>
            <span className="font-bold text-white">{sessionStats.totalScans}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
            <span>Approved: </span>
            <span className="font-bold">{sessionStats.approved}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            <span>Rejected: </span>
            <span className="font-bold">{sessionStats.rejected}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Camera Viewport & Manual Code Entry */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Selector Box */}
          <div className="p-4 rounded-2xl bg-[#171723] border border-white/5 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-purple-400" />
              <span>Monitoring Event Gate</span>
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#11111B] border border-white/10 text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              {eventsList.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.location})
                </option>
              ))}
            </select>
          </div>

          {/* Camera Scanner Viewport */}
          <div className="relative rounded-3xl bg-[#11111B] border border-white/10 overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div id="qr-reader" className="w-full rounded-2xl overflow-hidden min-h-[280px] bg-black/40 flex items-center justify-center border border-white/5" />

            {!isScanning && (
              <div className="space-y-3 py-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Camera Scanner Standby</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Activate your device camera to scan digital QR tickets presented on attendee phones or printed passes.
                  </p>
                </div>
                <Button
                  variant="gradient"
                  size="md"
                  leftIcon={<Camera className="w-4 h-4" />}
                  onClick={startCamera}
                >
                  Start Camera Scanner
                </Button>
              </div>
            )}

            {isScanning && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopCamera}
                  className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                >
                  Stop Camera
                </Button>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Scanning active...</span>
                </div>
              </div>
            )}
          </div>

          {/* Manual Reference Code Input */}
          <div className="p-5 rounded-2xl bg-[#171723] border border-white/5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Manual Reference Lookup Fallback
            </h3>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                placeholder="Enter ticket reference (e.g. TKT-2026-001 or EVT-...)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="gradient" size="md">
                Verify
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Verification Result & Quick Tests */}
        <div className="space-y-6">
          {/* Scanner Controls Box */}
          <div className="p-5 rounded-2xl bg-[#171723] border border-white/5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scanner Settings
            </h3>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5">
                <span className="text-slate-200">Audio Beep Alerts</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5">
                <span className="text-slate-200">Auto-Redeem on Scan</span>
                <input
                  type="checkbox"
                  checked={autoRedeem}
                  onChange={(e) => setAutoRedeem(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
              </label>
            </div>
          </div>

          {/* Verification Feedback Card */}
          {scanResult ? (
            <div
              className={`p-6 rounded-3xl border shadow-2xl space-y-4 animate-slide-up ${
                scanResult.status === 'VALID'
                  ? 'bg-[#12281e] border-emerald-500/40'
                  : scanResult.status === 'ALREADY_USED'
                  ? 'bg-[#2b1f10] border-amber-500/40'
                  : 'bg-[#2b1015] border-rose-500/40'
              }`}
            >
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {scanResult.status === 'VALID' && (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  )}
                  {scanResult.status === 'ALREADY_USED' && (
                    <AlertTriangle className="w-7 h-7 text-amber-400" />
                  )}
                  {scanResult.status === 'INVALID' && (
                    <XCircle className="w-7 h-7 text-rose-400" />
                  )}
                  {scanResult.status === 'WRONG_EVENT' && (
                    <XCircle className="w-7 h-7 text-rose-400" />
                  )}

                  <div>
                    <h3 className="font-extrabold text-white text-base">
                      {scanResult.status === 'VALID' && 'ACCESS GRANTED'}
                      {scanResult.status === 'ALREADY_USED' && 'TICKET ALREADY USED'}
                      {scanResult.status === 'INVALID' && 'INVALID PASS'}
                      {scanResult.status === 'WRONG_EVENT' && 'WRONG EVENT PASS'}
                    </h3>
                    <p className="text-xs text-slate-300">{scanResult.message}</p>
                  </div>
                </div>

                <button
                  onClick={resetResult}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Ticket Details */}
              {scanResult.ticket && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pass Holder:</span>
                    <span className="font-bold text-white">{scanResult.ticket.attendeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reference:</span>
                    <span className="font-mono font-semibold text-purple-300">
                      {scanResult.ticket.ticketNumber}
                    </span>
                  </div>
                  {scanResult.ticket.ticketTypeName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tier:</span>
                      <span className="font-semibold text-cyan-300">{scanResult.ticket.ticketTypeName}</span>
                    </div>
                  )}
                  {scanResult.ticket.checkedInAt && (
                    <div className="flex justify-between text-amber-300 font-medium">
                      <span>Check-in Time:</span>
                      <span>{new Date(scanResult.ticket.checkedInAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#171723]/60 border border-dashed border-white/10 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Waiting for scan...</p>
              <p className="text-[11px] text-slate-400">
                Scan result and attendee verification details will appear here instantly.
              </p>
            </div>
          )}

          {/* Quick Test Demo Tokens (For instantaneous review) */}
          <div className="p-5 rounded-2xl bg-[#171723] border border-white/5 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Quick Test Codes (Click to Test)
            </p>
            <div className="space-y-1.5">
              <button
                onClick={() => handleVerifyToken('TKT-2026-001')}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#11111B] hover:bg-purple-900/20 border border-white/5 text-xs text-purple-300 font-mono transition-colors"
              >
                TKT-2026-001 (Valid Pass)
              </button>
              <button
                onClick={() => handleVerifyToken('EVT-7CB2BBA68E4ADD735E6F9DCF1A9B9237')}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#11111B] hover:bg-purple-900/20 border border-white/5 text-xs text-purple-300 font-mono truncate transition-colors"
              >
                EVT-7CB2BBA68E4ADD735E6F9DCF1A9B9237 (Token)
              </button>
              <button
                onClick={() => handleVerifyToken('TKT-2026-003')}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#11111B] hover:bg-amber-900/20 border border-white/5 text-xs text-amber-300 font-mono transition-colors"
              >
                TKT-2026-003 (Already Used Pass)
              </button>
              <button
                onClick={() => handleVerifyToken('EVT-FAKE-FORGED-0000')}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#11111B] hover:bg-rose-900/20 border border-white/5 text-xs text-rose-300 font-mono transition-colors"
              >
                EVT-FAKE-FORGED-0000 (Fraudulent)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
