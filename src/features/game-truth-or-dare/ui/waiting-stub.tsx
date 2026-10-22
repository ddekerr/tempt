/** Екран партнера, чия зараз не черга: лише ім'я того, хто ходить. Тексту запису тут немає й бути не може. */
export function WaitingStub({ name }: { name: string }) {
  return (
    <div className="grid min-h-72 content-center justify-items-center gap-5 text-center">
      <p className="font-display text-4xl leading-tight font-extrabold italic">Дивись на {name}</p>
      <div className="h-[3px] w-16 bg-crimson motion-safe:animate-pulse" aria-hidden="true" />
    </div>
  );
}
