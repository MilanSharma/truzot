export interface FalImage {
  url: string;
  width?: number;
  height?: number;
  content_type?: string;
}

export interface FalLoraResult {
  prompt: string;
  images: FalImage[];
  seed?: number;
}

export interface GenerateHeadshotsResult {
  prompt: string;
  index: number;
  images: FalImage[];
  seed?: number;
}

export interface GenerateHeadshotsResponse {
  results: GenerateHeadshotsResult[];
  failures: string[];
  totalRequested: number;
}

export interface TrainModelResult {
  request_id?: string;
  response_id?: string;
  status?: string;
}

export interface UserPreferences {
  gender?: string;
  eyeColor?: string;
  hairColor?: string;
  clothing?: string;
  background?: string;
  framing?: string;
  selectedStyles?: string[];
  storagePath?: string;
  idempotency_key?: string;
  stripe_customer_id?: string;
  generate_failures?: number;
}
