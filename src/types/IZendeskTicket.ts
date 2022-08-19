export default interface IZendeskTicket {
  createdAt: Date;
  updatedAt: Date;
  status: string;
  subject: string;
  id: number;
  description: string;
}
