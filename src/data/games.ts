import type { Localized } from './news';

/** Official names/categories based on Plato's games catalogue (October 2026).
 * Icon URL convention is based on the verified official Poker asset path.
 * Individual image endpoints may vary; GamesSection uses a fallback on errors.
 */
export interface Game {
  id: string;
  name: Localized;
  genre: Localized;
  tagline: Localized;
  colors: [string, string];
  image?: string;
  /** Only for tournaments: hidden from the Games section and from Game of the day. */
  tournamentOnly?: boolean;
  /** Dominant colour of the artwork; tints the page under the banner. */
  tone?: string;
  overview: Localized;
  /** Game page: text paragraphs, videos (YouTube or an uploaded file) and images, all edited in the dashboard. */
  texts?: { title: Localized; body: Localized }[];
  videos?: { title: Localized; youtubeId: string; /** uploaded video file (then youtubeId is empty) */ src?: string }[];
  images?: string[];
}
export const SHOW_EXAMPLE_GAMES = false;
const L = (en: string, ar: string): Localized => ({ en, ar });
const genres: Record<string, Localized> = {
  Arcade: L('Arcade', 'أركيد'), Board: L('Board', 'ألعاب لوحية'),
  Card: L('Card', 'ألعاب ورق'), Social: L('Social', 'اجتماعية'),
  Sports: L('Sports', 'رياضة'), Word: L('Word', 'كلمات'),
};
const palette: Record<string, [string, string]> = {
  Arcade: ['#306ad9','#111d4c'], Board: ['#7a5cf0','#1c2468'],
  Card: ['#c75be0','#2a1c66'], Social: ['#a468e8','#28246a'],
  Sports: ['#2aa0e0','#12285a'], Word: ['#e0a93a','#2a2a66'],
};
// The official icon naming convention is not guaranteed for every game.
const BASE_GAMES: Game[] = [
  { id: 'match-it', name: L('Match It', 'Match It'), genre: genres.Arcade, tagline: L('Match the tiles and clear the board.', 'طابق البلاطات وأفرغ اللوحة.'), overview: L('Match the tiles and clear the board.', 'طابق البلاطات وأفرغ اللوحة.'), colors: palette.Arcade, image: '', tone: '#9227a2' },
  { id: 'poker', name: L('Poker', 'بوكر'), genre: genres.Card, tagline: L('Texas Hold’em poker with friends.', 'بوكر تكساس هولدم مع الأصدقاء.'), overview: L('Texas Hold’em poker with friends.', 'بوكر تكساس هولدم مع الأصدقاء.'), colors: palette.Card, image: '', tone: '#0a2292' },
  { id: 'ocho', name: L('Ocho', 'اوتشو'), genre: genres.Card, tagline: L('Match colors and numbers to empty your hand.', 'طابق الألوان والأرقام لتُنهي أوراقك أولًا.'), overview: L('Match colors and numbers to empty your hand.', 'طابق الألوان والأرقام لتُنهي أوراقك أولًا.'), colors: palette.Card, image: '', tone: '#6424d1' },
  { id: 'pool', name: L('Pool', 'بلياردو'), genre: genres.Sports, tagline: L('Classic pool with friends.', 'بلياردو كلاسيكي مع الأصدقاء.'), overview: L('Classic pool with friends.', 'بلياردو كلاسيكي مع الأصدقاء.'), colors: palette.Sports, image: '', tone: '#2a9be0' },
  { id: 'bowling', name: L('Bowling', 'بولينغ'), genre: genres.Sports, tagline: L('Knock down the pins in ten frames.', 'أسقط القوارير خلال عشر جولات.'), overview: L('Knock down the pins in ten frames.', 'أسقط القوارير خلال عشر جولات.'), colors: palette.Sports, image: '', tone: '#c75be0' },
  { id: 'match-monsters', name: L('Match Monsters', 'مباراة الوحوش'), genre: genres.Arcade, tagline: L('Match gems and power up your monsters.', 'طابق الجواهر وقوِّ وحوشك.'), overview: L('Match gems and power up your monsters.', 'طابق الجواهر وقوِّ وحوشك.'), colors: palette.Arcade, image: '', tone: '#311da4' },
  { id: 'brawlbots', name: L('Brawlbots', 'دبابات'), genre: genres.Arcade, tagline: L('Control your bot and survive the arena.', 'تحكم بروبوتك واصمد في الساحة.'), overview: L('Control your bot and survive the arena.', 'تحكم بروبوتك واصمد في الساحة.'), colors: palette.Arcade, image: '', tone: '#164ca4' },
  { id: 'ludo', name: L('Ludo', 'لودو'), genre: genres.Board, tagline: L('Race your tokens around the board.', 'سابق خصومك بقطعك حتى النهاية.'), overview: L('Race your tokens around the board.', 'سابق خصومك بقطعك حتى النهاية.'), colors: palette.Board, image: '', tone: '#0a33d9' },
  { id: 'mini-golf', name: L('Mini Golf', 'غولف'), genre: genres.Sports, tagline: L('Compete on miniature golf courses.', 'تنافس في ملاعب الغولف المصغّرة.'), overview: L('Compete on miniature golf courses.', 'تنافس في ملاعب الغولف المصغّرة.'), colors: palette.Sports, image: '', tone: '#2a6ad9' },
  { id: 'table-soccer', name: L('Table Soccer', 'كرة القدم'), genre: genres.Sports, tagline: L('Fast tabletop-style soccer matches.', 'مباريات كرة قدم سريعة ومصغّرة.'), overview: L('Fast tabletop-style soccer matches.', 'مباريات كرة قدم سريعة ومصغّرة.'), colors: palette.Sports, image: '', tone: '#2a5bd9' },
  { id: 'bounce', name: L('Bounce', 'الكرة المرتدة'), genre: genres.Arcade, tagline: L('Time each bounce to stay in the game.', 'تحكم بتوقيت ارتداد الكرة لتستمر في اللعب.'), overview: L('Time each bounce to stay in the game.', 'تحكم بتوقيت ارتداد الكرة لتستمر في اللعب.'), colors: palette.Arcade, image: '' },
  { id: 'dice-party', name: L('Dice Party', 'حفلة النرد'), genre: genres.Board, tagline: L('Roll dice to fill your scorecard.', 'ارمِ النرد وأكمل بطاقة النقاط.'), overview: L('Roll dice to fill your scorecard.', 'ارمِ النرد وأكمل بطاقة النقاط.'), colors: palette.Board, image: '', tone: '#1f35be' },
  { id: 'carrom', name: L('Carrom', 'كيرم'), genre: genres.Sports, tagline: L('Flick discs to claim the queen.', 'سدّد الأقراص لتفوز بالملكة.'), overview: L('Flick discs to claim the queen.', 'سدّد الأقراص لتفوز بالملكة.'), colors: palette.Sports, image: '', tone: '#1b31ba' },
  { id: 'wordbox', name: L('Wordbox', 'صندوق الكلمات'), genre: genres.Word, tagline: L('Connect letters to form words.', 'صل الحروف لتكوين الكلمات.'), overview: L('Connect letters to form words.', 'صل الحروف لتكوين الكلمات.'), colors: palette.Word, image: '' },
  { id: 'plox', name: L('Plox', 'بلوكس'), genre: genres.Arcade, tagline: L('Match blocks and outlast your opponent.', 'طابق الكتل وتفوّق على خصمك.'), overview: L('Match blocks and outlast your opponent.', 'طابق الكتل وتفوّق على خصمك.'), colors: palette.Arcade, image: '' },
  { id: 'disc-o', name: L('Disc-O', 'ديسكو'), genre: genres.Sports, tagline: L('Slide your discs to score.', 'حرّك أقراصك بذكاء لتسجيل النقاط.'), overview: L('Slide your discs to score.', 'حرّك أقراصك بذكاء لتسجيل النقاط.'), colors: palette.Sports, image: '' },
  { id: 'bingo', name: L('Bingo', 'بينغو'), genre: genres.Board, tagline: L('Mark numbers and complete a line.', 'طابق الأرقام وأكمل صفًا.'), overview: L('Mark numbers and complete a line.', 'طابق الأرقام وأكمل صفًا.'), colors: palette.Board, image: '', tone: '#d49334' },
  { id: 'blitz-league', name: L('Blitz League', 'دوري بليتز'), genre: genres.Arcade, tagline: L('Deploy units to protect your base.', 'انشر الوحدات للدفاع عن قاعدتك.'), overview: L('Deploy units to protect your base.', 'انشر الوحدات للدفاع عن قاعدتك.'), colors: palette.Arcade, image: '' },
  { id: 'archery', name: L('Archery', 'رماية القوس'), genre: genres.Sports, tagline: L('Aim your arrows at the bullseye.', 'صوّب سهامك نحو الهدف.'), overview: L('Aim your arrows at the bullseye.', 'صوّب سهامك نحو الهدف.'), colors: palette.Sports, image: '', tone: '#e0a93a' },
  { id: 'skeeball', name: L('Skeeball', 'سكيبول'), genre: genres.Arcade, tagline: L('Roll for the highest score.', 'دحرج الكرة لتحقيق أعلى نقاط.'), overview: L('Roll for the highest score.', 'دحرج الكرة لتحقيق أعلى نقاط.'), colors: palette.Arcade, image: '' },
  { id: '4-in-a-row', name: L('4 in a Row', 'أربعة في صف'), genre: genres.Board, tagline: L('Connect four pieces before your opponent.', 'اجمع أربع قطع متتالية قبل خصمك.'), overview: L('Connect four pieces before your opponent.', 'اجمع أربع قطع متتالية قبل خصمك.'), colors: palette.Board, image: '', tone: '#651bd1' },
  { id: 'dominoes', name: L('Dominoes', 'دومينوز'), genre: genres.Board, tagline: L('Play classic dominoes with friends.', 'العب الدومينو الكلاسيكية مع الأصدقاء.'), overview: L('Play classic dominoes with friends.', 'العب الدومينو الكلاسيكية مع الأصدقاء.'), colors: palette.Board, image: '', tone: '#2438d6' },
  { id: 'backgammon', name: L('Backgammon', 'طاولة الزهر'), genre: genres.Board, tagline: L('Roll dice and bear off your checkers.', 'ارمِ النرد وأخرج قطعك قبل خصمك.'), overview: L('Roll dice and bear off your checkers.', 'ارمِ النرد وأخرج قطعك قبل خصمك.'), colors: palette.Board, image: '', tone: '#450da5' },
  { id: 'voice', name: L('Voice', 'صوت'), genre: genres.Social, tagline: L('Meet and chat with other players.', 'تحدث وتعرّف على لاعبين آخرين.'), overview: L('Meet and chat with other players.', 'تحدث وتعرّف على لاعبين آخرين.'), colors: palette.Social, image: '' },
  { id: 'cribbage', name: L('Cribbage', 'كريبيج'), genre: genres.Card, tagline: L('Play cards and race to score points.', 'العب الأوراق وتسابق لجمع النقاط.'), overview: L('Play cards and race to score points.', 'العب الأوراق وتسابق لجمع النقاط.'), colors: palette.Card, image: '' },
  { id: 'bankroll', name: L('Bankroll', 'بنك رول'), genre: genres.Board, tagline: L('Trade properties to grow your fortune.', 'تاجر بالعقارات لبناء ثروتك.'), overview: L('Trade properties to grow your fortune.', 'تاجر بالعقارات لبناء ثروتك.'), colors: palette.Board, image: '' },
  { id: 'gin-rummy', name: L('Gin Rummy', 'جين رومي'), genre: genres.Card, tagline: L('Draw and discard to make melds.', 'اسحب الأوراق وتخلّص منها لتكوين مجموعات.'), overview: L('Draw and discard to make melds.', 'اسحب الأوراق وتخلّص منها لتكوين مجموعات.'), colors: palette.Card, image: '' },
  { id: 'darts', name: L('Darts', 'رمي السهام'), genre: genres.Sports, tagline: L('Aim darts for the bullseye.', 'صوّب السهام نحو مركز اللوحة.'), overview: L('Aim darts for the bullseye.', 'صوّب السهام نحو مركز اللوحة.'), colors: palette.Sports, image: '', tone: '#0754dc' },
  { id: 'go-fish', name: L('Go Fish', 'اذهب للصيد'), genre: genres.Card, tagline: L('Collect matching sets of cards.', 'اجمع مجموعات الأوراق المتشابهة.'), overview: L('Collect matching sets of cards.', 'اجمع مجموعات الأوراق المتشابهة.'), colors: palette.Card, image: '' },
  { id: 'chess', name: L('Chess', 'شطرنج'), genre: genres.Board, tagline: L('Plan your moves and checkmate.', 'خطط لحركاتك وحقق كش ملك.'), overview: L('Plan your moves and checkmate.', 'خطط لحركاتك وحقق كش ملك.'), colors: palette.Board, image: '', tone: '#6d38c2' },
  { id: 'sea-battle', name: L('Sea Battle', 'معركة بحرية'), genre: genres.Board, tagline: L('Find and sink your rival\'s ships.', 'اكتشف سفن خصمك وأغرقها.'), overview: L('Find and sink your rival\'s ships.', 'اكتشف سفن خصمك وأغرقها.'), colors: palette.Board, image: '' },
  { id: 'spades', name: L('Spades', 'سبيدز'), genre: genres.Card, tagline: L('Team up and win tricks.', 'تعاون مع فريقك للفوز باللمّات.'), overview: L('Team up and win tricks.', 'تعاون مع فريقك للفوز باللمّات.'), colors: palette.Card, image: '' },
  { id: 'bloko', name: L('Bloko', 'بلوكو'), genre: genres.Board, tagline: L('Place your pieces corner to corner and claim the board.', 'ضع قطعك من الزوايا واستحوذ على اللوحة.'), overview: L('Place your pieces corner to corner and claim the board.', 'ضع قطعك من الزوايا واستحوذ على اللوحة.'), colors: palette.Board, image: '' },
  { id: 'mancala', name: L('Mancala', 'منقلة'), genre: genres.Board, tagline: L('Move stones and collect captures.', 'حرّك الأحجار واجمع أكبر عدد منها.'), overview: L('Move stones and collect captures.', 'حرّك الأحجار واجمع أكبر عدد منها.'), colors: palette.Board, image: '' },
  { id: 'werewolf', name: L('Werewolf', 'المستذئب'), genre: genres.Social, tagline: L('Find the hidden wolves before they win.', 'اكشف الذئاب المختبئة قبل فوات الأوان.'), overview: L('Find the hidden wolves before they win.', 'اكشف الذئاب المختبئة قبل فوات الأوان.'), colors: palette.Social, image: '' },
  { id: 'dots-and-boxes', name: L('Dots & Boxes', 'النقاط والمربعات'), genre: genres.Board, tagline: L('Draw lines and claim squares.', 'ارسم الخطوط واستحوذ على المربعات.'), overview: L('Draw lines and claim squares.', 'ارسم الخطوط واستحوذ على المربعات.'), colors: palette.Board, image: '' },
  { id: 'basketball', name: L('Basketball', 'كرة السلة'), genre: genres.Sports, tagline: L('Score baskets before time runs out.', 'سجّل السلات قبل انتهاء الوقت.'), overview: L('Score baskets before time runs out.', 'سجّل السلات قبل انتهاء الوقت.'), colors: palette.Sports, image: '', tone: '#2b3db5' },
  { id: 'cup-pong', name: L('Cup Pong', 'الكرة في الأكواب'), genre: genres.Sports, tagline: L('Toss balls into your rival\'s cups.', 'ارمِ الكرات داخل أكواب الخصم.'), overview: L('Toss balls into your rival\'s cups.', 'ارمِ الكرات داخل أكواب الخصم.'), colors: palette.Sports, image: '' },
  { id: 'bullshit', name: L('Bullsh!t', 'الكذب'), genre: genres.Card, tagline: L('Bluff or catch the other players bluffing.', 'اخدع الآخرين أو اكشف خداعهم.'), overview: L('Bluff or catch the other players bluffing.', 'اخدع الآخرين أو اكشف خداعهم.'), colors: palette.Card, image: '' },
  { id: 'checkers', name: L('Checkers', 'داما'), genre: genres.Board, tagline: L('Capture your opponent\'s pieces.', 'التقط قطع خصمك واربح.'), overview: L('Capture your opponent\'s pieces.', 'التقط قطع خصمك واربح.'), colors: palette.Board, image: '' },
  { id: 'truco', name: L('Truco', 'تروكو'), genre: genres.Card, tagline: L('Bluff and bid for every point.', 'خادع وراهن على كل نقطة.'), overview: L('Bluff and bid for every point.', 'خادع وراهن على كل نقطة.'), colors: palette.Card, image: '' },
  { id: 'draw-together', name: L('Draw Together', 'الرسم معًا'), genre: genres.Social, tagline: L('Draw pictures and guess the answers.', 'ارسم وخمّن ما رسمه الآخرون.'), overview: L('Draw pictures and guess the answers.', 'ارسم وخمّن ما رسمه الآخرون.'), colors: palette.Social, image: '' },
  { id: 'minesweepers', name: L('Minesweepers', 'كاسحة الألغام'), genre: genres.Board, tagline: L('Clear tiles without hitting mines.', 'اكشف المربعات دون الوقوع في الألغام.'), overview: L('Clear tiles without hitting mines.', 'اكشف المربعات دون الوقوع في الألغام.'), colors: palette.Board, image: '' },
  { id: 'literati', name: L('Literati', 'ليتراتي'), genre: genres.Word, tagline: L('Build words and score points.', 'كوّن الكلمات واجمع النقاط.'), overview: L('Build words and score points.', 'كوّن الكلمات واجمع النقاط.'), colors: palette.Word, image: '' },
  { id: 'old-zombie', name: L('Old Zombie', 'زومبي'), genre: genres.Card, tagline: L('Make pairs and avoid the zombie card.', 'كوّن أزواجًا وتجنب بطاقة الزومبي.'), overview: L('Make pairs and avoid the zombie card.', 'كوّن أزواجًا وتجنب بطاقة الزومبي.'), colors: palette.Card, image: '' },
  { id: 'big-two', name: L('Big Two', 'الاثنان الكبيران'), genre: genres.Card, tagline: L('Beat card combinations to clear your hand.', 'تغلب على مجموعات الأوراق لتُنهي يدك.'), overview: L('Beat card combinations to clear your hand.', 'تغلب على مجموعات الأوراق لتُنهي يدك.'), colors: palette.Card, image: '' },
  { id: 'reversi', name: L('Reversi', 'ريفرسي'), genre: genres.Board, tagline: L('Flip pieces and dominate the board.', 'اقلب قطع خصمك وسيطر على اللوحة.'), overview: L('Flip pieces and dominate the board.', 'اقلب قطع خصمك وسيطر على اللوحة.'), colors: palette.Board, image: '' },
  { id: 'hearts', name: L('Hearts', 'القلوب'), genre: genres.Card, tagline: L('Avoid taking penalty points.', 'تجنب جمع نقاط العقوبة.'), overview: L('Avoid taking penalty points.', 'تجنب جمع نقاط العقوبة.'), colors: palette.Card, image: '' },
  { id: 'conquest', name: L('Conquest', 'الغزو'), genre: genres.Board, tagline: L('Roll dice to conquer territories.', 'ارمِ النرد للسيطرة على المناطق.'), overview: L('Roll dice to conquer territories.', 'ارمِ النرد للسيطرة على المناطق.'), colors: palette.Board, image: '' },
  { id: 'legions', name: L('Legions', 'الفيالق'), genre: genres.Board, tagline: L('Lead your legion to victory.', 'قد فيلقك نحو النصر.'), overview: L('Lead your legion to victory.', 'قد فيلقك نحو النصر.'), colors: palette.Board, image: '' },
  { id: 'the-island', name: L('The Island', 'الجزيرة'), genre: genres.Social, tagline: L('Make alliances and survive.', 'كوّن التحالفات وابقَ للنهاية.'), overview: L('Make alliances and survive.', 'كوّن التحالفات وابقَ للنهاية.'), colors: palette.Social, image: '' },
  { id: 'rock-card', name: L('Rock Card', 'روك كارد'), genre: genres.Social, tagline: L('Vote on funny or daring answers.', 'صوّت لأطرف الإجابات وأكثرها جرأة.'), overview: L('Vote on funny or daring answers.', 'صوّت لأطرف الإجابات وأكثرها جرأة.'), colors: palette.Social, image: '' },
  { id: 'dungeon-tales', name: L('Dungeon Tales', 'حكايات الزنزانة'), genre: genres.Social, tagline: L('Adventure together and defeat monsters.', 'خُض مغامرة تعاونية واهزم الوحوش.'), overview: L('Adventure together and defeat monsters.', 'خُض مغامرة تعاونية واهزم الوحوش.'), colors: palette.Social, image: '' },
  { id: 'conspiracy', name: L('Conspiracy', 'مؤامرة'), genre: genres.Social, tagline: L('Discover the spy among your group.', 'اكشف الجاسوس الموجود بينكم.'), overview: L('Discover the spy among your group.', 'اكشف الجاسوس الموجود بينكم.'), colors: palette.Social, image: '' },
  { id: 'deep-thots', name: L('Deep Thots', 'أفكار عميقة'), genre: genres.Social, tagline: L('Give unexpected answers to big questions.', 'أجب بإجابات طريفة عن أسئلة عميقة.'), overview: L('Give unexpected answers to big questions.', 'أجب بإجابات طريفة عن أسئلة عميقة.'), colors: palette.Social, image: '' },
  { id: 'go', name: L('Go', 'غو'), genre: genres.Board, tagline: L('Control territory on the board.', 'سيطر على المساحات على لوحة غو.'), overview: L('Control territory on the board.', 'سيطر على المساحات على لوحة غو.'), colors: palette.Board, image: '' },
];

/* ---------- Dashboard-managed games (D1 table "games") merged over the built-in list ---------- */
export const GENRE_KEYS = Object.keys(genres);
export const genreLabel = (key: string): Localized => genres[key] ?? genres.Arcade;
/** Game-page content edited in the dashboard (stored as JSON in the games table). */
export interface GameDetails { texts: { title: Localized; body: Localized }[]; videos: { title: Localized; url: string }[]; images: string[] }
export const emptyDetails = (): GameDetails => ({ texts: [], videos: [], images: [] });
export const emptyText = () => ({ title: { ar: '', en: '' }, body: { ar: '', en: '' } });
/** The dashboard form edits growing lists: normalise whatever came from the server. */
export const fullDetails = (d?: Partial<GameDetails>): GameDetails => ({
  texts: (d?.texts ?? []).map((t) => ({ title: { ar: t.title?.ar ?? '', en: t.title?.en ?? '' }, body: { ar: t.body?.ar ?? '', en: t.body?.en ?? '' } })),
  videos: (d?.videos ?? []).map((v) => ({ title: { ar: v.title?.ar ?? '', en: v.title?.en ?? '' }, url: v.url ?? '' })),
  images: (d?.images ?? []).filter(Boolean),
});
/** Uploaded video file (served from our own storage) → true. */
export const isVideoFile = (u: string) => /^\/api\/img\/[0-9a-f-]{36}\.(mp4|webm)$/.test(u.trim());
/** YouTube link or bare id → id. */
export const youtubeId = (v: string) => (v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)?.[1] ?? (/^[\w-]{11}$/.test(v.trim()) ? v.trim() : ''));
/** Fields of a game that come from its details row; empty details keep the built-in values. */
function applyDetails(d: GameDetails | undefined): Partial<Game> {
  if (!d) return {};
  const out: Partial<Game> = {};
  const texts = (d.texts ?? []).filter((t) => t.title.ar || t.title.en || t.body.ar || t.body.en).map((t) => ({ title: { ar: t.title.ar || t.title.en, en: t.title.en || t.title.ar }, body: { ar: t.body.ar || t.body.en, en: t.body.en || t.body.ar } }));
  if (texts.length) out.texts = texts;
  const videos = (d.videos ?? []).map((v) => ({ id: youtubeId(v.url ?? ''), src: isVideoFile(v.url ?? '') ? v.url.trim() : '', t: v.title })).filter((v) => v.id || v.src).map((v) => ({ youtubeId: v.id, src: v.src || undefined, title: { ar: v.t.ar || v.t.en, en: v.t.en || v.t.ar } }));
  if (videos.length) out.videos = videos;
  const images = (d.images ?? []).filter(Boolean);
  if (images.length) out.images = images;
  return out;
}
export interface GameRow { /** order / deleted: only on the special '__meta' row (display order, deleted built-in games) */ order?: string[]; deleted?: string[]; id: string; genre: string; name: Localized; tagline: Localized; image: string; hidden: boolean; custom: boolean; tournamentOnly?: boolean; details?: GameDetails }
export type AdminGame = Game & { hidden: boolean; custom: boolean; genreKey: string; details?: GameDetails };
const keyOf = (genre: Localized) => GENRE_KEYS.find((k) => genres[k].en === genre.en) ?? 'Arcade';

/** A row overrides the built-in game with the same id (empty field = keep default); other rows are custom games. */
export function mergeGames(rows: GameRow[]): AdminGame[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const meta = byId.get('__meta');
  const gone = new Set(meta?.deleted ?? []);
  const list: AdminGame[] = BASE_GAMES.filter((b) => !gone.has(b.id)).map((b) => {
    const r = byId.get(b.id);
    const gk = r?.genre && genres[r.genre] ? r.genre : keyOf(b.genre);
    const tagline = { en: r?.tagline.en || b.tagline.en, ar: r?.tagline.ar || b.tagline.ar };
    const name = { en: r?.name.en || b.name.en, ar: r?.name.ar || b.name.ar };
    return {
      ...b, ...applyDetails(r?.details), details: r?.details, genreKey: gk, genre: genres[gk], colors: gk === keyOf(b.genre) ? b.colors : palette[gk],
      name, tagline, overview: r?.tagline.en || r?.tagline.ar ? tagline : b.overview,
      image: r?.image || b.image, tone: r?.image ? undefined : b.tone, hidden: !!r?.hidden, custom: false, tournamentOnly: !!r?.tournamentOnly,
    };
  });
  for (const r of rows) {
    if (!r.custom || BASE_GAMES.some((b) => b.id === r.id)) continue;
    const gk = genres[r.genre] ? r.genre : 'Arcade';
    const name = { en: r.name.en || r.name.ar, ar: r.name.ar || r.name.en };
    list.push({
      ...applyDetails(r.details), details: r.details,
      id: r.id, genreKey: gk, genre: genres[gk], colors: palette[gk], name,
      tagline: r.tagline, overview: r.tagline, image: r.image || undefined, hidden: r.hidden, custom: true, tournamentOnly: !!r.tournamentOnly,
    });
  }
  // Dashboard order (games not listed yet, e.g. newly added, keep their default place after the listed ones).
  const pos = new Map((meta?.order ?? []).map((id, i) => [id, i]));
  return list.sort((a, b) => (pos.get(a.id) ?? 1e6) - (pos.get(b.id) ?? 1e6));
}

/** The games the site shows. Replaced (new array) when the dashboard data loads; components subscribe through useGames(). */
export let GAMES: Game[] = BASE_GAMES;
const listeners = new Set<() => void>();
export const subscribeGames = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const getGamesSnapshot = () => GAMES;
export function setGameRows(rows: GameRow[]) {
  GAMES = mergeGames(rows).filter((x) => !x.hidden);
  listeners.forEach((fn) => fn());
}
export const getGame = (id: string) => GAMES.find((g) => g.id === id);
