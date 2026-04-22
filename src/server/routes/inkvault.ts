import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// 10 requests per hour per IP for AI generation
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'AI generation limit reached. Try again in an hour.' },
});

interface GenerateRequest {
  style: string;       // e.g. "japanese traditional", "geometric", "blackwork"
  placement: string;   // e.g. "forearm", "upper arm", "calf"
  description: string; // user's description of what they want
  size: string;        // e.g. "small (2-3in)", "medium (4-6in)", "large (7in+)"
  colors?: string[];   // optional color preferences
}

interface GenerateResponse {
  prompt: string;
  svgDescription: string;
  colorPalette: string[];
  styleNotes: string;
  placementTips: string;
  lineweightGuide: string;
  estimatedTime: string;
  designElements: string[];
}

router.post('/generate', aiLimiter, async (req: Request, res: Response, next) => {
  try {
    const { style, placement, description, size, colors } = req.body as GenerateRequest;

    if (!style || !placement || !description) {
      res.status(400).json({ success: false, error: 'style, placement, and description are required' });
      return;
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(503).json({ success: false, error: 'AI generation is not configured on this server' });
      return;
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an expert tattoo designer. Generate detailed design guidance for a tattoo with these specs:

Style: ${style}
Placement: ${placement}
Description: ${description}
Size: ${size}
${colors?.length ? `Color preferences: ${colors.join(', ')}` : 'Black and grey preferred'}

Respond with ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "prompt": "detailed stable diffusion / image generation prompt for this tattoo",
  "svgDescription": "step-by-step SVG drawing instructions describing the linework paths",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "styleNotes": "2-3 sentences on style execution tips",
  "placementTips": "specific advice for placing this design on the ${placement} considering muscle contour and movement",
  "lineweightGuide": "guide for varying line weights in this design",
  "estimatedTime": "estimated tattoo session time",
  "designElements": ["element1", "element2", "element3", "element4", "element5"]
}`,
      }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

    const parsed: GenerateResponse = JSON.parse(content.text);

    res.json({ success: true, data: parsed });
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      res.status(500).json({ success: false, error: 'AI returned invalid response. Please try again.' });
      return;
    }
    next(err);
  }
});

// GET /api/inkvault/styles — return available styles
router.get('/styles', (_req, res) => {
  res.json({
    success: true,
    data: {
      styles: ['Japanese Traditional', 'American Traditional', 'Blackwork', 'Geometric', 'Watercolor', 'Realism', 'Neo-Traditional', 'Tribal', 'Dotwork', 'Fine Line', 'Illustrative', 'Surrealism'],
      placements: ['Forearm', 'Upper Arm', 'Bicep', 'Shoulder', 'Back', 'Chest', 'Calf', 'Thigh', 'Ankle', 'Wrist', 'Neck', 'Ribcage', 'Hand', 'Foot'],
      sizes: ['Tiny (1in)', 'Small (2-3in)', 'Medium (4-6in)', 'Large (7-10in)', 'Extra Large (11in+)', 'Full Sleeve', 'Half Sleeve'],
    }
  });
});

export { router as inkVaultRoutes };
