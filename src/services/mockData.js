export const mockClient = {
  client_name: 'Demo Client LLC',
  status: 'active',
  main_email: 'demo@example.local',
  username: 'demo',
  balance: 4250.75,
  credit_limit: 10000,
  currency: 'USD',
};

export const mockFinance = {
  balance: 4250.75,
  credit: 10000,
  currency: 'USD',
};

export const mockPayments = {
  items: [
    { client_payment_id: 1001, payment_type: 'invoice payment received', amount: 1500, paid_on: '2026-05-01T10:00:00Z' },
    { client_payment_id: 1002, payment_type: 'prepayment', amount: 500, paid_on: '2026-04-15T14:30:00Z' },
    { client_payment_id: 1003, payment_type: 'payment sent', amount: -200, paid_on: '2026-04-01T09:00:00Z' },
    { client_payment_id: 1004, payment_type: 'invoice payment received', amount: 2200, paid_on: '2026-03-20T11:00:00Z' },
    { client_payment_id: 1005, payment_type: 'credit note received', amount: 250.75, paid_on: '2026-03-01T16:00:00Z' },
  ],
  total: 5,
  page: 0,
  per_page: 10,
};

export const mockInvoices = {
  items: [
    { id: 501, invoice_number: 'INV-2026-0501', amount: 1500, status: 'paid', invoice_time: '2026-05-01T00:00:00Z' },
    { id: 502, invoice_number: 'INV-2026-0401', amount: 2200, status: 'paid', invoice_time: '2026-04-01T00:00:00Z' },
    { id: 503, invoice_number: 'INV-2026-0502', amount: 890.5, status: 'pending', invoice_time: '2026-05-15T00:00:00Z' },
    { id: 504, invoice_number: 'INV-2026-0301', amount: 1100, status: 'overdue', invoice_time: '2026-03-01T00:00:00Z' },
  ],
  total: 4,
  page: 0,
  per_page: 10,
};
