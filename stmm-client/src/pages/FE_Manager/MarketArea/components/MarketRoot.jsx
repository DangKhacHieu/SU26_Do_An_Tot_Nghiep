import React, { useState } from 'react';
import MarketList from './MarketList';
import MarketWizard from './MarketWizard';
import MarketMapViewer from './MarketMapViewer';

const MarketRoot = ({ user }) => {
    const [view, setView] = useState('list'); // 'list' or 'wizard' or 'viewer'
    const [selectedMarketId, setSelectedMarketId] = useState(null);

    const handleViewMarket = (marketId) => {
        setSelectedMarketId(marketId);
        setView('viewer');
    };

    if (view === 'wizard') {
        return <MarketWizard onCancel={() => setView('list')} onComplete={() => setView('list')} />;
    }

    if (view === 'viewer' && selectedMarketId) {
        return <MarketMapViewer marketId={selectedMarketId} onBack={() => setView('list')} />;
    }

    return <MarketList user={user} onCreateNew={() => setView('wizard')} onViewMarket={handleViewMarket} />;
};

export default MarketRoot;
