// --- Order Types ---

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'queued'
  | 'processing'
  | 'rendering'
  | 'review'
  | 'completed'
  | 'failed'
  | 'refunded';

export type AssetType =
  | 'product_render'
  | 'custom_stl'
  | 'custom_3mf'
  | 'prototype_step'
  | 'glass_digitize'
  | 'scene_render';

export type RenderEngine = 'cycles' | 'eevee';

export type OutputFormat = 'png' | 'jpg' | 'exr' | 'stl' | '3mf' | 'step' | 'obj' | 'fbx' | 'glb';

export interface OrderRequest {
  assetType: AssetType;
  description: string;
  referenceImages?: string[];        // URLs to uploaded reference images
  dimensions?: Dimensions;
  outputFormats: OutputFormat[];
  renderEngine?: RenderEngine;
  priority?: 'standard' | 'rush';
  notes?: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  assetType: AssetType;
  description: string;
  referenceImages: string[];
  dimensions: Dimensions | null;
  outputFormats: OutputFormat[];
  renderEngine: RenderEngine;
  priority: 'standard' | 'rush';
  notes: string;
  priceUsd: number;
  stripePaymentId: string | null;
  jobId: string | null;
  assets: DeliveredAsset[];
  revisions: Revision[];
  createdAt: string;
  updatedAt: string;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'mm' | 'cm' | 'in';
}

export interface DeliveredAsset {
  id: string;
  orderId: string;
  filename: string;
  format: OutputFormat;
  fileSizeBytes: number;
  downloadUrl: string;
  thumbnailUrl: string | null;
  expiresAt: string;
}

export interface Revision {
  id: string;
  orderId: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
}

// --- Job Types ---

export interface RenderJob {
  orderId: string;
  assetType: AssetType;
  description: string;
  referenceImages: string[];
  dimensions: Dimensions | null;
  outputFormats: OutputFormat[];
  renderEngine: RenderEngine;
  blenderCommands: BlenderCommand[];
  attempt: number;
}

export interface BlenderCommand {
  operation: string;
  params: Record<string, unknown>;
}

// --- Pricing ---

export const PRICING: Record<AssetType, { base: number; rush: number }> = {
  product_render:  { base: 100, rush: 175 },
  custom_stl:      { base: 50,  rush: 85  },
  custom_3mf:      { base: 50,  rush: 85  },
  prototype_step:  { base: 150, rush: 250 },
  glass_digitize:  { base: 100, rush: 175 },
  scene_render:    { base: 125, rush: 200 },
};

// --- API Response ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- User / Auth ---

export interface AuthUser {
  uid: string;
  email: string;
  role: 'client' | 'admin' | 'partner';
}
