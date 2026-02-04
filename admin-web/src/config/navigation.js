// src/config/navigation.js
import { 
    LayoutDashboard, 
    History, 
    Settings, 
    UserSearch, 
    Megaphone, 
    Activity 
} from 'lucide-react';

export const STAFF_NAVIGATION = [
    {
        group: "DAILY OPERATIONS",
        items: [
            {
                label: 'Live Queue',
                path: '/staff/dashboard',
                icon: LayoutDashboard,
                roles: ['admin', 'staff'],
                badge: 'live' // We can use this later for real-time counts
            },
            {
                label: 'Student Lookup',
                path: '/staff/lookup',
                icon: UserSearch,
                roles: ['admin', 'staff']
            },
        ]
    },
    {
        group: "MANAGEMENT",
        items: [
            {
                label: 'Queue History',
                path: '/staff/history',
                icon: History,
                roles: ['admin', 'staff']
            },
            {
                label: 'Broadcast',
                path: '/staff/broadcast',
                icon: Megaphone,
                roles: ['admin', 'staff']
            },
        ]
    },
    {
        group: "SYSTEM",
        items: [
            {
                label: 'Office Settings',
                path: '/staff/settings',
                icon: Settings,
                roles: ['staff'], // Only Admins can change office hours/capacity
            },
            {
                label: 'System Status',
                path: '/staff/status',
                icon: Activity,
                roles: ['staff']
            },
        ]
    }
];