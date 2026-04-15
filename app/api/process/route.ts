import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { pid } = await request.json();
    
    if (!pid || typeof pid !== 'number') {
      return NextResponse.json({ error: 'Invalid PID provided' }, { status: 400 });
    }

    // Kill the process. On macOS/Linux, kill -9 is the standard force kill.
    await execAsync(`kill -9 ${pid}`);
    
    return NextResponse.json({ success: true, message: `Successfully killed process ${pid}` });
  } catch (error: any) {
    console.error('Failed to kill process:', error);
    return NextResponse.json({ 
      error: 'Failed to kill process', 
      details: error.message 
    }, { status: 500 });
  }
}
