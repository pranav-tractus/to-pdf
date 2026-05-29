import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export async function promptPassword(filename: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    return await rl.question(
      `Password for ${filename} (input will be visible): `,
    );
  } finally {
    rl.close();
  }
}
