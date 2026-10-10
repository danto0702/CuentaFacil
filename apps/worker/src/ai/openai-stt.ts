import type { STT } from '@cuentasbot/conversation';
import type OpenAI from 'openai';
import { toFile } from 'openai';

/** Vocabulary hints for Colombian public-health contractors (improves acronyms and place names). */
const PROMPT =
  'Informe de actividades de contratista. Términos: ESE, EBS, PIC, PAI, UPGD, SIVIGILA, SAMEN, IDS, COVE, CRUE, Ábrego, Convención, El Carmen, Teorama, San Pablo, Guamalito.';

const EXT: Record<string, string> = {
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/amr': 'amr',
};

export class OpenAISTT implements STT {
  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
  ) {}

  async transcribe(audio: Buffer, mime: string): Promise<string> {
    const base = mime.split(';')[0]?.trim() ?? 'audio/ogg';
    const file = await toFile(audio, `nota.${EXT[base] ?? 'ogg'}`, { type: base });
    const res = await this.client.audio.transcriptions.create({
      file,
      model: this.model,
      language: 'es',
      prompt: PROMPT,
    });
    return res.text.trim();
  }
}
