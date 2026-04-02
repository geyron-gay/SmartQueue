// /types/ticket.ts
export interface TicketData {
    ticket: {
        id: number;
        queue_number: number;
        status: string;
        student_name: string;
        department: string;
        priority_level: number | string;
    };
    started_at: string | null;
    neighborhood: Array<{
        id: number;
        queue_number: number;
        status: string;
        student_name: string;
        is_me: boolean;
        priority: string;
        purpose: string;
    }>;
    people_ahead: number;
    now_serving: number | string;
    estimated_wait_time: number;
}