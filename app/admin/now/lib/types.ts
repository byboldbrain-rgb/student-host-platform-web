export type OrderStatus =
  | 'awaiting_whatsapp_send'
  | 'waiting_confirmation'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type AdminAccessContext = {
  user_id: string;
  platform_role: string;
  now_role: string;
  is_active: boolean;
  permissions: {
    view_orders: boolean;
    manage_orders: boolean;
    manage_catalog: boolean;
    manage_finance: boolean;
    manage_settings: boolean;
  };
};

export type AdminOrderListItem = {
  id: string;
  order_code: string;
  source: string;
  status: OrderStatus;
  payment_status: PaymentStatus;

  store: {
    id: string;
    icon: string | null;
    name_ar: string;
  };

  customer: {
    name: string;
    phone: string;
  };

  delivery: {
    address: string;
    area_name_ar: string;
  };

  summary: {
    subtotal: number | string;
    item_count: number;
    delivery_fee: number | string;
    total_amount: number | string;
    currency_code: string;
    currency_symbol: string;
  };

  whatsapp: {
    opened_at: string | null;
    sent_confirmed_at: string | null;
  };

  created_at: string;
  updated_at: string;
};

export type AdminOrdersResponse = {
  items: AdminOrderListItem[];

  summary: {
    total: number;
    cancelled: number;
    confirmed: number;
    delivered: number;
    preparing: number;
    out_for_delivery: number;
    waiting_confirmation: number;
    awaiting_whatsapp_send: number;
  };

  pagination: {
    limit: number;
    offset: number;
    returned: number;
    total_filtered: number;
  };
};

export type AdminOrderDetail = {
  id: string;
  order_code: string;
  client_request_id: string;
  source: string;
  status: OrderStatus;
  payment_status: PaymentStatus;

  store: {
    id: string;
    icon: string | null;
    name_ar: string;
  };

  customer: {
    user_id: string | null;
    name: string;
    phone: string;
  };

  delivery: {
    service_area_id: string;
    area_name_ar: string;
    address: string;
    landmark: string | null;
    notes: string | null;
  };

  payment: {
    payment_method_id: string;
    payment_method_name: string;
    payment_status: PaymentStatus;
  };

  summary: {
    subtotal: number | string;
    delivery_fee: number | string;
    total_amount: number | string;
    currency_code: string;
    currency_symbol: string;
  };

  whatsapp: {
    message: string | null;
    opened_at: string | null;
    sent_confirmed_at: string | null;
  };

  items: Array<{
    id: string;
    product_id: string | null;
    product_variant_id: string | null;
    name_ar: string;
    variant_name_ar: string | null;
    sku: string | null;
    image_url: string | null;
    quantity: number;
    unit_price: number | string;
    line_total: number | string;
    requires_prescription: boolean;
    is_age_restricted: boolean;
  }>;

  status_history: Array<{
    id: string;
    old_status: OrderStatus | null;
    new_status: OrderStatus;
    note: string | null;
    changed_by_type: string;
    changed_by_user_id: string | null;
    actor_reference: string | null;
    created_at: string;
  }>;

  timestamps: {
    created_at: string;
    updated_at: string;
    confirmed_at: string | null;
    preparing_at: string | null;
    out_for_delivery_at: string | null;
    delivered_at: string | null;
    cancelled_at: string | null;
  };

  cancellation_reason: string | null;
};
