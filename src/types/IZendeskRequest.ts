export default interface IZendeskRequest {
  userId: string;
  subject: string;
  comment: string;
  requester: {
    name: string;
    email: string;
  };
}
