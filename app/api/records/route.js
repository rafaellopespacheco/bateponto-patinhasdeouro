import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { type } = await req.json();

    if (!['ENTRADA', 'PAUSA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA'].includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 });
    }

    // Criar o registro de ponto
    const record = await prisma.timeRecord.create({
      data: {
        userId: session.userId,
        type,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
