import { NextResponse } from 'next/server';
import { getUserId } from '@/server/session';
import { getWorkspace, patchWorkspace } from '@/server/learning-store';
import { parseWorkspacePatch } from '@/server/request-validation';
export async function GET(){const user=await getUserId();if(!user)return NextResponse.json({error:'unauthorized'},{status:401});return NextResponse.json(await getWorkspace(user))}
export async function PATCH(request:Request){const user=await getUserId();if(!user)return NextResponse.json({error:'unauthorized'},{status:401});try{const patch=parseWorkspacePatch(await request.json());return NextResponse.json(await patchWorkspace(user,patch))}catch{return NextResponse.json({error:'invalid_request',message:'設定内容を確認してください。'},{status:400})}}
