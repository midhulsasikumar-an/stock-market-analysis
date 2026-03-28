import React from 'react';
import { AdminPageHeader, AdminPanel } from '../components/admin/AdminUI';

export default function AdminAnnouncements() {
    return (
        <div>
            <AdminPageHeader
                eyebrow="System broadcasts"
                title="Announcements"
                description="Announcement management arrives in Phase 3. This placeholder route is now wired in the admin sidebar."
            />

            <AdminPanel title="Coming soon" subtitle="Phase 3 deliverable">
                <p className="admin-muted mb-0">
                    This placeholder keeps navigation stable until the full announcements workflow is implemented.
                </p>
            </AdminPanel>
        </div>
    );
}
