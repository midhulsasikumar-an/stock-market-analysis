import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileSettings from '../components/settings/ProfileSettings';
import AccountSettings from '../components/settings/AccountSettings';
import PreferenceSettings from '../components/settings/PreferenceSettings';
import SecuritySettings from '../components/settings/SecuritySettings';

export default function Settings() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'profile';

    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        document.title = 'Settings — TradeTrack';
    }, []);

    useEffect(() => {
        const tab = queryParams.get('tab') || 'profile';
        setActiveTab(tab);
    }, [location.search]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        navigate(`/dashboard/settings?tab=${tabId}`);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileSettings />;
            case 'account': return <AccountSettings />;
            case 'preferences': return <PreferenceSettings />;
            case 'security': return <SecuritySettings />;
            default: return <ProfileSettings />;
        }
    };

    const navItems = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'account', label: 'Account', icon: '💳' },
        { id: 'preferences', label: 'Preferences', icon: '🛠️' },
        { id: 'security', label: 'Security', icon: '🔒' },
    ];

    return (
        <div className="settings-page-container">
            <div className="settings-header-box border-0">
                <h1 className="settings-title text-2xl">Account Settings</h1>
                <p className="settings-subtitle">Manage your account settings and set e-mail preferences.</p>
            </div>

            <div className="settings-layout">
                {/* Sidebar Navigation */}
                <aside className="settings-sidebar">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-text">{item.label}</span>
                        </button>
                    ))}
                </aside>

                {/* Dynamic Content Area */}
                <main className="settings-content-card bg-glass rounded-lg">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
