import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/session';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    // Criar sessão de JWT em cookie
    await createSession(user.id, user.role);

    return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
