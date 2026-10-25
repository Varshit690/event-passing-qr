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
  ShieldCheck 
} from 'lucide-react';
import { Button } from '../ui/Button';

export const DigitalTicketCard = ({ ticket }) => {
  const [qrDataUrl, setQrDataUrl] = useState(ticket.qrCodeDataUrl || '');

  useEffect(() => {
    if (!qrDataUrl && ticket.qrCodeToken) {
      QRCode.toDataURL(ticket.qrCodeToken, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0F172A',
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
    const splitTitle = doc.splitTextToSize(ticket.eventTitle || 'Event', 85);
    doc.text(splitTitle, 10, 32);

    // Attendee & Venue Info
    let currentY = 36 + splitTitle.length * 5;
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Attendee: ${ticket.attendeeName || ''}`, 10, currentY);
    currentY += 5;
    doc.text(`Pass Tier: ${ticket.ticketTypeName || ''}`, 10, currentY);
    currentY += 5;
    doc.text(`Date: ${ticket.eventDate || ''}`, 10, currentY);
    currentY += 5;
    doc.text(`Venue: ${ticket.venue || ''}`, 10, currentY);
    currentY += 5;
    doc.text(`Ref: ${ticket.ticketNumber || ''}`, 10, currentY);

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
    doc.text(`Cryptographic Token: ${(ticket.qrCodeToken || '').slice(0, 16)}...`, 52, currentY, { align: 'center' });

    doc.save(`EVENTORA-${ticket.ticketNumber}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Checked In</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <ShieldCheck className="w-3 h-3" />
            <span>Valid Pass</span>
          </span>
        );
    }
  };

  return (
    <div className="relative rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden max-w-sm mx-auto group hover:border-slate-300 hover:shadow-md transition-all duration-200 text-slate-900">
      {/* Top Banner Header */}
      <div className="p-4 pb-3.5 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center shadow-sm">
            <TicketIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-wider uppercase">EVENTORA</p>
            <p className="text-[10px] text-blue-100 font-medium">Digital Admission Pass</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Ticket Info */}
      <div className="p-5 space-y-3.5">
        <div>
          <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
            {ticket.eventTitle}
          </h4>
          <p className="text-xs font-semibold text-blue-600 mt-1">
            {ticket.ticketTypeName} • {ticket.price === 0 ? 'Free' : `$${ticket.price}`}
          </p>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{ticket.eventDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{ticket.venue}</span>
          </div>
        </div>

        {/* Attendee Holder Box */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Pass Holder</p>
            <p className="font-semibold text-slate-900 mt-0.5">{ticket.attendeeName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Reference</p>
            <p className="font-mono font-bold text-blue-600 mt-0.5">{ticket.ticketNumber}</p>
          </div>
        </div>
      </div>

      {/* Perforated Divider Cutouts */}
      <div className="relative py-1 flex items-center justify-center">
        <div className="ticket-perforation-left" />
        <div className="ticket-perforation-right" />
        <div className="w-full border-t-2 border-dashed border-slate-200 mx-5" />
      </div>

      {/* QR Code Container */}
      <div className="p-5 pt-3 text-center space-y-3.5">
        <div className="p-3 bg-white rounded-xl inline-block border border-slate-200 shadow-sm">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Pass for ${ticket.ticketNumber}`}
              className="w-36 h-36 object-contain mx-auto"
            />
          ) : (
            <div className="w-36 h-36 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
              Generating QR...
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-mono font-semibold text-slate-700">
            {ticket.qrCodeToken}
          </p>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Present at gate for entrance check-in</span>
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={downloadPDF}
            className="w-full text-xs"
          >
            PDF Pass
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
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
