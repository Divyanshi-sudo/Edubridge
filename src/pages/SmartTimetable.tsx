
import { useEffect, useState } from 'react';
import TimetableUpload from '../components/TimetableUpload';
import { extractPDFData } from '../lib/pdfExtractor';
import { parseTimetableItems, type FreeSlot } from '../lib/timetableParser';
import { supabase } from '../lib/supabase';

type SmartTimetableProps = {
  userId: string;
};

type Faculty = {
  id: string;
  full_name: string;
  email: string;
  department: string;
};

type AvailabilityRecord = {
  day: string;
  start_time: string;
  end_time: string;
};

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function toMinutes(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);

  if (!match) return 0;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return hour * 60 + minute;
}

function databaseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

function convertToDatabaseTime(time: string): string {
  const minutes = toMinutes(time);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:00`;
}

function calculateIntersection(
  studentSlots: FreeSlot[],
  facultySlots: AvailabilityRecord[]
): FreeSlot[] {
  const result: FreeSlot[] = [];

  for (const day of DAYS) {
    const studentDay = studentSlots.filter(slot => slot.day === day);
    const facultyDay = facultySlots.filter(slot => slot.day === day);

    const overlaps: { start: number; end: number }[] = [];

    for (const studentSlot of studentDay) {
      const studentStart = toMinutes(studentSlot.start);
      const studentEnd = toMinutes(studentSlot.end);

      for (const facultySlot of facultyDay) {
        const facultyStart = databaseTimeToMinutes(facultySlot.start_time);
        const facultyEnd = databaseTimeToMinutes(facultySlot.end_time);

        const start = Math.max(studentStart, facultyStart);
        const end = Math.min(studentEnd, facultyEnd);

        if (start < end) {
          overlaps.push({ start, end });
        }
      }
    }

    overlaps.sort((a, b) => a.start - b.start);

    const merged: { start: number; end: number }[] = [];

    for (const overlap of overlaps) {
      const last = merged[merged.length - 1];

      if (last && overlap.start <= last.end) {
        last.end = Math.max(last.end, overlap.end);
      } else {
        merged.push({ ...overlap });
      }
    }

    for (const slot of merged) {
      result.push({
        day,
        start: formatTime(slot.start),
        end: formatTime(slot.end),
      });
    }
  }

  return result;
}

export default function SmartTimetable({ userId }: SmartTimetableProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [facultySlots, setFacultySlots] = useState<AvailabilityRecord[]>([]);
  const [commonSlots, setCommonSlots] = useState<FreeSlot[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [saved, setSaved] = useState(false);

  // Load faculty members
  useEffect(() => {
    const loadFaculty = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, department')
        .eq('role', 'faculty')
        .order('full_name');

      if (error) {
        console.error('Failed to load faculty:', error);
        setError(error.message);
      } else {
        setFaculty(data || []);
      }

      setIsLoadingFaculty(false);
    };

    loadFaculty();
  }, []);

  // Load selected faculty availability
  const handleFacultyChange = async (facultyId: string) => {
    setSelectedFaculty(facultyId);
    setFacultySlots([]);
    setCommonSlots([]);
    setError('');

    if (!facultyId) return;

    setIsLoadingAvailability(true);

    try {
      const { data, error } = await supabase
        .from('student_availability')
        .select('day, start_time, end_time')
        .eq('user_id', facultyId);

      if (error) throw error;

      const availability = data || [];

      setFacultySlots(availability);

      if (freeSlots.length > 0) {
        setCommonSlots(
          calculateIntersection(freeSlots, availability)
        );
      }
    } catch (err) {
      console.error('Failed to load faculty availability:', err);

      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Upload and save student availability
  const handleUpload = async (file: File) => {
    setUploadedFile(file);
    setFreeSlots([]);
    setCommonSlots([]);
    setExtractedText('');
    setError('');
    setSaved(false);
    setIsAnalyzing(true);

    try {
      const pdfData = await extractPDFData(file);

      setExtractedText(pdfData.text);

      const parsed = parseTimetableItems(pdfData.items);
      const detectedSlots = parsed.freeSlots;

      setFreeSlots(detectedSlots);

      if (detectedSlots.length === 0) {
        return;
      }

      const { error: deleteError } = await supabase
        .from('student_availability')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const records = detectedSlots.map(slot => ({
        user_id: userId,
        day: slot.day,
        start_time: convertToDatabaseTime(slot.start),
        end_time: convertToDatabaseTime(slot.end),
      }));

      const { error: insertError } = await supabase
        .from('student_availability')
        .insert(records);

      if (insertError) throw insertError;

      setSaved(true);

      // If a faculty member is already selected, recalculate
      if (selectedFaculty && facultySlots.length > 0) {
        setCommonSlots(
          calculateIntersection(detectedSlots, facultySlots)
        );
      }
    } catch (err) {
      console.error('Timetable analysis failed:', err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Timetable analysis failed.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm tracking-[0.25em] text-slate-500">
          ACADEMIC WORKSPACE
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Smart Timetable
        </h1>

        <p className="mt-2 text-slate-500">
          Discover your free periods and find common availability with your guide.
        </p>
      </div>

      {/* Upload */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Upload Your Timetable
        </h2>

        <p className="mt-2 text-slate-500">
          Upload your PDF timetable to identify your free periods.
        </p>

        <div className="mt-6">
          <TimetableUpload
            userId={userId}
            onUploaded={handleUpload}
          />
        </div>
      </div>

      {/* Loading */}
      {isAnalyzing && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="font-medium text-blue-800">
            Analyzing your timetable...
          </p>
          <p className="mt-1 text-sm text-blue-600">
            Detecting and saving your free periods.
          </p>
        </div>
      )}

      {/* Saved */}
      {saved && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-800">
            Availability saved successfully!
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Your availability is ready to compare with your guide.
          </p>
        </div>
      )}

      {/* Your free periods */}
      {freeSlots.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Your Free Periods
          </h2>

          <div className="mt-6 space-y-4">
            {DAYS.map(day => {
              const slots = freeSlots.filter(slot => slot.day === day);

              if (!slots.length) return null;

              return (
                <div key={day} className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="font-semibold text-slate-800">{day}</h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {slots.map((slot, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                      >
                        {slot.start} – {slot.end}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Select guide */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Find Common Availability
        </h2>

        <p className="mt-2 text-slate-500">
          Select your guide to find the time when both of you are free.
        </p>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Select Guide
          </label>

          <select
            value={selectedFaculty}
            onChange={e => handleFacultyChange(e.target.value)}
            disabled={isLoadingFaculty}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="">
              {isLoadingFaculty ? 'Loading guides...' : 'Choose a guide'}
            </option>

            {faculty.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.full_name} — {teacher.department}
              </option>
            ))}
          </select>
        </div>

        {/* Faculty selected */}
        {selectedFaculty && (
          <div className="mt-5">
            {isLoadingAvailability && (
              <p className="text-sm text-blue-600">
                Checking guide availability...
              </p>
            )}

            {!isLoadingAvailability && facultySlots.length === 0 && (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                This guide hasn't uploaded their timetable yet.
              </div>
            )}

            {!isLoadingAvailability &&
              facultySlots.length > 0 &&
              freeSlots.length === 0 && (
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  Upload your timetable first to calculate common availability.
                </div>
              )}

            {!isLoadingAvailability &&
              facultySlots.length > 0 &&
              freeSlots.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Common Available Times
                  </h3>

                  {commonSlots.length === 0 ? (
                    <div className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                      No overlapping free periods were found.
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-sm text-slate-500">
                        {commonSlots.length} matching time slots found
                      </p>

                      <div className="mt-4 space-y-4">
                        {DAYS.map(day => {
                          const slots = commonSlots.filter(
                            slot => slot.day === day
                          );

                          if (!slots.length) return null;

                          return (
                            <div
                              key={day}
                              className="rounded-2xl border border-slate-100 p-4"
                            >
                              <h4 className="font-semibold text-slate-800">
                                {day}
                              </h4>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {slots.map((slot, index) => (
                                  <div
                                    key={index}
                                    className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700"
                                  >
                                    {slot.start} – {slot.end}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">Error</p>
          <p className="mt-2">{error}</p>
        </div>
      )}

      {/* Extracted PDF text */}
      {extractedText && (
        <details className="rounded-2xl border border-slate-200 bg-white p-5">
          <summary className="cursor-pointer font-medium text-slate-700">
            View extracted PDF text
          </summary>

          <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-600">
            {extractedText}
          </pre>
        </details>
      )}
    </div>
  );
}
