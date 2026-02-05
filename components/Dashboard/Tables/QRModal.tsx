
import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '../../UI/Button';
import { TableItem } from '../../../types';

interface QRModalProps {
  table: TableItem;
  restaurantName: string;
  qrUrl: string;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ table, restaurantName, qrUrl, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <div className="mb-6">
                <h3 className="text-lg font-extrabold text-gray-900 uppercase tracking-wide">{restaurantName}</h3>
            </div>
            
            <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 inline-block mb-4 shadow-sm">
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`} 
                    alt="QR Code" 
                    className="w-48 h-48"
                />
            </div>
            
            <div className="mb-6">
                <h2 className="text-3xl font-black text-gray-900 mb-1">{table.name}</h2>
                <p className="text-gray-500 font-medium">Scan to <span className="text-primary-600 font-bold">Order Food</span> & Pay</p>
            </div>

            <div className="flex gap-3">
                <Button variant="white" fullWidth onClick={() => window.print()}><Printer size={18} className="mr-2"/> Print</Button>
                <Button fullWidth onClick={onClose}>Close</Button>
            </div>
        </div>
    </div>
  );
};
