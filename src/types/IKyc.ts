export default interface IKyc {
  StatusCode: number;
  StatusDescription: string;
  PersonId: string;
  KycId: string;
  RequireMobileNumberCheck: boolean;
  RequireVideo: boolean;
  RequireAdditionalDocuments: boolean;
  AllowAddressEntry: boolean;
  RequiredAddressFields: string;
  AdditionalDocuments: string;
  VideoDocumentExpiryDate: string;
  VideoDocumentWillExpire: string;
  VideoDocumentExpired: string;
  IbanWillBeCreated: string;
  RequireAddress: boolean;
  AddressFields: string;
  ReferenceId: string;
  ReferenceNumber: string;
  VerificationStatus: string;
  KycStatus: string;
}
