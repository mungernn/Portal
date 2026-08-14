export interface PaymentInput {
  paymentMode: string;
  counter?: string | null;
  /** Required — references the demand_notices row being settled. The amount charged comes from that notice, not from the client. */
  demandNo: string;
}

export interface ArrearStagePaidView {
  period: string;
  years: number;
  annualCharge: string;
  amount: string;
}

export interface PaymentResult {
  receiptNo: string;
  formattedReceiptNo: string;
  date: string;
  paymentMode: string;
  amountReceived: string;
  amountInWords: string;
  collectedBy: string;
  demandNo: string;
  verificationUrl: string;
  arrearStagesPaid: ArrearStagePaidView[];
  property: Record<string, unknown>;
  floors: unknown[];
  taxCalc: unknown;
  totals: {
    yearWiseArrears: string;
    currentTax: string;
    rebate: string;
    penalty: string;
    outstandingDemand: string;
    currentTaxLateFee: string;
    currentTaxRebate: string;
    currentTotal: string;
    grandTotal: string;
  };
}