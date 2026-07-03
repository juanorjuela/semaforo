import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AssignmentWithStaff, PaymentStatus, ShiftAssignment } from '../types';
import { calculatePayment } from '../utils/currency';
import { calculateHoursFromTimes } from '../utils/time';
import { logAudit } from './auditService';
import { getStaffMap } from './staffService';

export async function getAssignmentsForDay(eventDayId: string): Promise<ShiftAssignment[]> {
  const q = query(collection(db, 'assignments'), where('eventDayId', '==', eventDayId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ShiftAssignment[];
}

export async function getAssignmentsForEvent(eventId: string): Promise<ShiftAssignment[]> {
  const q = query(collection(db, 'assignments'), where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ShiftAssignment[];
}

export async function getAssignmentsWithStaffForDay(
  eventDayId: string
): Promise<AssignmentWithStaff[]> {
  const assignments = await getAssignmentsForDay(eventDayId);
  const staffMap = await getStaffMap();
  return assignments
    .map((a) => ({
      ...a,
      staffName: staffMap.get(a.staffMemberId)?.name || 'Desconocido',
    }))
    .sort((a, b) => a.staffName.localeCompare(b.staffName));
}

export async function getAssignmentsWithStaffForEvent(
  eventId: string
): Promise<AssignmentWithStaff[]> {
  const assignments = await getAssignmentsForEvent(eventId);
  const staffMap = await getStaffMap();
  return assignments.map((a) => ({
    ...a,
    staffName: staffMap.get(a.staffMemberId)?.name || 'Desconocido',
  }));
}

export async function createAssignment(
  eventId: string,
  eventDayId: string,
  staffMemberId: string,
  startTime: string,
  endTime: string,
  hourlyWage: number,
  userId: string,
  userEmail: string
): Promise<string> {
  const existing = await getAssignmentsForDay(eventDayId);
  if (existing.some((a) => a.staffMemberId === staffMemberId)) {
    throw new Error('Este miembro ya está asignado para este día.');
  }

  const hoursWorked = calculateHoursFromTimes(startTime, endTime);
  const paymentAmount = calculatePayment(hoursWorked, hourlyWage);
  const now = Date.now();

  const docRef = await addDoc(collection(db, 'assignments'), {
    eventId,
    eventDayId,
    staffMemberId,
    startTime,
    endTime,
    hoursWorked,
    hourlyWage,
    paymentAmount,
    paymentStatus: 'pending' as PaymentStatus,
    createdAt: now,
    updatedAt: now,
  });

  await logAudit(
    'CREATE',
    'assignment',
    docRef.id,
    userId,
    userEmail,
    `Turno asignado: ${startTime}-${endTime}, ${hoursWorked}h, ${paymentAmount} COP`
  );
  return docRef.id;
}

export async function updateAssignment(
  id: string,
  startTime: string,
  endTime: string,
  hourlyWage: number,
  userId: string,
  userEmail: string
): Promise<void> {
  const hoursWorked = calculateHoursFromTimes(startTime, endTime);
  const paymentAmount = calculatePayment(hoursWorked, hourlyWage);

  await updateDoc(doc(db, 'assignments', id), {
    startTime,
    endTime,
    hoursWorked,
    hourlyWage,
    paymentAmount,
    updatedAt: Date.now(),
  });

  await logAudit(
    'UPDATE',
    'assignment',
    id,
    userId,
    userEmail,
    `Turno actualizado: ${startTime}-${endTime}, ${hoursWorked}h, ${paymentAmount} COP`
  );
}

export async function deleteAssignment(
  id: string,
  userId: string,
  userEmail: string
): Promise<void> {
  await deleteDoc(doc(db, 'assignments', id));
  await logAudit('DELETE', 'assignment', id, userId, userEmail, 'Turno eliminado');
}

export async function markAssignmentPaid(
  id: string,
  userId: string,
  userEmail: string
): Promise<void> {
  await updateDoc(doc(db, 'assignments', id), {
    paymentStatus: 'paid',
    paidAt: Date.now(),
    paidBy: userId,
    updatedAt: Date.now(),
  });
  await logAudit('PAY', 'assignment', id, userId, userEmail, 'Pago marcado como realizado');
}

export async function markAssignmentPending(
  id: string,
  userId: string,
  userEmail: string
): Promise<void> {
  await updateDoc(doc(db, 'assignments', id), {
    paymentStatus: 'pending',
    paidAt: deleteField(),
    paidBy: deleteField(),
    updatedAt: Date.now(),
  });
  await logAudit('UNPAY', 'assignment', id, userId, userEmail, 'Pago marcado como pendiente');
}

export async function markAllDayPaid(
  eventDayId: string,
  userId: string,
  userEmail: string
): Promise<void> {
  const assignments = await getAssignmentsForDay(eventDayId);
  for (const a of assignments) {
    if (a.paymentStatus === 'pending') {
      await markAssignmentPaid(a.id, userId, userEmail);
    }
  }
}
