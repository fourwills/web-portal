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

export const mockIngressTrunks = {
  items: [
    {
      resource_id: 205,
      trunk_id: 205,
      trunk_name: 'AMS',
      is_active: true,
      call_limit: 100,
      ip: [{ ip: '88.99.103.106', port: 5060, addr_type: 'ip' }],
    },
  ],
  total: 1,
  page: 0,
  per_page: 10,
};

export const mockTrunkRouting = [
  {
    trunk_id: 205,
    trunk_name: 'AMS',
    tech_prefix: '230426',
    rate_table_name: 'USA_Flat_00075_Client',
    product_name: null,
    code: null,
  },
];

export const mockEgressTrunks = {
  items: [
    {
      resource_id: 310,
      trunk_id: 310,
      trunk_name: 'Demo Egress',
      is_active: true,
      trunk_type2: 'DID Traffic',
      auth_type: 'Authorized by Host Only',
      call_limit: 200,
      ip: [{ ip: '203.0.113.50', port: 5060, addr_type: 'ip' }],
    },
  ],
  total: 1,
  page: 0,
  per_page: 10,
};

export const mockClientRegisteredIps = [
  { trunk_id: 205, trunk_name: 'AMS', direction: 'Ingress', ip: '88.99.103.106', port: 5060, addr_type: 'ip', fqdn: '—', trunk_type2: '—' },
  {
    trunk_id: 310,
    trunk_name: 'Demo Egress',
    direction: 'Egress',
    ip: '203.0.113.50',
    port: 5060,
    addr_type: 'ip',
    fqdn: '—',
    trunk_type2: 'DID Traffic',
  },
];

export const mockRateTables = {
  items: [
    { id: 1, name: 'US Termination', currency: 'USD', effective_date: '2026-01-01' },
    { id: 2, name: 'EU Termination', currency: 'EUR', effective_date: '2026-02-01' },
  ],
  total: 2,
  page: 0,
  per_page: 10,
};

export const mockRates = {
  items: [
    { code: '1', description: 'USA', rate: 0.012, interval: 6 },
    { code: '44', description: 'UK', rate: 0.018, interval: 6 },
  ],
  total: 2,
  page: 0,
  per_page: 10,
};

export const mockDids = {
  items: [
    { id: 1, did: '+12025550100', state: 'DC', status: 'active', country: 'US' },
  ],
  total: 1,
  page: 0,
  per_page: 10,
};

export const mockFreeDids = {
  items: [
    {
      id: 101,
      did: '+12025550999',
      state: 'DC',
      country: 'US',
      buy_billing_plan_id: 1,
      rate_type: 'flat',
    },
  ],
  total: 1,
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
