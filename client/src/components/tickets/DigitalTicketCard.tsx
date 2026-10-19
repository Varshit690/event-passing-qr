import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { 
  Ticket as TicketIcon, 
  Calendar, 
  MapPin, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { Ticket } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface DigitalTicketCardProps {
  ticket: Ticket;
  onRefresh?: () => void;
}

export const DigitalTicketCard: React.FC<DigitalTicketCardProps> = ({ ticket }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>(ticket.qrCodeDataUrl || '');

  useEffect(() => {
    if (!qrDataUrl && ticket.qrCodeToken) {
      QRCode.toDataURL(ticket.qrCodeToken, {
        width: 320,
        margin: 2,
        color: {
          dark: '#09090F',
          light: '#FFFFFF',
        },
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [ticket.qrCodeToken, qrDataUrl]);

  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [105, 148], // A6 Pass Format
    });

    // Dark Background Header
    doc.setFillColor(9, 9, 15);
    doc.rect(0, 0, 105, 148, 'F');

    // Gradient accent bar
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 105, 8, 'F');

    // EVENTORA Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENTORA PASS', 10, 18);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('OFFICIAL DIGITAL ADMISSION PASS', 10, 23);

    // Event Title
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    const splitTitle = doc.splitTextToSize(ticket.eventTitle, 85);
    doc.text(splitTitle, 10, 32);

    // Attendee & Venue Info
    let currentY = 36 + splitTitle.length * 5;
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Attendee: ${ticket.attendeeName}`, 10, currentY);
    currentY += 5;
    doc.text(`Pass Tier: ${ticket.ticketTypeName}`, 10, currentY);
    currentY += 5;
    doc.text(`Date: ${ticket.eventDate}`, 10, currentY);
    currentY += 5;
    doc.text(`Venue: ${ticket.venue}`, 10, currentY);
    currentY += 5;
    doc.text(`Ref: ${ticket.ticketNumber}`, 10, currentY);

    // QR Code Image
    if (qrDataUrl) {
      currentY += 4;
      doc.addImage(qrDataUrl, 'PNG', 27, currentY, 50, 50);
      currentY += 54;
    }

    // Security Footer
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Present this QR ticket at gate entry. Non-transferable.', 52, currentY, { align: 'center' });
    currentY += 4;
    doc.text(`Cryptographic Token: ${ticket.qrCodeToken.slice(0, 16)}...`, 52, currentY, { align: 'center' });

    doc.save(`EVENTORA-${ticket.ticketNumber}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'CHECKED_IN':
        return (
          <Badge variant="success" size="sm" className="gap-1 bg-emerald-500/20 text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>Checked In</span>
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" size="sm">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="primary" size="sm" className="gap-1 bg-purple-500/20 text-purple-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Valid Pass</span>
          </Badge>
        );
    }
  };

  return (
    <div className="relative rounded-3xl bg-[#171723] border border-white/10 shadow-2xl overflow-hidden max-w-sm mx-auto group hover:border-purple-500/30 transition-all duration-300">
      {/* Top Banner Header */}
      <div className="p-5 pb-4 bg-gradient-to-r from-purple-900/40 via-[#1a1a2e] to-cyan-900/30 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center shadow-sm">
            <TicketIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-wider uppercase">EVENTORA</p>
            <p className="text-[10px] text-purple-300 font-semibold">Official Entry Pass</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Ticket Info */}
      <div className="p-5 space-y-4">
        <div>
          <h4 className="text-base font-extrabold text-white leading-tight line-clamp-2">
            {ticket.eventTitle}
          </h4>
          <p className="text-xs font-semibold text-purple-400 mt-1">
            {ticket.ticketTypeName} • {ticket.price === 0 ? 'Free RSVP' : `$${ticket.price}`}
          </p>
        </div>

        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{ticket.eventDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{ticket.venue}</span>
          </div>
        </div>

        {/* Attendee Holder Box */}
        <div className="p-3 rounded-xl bg-[#11111B] border border-white/5 flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Pass Holder</p>
            <p className="font-bold text-white mt-0.5">{ticket.attendeeName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Ref Code</p>
            <p className="font-mono font-bold text-purple-400 mt-0.5">{ticket.ticketNumber}</p>
          </div>
        </div>
      </div>

      {/* Perforated Divider Cutouts */}
      <div className="relative py-2 flex items-center justify-center">
        <div className="ticket-perforation-left" />
        <div className="ticket-perforation-right" />
        <div className="w-full border-t-2 border-dashed border-white/10 mx-6" />
      </div>

      {/* QR Code Container */}
      <div className="p-5 pt-3 text-center space-y-4">
        <div className="p-3 bg-white rounded-2xl inline-block shadow-md ring-4 ring-purple-500/20">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Pass for ${ticket.ticketNumber}`}
              className="w-40 h-40 object-contain mx-auto"
            />
          ) : (
            <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-xs text-slate-600">
              Generating QR...
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-mono font-semibold text-slate-300">
            {ticket.qrCodeToken}
          </p>
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Flash at gate for instant check-in</span>
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5 text-purple-400" />}
            onClick={downloadPDF}
            className="w-full text-xs"
          >
            PDF Pass
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5 text-cyan-400" />}
            onClick={handlePrint}
            className="w-full text-xs"
          >
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};
