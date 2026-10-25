import mongoose from 'mongoose';

const EventStaffSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, ref: 'Event' },
    userId: { type: String, required: true, ref: 'User' },
    role: { type: String, enum: ['SCANNER', 'MANAGER'], default: 'SCANNER' },
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

EventStaffSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const EventStaff =
  mongoose.models.EventStaff || mongoose.model('EventStaff', EventStaffSchema);
export default EventStaff;
