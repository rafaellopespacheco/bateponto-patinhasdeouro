import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export async function POST(req) {
  await deleteSession();
  
  // Utilizar um Response com status 302 direto para a raiz (/) 
  // Isso evita que proxies como o do Discloud forcem "localhost:8080" na URL
  return new Response(null, {
    status: 302,
    headers: { Location: '/' }
  });
}
