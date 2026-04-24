'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Loader2, CalendarDays, RefreshCw, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AvailabilityDay = {
  date: string;
  label: string;
  slots: Array<{
    startTime: string;
    endTime: string;
    label: string;
  }>;
};

type AvailabilityResponse = {
  connected: boolean;
  message?: string;
  timezone?: string;
  availability?: AvailabilityDay[];
};

export function BookingWidget({
  username,
  slug,
  buttonBg,
  buttonText,
  cardBg,
  cardBorder,
  headingColor,
  textColor,
  mutedColor,
  borderRadius,
}: {
  username: string;
  slug: string;
  buttonBg: string;
  buttonText: string;
  cardBg: string;
  cardBorder: string;
  headingColor: string;
  textColor: string;
  mutedColor: string;
  borderRadius: string;
}) {
  const [availabilityData, setAvailabilityData] =
    useState<AvailabilityResponse | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(
    null
  );
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    label: string;
    meetUrl: string | null;
    eventUrl: string | null;
  } | null>(null);

  const loadAvailability = async () => {
    setIsLoading(true);
    setAvailabilityError(null);

    try {
      const response = await fetch(`/api/booking/${username}/${slug}`, {
        cache: 'no-store',
      });
      const data = (await response.json()) as AvailabilityResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to load slots');
      }

      setAvailabilityData(data);
    } catch (error) {
      setAvailabilityError(
        error instanceof Error ? error.message : 'Failed to load slots'
      );
      setAvailabilityData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, [username, slug]);

  useEffect(() => {
    const firstAvailableDay =
      availabilityData?.availability?.find((day) => day.slots.length > 0) ||
      availabilityData?.availability?.[0];
    setSelectedDate(firstAvailableDay?.date || null);
  }, [availabilityData]);

  const selectedDay = useMemo(
    () =>
      availabilityData?.availability?.find((day) => day.date === selectedDate) ||
      null,
    [availabilityData, selectedDate]
  );

  useEffect(() => {
    if (!selectedDay) {
      setSelectedStartTime(null);
      return;
    }

    if (
      selectedStartTime &&
      selectedDay.slots.some((slot) => slot.startTime === selectedStartTime)
    ) {
      return;
    }

    setSelectedStartTime(selectedDay.slots[0]?.startTime || null);
  }, [selectedDay, selectedStartTime]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStartTime) return;

    setIsSubmitting(true);
    setAvailabilityError(null);

    try {
      const response = await fetch(`/api/booking/${username}/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerNotes,
          startTime: selectedStartTime,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        booking?: {
          label: string;
          meetUrl: string | null;
          eventUrl: string | null;
        };
      };

      if (!response.ok || !data.booking) {
        throw new Error(data.error || 'Booking failed');
      }

      setBookingResult(data.booking);
      await loadAvailability();
    } catch (error) {
      setAvailabilityError(
        error instanceof Error ? error.message : 'Booking failed'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-3xl border p-5 sm:p-6"
      style={{
        background: cardBg,
        borderColor: cardBorder,
        borderRadius,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="flex items-center gap-2 text-lg font-semibold"
            style={{ color: headingColor }}
          >
            <CalendarDays className="h-5 w-5" />
            Book a session
          </h2>
          <p className="mt-1 text-sm" style={{ color: mutedColor }}>
            Google Calendar’dagi busy vaqtlar avtomatik bloklanadi va booking qilinganda Meet link yaratiladi.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadAvailability}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {bookingResult && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Booking confirmed: {bookingResult.label}
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Calendar invite email yuboriladi. Meet link tayyor bo‘lsa pastda ko‘rinadi.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {bookingResult.meetUrl && (
              <a
                href={bookingResult.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white no-underline"
              >
                <Video className="h-4 w-4" />
                Open Meet
              </a>
            )}
            {bookingResult.eventUrl && (
              <a
                href={bookingResult.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 no-underline"
              >
                View Calendar Event
              </a>
            )}
          </div>
        </div>
      )}

      {availabilityError && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {availabilityError}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 flex items-center gap-2 text-sm" style={{ color: mutedColor }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading available slots...
        </div>
      ) : !availabilityData?.availability?.length ? (
        <div className="mt-6 rounded-2xl border border-dashed p-4 text-sm" style={{ borderColor: cardBorder, color: mutedColor }}>
          Hozircha ochiq slot topilmadi.
        </div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <Label className="mb-2 block">Choose a day</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {availabilityData.availability.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                    selectedDate === day.date ? 'shadow-sm' : ''
                  }`}
                  style={{
                    borderColor:
                      selectedDate === day.date ? buttonBg : cardBorder,
                    background:
                      selectedDate === day.date ? `${buttonBg}12` : '#ffffff',
                  }}
                >
                  <div
                    className="text-sm font-semibold"
                    style={{ color: headingColor }}
                  >
                    {day.label}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: mutedColor }}>
                    {day.slots.length} slots
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Choose a time</Label>
            {selectedDay?.slots.length ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {selectedDay.slots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => setSelectedStartTime(slot.startTime)}
                    className="rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors"
                    style={{
                      borderColor:
                        selectedStartTime === slot.startTime
                          ? buttonBg
                          : cardBorder,
                      background:
                        selectedStartTime === slot.startTime
                          ? `${buttonBg}12`
                          : '#ffffff',
                      color: textColor,
                    }}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-4 text-sm" style={{ borderColor: cardBorder, color: mutedColor }}>
                Bu kun uchun bo‘sh slot yo‘q.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="customerName" className="mb-2 block">
                Your name
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="customerEmail" className="mb-2 block">
                Email
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="customerNotes" className="mb-2 block">
              Notes
            </Label>
            <textarea
              id="customerNotes"
              value={customerNotes}
              onChange={(event) => setCustomerNotes(event.target.value)}
              rows={4}
              className="flex min-h-[110px] w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="What should we cover in this session?"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3.5 text-base font-semibold"
            style={{
              background: buttonBg,
              color: buttonText,
              borderRadius,
            }}
            disabled={
              isSubmitting ||
              !selectedStartTime ||
              !customerName.trim() ||
              !customerEmail.trim()
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming booking...
              </>
            ) : (
              'Confirm booking'
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
