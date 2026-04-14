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
                roles: [ 'staff' ,'admin']
            },

             {
                label: 'User Management',
                path: '/admin/user-management',
                icon: Activity,
                roles: [ 'admin']
            },

            {
                label: 'Staff Performance',
                path: '/admin/staff-performance',
                icon: Activity,
                roles: [ 'admin'] // Only Admins can see staff performance
            },

             {
                label: 'View Sessions',
                path: '/admin/sessions',
                icon: History,
                roles: [ 'admin'] // Only Admins can see staff performance
            },

            {
                label: 'Audit Logs',
                path: '/admin/audit-logs',
                icon: UserSearch,
                roles: [ 'admin'] // Only Admins can see audit logs
            },

             {
                label: 'Manage Purposes',
                path: '/staff/manage-purposes',
                icon: Settings,
                roles: ['staff' ,'admin'] // Only Admins can see audit logs
            }

        ]
    },
];