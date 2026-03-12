import { Job } from 'bullmq';
import { RenderJob, DeliveredAsset, OutputFormat } from '../types';
import { orders } from '../routes/orders';
import { v4 as uuid } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8765';

/**
 * Process a render job by:
 * 1. Translating the order description into Blender MCP commands via Claude
 * 2. Sending commands to the Blender MCP bridge
 * 3. Collecting output files and updating the order
 */
export async function processRenderJob(job: Job<RenderJob>): Promise<void> {
  const data = job.data;
  const order = orders.get(data.orderId);

  if (!order) {
    throw new Error(`Order ${data.orderId} not found`);
  }

  try {
    // Phase 1: Generate Blender commands from description via Claude
    await job.updateProgress(10);
    order.status = 'processing';

    const blenderScript = await generateBlenderScript(data);

    // Phase 2: Execute via Blender MCP bridge
    await job.updateProgress(30);
    order.status = 'rendering';

    const result = await executeBlenderScript(blenderScript, data);

    // Phase 3: Render outputs
    await job.updateProgress(60);

    const renderOutputs = await renderOutputFormats(data, result.sceneId);

    // Phase 4: Upload to cloud storage
    await job.updateProgress(80);

    const assets = await uploadAssets(data.orderId, renderOutputs);

    // Phase 5: Update order with delivered assets
    order.assets = assets;
    order.status = 'completed';
    order.updatedAt = new Date().toISOString();

    await job.updateProgress(100);

    console.log(`[RenderWorker] Order ${data.orderId} completed with ${assets.length} assets`);
  } catch (err: any) {
    order.status = 'failed';
    order.updatedAt = new Date().toISOString();
    throw err; // Re-throw for BullMQ retry logic
  }
}

/**
 * Use Claude to translate a natural language description into a Blender Python script
 */
async function generateBlenderScript(data: RenderJob): Promise<string> {
  const systemPrompt = `You are a Blender 4.x Python scripting expert. Generate a complete, executable Blender Python script based on the user's description.

Rules:
- Start with bpy.ops.wm.read_factory_settings(use_empty=True) to clear the scene
- All dimensions in METERS
- Use bpy module exclusively
- Include proper materials with Principled BSDF nodes
- Set up a 3-point lighting rig for product shots
- Add a camera positioned for the best angle
- Script must be self-contained and executable via blender --background --python
- Output ONLY the Python script, no explanation

Asset type: ${data.assetType}
Output formats needed: ${data.outputFormats.join(', ')}
Render engine: ${data.renderEngine}
${data.dimensions ? `Dimensions: ${data.dimensions.width}${data.dimensions.unit} × ${data.dimensions.height}${data.dimensions.unit} × ${data.dimensions.depth}${data.dimensions.unit}` : ''}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: data.description }],
  });

  const script = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.type === 'text' ? block.text : '')
    .join('\n');

  // Strip any markdown fencing
  return script.replace(/```python\n?/g, '').replace(/```\n?/g, '').trim();
}

/**
 * Send Blender script to the MCP bridge for execution
 */
async function executeBlenderScript(
  script: string,
  data: RenderJob,
): Promise<{ sceneId: string; stdout: string }> {
  const response = await fetch(`${MCP_SERVER_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      script,
      orderId: data.orderId,
      timeout: 120, // 2 minute max
    }),
    signal: AbortSignal.timeout(130_000), // 130s total with buffer
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Blender MCP execution failed (${response.status}): ${errBody}`);
  }

  return response.json();
}

/**
 * Trigger render exports for each requested output format
 */
async function renderOutputFormats(
  data: RenderJob,
  sceneId: string,
): Promise<Array<{ format: OutputFormat; localPath: string }>> {
  const outputs: Array<{ format: OutputFormat; localPath: string }> = [];

  for (const format of data.outputFormats) {
    const response = await fetch(`${MCP_SERVER_URL}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneId,
        format,
        renderEngine: data.renderEngine,
        samples: data.renderEngine === 'cycles' ? 256 : undefined,
        resolution: format === 'png' || format === 'jpg' ? { x: 2048, y: 2048 } : undefined,
      }),
      signal: AbortSignal.timeout(300_000), // 5 min for renders
    });

    if (!response.ok) {
      console.error(`[RenderWorker] Export failed for format ${format}`);
      continue;
    }

    const result = await response.json();
    outputs.push({ format, localPath: result.filePath });
  }

  if (outputs.length === 0) {
    throw new Error('All export formats failed');
  }

  return outputs;
}

/**
 * Upload rendered assets to cloud storage and return delivery metadata
 */
async function uploadAssets(
  orderId: string,
  outputs: Array<{ format: OutputFormat; localPath: string }>,
): Promise<DeliveredAsset[]> {
  const assets: DeliveredAsset[] = [];
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  for (const output of outputs) {
    // In production: upload to GCS and generate signed URL
    // For now: return local path as placeholder
    const assetId = uuid();
    const filename = `${orderId}_${assetId}.${output.format}`;

    assets.push({
      id: assetId,
      orderId,
      filename,
      format: output.format,
      fileSizeBytes: 0, // Would be populated from actual file
      downloadUrl: `${process.env.GCS_CDN_URL || '/local'}/${filename}`,
      thumbnailUrl: output.format === 'png' || output.format === 'jpg'
        ? `${process.env.GCS_CDN_URL || '/local'}/thumb_${filename}`
        : null,
      expiresAt,
    });
  }

  return assets;
}
