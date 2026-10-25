import mongoose from 'mongoose';

const CheckInSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, ref: 'Ticket', index: true },
    eventId: { type: String, required: true, ref: 'Event', index: true },
    verifiedById: { type: String, required: true, ref: 'User' },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

export const CheckIn = mongoose.models.CheckIn || mongoose.model('CheckIn', CheckInSchema);
export default CheckIn;
