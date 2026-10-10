import { useState } from 'react';
import { useAuditStore } from '../../stores/auditStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { Input } from '../../components/ui/input';

export default function GuestFeedback() {
  const { log } = useAuditStore();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (rating === 0) return;
    await log('GUEST_COMMENT', 'feedback', `feedback-${Date.now()}`, {
      new_data: { rating, comment },
    });
    setSubmitted(true);
    setRating(0);
    setComment('');
  };

  return (
    <div className="min-h-screen bg-void p-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-fog hover:text-paper-white">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-paper-white">Tamu & Ulasan</h1>
      </div>

      <Card className="max-w-lg bg-charcoal border-iron">
        <CardHeader><CardTitle className="text-base">Komentar / Questionnaire Tamu</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-fog">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`${rating >= n ? 'text-ice-signal' : 'text-iron'}`}
                  aria-label={`Rating ${n}`}
                >
                  <Star className="h-8 w-8" fill={rating >= n ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-fog">Komentar</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Terima kasih atas kunjungan Anda..."
              className="mt-1 w-full rounded border border-iron bg-graphite p-2 text-sm text-paper-white"
            />
          </div>

          <Button className="w-full" disabled={rating === 0} onClick={submit}>
            Kirim
          </Button>

          {submitted && <p className="text-sm text-green-400">Tersimpan — terima kasih!</p>}
        </CardContent>
      </Card>
    </div>
  );
}
