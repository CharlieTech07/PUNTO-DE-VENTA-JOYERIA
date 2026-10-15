import { Router } from 'express';
import * as deepl from 'deepl-node';

const router = Router();
const MAX_TEXTS = 50;
const MAX_TEXT_LENGTH = 4_000;
const MAX_TOTAL_LENGTH = 20_000;

router.post('/', async (req, res) => {
  const apiKey = process.env.DEEPL_AUTH_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'El servicio de traducción no está configurado.' });
  }

  const input = req.body?.texts ?? req.body?.text;
  const isBatch = Array.isArray(input);
  const texts: string[] = isBatch ? input : [input];

  if (
    texts.length === 0 ||
    (isBatch && texts.length > MAX_TEXTS) ||
    texts.some(text => typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT_LENGTH) ||
    texts.reduce((total, text) => total + text.length, 0) > MAX_TOTAL_LENGTH
  ) {
    return res.status(400).json({ error: 'Envía uno o más textos válidos para traducir.' });
  }

  try {
    const client = new deepl.DeepLClient(apiKey);
    const result = await client.translateText(texts, 'es', 'en-GB');
    const translatedTexts = result.map(item => item.text);

    if (isBatch) {
      return res.json({ translatedTexts });
    }

    return res.json({ translatedText: translatedTexts[0] });
  } catch {
    return res.status(502).json({ error: 'DeepL no pudo traducir el texto. Intenta de nuevo más tarde.' });
  }
});

export default router;
