import React from 'react';
import AppHeader from '../components/AppHeader';
import CodingIDEComponent from '../components/CodingIDE';

const CodingIDEPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <AppHeader />
      
      <div className="pt-16 flex-grow">
        <CodingIDEComponent />
      </div>
    </div>
  );
};

export default CodingIDEPage;
