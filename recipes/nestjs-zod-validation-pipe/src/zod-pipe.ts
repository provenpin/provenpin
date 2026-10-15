import { BadRequestException, type PipeTransform } from "@nestjs/common";
import { z, type ZodType } from "zod";

export class ZodPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}
  transform(value: unknown): T {
    const r = this.schema.safeParse(value);
    if (!r.success) {
      throw new BadRequestException({ error: "invalid_body", issues: z.flattenError(r.error).fieldErrors });
    }
    return r.data;
  }
}
