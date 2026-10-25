import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    bookingId: { type: String, required: true, ref: 'Booking', index: true },
    eventId: { type: String, required: true, ref: 'Event', index: true },
    ticketTypeId: { type: String, required: true, ref: 'TicketType', index: true },
    qrCodeToken: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['VALID', 'CHECKED_IN', 'CANCELLED'],
      default: 'VALID',
      index: true,
    },
    attendeeName: { type: String, required: true, trim: true },
    attendeeEmail: { type: String, required: true, trim: true, lowercase: true },
    checkedInAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
export default Ticket;
