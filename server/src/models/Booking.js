import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, ref: 'User', index: true },
    eventId: { type: String, required: true, ref: 'Event', index: true },
    status: {
      type: String,
      enum: ['CONFIRMED', 'PENDING', 'CANCELLED'],
      default: 'CONFIRMED',
    },
    totalAmount: { type: Number, default: 0 },
    ticketsCount: { type: Number, default: 1 },
    idempotencyKey: { type: String, unique: true, sparse: true },
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

export const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export default Booking;
