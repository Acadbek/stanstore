import { sql } from 'drizzle-orm';
import { withDatabaseFallback } from '@/lib/db/drizzle';
import type { Product } from '@/lib/db/schema';
import { getValidGoogleCalendarAccessToken } from '@/lib/google-calendar';

const BOOKING_PRODUCT_SETTINGS_TABLE = 'booking_product_settings';
const BOOKING_APPOINTMENTS_TABLE = 'booking_appointments';

export const BOOKING_DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type BookingDayKey = (typeof BOOKING_DAY_KEYS)[number];

export type BookingDayAvailability = {
  enabled: boolean;
  start: string;
  end: string;
};

export type BookingWeeklyAvailability = Record<
  BookingDayKey,
  BookingDayAvailability
>;

export type BookingProductSettings = {
  productId: number;
  userId: number;
  timezone: string;
  durationMinutes: number;
  intervalMinutes: number;
  bufferMinutes: number;
  minNoticeMinutes: number;
  maxDaysAhead: number;
  weeklyAvailability: BookingWeeklyAvailability;
  locationType: 'google_meet';
  createdAt: Date;
  updatedAt: Date;
};

export type BookingSlot = {
  startTime: string;
  endTime: string;
  label: string;
};

export type BookingAvailabilityDay = {
  date: string;
  label: string;
  slots: BookingSlot[];
};

export type BookingAppointment = {
  id: number;
  productId: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerNotes: string | null;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  googleEventId: string | null;
  googleMeetUrl: string | null;
  status: 'pending' | 'confirmed';
  createdAt: Date;
  updatedAt: Date;
};

const DEFAULT_WEEKLY_AVAILABILITY: BookingWeeklyAvailability = {
  sunday: { enabled: false, start: '09:00', end: '17:00' },
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '09:00', end: '17:00' },
};

export function getDefaultBookingSettings(
  productId = 0,
  userId = 0
): BookingProductSettings {
  return {
    productId,
    userId,
    timezone: 'UTC',
    durationMinutes: 30,
    intervalMinutes: 30,
    bufferMinutes: 0,
    minNoticeMinutes: 120,
    maxDaysAhead: 30,
    weeklyAvailability: DEFAULT_WEEKLY_AVAILABILITY,
    locationType: 'google_meet',
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

function normalizeDate(value: string | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function normalizeBookingWeeklyAvailability(
  input: unknown
): BookingWeeklyAvailability {
  const defaults = DEFAULT_WEEKLY_AVAILABILITY;
  if (!input || typeof input !== 'object') {
    return defaults;
  }

  const source = input as Record<string, unknown>;
  const result = {} as BookingWeeklyAvailability;

  for (const day of BOOKING_DAY_KEYS) {
    const rawDay = source[day];
    const fallback = defaults[day];

    if (!rawDay || typeof rawDay !== 'object') {
      result[day] = fallback;
      continue;
    }

    const entry = rawDay as Record<string, unknown>;
    result[day] = {
      enabled:
        typeof entry.enabled === 'boolean' ? entry.enabled : fallback.enabled,
      start:
        typeof entry.start === 'string' && /^\d{2}:\d{2}$/.test(entry.start)
          ? entry.start
          : fallback.start,
      end:
        typeof entry.end === 'string' && /^\d{2}:\d{2}$/.test(entry.end)
          ? entry.end
          : fallback.end,
    };
  }

  return result;
}

function addDays(date: string, days: number) {
  const target = new Date(`${date}T00:00:00.000Z`);
  target.setUTCDate(target.getUTCDate() + days);
  return target.toISOString().slice(0, 10);
}

function getUtcDateForLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const read = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value || '0');

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

function getTimeZoneEquivalentUtcMs(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
}

function zonedDateTimeToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const targetUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = new Date(targetUtcMs);

  for (let index = 0; index < 3; index += 1) {
    const offset = targetUtcMs - getTimeZoneEquivalentUtcMs(guess, timeZone);
    guess = new Date(guess.getTime() + offset);
  }

  return guess;
}

function getDateInTimeZone(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

function formatSlotLabel(startTime: Date, timeZone: string, durationMinutes: number) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);
  return `${formatter.format(startTime)} - ${formatter.format(endTime)}`;
}

function formatDayLabel(date: string, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return formatter.format(getUtcDateForLocalDate(date));
}

function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && endA > startB;
}

async function fetchBusyRanges(
  userId: number,
  timeMin: string,
  timeMax: string,
  timeZone: string
) {
  const accessToken = await getValidGoogleCalendarAccessToken(userId);
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/freeBusy',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone,
        items: [{ id: 'primary' }],
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Calendar availability check failed: ${detail}`);
  }

  const data = (await response.json()) as {
    calendars?: {
      primary?: {
        busy?: Array<{ start: string; end: string }>;
      };
    };
  };

  return (data.calendars?.primary?.busy || []).map((item) => ({
    start: new Date(item.start),
    end: new Date(item.end),
  }));
}

async function fetchInternalAppointmentRanges(
  productId: number,
  timeMin: string,
  timeMax: string
) {
  await ensureBookingAppointmentsTable();

  const rows = await withDatabaseFallback((database) =>
    database.execute<{
      starts_at: string | Date;
      ends_at: string | Date;
    }>(sql`
      SELECT starts_at, ends_at
      FROM ${sql.raw(BOOKING_APPOINTMENTS_TABLE)}
      WHERE product_id = ${productId}
        AND status IN ('pending', 'confirmed')
        AND starts_at < ${timeMax}
        AND ends_at > ${timeMin}
    `)
  );

  return rows.map((row) => ({
    start: normalizeDate(row.starts_at)!,
    end: normalizeDate(row.ends_at)!,
  }));
}

export async function ensureBookingSettingsTable() {
  await withDatabaseFallback((database) =>
    database.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS ${BOOKING_PRODUCT_SETTINGS_TABLE} (
        id serial PRIMARY KEY,
        product_id integer NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
        user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        timezone varchar(100) NOT NULL DEFAULT 'UTC',
        duration_minutes integer NOT NULL DEFAULT 30,
        interval_minutes integer NOT NULL DEFAULT 30,
        buffer_minutes integer NOT NULL DEFAULT 0,
        min_notice_minutes integer NOT NULL DEFAULT 120,
        max_days_ahead integer NOT NULL DEFAULT 30,
        weekly_availability jsonb NOT NULL,
        location_type varchar(30) NOT NULL DEFAULT 'google_meet',
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `))
  );
}

export async function ensureBookingAppointmentsTable() {
  await withDatabaseFallback((database) =>
    database.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS ${BOOKING_APPOINTMENTS_TABLE} (
        id serial PRIMARY KEY,
        product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        customer_name varchar(200) NOT NULL,
        customer_email varchar(255) NOT NULL,
        customer_notes text,
        starts_at timestamp NOT NULL,
        ends_at timestamp NOT NULL,
        timezone varchar(100) NOT NULL,
        google_event_id varchar(255),
        google_meet_url text,
        status varchar(20) NOT NULL DEFAULT 'pending',
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        UNIQUE (product_id, starts_at)
      )
    `))
  );
}

export async function getBookingSettings(productId: number) {
  await ensureBookingSettingsTable();

  const rows = await withDatabaseFallback((database) =>
    database.execute<{
      product_id: number;
      user_id: number;
      timezone: string;
      duration_minutes: number;
      interval_minutes: number;
      buffer_minutes: number;
      min_notice_minutes: number;
      max_days_ahead: number;
      weekly_availability: unknown;
      location_type: 'google_meet';
      created_at: string | Date;
      updated_at: string | Date;
    }>(sql`
      SELECT
        product_id,
        user_id,
        timezone,
        duration_minutes,
        interval_minutes,
        buffer_minutes,
        min_notice_minutes,
        max_days_ahead,
        weekly_availability,
        location_type,
        created_at,
        updated_at
      FROM ${sql.raw(BOOKING_PRODUCT_SETTINGS_TABLE)}
      WHERE product_id = ${productId}
      LIMIT 1
    `)
  );

  const row = rows[0];
  if (!row) return null;

  return {
    productId: row.product_id,
    userId: row.user_id,
    timezone: row.timezone,
    durationMinutes: row.duration_minutes,
    intervalMinutes: row.interval_minutes,
    bufferMinutes: row.buffer_minutes,
    minNoticeMinutes: row.min_notice_minutes,
    maxDaysAhead: row.max_days_ahead,
    weeklyAvailability: normalizeBookingWeeklyAvailability(row.weekly_availability),
    locationType: row.location_type || 'google_meet',
    createdAt: normalizeDate(row.created_at)!,
    updatedAt: normalizeDate(row.updated_at)!,
  } satisfies BookingProductSettings;
}

export async function upsertBookingSettings(input: {
  productId: number;
  userId: number;
  timezone: string;
  durationMinutes: number;
  intervalMinutes: number;
  bufferMinutes: number;
  minNoticeMinutes: number;
  maxDaysAhead: number;
  weeklyAvailability: BookingWeeklyAvailability;
}) {
  await ensureBookingSettingsTable();

  await withDatabaseFallback((database) =>
    database.execute(sql`
      INSERT INTO ${sql.raw(BOOKING_PRODUCT_SETTINGS_TABLE)} (
        product_id,
        user_id,
        timezone,
        duration_minutes,
        interval_minutes,
        buffer_minutes,
        min_notice_minutes,
        max_days_ahead,
        weekly_availability,
        location_type,
        updated_at
      )
      VALUES (
        ${input.productId},
        ${input.userId},
        ${input.timezone},
        ${input.durationMinutes},
        ${input.intervalMinutes},
        ${input.bufferMinutes},
        ${input.minNoticeMinutes},
        ${input.maxDaysAhead},
        ${JSON.stringify(input.weeklyAvailability)},
        'google_meet',
        now()
      )
      ON CONFLICT (product_id) DO UPDATE SET
        timezone = EXCLUDED.timezone,
        duration_minutes = EXCLUDED.duration_minutes,
        interval_minutes = EXCLUDED.interval_minutes,
        buffer_minutes = EXCLUDED.buffer_minutes,
        min_notice_minutes = EXCLUDED.min_notice_minutes,
        max_days_ahead = EXCLUDED.max_days_ahead,
        weekly_availability = EXCLUDED.weekly_availability,
        location_type = EXCLUDED.location_type,
        updated_at = now()
    `)
  );
}

export async function deleteBookingSettings(productId: number) {
  await ensureBookingSettingsTable();

  await withDatabaseFallback((database) =>
    database.execute(sql`
      DELETE FROM ${sql.raw(BOOKING_PRODUCT_SETTINGS_TABLE)}
      WHERE product_id = ${productId}
    `)
  );
}

export async function listBookingAvailability(params: {
  product: Product;
  settings: BookingProductSettings;
  startDate: string;
  days: number;
}) {
  const { product, settings } = params;
  const requestedDays = Math.max(1, Math.min(params.days, 14));
  const todayInTimezone = getDateInTimeZone(new Date(), settings.timezone);
  const maxAllowedDate = addDays(todayInTimezone, settings.maxDaysAhead);
  const startDate =
    params.startDate < todayInTimezone ? todayInTimezone : params.startDate;

  const rangeStart = zonedDateTimeToUtc(startDate, '00:00', settings.timezone);
  const rangeEnd = zonedDateTimeToUtc(
    addDays(startDate, requestedDays),
    '00:00',
    settings.timezone
  );

  const [busyRanges, internalRanges] = await Promise.all([
    fetchBusyRanges(
      product.userId,
      rangeStart.toISOString(),
      rangeEnd.toISOString(),
      settings.timezone
    ),
    fetchInternalAppointmentRanges(
      product.id,
      rangeStart.toISOString(),
      rangeEnd.toISOString()
    ),
  ]);

  const blockedRanges = [...busyRanges, ...internalRanges];
  const availability: BookingAvailabilityDay[] = [];
  const earliestAllowedStart = new Date(
    Date.now() + settings.minNoticeMinutes * 60_000
  );

  for (let index = 0; index < requestedDays; index += 1) {
    const date = addDays(startDate, index);
    if (date > maxAllowedDate) break;

    const weekday = BOOKING_DAY_KEYS[getUtcDateForLocalDate(date).getUTCDay()];
    const daySettings = settings.weeklyAvailability[weekday];

    if (!daySettings?.enabled) {
      availability.push({
        date,
        label: formatDayLabel(date, settings.timezone),
        slots: [],
      });
      continue;
    }

    const dayStart = zonedDateTimeToUtc(
      date,
      daySettings.start,
      settings.timezone
    );
    const dayEnd = zonedDateTimeToUtc(date, daySettings.end, settings.timezone);
    const slots: BookingSlot[] = [];

    for (
      let cursor = dayStart.getTime();
      cursor + settings.durationMinutes * 60_000 <= dayEnd.getTime();
      cursor += settings.intervalMinutes * 60_000
    ) {
      const startTime = new Date(cursor);
      const endTime = new Date(
        cursor + settings.durationMinutes * 60_000
      );
      const blockedUntil = new Date(
        endTime.getTime() + settings.bufferMinutes * 60_000
      );

      if (startTime < earliestAllowedStart) {
        continue;
      }

      const isBlocked = blockedRanges.some((range) =>
        overlaps(startTime, blockedUntil, range.start, range.end)
      );

      if (isBlocked) {
        continue;
      }

      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        label: formatSlotLabel(
          startTime,
          settings.timezone,
          settings.durationMinutes
        ),
      });
    }

    availability.push({
      date,
      label: formatDayLabel(date, settings.timezone),
      slots,
    });
  }

  return availability;
}

async function reservePendingAppointment(input: {
  productId: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerNotes?: string | null;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
}) {
  await ensureBookingAppointmentsTable();

  const rows = await withDatabaseFallback((database) =>
    database.execute<{ id: number }>(sql`
      INSERT INTO ${sql.raw(BOOKING_APPOINTMENTS_TABLE)} (
        product_id,
        user_id,
        customer_name,
        customer_email,
        customer_notes,
        starts_at,
        ends_at,
        timezone,
        status
      )
      VALUES (
        ${input.productId},
        ${input.userId},
        ${input.customerName},
        ${input.customerEmail},
        ${input.customerNotes ?? null},
        ${input.startsAt.toISOString()},
        ${input.endsAt.toISOString()},
        ${input.timezone},
        'pending'
      )
      ON CONFLICT (product_id, starts_at) DO NOTHING
      RETURNING id
    `)
  );

  return rows[0]?.id || null;
}

async function confirmAppointment(
  appointmentId: number,
  googleEventId: string,
  googleMeetUrl: string | null
) {
  await withDatabaseFallback((database) =>
    database.execute(sql`
      UPDATE ${sql.raw(BOOKING_APPOINTMENTS_TABLE)}
      SET
        google_event_id = ${googleEventId},
        google_meet_url = ${googleMeetUrl},
        status = 'confirmed',
        updated_at = now()
      WHERE id = ${appointmentId}
    `)
  );
}

async function deleteAppointment(appointmentId: number) {
  await withDatabaseFallback((database) =>
    database.execute(sql`
      DELETE FROM ${sql.raw(BOOKING_APPOINTMENTS_TABLE)}
      WHERE id = ${appointmentId}
    `)
  );
}

async function createGoogleCalendarEvent(input: {
  userId: number;
  product: Product;
  settings: BookingProductSettings;
  customerName: string;
  customerEmail: string;
  customerNotes?: string | null;
  startTime: Date;
  endTime: Date;
  storePath: string;
}) {
  const accessToken = await getValidGoogleCalendarAccessToken(input.userId);
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        summary: `${input.product.title} · ${input.customerName}`,
        description: [
          `Booked via store: ${input.storePath}`,
          `Customer: ${input.customerName} <${input.customerEmail}>`,
          input.customerNotes ? `Notes: ${input.customerNotes}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
        start: {
          dateTime: input.startTime.toISOString(),
          timeZone: input.settings.timezone,
        },
        end: {
          dateTime: input.endTime.toISOString(),
          timeZone: input.settings.timezone,
        },
        attendees: [
          {
            email: input.customerEmail,
            displayName: input.customerName,
          },
        ],
        reminders: {
          useDefault: true,
        },
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Calendar event creation failed: ${detail}`);
  }

  const event = (await response.json()) as {
    id?: string;
    htmlLink?: string;
    hangoutLink?: string;
    conferenceData?: {
      entryPoints?: Array<{ uri?: string }>;
    };
  };

  return {
    eventId: event.id || '',
    eventUrl: event.htmlLink || null,
    meetUrl:
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find((entry) => entry.uri)?.uri ||
      null,
  };
}

export async function createBookingAppointment(input: {
  product: Product;
  settings: BookingProductSettings;
  customerName: string;
  customerEmail: string;
  customerNotes?: string | null;
  startTimeIso: string;
  username: string;
}) {
  const requestedStart = new Date(input.startTimeIso);
  if (Number.isNaN(requestedStart.getTime())) {
    throw new Error('Invalid booking start time.');
  }

  const slotDate = getDateInTimeZone(requestedStart, input.settings.timezone);
  const availability = await listBookingAvailability({
    product: input.product,
    settings: input.settings,
    startDate: slotDate,
    days: 1,
  });
  const selectedSlot = availability[0]?.slots.find(
    (slot) => slot.startTime === requestedStart.toISOString()
  );

  if (!selectedSlot) {
    throw new Error('This booking slot is no longer available.');
  }

  const appointmentId = await reservePendingAppointment({
    productId: input.product.id,
    userId: input.product.userId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerNotes: input.customerNotes,
    startsAt: new Date(selectedSlot.startTime),
    endsAt: new Date(selectedSlot.endTime),
    timezone: input.settings.timezone,
  });

  if (!appointmentId) {
    throw new Error('This booking slot was just taken. Choose another slot.');
  }

  try {
    const event = await createGoogleCalendarEvent({
      userId: input.product.userId,
      product: input.product,
      settings: input.settings,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerNotes: input.customerNotes,
      startTime: new Date(selectedSlot.startTime),
      endTime: new Date(selectedSlot.endTime),
      storePath: `/${input.username}/${input.product.slug}`,
    });

    await confirmAppointment(appointmentId, event.eventId, event.meetUrl);

    return {
      appointmentId,
      eventUrl: event.eventUrl,
      meetUrl: event.meetUrl,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      label: selectedSlot.label,
    };
  } catch (error) {
    await deleteAppointment(appointmentId);
    throw error;
  }
}
