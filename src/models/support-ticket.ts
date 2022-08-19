import { model, Schema, Document } from 'mongoose';

interface ISupportTicket {
  subject: string;
  comment: string;
  requester: string;
  externalId: string;
  additionalTags: string[];
  brandId: string;
  status: string;
  created: Date;
  updated: Date;
}

interface ISupportTicketDocument extends ISupportTicket, Document {}

export const supportTicketSchema = new Schema(
  {
    subject: String,
    comment: String,
    requester: String,
    externalId: String,
    additionalTags: [String],
    brandId: String,
    status: String,
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } },
);

export const SupportTicket = model<ISupportTicketDocument>(
  'support-ticket',
  supportTicketSchema,
);
