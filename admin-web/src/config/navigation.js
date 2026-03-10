// src/config/navigation.js
import { 
    LayoutDashboard, 
    History, 
    Settings, 
    UserSearch, 
    Megaphone, 
    Activity 
} from 'lucide-react';

export const MASTER_NAVIGATIONS = [
    {
        group: "DAILY OPERATIONS",
        items: [
            {
                label: 'Live Queue',
                path: '/staff/dashboard',
                icon: LayoutDashboard,
                roles: [ 'staff'],
                badge: 'live' // We can use this later for real-time counts
            },
            {
                label : "Admin Dashboard",
                path: '/admin/dashboard',
                icon: LayoutDashboard,
                roles: [ 'admin'],
                badge: 'live'
            },
            {
                label: 'Student Lookup',
                path: '/staff/lookup',
                icon: UserSearch,
                roles: [ 'staff','admin']
            },
            
            {
                label: 'Queue Analytics',
                path: '/admin/analytics',
                icon: LayoutDashboard,
                roles: [ 'admin'] // Only Admins can see analytics
            }
        ]
    },
    {
        group: "MANAGEMENT",
        items: [
            {
                label: 'Queue History',
                path: '/staff/history',
                icon: History,
                roles: ['staff']
            },
            {
                label: 'Broadcast',
                path: '/staff/broadcast',
                icon: Megaphone,
                roles: [ 'staff']
            },

            {
                label: 'Staff Performance',
                path: '/admin/analytics/staff-performance',
                icon: Activity,
                roles: [ 'admin'] // Only Admins can see staff performance
            },

             {
                label: 'View Sessions',
                path: '/admin/sessions',
                icon: Activity,
                roles: [ 'admin'] // Only Admins can see staff performance
            },

            {
                label: 'Audit Logs',
                path: '/admin/audit-logs',
                icon: Activity,
                roles: [ 'admin'] // Only Admins can see audit logs
            }

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