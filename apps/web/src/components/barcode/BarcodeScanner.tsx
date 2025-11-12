import { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (scannerRef.current) {
      initScanner();
    }

    return () => {
      stopScanner();
    };
  }, []);

  const initScanner = () => {
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: scannerRef.current!,
          constraints: {
            width: 640,
            height: 480,
            facingMode: 'environment',
          },
        },
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'upc_reader',
          ],
        },
      },
      (err) => {
        if (err) {
          console.error('Error initializing scanner:', err);
          return;
        }
        Quagga.start();
        setIsScanning(true);
      }
    );

    Quagga.onDetected((data) => {
      if (data.codeResult && data.codeResult.code) {
        onDetected(data.codeResult.code);
        stopScanner();
      }
    });
  };

  const stopScanner = () => {
    Quagga.stop();
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Scan Barcode</h2>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div ref={scannerRef} className="w-full rounded-lg overflow-hidden bg-black" />

        <div className="mt-4">
          <p className="text-sm text-gray-600 text-center">
            {isScanning
              ? 'Position the barcode in front of the camera'
              : 'Initializing camera...'}
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
