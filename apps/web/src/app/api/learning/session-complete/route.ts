import { NextResponse } from 'next/server';
import { getUserId } from '@/server/session';
import { saveSessionCompletion } from '@/server/learning-store';
import { parseCompletion } from '@/server/request-validation';
export async function POST(r:Request){const user=await getUserId();if(!user)return NextResponse.json({error:'unauthorized'},{status:401});try{return NextResponse.json(await saveSessionCompletion(user,parseCompletion(await r.json())))}catch{return NextResponse.json({error:'invalid_completion'},{status:400})}}
