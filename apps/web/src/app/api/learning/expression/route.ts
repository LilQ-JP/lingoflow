import { NextResponse } from 'next/server';
import { getUserId } from '@/server/session';
import { expressionAction } from '@/server/learning-store';
import { parseExpressionAction } from '@/server/request-validation';
export async function POST(r:Request){const user=await getUserId();if(!user)return NextResponse.json({error:'unauthorized'},{status:401});try{const b=parseExpressionAction(await r.json());return NextResponse.json(await expressionAction(user,b.phraseId,b.action as 'archive'|'restore'))}catch{return NextResponse.json({error:'invalid_request'},{status:400})}}
