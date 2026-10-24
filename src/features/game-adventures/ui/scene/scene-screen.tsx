import type { AdvAction, AdvView, SceneBody, SceneView } from '@core/games/adventures/types';
import type { TaskWho } from '@core/games/adventures/script.types';
import type { Role } from '@core/roles';
import { ROLE_TEXT_CLASS } from '@/shared/config/roles';
import { HeroHud } from './hero-hud';
import { RollingDie } from './die';
import { GhostButton, Label, PrimaryButton, Waiting } from './primitives';
import { Timer } from './timer';
import { WishForm } from './wish-form';

interface SceneScreenProps {
  view: AdvView;
  scene: SceneView;
  role: Role;
  send: (action: AdvAction) => void;
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 border-t-4 border-crimson bg-wine p-5">{children}</div>
);

const Title = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-3xl leading-tight font-extrabold italic">{children}</h2>
);

const Prose = ({ children }: { children: React.ReactNode }) => (
  <p className="text-lg leading-relaxed whitespace-pre-line">{children}</p>
);

const whoLabel = (who: TaskWho, name: (role: Role) => string) => (who === 'both' ? 'Для вас обох' : `Для ${name(who)}`);

export function SceneScreen({ view, scene, role, send }: SceneScreenProps) {
  const name = (target: Role) => (target === role ? view.hero.name : view.partner.name);
  const mine = scene.actor === 'any' || scene.actor === role;
  const body: SceneBody = scene.body;
  const next = (label = 'Далі') => <PrimaryButton onClick={() => send({ type: 'advance' })}>{label}</PrimaryButton>;
  const rollButton = (label: string, target: Role) =>
    scene.actor === role ? (
      <PrimaryButton onClick={() => send({ type: 'roll' })}>{label}</PrimaryButton>
    ) : (
      <Waiting>Кидає {name(target)}…</Waiting>
    );

  let content: React.ReactNode;

  switch (body.kind) {
    case 'guide':
      content = (
        <Card>
          <Label>
            Гід · {body.index + 1} з {body.total}
          </Label>
          <Title>{body.title}</Title>
          <Prose>{body.text}</Prose>
          {next(body.index + 1 === body.total ? 'Почати' : 'Далі')}
        </Card>
      );
      break;

    case 'title':
      content = (
        <Card>
          <Title>{body.title}</Title>
          <Prose>{body.text}</Prose>
          {next()}
        </Card>
      );
      break;

    case 'say':
      content = (
        <Card>
          {body.speaker && <Label>{body.speaker}</Label>}
          <Prose>{body.text}</Prose>
          {next()}
        </Card>
      );
      break;

    case 'choice':
      content = (
        <Card>
          <Prose>{body.text}</Prose>
          {mine ? (
            <div className="grid gap-3">
              {body.options.map((option, index) => (
                <PrimaryButton key={option} onClick={() => send({ type: 'choose', index })}>
                  {option}
                </PrimaryButton>
              ))}
            </div>
          ) : (
            <>
              <ul className="grid list-disc gap-1 pl-5 text-bone/60">
                {body.options.map((option) => (
                  <li key={option}>{option}</li>
                ))}
              </ul>
              <Waiting>Вибирає {name(body.chooser)}…</Waiting>
            </>
          )}
        </Card>
      );
      break;

    case 'check':
      content = (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <Label>{body.label}</Label>
            <span className="rounded-blade border border-brass px-2.5 py-1 font-label text-xs font-semibold tracking-[0.14em] text-brass uppercase">
              Складність {body.difficulty}
            </span>
          </div>
          <Prose>{body.text}</Prose>
          <RollingDie sides={20} value={body.roll?.value ?? null} success={body.roll?.success}>
            {body.roll && (
              <>
                <p
                  className={`text-center font-label text-xl font-bold tracking-[0.16em] uppercase ${body.roll.success ? 'text-brass' : 'text-rose'}`}
                >
                  {body.roll.success ? 'Успіх' : 'Провал'}
                </p>
                {next()}
              </>
            )}
          </RollingDie>
          {!body.roll && rollButton(`${name(body.roller)}, кидай d20`, body.roller)}
        </Card>
      );
      break;

    case 'dice':
      content = (
        <Card>
          <Prose>{body.text}</Prose>
          <RollingDie sides={6} value={body.roll}>
            <p className="text-center font-label text-xl font-bold tracking-[0.16em] uppercase">Випало: {body.roll}</p>
            {body.outcome && <p className="text-center text-bone/80 italic">{body.outcome}</p>}
            {next()}
          </RollingDie>
          {body.roll === null && rollButton(`${name(body.roller)}, кидай d6`, body.roller)}
        </Card>
      );
      break;

    case 'task':
      content = (
        <Card>
          <Label>{whoLabel(body.who, name)}</Label>
          <Title>{body.title}</Title>
          <Prose>{body.text}</Prose>
          {body.timer && <Timer seconds={body.timer} />}
          {next('Готово')}
        </Card>
      );
      break;

    case 'effect':
      content = (
        <Card>
          <Prose>{body.text}</Prose>
          <ul
            className={`flex flex-wrap gap-2 font-label text-sm font-semibold tracking-[0.14em] uppercase ${ROLE_TEXT_CLASS[body.who]}`}
          >
            <li className="sr-only">{name(body.who)}</li>
            {body.hp !== 0 && (
              <li className="rounded-blade border border-current px-2.5 py-1">
                {body.hp > 0 ? '+' : '−'}
                {Math.abs(body.hp)} життя
              </li>
            )}
            {body.clothing !== 0 && (
              <li className="rounded-blade border border-current px-2.5 py-1">
                {body.clothing > 0 ? '+' : '−'}
                {Math.abs(body.clothing)} одягу
              </li>
            )}
          </ul>
          {next()}
        </Card>
      );
      break;

    case 'reward':
      content = (
        <Card>
          <Label>Знахідка</Label>
          <Prose>{body.text}</Prose>
          <div className="grid justify-items-center gap-2 border border-brass bg-ink p-5 text-center">
            <span aria-hidden="true" className="text-5xl">
              {body.item.icon}
            </span>
            <p className="font-display text-2xl font-extrabold italic">{body.item.name}</p>
            <p className="text-sm text-bone/70">{body.item.description}</p>
          </div>
          <p className="text-sm text-bone/60">Предмет уже у скарбниці.</p>
          {next()}
        </Card>
      );
      break;

    case 'dead':
      content = (
        <Card>
          <Label>Без сил</Label>
          <Title>{name(body.who)} падає</Title>
          <Prose>
            Життя закінчилось. Щоб повернутись, {name(body.who)} кидає d20: потрібно не менше {body.difficulty}.
          </Prose>
          <RollingDie sides={20} value={body.roll?.value ?? null} success={body.roll?.success}>
            {body.roll && (
              <>
                <p
                  className={`text-center font-label text-xl font-bold tracking-[0.16em] uppercase ${body.roll.success ? 'text-brass' : 'text-rose'}`}
                >
                  {body.roll.success ? 'Повертається сам' : 'Потрібна допомога'}
                </p>
                {body.episode && (
                  <div className="grid gap-3 border-l-4 border-brass bg-ink p-4">
                    <Label>Завдання для партнера</Label>
                    <p className="font-display text-xl font-extrabold italic">{body.episode.title}</p>
                    <p className="whitespace-pre-line">{body.episode.text}</p>
                    {body.episode.timer && <Timer seconds={body.episode.timer} />}
                  </div>
                )}
                {next('Повернутись у гру')}
              </>
            )}
          </RollingDie>
          {!body.roll && rollButton(`${name(body.who)}, кидай d20`, body.who)}
        </Card>
      );
      break;

    case 'ritual':
      content = (
        <Card>
          <Label>Останній ритуал</Label>
          <Title>Ритуал палацу</Title>
          <Prose>Те, що станеться далі, вирішує кубик. Кидайте разом, кидає той, хто хоче.</Prose>
          <RollingDie sides={6} value={body.roll}>
            {body.episode && (
              <>
                <div className="grid gap-3 border-l-4 border-brass bg-ink p-4">
                  <p className="font-display text-2xl font-extrabold italic">{body.episode.title}</p>
                  <p className="whitespace-pre-line">{body.episode.text}</p>
                  {body.episode.timer && <Timer seconds={body.episode.timer} />}
                </div>
                {next('Ритуал завершено')}
              </>
            )}
          </RollingDie>
          {body.roll === null && <PrimaryButton onClick={() => send({ type: 'roll' })}>Кинути d6</PrimaryButton>}
        </Card>
      );
      break;

    case 'wish':
      content = (
        <Card>
          <Label>Бажання</Label>
          <Title>Слово переможцю</Title>
          <Prose>
            У {name('male')} вдалих кидків: {body.successes.male}, у {name('female')}: {body.successes.female}. Бажання
            загадує {name(body.winner)}.
          </Prose>
          {scene.actor === role ? (
            <WishForm onSubmit={(text) => send({ type: 'wish', text })} />
          ) : (
            <Waiting>{name(body.winner)} загадує бажання…</Waiting>
          )}
        </Card>
      );
      break;

    case 'finish':
      content = (
        <Card>
          <Label>Історію завершено</Label>
          <Title>{scene.storyTitle}</Title>
          <Prose>{body.text}</Prose>
          {body.wish && (
            <blockquote className="border-l-4 border-rose bg-ink p-4 italic">
              {body.wish}
              <footer className="mt-2 text-sm text-bone/60 not-italic">Бажання вже у скарбниці</footer>
            </blockquote>
          )}
          <PrimaryButton onClick={() => send({ type: 'leave' })}>До історій</PrimaryButton>
        </Card>
      );
      break;
  }

  const usable = view.treasury.filter((item) => scene.usable.includes(item.id));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-label text-xs font-semibold tracking-[0.22em] text-brass uppercase">
          {scene.storyTitle} · Глава {scene.chapter} з {scene.chapters}
        </p>
        {body.kind !== 'finish' && (
          <button
            type="button"
            onClick={() => send({ type: 'leave' })}
            className="font-label text-xs font-semibold tracking-[0.16em] text-bone/60 uppercase hover:text-bone"
          >
            Вийти
          </button>
        )}
      </div>

      <HeroHud hero={view.hero} partner={view.partner} role={role} />
      {content}

      {usable.length > 0 && (
        <div className="grid gap-2">
          <Label>Предмети</Label>
          {usable.map((item) => (
            <GhostButton key={item.id} onClick={() => send({ type: 'use-item', itemId: item.id })}>
              {item.icon} {item.name}
            </GhostButton>
          ))}
        </div>
      )}
    </div>
  );
}
