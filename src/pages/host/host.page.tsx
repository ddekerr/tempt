import { Link } from 'react-router';
import { QrConnect } from '@/widgets/qr-connect';

export function HostPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/" className="font-label text-sm tracking-[0.22em] text-brass uppercase hover:text-rose">
        ← Tempt
      </Link>
      <p className="mt-6 font-label text-sm tracking-[0.22em] text-brass uppercase">Підключення</p>
      <h1 className="font-display text-5xl font-extrabold italic sm:text-6xl">Скануйте свій код</h1>
      <p className="mt-4 max-w-xl text-bone/70">
        Кожен сканує свій QR-код телефоном. Обидва пристрої мають бути в одній Wi-Fi мережі з цим комп'ютером.
      </p>
      <div className="mt-10">
        <QrConnect />
      </div>
    </main>
  );
}
