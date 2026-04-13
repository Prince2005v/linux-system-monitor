import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const filePath = path.join(process.cwd(), 'system_logs.json');
  let data = [];

  try {
    const raw = await fs.promises.readFile(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch {
    data = [];
  }

  const history = Array.isArray(data) ? data.slice(-30) : [];
  const latest = history.length ? history[history.length - 1] : null;

  return NextResponse.json({ latest, history });
}
