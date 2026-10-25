import mongoose from 'mongoose';

const OrganizerApplicationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, ref: 'User', index: true },
    organizationName: { type: String, required: true, trim: true },
    collegeOrOrg: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    category: { type: String, default: 'TECHNOLOGY' },
    reason: { type: String, required: true, trim: true },
    website: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: { type: String },
    reviewedById: { type: String, ref: 'User' },
    reviewedAt: { type: Date },
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

export const OrganizerApplication =
  mongoose.models.OrganizerApplication ||
  mongoose.model('OrganizerApplication', OrganizerApplicationSchema);
export default OrganizerApplication;
