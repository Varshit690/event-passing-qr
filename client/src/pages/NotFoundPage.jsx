import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowLeft, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
          <Ticket className="w-10 h-10 text-blue-600 rotate-12" />
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold text-white uppercase">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-500">
            The page or event ticket you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return Home
            </Button>
          </Link>
          <Link to="/events">
            <Button variant="outline" size="md" leftIcon={<Compass className="w-4 h-4" />}>
              Browse Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
