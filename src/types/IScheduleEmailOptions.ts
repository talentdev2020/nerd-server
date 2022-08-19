export interface IScheduleEmailOptions {
  sendTo: string;
  sendAt: Date;
  template: {
    subject: string;
    html: string;
    attachments?: Array<{
      content: string;
      filename: string;
      type?: string;
      disposition?: 'inline' | 'attachment';
      content_id?: string;
    }>;
  };
}
