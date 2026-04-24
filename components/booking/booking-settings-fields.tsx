'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BookingWeeklyAvailability } from '@/lib/booking';

export type BookingSettingsFormValue = {
  timezone: string;
  durationMinutes: string;
  intervalMinutes: string;
  bufferMinutes: string;
  minNoticeMinutes: string;
  maxDaysAhead: string;
  weeklyAvailability: BookingWeeklyAvailability;
};

const WEEKDAY_LABELS: Array<{
  key: keyof BookingWeeklyAvailability;
  label: string;
}> = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

export function BookingSettingsFields({
  value,
  onChange,
  includeFormFields = true,
  compact = false,
}: {
  value: BookingSettingsFormValue;
  onChange: (next: BookingSettingsFormValue) => void;
  includeFormFields?: boolean;
  compact?: boolean;
}) {
  const setField = (field: keyof Omit<BookingSettingsFormValue, 'weeklyAvailability'>) =>
    (nextValue: string) => {
      onChange({
        ...value,
        [field]: nextValue,
      });
    };

  return (
    <div
      className={`rounded-2xl border border-orange-100 bg-orange-50/40 ${
        compact ? 'space-y-3 p-3' : 'space-y-4 p-4'
      }`}
    >
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Booking Settings
        </h3>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? 'gap-3' : 'gap-4'}`}>
        <div>
          <Label htmlFor="bookingTimezone" className="mb-2">
            Timezone
          </Label>
          <Input
            id="bookingTimezone"
            name={includeFormFields ? 'bookingTimezone' : undefined}
            value={value.timezone}
            onChange={(event) => setField('timezone')(event.target.value)}
            placeholder="Asia/Tashkent"
          />
        </div>
        <div>
          <Label htmlFor="bookingDurationMinutes" className="mb-2">
            Session duration (min)
          </Label>
          <Input
            id="bookingDurationMinutes"
            name={includeFormFields ? 'bookingDurationMinutes' : undefined}
            type="number"
            min="15"
            step="15"
            value={value.durationMinutes}
            onChange={(event) =>
              setField('durationMinutes')(event.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="bookingIntervalMinutes" className="mb-2">
            Slot interval (min)
          </Label>
          <Input
            id="bookingIntervalMinutes"
            name={includeFormFields ? 'bookingIntervalMinutes' : undefined}
            type="number"
            min="15"
            step="15"
            value={value.intervalMinutes}
            onChange={(event) =>
              setField('intervalMinutes')(event.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="bookingBufferMinutes" className="mb-2">
            Buffer after session (min)
          </Label>
          <Input
            id="bookingBufferMinutes"
            name={includeFormFields ? 'bookingBufferMinutes' : undefined}
            type="number"
            min="0"
            step="5"
            value={value.bufferMinutes}
            onChange={(event) => setField('bufferMinutes')(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="bookingMinNoticeMinutes" className="mb-2">
            Minimum notice (min)
          </Label>
          <Input
            id="bookingMinNoticeMinutes"
            name={includeFormFields ? 'bookingMinNoticeMinutes' : undefined}
            type="number"
            min="0"
            step="15"
            value={value.minNoticeMinutes}
            onChange={(event) =>
              setField('minNoticeMinutes')(event.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="bookingMaxDaysAhead" className="mb-2">
            Bookable days ahead
          </Label>
          <Input
            id="bookingMaxDaysAhead"
            name={includeFormFields ? 'bookingMaxDaysAhead' : undefined}
            type="number"
            min="1"
            step="1"
            value={value.maxDaysAhead}
            onChange={(event) => setField('maxDaysAhead')(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <Label className="mb-2">Weekly availability</Label>
          <p className="text-xs text-muted-foreground">
            Enabled kunlarda boshlanish va tugash vaqtini kiriting.
          </p>
        </div>
        <div className="space-y-2">
          {WEEKDAY_LABELS.map((day) => {
            const availability = value.weeklyAvailability[day.key];
            return (
              <div
                key={day.key}
                className={`grid items-center rounded-lg border border-white/80 bg-white/80 ${
                  compact
                    ? 'grid-cols-[60px_minmax(0,1fr)_minmax(0,1fr)] gap-2 p-2.5'
                    : 'grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] gap-3 p-3'
                }`}
              >
                <label
                  className={`flex items-center gap-2 font-medium text-gray-800 ${
                    compact ? 'text-xs' : 'text-sm'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={availability.enabled}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        weeklyAvailability: {
                          ...value.weeklyAvailability,
                          [day.key]: {
                            ...availability,
                            enabled: event.target.checked,
                          },
                        },
                      })
                    }
                  />
                  {day.label}
                </label>
                <Input
                  type="time"
                  value={availability.start}
                  disabled={!availability.enabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      weeklyAvailability: {
                        ...value.weeklyAvailability,
                        [day.key]: {
                          ...availability,
                          start: event.target.value,
                        },
                      },
                    })
                  }
                />
                <Input
                  type="time"
                  value={availability.end}
                  disabled={!availability.enabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      weeklyAvailability: {
                        ...value.weeklyAvailability,
                        [day.key]: {
                          ...availability,
                          end: event.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      {includeFormFields && (
        <input
          type="hidden"
          name="bookingAvailability"
          value={JSON.stringify(value.weeklyAvailability)}
        />
      )}
    </div>
  );
}
