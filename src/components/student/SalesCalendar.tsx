"use client";

import { useState, useEffect } from "react";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: 'purchase' | 'sale' | 'request';
    amount?: number;
    profit?: number;
}

export default function SalesCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    type ValuePiece = Date | null;
    type Value = ValuePiece | [ValuePiece, ValuePiece];

    const [date, setDate] = useState<Value>(new Date());

    // Helper to get safe single date
    const activeDate = (Array.isArray(date) ? date[0] : date) || new Date();

    const fetchEvents = async (currDate: Date) => {
        const year = currDate.getFullYear();
        const month = currDate.getMonth() + 1;
        try {
            const res = await fetch(`/api/student/calendar?year=${year}&month=${month}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events.map((e: any) => ({
                    ...e,
                    date: new Date(e.date).toDateString() // Normalize for comparison
                })));
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchEvents(activeDate);
    }, [activeDate.getMonth()]); // Refetch on month change

    const tileContent = ({ date, view }: { date: Date, view: string }) => {
        if (view !== 'month') return null;

        const dateStr = date.toDateString();
        const dailyEvents = events.filter(e => e.date === dateStr);

        if (dailyEvents.length === 0) return null;

        const hasSale = dailyEvents.some(e => e.type === 'sale');
        const hasPurchase = dailyEvents.some(e => e.type === 'purchase');
        const hasRequest = dailyEvents.some(e => e.type === 'request');

        return (
            <div className="flex justify-center gap-1 mt-1">
                {hasSale && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                {hasPurchase && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                {hasRequest && <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>}
            </div>
        );
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 sales-calendar-container">
            <h3 className="font-bold text-slate-700 mb-4">活動カレンダー</h3>
            <div className="flex justify-center">
                <Calendar
                    onChange={setDate}
                    value={activeDate}
                    tileContent={tileContent}
                    nextLabel={<ChevronRight className="w-4 h-4" />}
                    prevLabel={<ChevronLeft className="w-4 h-4" />}
                    className="border-none w-full text-sm"
                />
            </div>
            <div className="flex gap-4 justify-center mt-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>売上</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span>仕入</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <span>リクエスト</span>
                </div>
            </div>
            <style jsx global>{`
                .sales-calendar-container .react-calendar {
                    border: none;
                    width: 100%;
                    background: transparent;
                }
                .sales-calendar-container .react-calendar__tile {
                    padding: 0.75em 0.5em;
                }
                .sales-calendar-container .react-calendar__tile--now {
                    background: #f1f5f9;
                    border-radius: 8px;
                }
                .sales-calendar-container .react-calendar__tile--active {
                    background: #6366f1 !important;
                    border-radius: 8px;
                    color: white !important;
                }
                .sales-calendar-container .react-calendar__navigation button {
                    min-width: 44px;
                    background: none;
                }
            `}</style>
        </div>
    );
}
