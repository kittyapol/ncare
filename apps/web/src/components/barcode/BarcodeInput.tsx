import { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onScan?: (code: string) => void;
}

export default function BarcodeInput({
  value,
  onChange,
  placeholder = 'Barcode',
  onScan,
}: BarcodeInputProps) {
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (code: string) => {
    onChange(code);
    setShowScanner(false);
    if (onScan) {
      onScan(code);
    }
  };

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input flex-1"
        />
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="btn btn-secondary px-4"
          title="Scan barcode"
        >
          📷 Scan
        </button>
      </div>

      {showScanner && (
        <BarcodeScanner onDetected={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
