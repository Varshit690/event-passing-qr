import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    bannerUrl: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    category: {
      type: String,
      default: 'MUSIC',
      enum: [
        'MUSIC',
        'TECHNOLOGY',
        'WORKSHOPS',
        'HACKATHONS',
        'CONFERENCES',
        'COLLEGE_FESTS',
        'SPORTS',
        'ARTS_CULTURE',
      ],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    organizerId: { type: String, required: true, ref: 'User' },
    totalCapacity: { type: Number, default: 500 },
    remainingTickets: { type: Number, default: 500 },
    minPrice: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    rules: { type: [String], default: [] },
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

EventSchema.index({ category: 1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ organizerId: 1 });

export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
export default Event;
