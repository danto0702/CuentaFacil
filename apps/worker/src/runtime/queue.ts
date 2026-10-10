import type { SupabaseClient } from '@supabase/supabase-js';

export interface QueueMessage<T> {
  msgId: number;
  readCount: number;
  message: T;
}

/** pgmq through the service_role-only RPC wrappers (queue_read/queue_delete/queue_archive/queue_send). */
export class Queue<T> {
  constructor(
    private readonly sb: SupabaseClient,
    readonly name: string,
  ) {}

  async read(visibilitySeconds: number, qty: number): Promise<QueueMessage<T>[]> {
    const { data, error } = await this.sb.rpc('queue_read', {
      queue: this.name,
      visibility_seconds: visibilitySeconds,
      qty,
    });
    if (error) throw new Error(`queue_read(${this.name}): ${error.message}`);
    return ((data ?? []) as { msg_id: number; read_ct: number; message: T }[]).map((r) => ({
      msgId: r.msg_id,
      readCount: r.read_ct,
      message: r.message,
    }));
  }

  async delete(msgId: number): Promise<void> {
    const { error } = await this.sb.rpc('queue_delete', { queue: this.name, msg_id: msgId });
    if (error) throw new Error(`queue_delete(${this.name}): ${error.message}`);
  }

  async archive(msgId: number): Promise<void> {
    const { error } = await this.sb.rpc('queue_archive', { queue: this.name, msg_id: msgId });
    if (error) throw new Error(`queue_archive(${this.name}): ${error.message}`);
  }

  async send(message: T, delaySeconds = 0): Promise<number> {
    const { data, error } = await this.sb.rpc('queue_send', {
      queue: this.name,
      message,
      delay_seconds: delaySeconds,
    });
    if (error) throw new Error(`queue_send(${this.name}): ${error.message}`);
    return data as number;
  }
}
