"use server";

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Não autorizado');
}

export async function createUser(formData) {
  await checkAdmin();
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');
  const hourlyRate = parseFloat(formData.get('hourlyRate')) || 0;
  const expectedEntryTime = formData.get('expectedEntryTime') || '08:00';
  const lunchBreakLimitMin = parseInt(formData.get('lunchBreakLimitMin')) || 60;
  const canViewPreview = formData.get('canViewPreview') === 'on';

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name, email, password: hashedPassword, role: 'EMPLOYEE',
      hourlyRate, expectedEntryTime, lunchBreakLimitMin, canViewPreview
    }
  });

  revalidatePath('/admin');
  redirect('/admin');
}

export async function updateUser(id, formData) {
  await checkAdmin();
  const name = formData.get('name');
  const email = formData.get('email');
  const hourlyRate = parseFloat(formData.get('hourlyRate')) || 0;
  const expectedEntryTime = formData.get('expectedEntryTime') || '08:00';
  const lunchBreakLimitMin = parseInt(formData.get('lunchBreakLimitMin')) || 60;
  const canViewPreview = formData.get('canViewPreview') === 'on';
  
  const password = formData.get('password');
  const data = {
    name, email, hourlyRate, expectedEntryTime, 
    lunchBreakLimitMin, canViewPreview
  };

  if (password && password.trim() !== '') {
    data.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id },
    data
  });

  revalidatePath('/admin');
  redirect('/admin');
}

export async function addManualTimeRecord(userId, formData) {
  await checkAdmin();
  const type = formData.get('type');
  const dateStr = formData.get('date'); // YYYY-MM-DD
  const timeStr = formData.get('time'); // HH:MM

  const timestamp = new Date(`${dateStr}T${timeStr}:00`);

  await prisma.timeRecord.create({
    data: {
      userId,
      type,
      timestamp
    }
  });

  revalidatePath(`/admin/ponto/${userId}`);
}

export async function deleteTimeRecord(recordId) {
  await checkAdmin();
  const record = await prisma.timeRecord.delete({
    where: { id: recordId }
  });
  revalidatePath(`/admin/ponto/${record.userId}`);
}

export async function addBatchManualTimeRecords(userId, formData) {
  await checkAdmin();
  const dateStr = formData.get('date'); // YYYY-MM-DD
  const entrada = formData.get('entrada');
  const pausa = formData.get('pausa');
  const retorno = formData.get('retorno');
  const saida = formData.get('saida');

  const recordsToCreate = [];

  if (entrada) recordsToCreate.push({ userId, type: 'ENTRADA', timestamp: new Date(`${dateStr}T${entrada}:00`) });
  if (pausa) recordsToCreate.push({ userId, type: 'PAUSA_ALMOCO', timestamp: new Date(`${dateStr}T${pausa}:00`) });
  if (retorno) recordsToCreate.push({ userId, type: 'RETORNO_ALMOCO', timestamp: new Date(`${dateStr}T${retorno}:00`) });
  if (saida) recordsToCreate.push({ userId, type: 'SAIDA', timestamp: new Date(`${dateStr}T${saida}:00`) });

  if (recordsToCreate.length > 0) {
    await prisma.timeRecord.createMany({
      data: recordsToCreate
    });
  }

  revalidatePath(`/admin/ponto/${userId}`);
}

export async function updateTimeRecord(recordId, formData) {
  await checkAdmin();
  const dateStr = formData.get('date');
  const timeStr = formData.get('time');
  const type = formData.get('type');

  const timestamp = new Date(`${dateStr}T${timeStr}:00`);

  const record = await prisma.timeRecord.update({
    where: { id: recordId },
    data: { type, timestamp }
  });

  revalidatePath(`/admin/ponto/${record.userId}`);
  redirect(`/admin/ponto/${record.userId}`);
}


