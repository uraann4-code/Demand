export interface PurchaseItem {
  id: string;
  srNo: string;
  description: string;
  qty: string;
  justification: string;
}

export interface FormData {
  dated: string;
  approverTitle: string; 
  raisedBy?: string;
}
