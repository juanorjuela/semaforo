import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Event, EventDay, EventStatus } from '../types';
import { getDateRange } from '../utils/time';
import { logAudit } from './auditService';

export async function getEvents(): Promise<Event[]> {
  const q = query(collection(db, 'events'), orderBy('startDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Event[];
}

export async function getActiveEvent(): Promise<Event | null> {
  const q = query(
    collection(db, 'events'),
    where('status', '==', 'active'),
    orderBy('startDate', 'desc')
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Event;
}

export async function createEvent(
  data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string,
  userEmail: string
): Promise<string> {
  const now = Date.now();
  const docRef = await addDoc(collection(db, 'events'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  const dates = getDateRange(data.startDate, data.endDate);
  for (const date of dates) {
    await addDoc(collection(db, 'eventDays'), {
      eventId: docRef.id,
      date,
      createdAt: now,
    });
  }

  await logAudit('CREATE', 'event', docRef.id, userId, userEmail, `Evento creado: ${data.name}`);
  return docRef.id;
}

export async function updateEvent(
  id: string,
  data: Partial<Event>,
  userId: string,
  userEmail: string
): Promise<void> {
  await updateDoc(doc(db, 'events', id), { ...data, updatedAt: Date.now() });
  await logAudit('UPDATE', 'event', id, userId, userEmail, `Evento actualizado: ${data.name || id}`);
}

export async function setEventStatus(
  id: string,
  status: EventStatus,
  userId: string,
  userEmail: string
): Promise<void> {
  if (status === 'active') {
    const activeEvents = await getDocs(
      query(collection(db, 'events'), where('status', '==', 'active'))
    );
    for (const activeDoc of activeEvents.docs) {
      if (activeDoc.id !== id) {
        await updateDoc(doc(db, 'events', activeDoc.id), {
          status: 'completed',
          updatedAt: Date.now(),
        });
      }
    }
  }
  await updateDoc(doc(db, 'events', id), { status, updatedAt: Date.now() });
  await logAudit('UPDATE', 'event', id, userId, userEmail, `Estado del evento: ${status}`);
}

export async function deleteEvent(
  id: string,
  name: string,
  userId: string,
  userEmail: string
): Promise<void> {
  const days = await getEventDays(id);
  for (const day of days) {
    const assignments = await getDocs(
      query(collection(db, 'assignments'), where('eventDayId', '==', day.id))
    );
    for (const a of assignments.docs) {
      await deleteDoc(doc(db, 'assignments', a.id));
    }
    await deleteDoc(doc(db, 'eventDays', day.id));
  }
  await deleteDoc(doc(db, 'events', id));
  await logAudit('DELETE', 'event', id, userId, userEmail, `Evento eliminado: ${name}`);
}

export async function getEventDays(eventId: string): Promise<EventDay[]> {
  const q = query(
    collection(db, 'eventDays'),
    where('eventId', '==', eventId),
    orderBy('date')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as EventDay[];
}
