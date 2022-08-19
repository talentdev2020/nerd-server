//#region "requests-responses"
export interface IPaywiserMerchantPaymentRequestNotification {
  MerchantReferenceID: string;
  PendingPaymentID: string;
  TransactionID: string;
  TransactionStatus: string;
  TransactionStatusDescription: string;
  CustomerAction: string;
  Customer?: {
    PersonID: string;
    FirstName: string;
    MiddleName: string;
    LastName: string;
    MobileNumber: string;
    Email: string;
    Address1: string;
    Address2: string;
    Address3: string;
    ZipCode: string;
    City: string;
    State: string;
    CountryCode: string;
    CountryName: string;
  };
}

export interface IPaywiserMerchantPaymentNotification {
  MerchantReferenceID: string;
  PendingPaymentID: string;
  TransactionID: string;
  TransactionStatus: string;
  TransactionStatusDescription: string;
}

export interface IPaywiserMerchantPaymentRequest {
  orderId: string;
  customerPersonId: string;
  amount: string;
  currency: string;
  description: string;
  validMinutes: number;
  validToDateTime: string;
  numberOfPayments: number;
  referenceId: string;
  pendingPaymentId: string;
  qrCodeData: string;
  callerReferenceId: string;
  customerAction: string;
  transactionStatus: string;
}

export interface IPaywiserMerchantPaymentRequestResponse {
  orderId: string;
  amount: string;
  currency: string;
  description: string;
  validToDateTime: string;
  numberOfPayments: number;
  qrCodeData: string;
}

export interface IPaywiserMerchantRequestPaymentRequest {
  OrderID: string;
  CustomerPersonID: string;
  CustomerMobileNumber: string;
  Amount: string;
  Currency: string;
  Description: string;
  ValidMinutes: number;
  ValidToDateTime: string;
  NumberOfPayments: Number;
  ReferenceID: string;
}

export interface IPaywiserMerchantRequestPaymentResponse {
  StatusCode: number;
  StatusDescription: string;
  PendingPaymentID: string;
  QRCodeData: string;
  ValidToDateTime: string;
  ReferenceID: string;
  CallerReferenceID: string;
}

export interface IPaywiserMerchantUserNotification {
  message: string;
  type: string;
  status: string;
  userId: string;
}
