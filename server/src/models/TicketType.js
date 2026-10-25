import mongoose from 'mongoose';

const TicketTypeSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, ref: 'Event', index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 100 },
    remainingQuantity: { type: Number, default: 100 },
    maxPerUser: { type: Number, default: 4 },
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

export const TicketType =
  mongoose.models.TicketType || mongoose.model('TicketType', TicketTypeSchema);
export default TicketType;
