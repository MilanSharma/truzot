export type OrderStatus =
  | "pending"
  | "paid"
  | "training"
  | "generating"
  | "completed"
  | "failed";

export interface Headshot {
  id: string;
  image_url: string;
  style?: string;
  category?: string;
  order_id?: string;
  created_at?: string;
}

export interface Training {
  id: string;
  order_id: string;
  status: string;
  model_id?: string;
  error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  plan: string;
  status: OrderStatus;
  created_at: string;
  email?: string;
  user_id?: string;
  amount_cents?: number;
  zip_url?: string;
  stripe_payment_intent?: string;
  preferences?: Record<string, unknown>;
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status?: number;
}

export interface OrderStatusResponse {
  status: OrderStatus;
  headshots?: Headshot[];
  count?: number;
  target?: number;
}

export interface CheckoutResponse {
  url?: string;
  orderId?: string;
  existing?: boolean;
  error?: string;
}
