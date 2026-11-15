import type { Game } from './games';

/** Built-in content of each game page (quick facts, glimpse, goal, short history, tips, tournaments).
 * Edited in the dashboard: paragraphs saved there replace these. Latin words inside Arabic text are wrapped in
 * Unicode isolates (U+2066…U+2069) with non-breaking hyphens so they keep their order and never split across lines. */
export const GAME_TEXTS: Record<string, NonNullable<Game['texts']>> = {
 "poker": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 20 إلى 60 دقيقة\nعدة لاعبين",
    "en": "Approx. length: 20–60 min\nSeveral players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة ورق يلعبها عدة لاعبين حول طاولة واحدة بنظام تكساس هولدم، وتجمع بين الحساب والجرأة والحظ.",
    "en": "A card game for several players at one table, played as Texas Hold’em, mixing maths, nerve and a little luck."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كوّن أقوى يد من خمس أوراق، أو أجبر بقية اللاعبين على الانسحاب قبل كشف الأوراق.",
    "en": "Make the best five-card hand, or force everyone else to fold before the showdown."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "يُقال إن تكساس هولدم نشأت في ولاية تكساس الأمريكية في أوائل القرن العشرين، ثم دخلت مدينة لاس فيغاس في ستينيات القرن نفسه. وازدادت شهرتها حين صارت اللعبة الرئيسية في بطولة العالم للبوكر، ثم انتشرت عبر الإنترنت.",
    "en": "Texas Hold’em is said to have started in Texas in the early 20th century and reached Las Vegas in the 1960s. It became hugely popular once it was the main game of the World Series of Poker, then spread online."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• تعلّم ترتيب الأيدي حتى تعرف قوة ورقتيك في كل مرحلة.\n• العب عدداً أقل من الأيدي، لكن بأوراق أقوى.\n• راقب طريقة رهان خصومك، فهي تكشف الكثير عن أوراقهم.\n• لا تلاحق رهاناً كبيراً بيد ضعيفة لمجرد الخوف من الخسارة.",
    "en": "• Learn the hand rankings so you know how strong your cards are at every stage.\n• Play fewer hands, but stronger ones.\n• Watch how opponents bet; it tells you a lot about their cards.\n• Don’t chase a big bet with a weak hand just because you fear losing."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: بطولة «اجلس والعب» ⁦Sit & Go⁩، ويتأهل الأوائل من كل طاولة إلى الدور التالي.\n• اتفقوا قبل البدء على عدد الرقائق الابتدائي ومواعيد رفع الرهانات.\n• تُقام المباراة النهائية بين عدد قليل من اللاعبين على طاولة واحدة.",
    "en": "• Format: Sit & Go; the top finishers from each table advance.\n• Agree the starting chips and the blind-raise schedule before you begin.\n• Hold the final on a single table with a small number of players."
   }
  }
 ],
 "ocho": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 20 دقيقة\nعدة لاعبين",
    "en": "Approx. length: 10–20 min\nSeveral players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة ورق سريعة تشبه «أونو»، تتخلص فيها من أوراقك بمطابقة اللون أو الرقم أو الرمز.",
    "en": "A fast card game in the style of UNO: shed your cards by matching colour, number or symbol."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول من يتخلص من جميع أوراقه.",
    "en": "Be the first to empty your hand."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "لا يتوفر تاريخ موثّق للعبة بهذا الاسم، لكنها من عائلة «أونو» التي ابتكرها ميرل روبنز في ولاية أوهايو الأمريكية سنة 1971، ثم اشترتها شركة ماتيل سنة 1992.",
    "en": "There is no documented history for this exact game, but it belongs to the UNO family, created by Merle Robbins in Ohio in 1971 and bought by Mattel in 1992."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• احتفظ بالأوراق الخاصة لوقت الحاجة إليها.\n• انتبه لعدد أوراق الخصوم، وإذا اقترب أحدهم من الفوز فأوقفه بورقة سحب.\n• نوّع الألوان في يدك حتى لا تعلق دون ورقة مطابقة.\n• في نمط الفريقين، استفد من رؤية أوراق شريكك لتجهيز اللعبة التالية.",
    "en": "• Save special cards for when you really need them.\n• Watch your rivals’ card counts; if one is close to winning, stop them with a draw card.\n• Keep a mix of colours so you are never stuck without a match.\n• In team mode, use your partner’s visible cards to set up the next play."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر في المواجهات الفردية، أو دوري للفرق في نمط الفريقين.\n• اتفقوا قبل البدء على النمط (سريع أو خاص أو فرق).\n• المواجهة: أفضل 3 جولات.",
    "en": "• Format: single elimination for solo matches, or a league for teams in team mode.\n• Agree the mode (quick, private or teams) before starting.\n• Series: best of 3 rounds."
   }
  }
 ],
 "pool": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 20 دقيقة\nلاعبان أو 2 ضد 2",
    "en": "Approx. length: 10–20 min\n1v1 or 2v2"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "تضرب الكرة البيضاء بالعصا لتُدخل الكرات في الجيوب. فيها أنماط ⁦8‑ball⁩ و⁦9‑ball⁩ وتسديدات استعراضية ⁦Trickshot⁩.",
    "en": "Strike the cue ball with the cue to pot balls in the pockets. Modes include 8-ball, 9-ball and Trickshot."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "في ⁦8‑ball⁩: أدخل مجموعتك ثم الكرة 8. وفي ⁦9‑ball⁩: أدخل الكرة 9 بعد ضرب أقل كرة رقماً.",
    "en": "In 8-ball: pot your group, then the 8. In 9-ball: pot the 9 after hitting the lowest-numbered ball first."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "خرج البلياردو من ألعاب العصا والكرة التي كانت تُلعب على العشب في أوروبا، وكان شكلها يشبه الكروكيه في القرن الرابع عشر. ثم انتقلت اللعبة إلى الداخل على طاولات، ويُقال إن الملك لويس الحادي عشر ملك فرنسا امتلك أول طاولة معروفة. وحلّت العصا الرفيعة محل العصا العريضة نحو سنة 1800.",
    "en": "Pool grew out of lawn games played with a stick and ball in Europe, similar to croquet, in the 14th century. It then moved indoors onto tables, and King Louis XI of France is said to have owned the first known table. The slim cue replaced the broad stick around 1800."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• فكّر في موضع الكرة البيضاء بعد الضربة، لا في إدخال الكرة فقط.\n• قوة أقل ودقة أكثر تغلبان التسديد العنيف.\n• لا تُدخل الكرة 8 قبل إنهاء مجموعتك.\n• إذا كانت التسديدة صعبة، العب ضربة دفاعية تترك الخصم بلا فرصة.",
    "en": "• Think about where the cue ball ends up, not only about potting.\n• Less power and more accuracy beat a hard hit.\n• Don’t pot the 8 before clearing your group.\n• If the shot is hard, play a safety that leaves your opponent nothing."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر، أو دوري في المجموعات الصغيرة.\n• المواجهة: أفضل 3، وأفضل 5 في النهائي.\n• اتفقوا قبل البدء على النمط (مثل ⁦8‑ball⁩) ليكون واحداً في كل المواجهات.\n• الكسر الأول: بالتناوب بين المباريات أو بالقرعة.",
    "en": "• Format: single elimination, or a league in small groups.\n• Series: best of 3, best of 5 in the final.\n• Agree the mode (e.g. 8-ball) so it is the same in every match.\n• Break: alternate between games or decide by draw."
   }
  }
 ],
 "bowling": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nلاعبان",
    "en": "Approx. length: 5–10 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "رمي كرة نحو عشرة قوارير بتمريرة من الإصبع على الشاشة، في مواجهة صديق أو خصم عشوائي.",
    "en": "Swipe to roll a ball at ten pins, against a friend or a matched opponent."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "اجمع نقاطاً أكثر من خصمك خلال 5 أو 10 جولات.",
    "en": "Score more than your opponent over 5 or 10 frames."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تذكر بعض الروايات أن أشكالاً من البولينغ عُرفت في مصر القديمة منذ آلاف السنين، لكن هذا غير مؤكد. أما أصل اللعبة الحديثة فيرتبط بأوروبا في العصور الوسطى، وانتشرت نسخة العشر قوارير في الولايات المتحدة، وتوحّدت قواعدها هناك سنة 1895 تقريباً.",
    "en": "Some accounts say forms of bowling existed in ancient Egypt thousands of years ago, though this is uncertain. The modern game is linked to medieval Europe; the ten-pin version spread in the United States, where rules were standardised around 1895."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• استهدف القوارير الأمامية بزاوية ثابتة وكرر الرمية نفسها.\n• لا ترمِ بقوة زائدة؛ الدقة أهم من السرعة.\n• إذا تبقّت قوارير في الرمية الأولى، فاستهدف إسقاطها كلها لتحصل على نقطة إضافية.\n• ركّز في الرمية الثانية على القارورة المنعزلة بدل التسرع.",
    "en": "• Aim at the front pins from a steady angle and repeat the same throw.\n• Don’t overpower the throw; accuracy matters more than speed.\n• If pins remain after the first throw, aim to clear them all for a spare.\n• On the second throw, focus on the lone pin instead of rushing."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: مباراة واحدة من 10 جولات، أو أفضل 3 للمباريات القصيرة.\n• التعادل: جولة إضافية واحدة.",
    "en": "• Format: single elimination.\n• Series: one 10-frame game, or best of 3 short games.\n• Tie: one extra frame."
   }
  }
 ],
 "match-monsters": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nلاعبان",
    "en": "Approx. length: 5–10 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "مزيج بين ألغاز مطابقة ثلاث قطع ومعارك الوحوش بالأدوار بين لاعبين.",
    "en": "A mix of match-3 puzzles and turn-based monster battles between two players."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أنقص نقاط حياة خصمك إلى الصفر.",
    "en": "Reduce your opponent’s HP to zero."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ألعاب مطابقة القطع انتشرت بقوة مع لعبة «بيجويلد» سنة 2001. أما دمج المطابقة مع معارك الأدوار والوحوش فاشتهر مع لعبة «بزل كويست» سنة 2007.",
    "en": "Match-3 games took off with Bejeweled in 2001. Combining matching with turn-based monster battles became popular with Puzzle Quest in 2007."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• طابق ألواناً تشحن الوحش الأقوى عندك أولاً.\n• ابحث عن مطابقة 4 قطع أو أكثر لتحصل على حركة إضافية.\n• خطّط لحركتين متتاليتين بدل حركة واحدة.\n• عطّل خطط الخصم بتغيير القطع التي يحتاجها.",
    "en": "• Match colours that charge your strongest monster first.\n• Look for matches of four or more to earn an extra move.\n• Plan two moves ahead instead of one.\n• Spoil your opponent’s plans by changing the tiles they need."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3.\n• اتفقوا قبل البدء على النمط (عادي أو مكافأة المطابقة) وطريقة اختيار الفرق.",
    "en": "• Format: single elimination.\n• Series: best of 3.\n• Agree the mode (Normal or Match Bonus) and the team-pick method beforehand."
   }
  }
 ],
 "brawlbots": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 15 دقيقة\nعدة لاعبين",
    "en": "Approx. length: 5–15 min\nSeveral players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "معركة دبابات روبوتية يتحرك فيها الجميع في الوقت نفسه، ولكل روبوت أسلحته وصفاته.",
    "en": "A free-for-all robot-tank battle in which everyone acts at the same time, each bot with its own weapons and stats."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "ابقَ آخر روبوت صامد في الساحة.",
    "en": "Be the last bot standing in the arena."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "لا يوجد تاريخ موثّق لهذه اللعبة تحديداً. وهي تنتمي إلى ألعاب المدفعية بالأدوار التي ظهرت منذ ثمانينيات القرن العشرين، ومن أشهرها «سكورتشد إيرث» سنة 1991 ثم «ورمز» سنة 1995.",
    "en": "There is no documented history for this exact game. It belongs to the family of turn-based artillery games from the 1980s onward, best known through Scorched Earth (1991) and Worms (1995)."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• اختر روبوتاً يناسب أسلوبك، فلكل روبوت صحة ووزن ودقة مختلفة.\n• لا تقف قرب الماء أو حافة الخريطة.\n• استعمل الدرع عندما تتوقع هجوماً جوياً.\n• وجّه ضرباتك إلى أضعف الخصوم أولاً.",
    "en": "• Pick a bot that suits your style; each has different health, weight and accuracy.\n• Don’t stand near water or the map edge.\n• Use the shield when you expect an air strike.\n• Aim at the weakest opponents first."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: مباريات جماعية يتأهل فيها الأوائل.\n• النقاط: ترتيب الخروج هو الأساس (آخر من يبقى الأول).\n• اتفقوا قبل البدء على عدد المشاركين في كل مباراة.",
    "en": "• Format: group matches where the top finishers advance.\n• Points: finishing order decides (last one standing is first).\n• Agree the number of players per match beforehand."
   }
  }
 ],
 "ludo": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 15 إلى 30 دقيقة\nمن 2 إلى 4 لاعبين، أو فريقان",
    "en": "Approx. length: 15–30 min\n2–4 players, or two teams"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة سباق بالنرد والقطع، متفرعة عن اللعبة الهندية القديمة «باتشيسي».",
    "en": "A dice-and-token race game, descended from the ancient Indian game Pachisi."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أوصل قطعك الأربع إلى المنزل قبل بقية اللاعبين.",
    "en": "Bring all four of your pieces home before the others."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تعود «لودو» إلى لعبة «باتشيسي» الهندية، التي تُروى عنها قصص تقول إن الإمبراطور أكبر لعبها بقطع بشرية في ساحة قصره. وسُجّلت «لودو» ببراءة اختراع في إنجلترا سنة 1896 باسم ألفريد كولير.",
    "en": "Ludo comes from the Indian game Pachisi, which legend says Emperor Akbar played with living pieces in his palace courtyard. Ludo itself was patented in England in 1896 under the name Alfred Collier."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• لا تُخرج كل قطعك دفعة واحدة، فتوزيعها يمنحك خيارات أكثر.\n• احمِ قطعك القريبة من خصم بوضعها في المربعات الآمنة إن كانت مفعّلة.\n• اغتنم كل فرصة لأسر قطعة خصم قريبة من منزله.\n• لا تُهمل القطعة الأخيرة حتى لا تتأخر عن الفوز.",
    "en": "• Don’t bring all your pieces out at once; spreading them gives you more options.\n• Protect pieces near an opponent by using Safe Squares if enabled.\n• Take every chance to capture a piece close to its owner’s home.\n• Don’t neglect your last piece or it will delay your win."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر في المواجهات الثنائية، أو طاولات من 4 يتأهل أولها.\n• اتفقوا قبل البدء على تفعيل المربعات الآمنة أو إلغائها.\n• التعادل في الطاولات: يُحسم بعدد القطع الواصلة.",
    "en": "• Format: single elimination for 1v1, or tables of four where the winner advances.\n• Agree whether Safe Squares are on or off.\n• Table ties: decided by the number of pieces home."
   }
  }
 ],
 "mini-golf": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 15 دقيقة\nحتى 4 لاعبين",
    "en": "Approx. length: 10–15 min\nUp to 4 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "غولف مصغّر على ملاعب مليئة بالعوائق، تلعبه مع الأصدقاء أو مع خصوم عشوائيين.",
    "en": "Miniature golf on obstacle-filled courses, with friends or matched opponents."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أدخل كرتك في الحفرة قبل الآخرين وبأقل عدد ممكن من الضربات.",
    "en": "Sink your ball before the others, using as few shots as you can."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تعود رياضة الغولف إلى اسكتلندا في القرن الخامس عشر. وأما الغولف المصغّر فتُنسب بدايته إلى مطلع القرن العشرين في الولايات المتحدة، ويُذكر ملعب «توم ثامب غولف» الذي بُني في ولاية تينيسي سنة 1927 وانتشر انتشاراً واسعاً.",
    "en": "Golf itself goes back to Scotland in the 15th century. Miniature golf is linked to the early 20th century in the United States; Tom Thumb Golf, built in Tennessee in 1927, spread widely."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• اضبط قوة الضربة بهدوء؛ الضربة الخفيفة أسهل في التحكم.\n• راقب الرياح والرمل والوحل قبل التسديد.\n• استخدم ارتداد الكرة عن الجدران بدل المسار المباشر عند وجود عائق.\n• لا تتسرع في ضرب الكرة من أول محاولة.",
    "en": "• Set the power calmly; a gentle shot is easier to control.\n• Check wind, sand and sludge before shooting.\n• Use rebounds off the walls instead of a direct line when there is an obstacle.\n• Don’t rush the shot on your first try."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: دوري على جولات، أو إقصاء مباشر في المواجهات الثنائية.\n• النقاط: مجموع الضربات عبر عدد من الحفر المتفق عليه.\n• اتفقوا على الملعب نفسه لكل المتنافسين.",
    "en": "• Format: a league over several courses, or single elimination for 1v1.\n• Points: total strokes over an agreed number of holes.\n• Agree on the same course for all competitors."
   }
  }
 ],
 "table-soccer": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nلاعبان",
    "en": "Approx. length: 5–10 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة كرة قدم مصغّرة سريعة بالأدوار، تقوم على التصويب والتمرير.",
    "en": "A fast, miniature turn-based football game built on aiming and passing."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "سجّل عدداً محدداً من الأهداف قبل خصمك.",
    "en": "Score a set number of goals before your opponent."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تنظّمت قواعد كرة القدم الحديثة في إنجلترا سنة 1863 مع تأسيس اتحاد كرة القدم. وهذه اللعبة تستلهم كرة القدم في نسخة مصغّرة تُلعب بالأدوار.",
    "en": "The modern rules of football were set in England in 1863 with the founding of the Football Association. This game takes inspiration from football in a miniature, turn-based form."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• استخدم التمرير لتفتح ثغرات في دفاع الخصم قبل التسديد.\n• لا تصوّب من بعيد دون زاوية واضحة.\n• اختر تشكيلاً هجومياً عندما تبدأ، ودفاعياً عندما يبدأ الخصم.\n• حافظ على لاعبيك قريبين من بعضهم لتبقى التمريرات ممكنة.",
    "en": "• Use passes to open gaps in the defence before shooting.\n• Don’t shoot from far away without a clear angle.\n• Choose an attacking formation when you kick off and a defensive one when your opponent does.\n• Keep your players close together so passes stay possible."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3.\n• اتفقوا قبل البدء على عدد الأهداف المطلوبة للفوز.",
    "en": "• Format: single elimination.\n• Series: best of 3.\n• Agree the number of goals needed to win beforehand."
   }
  }
 ],
 "bounce": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 2 إلى 5 دقائق\nخصمان عشوائيان أو صديق",
    "en": "Approx. length: 2–5 min\nMatched opponents or a friend"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "سباق توقيت ودقة: ترتد كرتك عبر مضمار من العوائق الملونة حتى خط النهاية.",
    "en": "A race of timing and precision: bounce your ball through a course of coloured obstacles to the finish."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "اعبر خط النهاية قبل منافسك.",
    "en": "Cross the finish line before your rival."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "لا يوجد تاريخ موثّق لهذه اللعبة، وهي من ألعاب المهارة والتوقيت التي انتشرت مع الهواتف الذكية.",
    "en": "There is no documented history for this game; it is one of the timing-and-skill games that spread with smartphones."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• تعلّم ترتيب الألوان في المضمار قبل أن تسرع.\n• اضغط بإيقاع ثابت بدل الضغط المتكرر.\n• لا تحاول تعويض الخطأ بسرعة؛ أعد المحاولة بهدوء من نقطة التفتيش.\n• ركّز على اللون القادم لا على اللون الحالي.",
    "en": "• Learn the colour order of the course before speeding up.\n• Tap at a steady rhythm instead of tapping repeatedly.\n• Don’t rush to make up for a mistake; retry calmly from the checkpoint.\n• Focus on the next colour, not the current one."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3 سباقات.\n• اتفقوا قبل البدء على المضمار نفسه للجميع إن أمكن.",
    "en": "• Format: single elimination.\n• Series: best of 3 races.\n• Agree on the same course for everyone if possible."
   }
  }
 ],
 "dice-party": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 دقائق\nلاعبان",
    "en": "Approx. length: 10 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة نرد لشخصين تشبه «يتزي»، تعتمد على اختيار التوليفات المناسبة.",
    "en": "A two-player dice game in the style of Yahtzee, about choosing the right combinations."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أنهِ 13 دوراً بأعلى مجموع نقاط.",
    "en": "Finish 13 turns with the highest total."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تشبه هذه اللعبة «يتزي» التي سوّقها إدوين لوي سنة 1956 بعد أن اشترى حقوقها من زوجين كنديين كانا يسميانها «لعبة اليخت». ثم اشترت شركة ميلتون برادلي حقوقها سنة 1973.",
    "en": "This game resembles Yahtzee, marketed by Edwin Lowe in 1956 after he bought it from a Canadian couple who called it the “yacht game”. Milton Bradley acquired it in 1973."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• احتفظ بالنرد المتشابه لبناء مجموعات أكبر.\n• لا تسجّل صفراً مبكراً إلا عند الضرورة.\n• انتبه إلى مكافأة القسم العلوي (35 نقطة فوق 62).\n• احتفظ بخانة «الفرصة» (⁦Chance⁩) للرمية السيئة.",
    "en": "• Keep matching dice to build bigger sets.\n• Don’t take a zero early unless you must.\n• Watch the upper-section bonus (35 points above 62).\n• Save the Chance box for a bad roll."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: مباراة واحدة من 13 دوراً، أو أفضل 3.\n• التعادل: مباراة قصيرة إضافية.",
    "en": "• Format: single elimination.\n• Series: one 13-turn game, or best of 3.\n• Tie: an extra short game."
   }
  }
 ],
 "carrom": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 20 دقيقة\nلاعبان أو فريقان",
    "en": "Approx. length: 10–20 min\n2 players or two teams"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة لوحية هندية الأصل، منتشرة في الشرق الأوسط، تجمع بين البلياردو والشفل بورد.",
    "en": "A board game from India, popular across the Middle East, mixing pool and shuffleboard."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أدخل جميع قطعك، ومنها الملكة، في الجيوب قبل خصمك.",
    "en": "Pocket all your discs, including the Queen, before your opponent."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "يُعتقد أن الكيرم نشأ في الهند، ويُقال إنه كان يُلعب في قصور الأمراء. ثم انتشر في جنوب آسيا والشرق الأوسط، وصار له اتحادات وبطولات دولية.",
    "en": "Carrom is believed to have started in India, where it is said to have been played in princely palaces. It spread across South Asia and the Middle East and now has federations and international tournaments."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• ابدأ بتحريك القطع المتجمعة عند المركز لتفتح مساحة.\n• لا تدخل الملكة إلا وأنت قادر على «تغطيتها» في الضربة التالية.\n• تجنب إدخال المضرب في الجيب لأنه يُفقدك الدور.\n• وجّه القطع إلى الجيب البعيد عن خصمك.",
    "en": "• Start by breaking up the cluster in the centre to open space.\n• Only pocket the Queen if you can cover it on the next shot.\n• Avoid pocketing the striker, which costs you the turn.\n• Aim pieces toward the pocket far from your opponent."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر، أو فرق من لاعبين في نمط الفريقين.\n• المواجهة: أفضل 3 مباريات.\n• اتفقوا قبل البدء على النمط (كيرم أو بول أو نقاط).",
    "en": "• Format: single elimination, or teams of two in team mode.\n• Series: best of 3 games.\n• Agree the mode (Carrom, Pool or Points) beforehand."
   }
  }
 ],
 "wordbox": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nمن 2 إلى 4 لاعبين",
    "en": "Approx. length: 5–10 min\n2–4 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة كلمات: صِل الحروف المتجاورة لتكوّن أطول الكلمات الممكنة.",
    "en": "A word game: connect neighbouring letters to build the longest words."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "تفوّق على الآخرين بكلمات أطول وأعلى نقاطاً.",
    "en": "Out-score the others with longer, higher-scoring words."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تشبه هذه اللعبة «بوغل»، التي ابتكرها آلان توروف سنة 1972 وأصدرتها شركة باركر براذرز سنة 1973.",
    "en": "This game resembles Boggle, invented by Allan Turoff in 1972 and released by Parker Brothers in 1973."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• ابحث أولاً عن الكلمة الأطول لأنها تمنحك نقاطاً أكثر.\n• استفد من المربع الأزرق الذي يضيف 3 نقاط.\n• ابحث عن اللواحق والبوادئ الشائعة لتطيل الكلمة.\n• لا تضيّع الوقت في كلمة قصيرة إن كان بين يديك احتمال أطول.",
    "en": "• Look for the longest word first, since it scores more.\n• Use the blue bonus tile that adds 3 points.\n• Look for common prefixes and suffixes to lengthen a word.\n• Don’t waste time on a short word if a longer one is within reach."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر في المواجهات الثنائية بنظام أفضل 3 جولات.\n• في طاولات من 3 إلى 4 لاعبين: يخرج صاحب أقل نقاط في كل جولة.\n• اتفقوا قبل البدء على لغة الكلمات المقبولة.",
    "en": "• Format: single elimination for 1v1, best of three rounds.\n• In tables of 3–4 players, the lowest scorer leaves each round.\n• Agree beforehand on the accepted word language."
   }
  }
 ],
 "plox": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 3 إلى 8 دقائق\nلاعبان",
    "en": "Approx. length: 3–8 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة كتل أركيد لشخصين: طابق الألوان وأرسل كتلاً مزعجة إلى منافسك.",
    "en": "A two-player arcade block game: match colours and send junk blocks to your rival."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "ابقَ آخر لاعب صامداً؛ فمن تمتلئ لوحته حتى الأعلى يخسر.",
    "en": "Be the last player standing; you lose if your board fills to the top."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ترجع ألعاب الكتل المتساقطة إلى «تتريس» التي ابتكرها أليكسي باجيتنوف سنة 1984. وفكرة إرسال كتل مزعجة إلى الخصم عند تكوين السلاسل اشتهرت مع لعبة «بويو بويو» اليابانية سنة 1991.",
    "en": "Falling-block games trace back to Tetris, created by Alexey Pajitnov in 1984. The idea of sending junk blocks to your rival when you chain matches became famous with Japan’s Puyo Puyo in 1991."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• كوّن سلاسل متتالية، فهي ترسل كتلاً أكثر إلى خصمك.\n• أبقِ اللوحة منخفضة ومنظّمة.\n• فعّل خيار «الشبح» (⁦Ghost⁩) لتعرف موضع سقوط الكتلة.\n• لا تحجز مساحة كبيرة لسلسلة واحدة إذا كان الخطر قريباً.",
    "en": "• Build chains; they send more junk to your rival.\n• Keep the board low and tidy.\n• Turn on the Ghost option to see where a block will land.\n• Don’t reserve a big area for one chain if danger is near."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3.\n• اتفقوا قبل البدء على خيار «الشبح» ليكون نفسه للجميع.",
    "en": "• Format: single elimination.\n• Series: best of 3.\n• Agree on the Ghost option so it is the same for everyone."
   }
  }
 ],
 "disc-o": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nلاعبان",
    "en": "Approx. length: 5–10 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة استراتيجية بالأدوار تمزج بين الشفل بورد وهوكي الهواء.",
    "en": "A turn-based strategy game that blends shuffleboard and air hockey."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "اجمع نقاطاً أكثر بإبقاء أقراصك في منطقة التسجيل وإخراج أقراص خصمك منها.",
    "en": "Score more by keeping your discs in the scoring zone and knocking your rival’s out."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "الشفل بورد لعبة قديمة يُقال إنها عُرفت في إنجلترا في القرن الخامس عشر، أما هوكي الهواء فظهرت في مطلع سبعينيات القرن العشرين. وتجمع هذه اللعبة بين الفكرتين.",
    "en": "Shuffleboard is an old game said to have been known in England in the 15th century, while air hockey appeared in the early 1970s. This game blends the two ideas."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• استخدم الأقراص الكبيرة لإزاحة أقراص الخصم لأنها أثقل.\n• لا تُسرع بإطلاق كل أقراصك؛ احتفظ بالأخيرة لضربة حاسمة.\n• استهدف المنطقة المضاعفة إن كانت مفعّلة.\n• فكّر في موضع قرصك بعد الاصطدام لا قبله.",
    "en": "• Use the bigger discs to push away your rival’s, since they are heavier.\n• Don’t fire all your discs quickly; keep the last for a decisive shot.\n• Aim for the bonus zone if it is enabled.\n• Think about where your disc ends up after the collision, not before."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3.\n• اتفقوا قبل البدء على تفعيل منطقة المكافأة المشتركة أو إلغائها.",
    "en": "• Format: single elimination.\n• Series: best of 3.\n• Agree whether the shared bonus zone is on or off."
   }
  }
 ],
 "bingo": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nمن 2 إلى 15 لاعباً",
    "en": "Approx. length: 5–10 min\n2–15 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة حظ جماعية على الطريقة الأمريكية بـ75 كرة.",
    "en": "A group game of chance, American style, with 75 balls."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول من يكمل نمطاً رابحاً ويضغط «بينغو!».",
    "en": "Be the first to complete a winning pattern and press BINGO!"
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "يُقال إن أصل اللعبة يعود إلى لعبة «اللوتو» الإيطالية في القرن السادس عشر. وفي سنة 1929 قدّم إدوين لوي في الولايات المتحدة نسخة باسم «بينو»، ثم صارت تُعرف باسم «بينغو».",
    "en": "The game is said to descend from the Italian lottery game in the 16th century. In 1929 Edwin Lowe introduced a version called “Beano” in the United States, which came to be known as Bingo."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• انتبه جيداً ولا تفوّت أي رقم، فالسرعة في التأشير تصنع الفرق.\n• لا تؤشر رقماً خاطئاً؛ فهذا يمنع ظهور زر الفوز.\n• تتبّع النمط الأقرب إلى الاكتمال على بطاقتك.\n• ركّز على بطاقتك وحدها حتى لا يشتتك اللاعبون الآخرون.",
    "en": "• Stay alert and don’t miss a number; quick marking makes the difference.\n• Don’t mark a wrong number; it stops the win button from appearing.\n• Track the pattern closest to completion on your card.\n• Focus on your own card so other players don’t distract you."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: جولات متعددة بنقاط مجموعة، أو طاولات يتأهل فيها الأول.\n• اتفقوا قبل البدء على نمط الفوز (خط أو بطاقة كاملة).\n• التعادل: جولة إضافية.",
    "en": "• Format: several rounds with accumulated points, or tables where the winner advances.\n• Agree the winning pattern (line or Blackout) beforehand.\n• Tie: an extra round."
   }
  }
 ],
 "blitz-league": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 3 إلى 6 دقائق\nلاعبان",
    "en": "Approx. length: 3–6 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "مبارزة فورية: أرسل جنودك عبر المسارات لتحطيم قاعدة خصمك.",
    "en": "A real-time duel: send units down the lanes to wreck your rival’s base."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أنزل نقاط حياة قاعدة العدو إلى الصفر.",
    "en": "Take the enemy base’s HP down to zero."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "لا يوجد تاريخ موثّق لهذه اللعبة. وهي من ألعاب إرسال الوحدات وتدمير القاعدة التي ازدهرت في الألعاب الإلكترونية.",
    "en": "There is no documented history for this game. It belongs to the family of send-units-and-destroy-the-base games that grew with video games."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• وزّع وحداتك على أكثر من مسار حتى لا يسد الخصم طريقك.\n• استعمل الوحدات الثقيلة لدفع الوحدات الخفيفة.\n• اجمع القنابل والتسريع بإرسالها إلى قاعدة العدو.\n• راقب أضعف مسار عند الخصم واهجم منه.",
    "en": "• Spread your units across lanes so your rival can’t block you.\n• Use heavy units to push back light ones.\n• Collect Bombs and Accelerate by sending them to the enemy base.\n• Watch for the rival’s weakest lane and attack there."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3.\n• اتفقوا قبل البدء على الأنماط الخاصة إن وُجدت.",
    "en": "• Format: single elimination.\n• Series: best of 3.\n• Agree any special modes beforehand."
   }
  }
 ],
 "archery": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 3 إلى 5 دقائق\nخصم واحد",
    "en": "Approx. length: 3–5 min\nOne opponent"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "رماية بسيطة: اسحب لتصوّب، وراعِ الرياح والمسافة.",
    "en": "Simple archery: drag to aim, and account for wind and distance."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "اجمع نقاطاً أكثر من خصمك بإصابة الأهداف.",
    "en": "Score more than your opponent by hitting the targets."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "القوس والسهم من أقدم أدوات الإنسان، واستُخدما للصيد والحرب منذ آلاف السنين. وأُدرجت الرماية في الألعاب الأولمبية سنة 1900 في باريس، وعادت إليها بصورتها الحديثة سنة 1972.",
    "en": "The bow and arrow are among humanity’s oldest tools, used for hunting and war for thousands of years. Archery entered the Olympics in Paris in 1900 and returned in its modern form in 1972."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• حدّد اتجاه الرياح قبل أن تسحب القوس.\n• صوّب أعلى قليلاً كلما بعد الهدف.\n• اسحب بهدوء، ولا تفلت السهم في عجلة.\n• كرّر الوضع نفسه في الرميات التي أصبتَ فيها.",
    "en": "• Check the wind direction before you draw.\n• Aim a little higher the farther the target is.\n• Draw calmly and don’t release in a hurry.\n• Repeat the same setup on shots that hit."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: عدد ثابت من الجولات، والأعلى مجموعاً يفوز.\n• التعادل: رمية فاصلة واحدة.",
    "en": "• Format: single elimination.\n• Series: a fixed number of rounds, highest total wins.\n• Tie: one deciding shot."
   }
  }
 ],
 "skeeball": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 دقائق\nلاعبان",
    "en": "Approx. length: 5 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة الملاهي الكلاسيكية: دحرج الكرات على مسار مائل نحو ثقوب التسجيل.",
    "en": "The arcade classic: roll balls up an inclined lane into scoring holes."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "اجمع أعلى النقاط بإدخال الكرات في الثقوب.",
    "en": "Score the most by sinking balls into the holes."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ابتكر جوزيف سيمبسون هذه اللعبة في مدينة فيلادلفيا الأمريكية نحو سنة 1908، وانتشرت في ملاهي الشواطئ والمدن الترفيهية.",
    "en": "Joseph Simpson devised this game in Philadelphia around 1908, and it spread through seaside and amusement-park arcades."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• لا تطارد الثقب الأعلى دائماً؛ الثبات في الثقوب المتوسطة يعطيك مجموعاً جيداً.\n• اضبط القوة بحيث تصل الكرة إلى الثقب لا أبعد منه.\n• استفد من الثقب المضاعف قبل أن ينتقل.\n• حافظ على الحركة نفسها في كل رمية.",
    "en": "• Don’t always chase the top hole; steady mid-value holes add up.\n• Set the power so the ball reaches the hole, not beyond it.\n• Use the multiplier hole before it moves.\n• Keep the same motion on every throw."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: مباراة من 3 جولات، أو أفضل 3 مباريات.\n• اتفقوا قبل البدء على تفعيل المضاعِفات أو إلغائها.",
    "en": "• Format: single elimination.\n• Series: one 3-round game, or best of 3 games.\n• Agree whether multipliers are on or off."
   }
  }
 ],
 "4-in-a-row": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 3 إلى 8 دقائق\nلاعبان",
    "en": "Approx. length: 3–8 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة استراتيجية لشخصين تشبه «كونكت 4» على شبكة من 7 أعمدة و6 صفوف.",
    "en": "A two-player strategy game like Connect 4, on a 7-column, 6-row grid."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول من يصل إلى أربع قطع متتالية أفقياً أو عمودياً أو قطرياً.",
    "en": "Be the first to line up four pieces in a row, column or diagonal."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "أصدرت شركة ميلتون برادلي «كونكت فور» سنة 1974 من ابتكار هاوارد ويكسلر ونيد سترونغين. وفي سنة 1988 أثبتت حسابات حاسوبية أن اللاعب الأول يستطيع الفوز دائماً إذا لعب بلا أخطاء.",
    "en": "Milton Bradley released Connect Four in 1974, created by Howard Wexler and Ned Strongin. In 1988 computer analysis showed that the first player can always win with perfect play."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• ابدأ بالعمود الأوسط، فهو يمنحك أكبر عدد من الاحتمالات.\n• احجب خطوط الخصم قبل أن تكتمل بثلاث قطع.\n• ابحث عن «التهديد المزدوج» الذي يفتح لك خطّين رابحين معاً.\n• فكّر في القطعة التي ستسقط فوق قطعتك قبل أن تلعب.",
    "en": "• Start in the middle column; it gives the most possibilities.\n• Block your rival’s lines before they reach three.\n• Look for a double threat that opens two winning lines at once.\n• Think about which piece will land on top of yours before you play."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3، وأفضل 5 في النهائي.\n• تبديل البداية: يبدأ اللاعبان بالتناوب بين المباريات.",
    "en": "• Format: single elimination.\n• Series: best of 3, best of 5 in the final.\n• Starting turn: alternate who starts between games."
   }
  }
 ],
 "dominoes": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 15 دقيقة\nلاعبان",
    "en": "Approx. length: 10–15 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة بـ28 قطعة لشخصين: طابق عدد النقاط على طرف السلسلة وتخلص من قطعك قبل خصمك.",
    "en": "A 28-tile game for two: match the pips at the open end and shed your tiles before your opponent."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول من يصل إلى نقاط الهدف (20 أو 50 أو 100).",
    "en": "Be the first to reach the target score (20, 50 or 100)."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "أقدم دومينو معروف جاء من الصين في عهد أسرة سونغ. أما الدومينو الأوروبي الحديث فظهر في فرنسا في منتصف القرن الثامن عشر، وسُجّل اسمه سنة 1762، ثم انتشر إلى بريطانيا وإيطاليا والنمسا وألمانيا. ولا يوجد دليل مؤكد على صلة بين الدومينو الصيني والأوروبي.",
    "en": "The oldest known dominoes come from China under the Song dynasty. Modern European dominoes appeared in France in the mid-18th century, with the name recorded in 1762, then spread to Britain, Italy, Austria and Germany. There is no firm evidence linking the Chinese and European forms."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• تذكّر القطع التي نزلت، واستنتج ما بقي مع خصمك.\n• تخلّص من القطع الثقيلة مبكراً، فنقاطها تنقلب عليك إن انتهت الجولة.\n• احتفظ بأرقام متنوعة لتبقى خياراتك مفتوحة.\n• تجنّب فتح رقم عندك منه قطع قليلة، فهذا يساعد خصمك.",
    "en": "• Track the tiles played and deduce what your opponent holds.\n• Shed heavy tiles early; their points count against you if the round ends.\n• Keep varied numbers so your options stay open.\n• Avoid opening a number you hold few of; it helps your opponent."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3، وأفضل 5 في النهائي لأن للحظ دوراً أكبر.\n• اتفقوا قبل البدء على النمط (⁦Draw⁩ أو ⁦Blocked⁩ أو ⁦All Fives⁩) ونقاط الهدف.",
    "en": "• Format: single elimination.\n• Series: best of 3, best of 5 in the final since luck plays a bigger part.\n• Agree the mode (Draw, Blocked or All Fives) and the target score beforehand."
   }
  }
 ],
 "backgammon": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 25 دقيقة\nلاعبان",
    "en": "Approx. length: 10–25 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة لوحية قديمة لشخصين تجمع بين الحظ والتخطيط، مع دردشة مباشرة.",
    "en": "A classic two-player board game of luck and planning, with live chat."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أخرج قطعك الخمس عشرة كلها من اللوحة قبل خصمك.",
    "en": "Bear all 15 of your checkers off the board before your opponent."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تُعد طاولة الزهر من أقدم الألعاب المعروفة، ويُقال إن جذورها تعود إلى بلاد الرافدين منذ نحو خمسة آلاف سنة، وإن «اللعبة الملكية في أور» من أسلافها المحتملة. وعُرفت عند الرومان باسم «تابولا»، وفي العالم العربي باسم «الطاولة»، وأُضيف مكعب المضاعفة إليها في عشرينيات القرن العشرين في الولايات المتحدة.",
    "en": "Backgammon is one of the oldest known games; its roots are said to go back about five thousand years to Mesopotamia, with the Royal Game of Ur a possible ancestor. The Romans knew a version called Tabula, the Arab world calls it Tawla, and the doubling cube was added in the United States in the 1920s."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• لا تترك قطعة منفردة قريبة من قطع خصمك إن استطعت.\n• كوّن «جسراً» من قطعتين أو أكثر لتسد طريق خصمك.\n• لا تقبل مضاعفة الرهان إلا إذا كانت فرصك قوية.\n• أدخل قطعك إلى منطقتك الداخلية بتنظيم قبل بدء الإخراج.",
    "en": "• Avoid leaving a lone checker near your rival’s pieces.\n• Build points with two or more checkers to block your rival.\n• Accept a double only if your chances are strong.\n• Bring your checkers into your home board in good order before bearing off."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: مباراة إلى 1 أو 3 أو 5 أو 9 نقاط، وتُحدد قبل البدء.\n• اتفقوا على استخدام مكعب المضاعفة أو عدم استخدامه.",
    "en": "• Format: single elimination.\n• Series: a match to 1, 3, 5 or 9 points, set before starting.\n• Agree whether to use the doubling cube."
   }
  }
 ],
 "voice": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "بلا مدة محددة\nتواصل اجتماعي\nعدد مفتوح",
    "en": "No fixed length\nSocial\nOpen number"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "مساحة للدردشة الصوتية والتعرف على لاعبين من أنحاء العالم.",
    "en": "A space for voice chat and meeting players from around the world."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "ليست لعبة فوز وخسارة، بل مكان للتواصل.",
    "en": "Not a win-or-lose game; it is a place to connect."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "لا يوجد تاريخ للعبة، فهي غرفة للتواصل الصوتي بين اللاعبين.",
    "en": "There is no game history here; it is a voice-chat room for players."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• كن لطيفاً مع من لا تعرفه.\n• استعمل الحظر والإبلاغ عند الحاجة.\n• قدّم نفسك قبل أن تبدأ الحديث.\n• لا تشارك معلومات شخصية.",
    "en": "• Be kind to people you don’t know.\n• Use block and report when you need to.\n• Introduce yourself before starting to talk.\n• Don’t share personal information."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• يمكن استخدامها للتنسيق بين فرق البطولة قبل المباريات.\n• احترموا مواعيد المباريات وتواصلوا بأدب.",
    "en": "• It can be used to coordinate tournament teams before matches.\n• Respect match times and communicate politely."
   }
  }
 ],
 "cribbage": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 15 إلى 25 دقيقة\nلاعبان",
    "en": "Approx. length: 15–25 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة ورق لشخصين يُحتسب فيها النقاط بأوتاد على لوح خاص.",
    "en": "A two-player card game scored with pegs on a special board."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول من يصل إلى 121 نقطة.",
    "en": "Be the first to reach 121 points."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "يُنسب اختراع الكريبيج إلى الشاعر الإنجليزي السير جون ساكلينغ في أوائل القرن السابع عشر. وتميّزت اللعبة بلوح التسجيل ذي الثقوب الذي لا يزال يُستخدم حتى اليوم.",
    "en": "The invention of cribbage is credited to the English poet Sir John Suckling in the early 17th century. It is known for its peg-and-hole scoring board, still used today."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• احتفظ بأوراق مجموعها 15 أو تُكوّن متتالية عند الإلقاء إلى «الكريب».\n• عندما تكون صاحب الكريب فاحتفظ بأوراق متكاملة ترفع مجموعه.\n• لا تتجاوز 31 في العدّ.\n• تعلّم حساب نقاط اليد بسرعة حتى لا تفوّت نقاطاً.",
    "en": "• Keep cards that make 15 or runs when discarding to the crib.\n• When the crib is yours, discard cards that work together.\n• Don’t go over 31 in the count.\n• Learn to count hand points quickly so you don’t miss any."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: مباراة واحدة إلى 121، أو أفضل 3.\n• اتفقوا قبل البدء على اللعب المباشر أو بالأدوار.",
    "en": "• Format: single elimination.\n• Series: one game to 121, or best of 3.\n• Agree on live or turn-based play beforehand."
   }
  }
 ],
 "bankroll": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 20 إلى 45 دقيقة\nمن 2 إلى 4 لاعبين",
    "en": "Approx. length: 20–45 min\n2–4 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة لوحية للتجارة العقارية على روح «مونوبولي».",
    "en": "A property-trading board game in the spirit of Monopoly."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول من يبلغ ثروة محددة (3000 أو 5000 أو 7000)، أو آخر من يبقى.",
    "en": "Be the first to reach a set net worth (3,000, 5,000 or 7,000), or the last one left."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تعود هذه الألعاب إلى «لعبة المالك» التي سجّلتها إليزابيث ماجي سنة 1904. وفي سنة 1935 أصدرت شركة باركر براذرز لعبة «مونوبولي» بنسخة تشارلز دارو، فانتشرت عالمياً.",
    "en": "Games like this go back to The Landlord’s Game, patented by Elizabeth Magie in 1904. In 1935 Parker Brothers released Monopoly in Charles Darrow’s version, and it spread worldwide."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• اشتر العقارات التي تُكمل لك مجموعة اللون نفسه.\n• لا تنفق كل نقودك؛ احتفظ بسيولة لدفع الإيجارات.\n• ابدأ البناء بمجرد أن تملك كل مدن اللون.\n• تذكّر أن البيع يعيد 80% فقط من القيمة.",
    "en": "• Buy properties that complete a colour set.\n• Don’t spend all your cash; keep a reserve for rent.\n• Start building as soon as you own every city of a colour.\n• Remember that selling returns only 80% of the value."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات من 2 إلى 4 لاعبين يتأهل أولها.\n• حدّدوا قبل البدء عدد الجولات (30 أو 50 أو بلا حد) وهدف الثروة.\n• التعادل عند انتهاء الجولات: الأعلى ثروة يفوز.",
    "en": "• Format: tables of 2–4 players where the winner advances.\n• Set the number of rounds (30, 50 or unlimited) and the net-worth target beforehand.\n• If rounds run out in a tie, the highest net worth wins."
   }
  }
 ],
 "gin-rummy": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 20 دقيقة\nلاعبان",
    "en": "Approx. length: 10–20 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة ورق لشخصين تقوم على تكوين مجموعات ومتتاليات.",
    "en": "A two-player card game of building sets and runs."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول من يصل إلى 100 نقطة.",
    "en": "Be the first to reach 100 points."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ابتكر إلوود بيكر لعبة «جين رومي» سنة 1909 في مدينة بروكلين الأمريكية، وانتشرت انتشاراً واسعاً في ثلاثينيات القرن العشرين.",
    "en": "Elwood Baker devised Gin Rummy in 1909 in Brooklyn, and it became hugely popular in the 1930s."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• تخلّص من الأوراق العالية التي لا تتجمع مع غيرها.\n• راقب ما يلتقطه خصمك من كومة التخلص لتعرف خطته.\n• لا تطرق مبكراً إذا كانت يدك ضعيفة.\n• احتفظ بأوراق مترابطة تتيح لك أكثر من خيار.",
    "en": "• Discard high cards that don’t group with others.\n• Watch what your opponent picks from the discard pile to learn their plan.\n• Don’t knock early with a weak hand.\n• Keep connected cards that give you more than one option."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: مباراة إلى 100 نقطة، أو أفضل 3.\n• التعادل: جولة إضافية.",
    "en": "• Format: single elimination.\n• Series: a game to 100 points, or best of 3.\n• Tie: an extra round."
   }
  }
 ],
 "darts": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 15 دقيقة\nلاعبان",
    "en": "Approx. length: 5–15 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "رمي السهام ضد الأصدقاء أو خصوم عشوائيين.",
    "en": "Darts against friends or matched opponents."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أنزل مجموعك إلى صفر بالضبط (الإنهاء).",
    "en": "Bring your score down to exactly zero (the checkout)."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "يُحكى أن الجنود في العصور الوسطى في إنجلترا كانوا يرمون سهاماً قصيرة نحو قاعدة برميل أو جذع شجرة للتسلية. وتطورت اللعبة إلى لوحة بأرقام ثابتة، وصارت لعبة «501» من أشهر أنماطها في القرن العشرين.",
    "en": "It is told that medieval English soldiers threw short darts at the base of a barrel or a tree trunk for fun. The game evolved into a numbered board, and 501 became one of its best-known formats in the 20th century."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• سدّد نحو منطقة الـ20 الثلاثية في البداية لتخفض مجموعك بسرعة.\n• خطّط للإنهاء قبل أن تقترب من الصفر.\n• تجنّب تجاوز الصفر لأن الدور يُلغى ويعود مجموعك.\n• حافظ على وقفة ثابتة وحركة رمي واحدة.",
    "en": "• Aim at the treble 20 early to cut your score quickly.\n• Plan your checkout before you get close to zero.\n• Avoid going below zero, since the turn is void and your score resets.\n• Keep a steady stance and one throwing motion."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3، وأفضل 5 في النهائي.\n• اتفقوا قبل البدء على نقطة البداية (101 أو 301 أو 501) ونمط الإنهاء (سهل أو احترافي).",
    "en": "• Format: single elimination.\n• Series: best of 3, best of 5 in the final.\n• Agree the start score (101, 301 or 501) and the finish mode (Easy or Pro) beforehand."
   }
  }
 ],
 "go-fish": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nعدة لاعبين",
    "en": "Approx. length: 5–10 min\nSeveral players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة ورق عائلية سهلة: اطلب أوراقاً من الآخرين لتكوّن مجموعات.",
    "en": "An easy family card game: ask others for cards to build sets."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "اجمع أكبر عدد من «الكتب»، وهي أربع أوراق من الرتبة نفسها.",
    "en": "Collect the most “books”, each being four cards of the same rank."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "لا يُعرف مخترع اللعبة بدقة. وهي من أوراق الأطفال والعائلات التي شاعت في القرن العشرين، وتُشبه ألعاباً قديمة مثل «العائلات السعيدة» البريطانية.",
    "en": "The inventor of the game is not known for sure. It is a children’s and family card game that became common in the 20th century, resembling older games such as Britain’s Happy Families."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• تذكّر ما طلبه الآخرون وما أجابوا به.\n• اطلب الرتبة التي تملك منها أكثر من ورقة.\n• لا تُظهر رتبتك الأضعف في طلباتك.\n• تابع الأوراق التي يجمعها خصومك لتعرف أين تسأل.",
    "en": "• Remember what others asked for and how they answered.\n• Ask for ranks you hold more than one of.\n• Don’t reveal your weaker ranks in your requests.\n• Watch which cards your rivals collect so you know where to ask."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات يتأهل أولها.\n• اتفقوا على عدد اللاعبين في كل طاولة.\n• التعادل في عدد الكتب: جولة قصيرة إضافية.",
    "en": "• Format: tables where the winner advances.\n• Agree the number of players per table.\n• Tie on books: a short extra round."
   }
  }
 ],
 "chess": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 30 دقيقة\nلاعبان",
    "en": "Approx. length: 10–30 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة استراتيجية لشخصين على رقعة 8×8، لكل لاعب 16 قطعة. يحسمها التفكير والتخطيط لا الحظ.",
    "en": "A two-player strategy game on an 8×8 board, 16 pieces each. Thinking and planning decide it, not luck."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "حاصر ملك الخصم بحيث لا يستطيع الهرب (كش مات).",
    "en": "Trap your opponent’s king so that it cannot escape (checkmate)."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ظهرت اللعبة في الهند قبل نحو 1500 سنة باسم «تشاتورانغا»، ثم انتقلت إلى بلاد فارس فالعالم العربي، ومنه إلى أوروبا. وفي أواخر القرن الخامس عشر صارت الوزيرة والفيل أقوى قطعتين، فاستقرت اللعبة على شكلها الحالي. وأُقيمت أول بطولة عالمية رسمية سنة 1886.",
    "en": "The game appeared in India about 1,500 years ago as Chaturanga, then moved to Persia and the Arab world, and from there to Europe. In the late 15th century the queen and bishop became the strongest pieces, giving the game its present form. The first official world championship was held in 1886."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• سيطر على مركز الرقعة بالبيادق والقطع.\n• طوّر الحصان والفيل قبل الهجوم، ولا تكثر من تحريك الوزيرة في البداية.\n• قم بالتبييت مبكراً ليكون ملكك آمناً.\n• قبل كل نقلة اسأل نفسك: هل تهدد قطعتي، أو تفتح ثغرة لخصمي؟",
    "en": "• Control the centre with pawns and pieces.\n• Develop knights and bishops before attacking, and don’t move the queen too much early.\n• Castle early to keep your king safe.\n• Before every move ask: does it threaten my piece, or open a hole for my opponent?"
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر، أو سويسري إذا كثر المشاركون.\n• المواجهة: أفضل 3 في الأدوار الأخيرة، مع تبديل لون البداية بين المباريات.\n• التعادل: مباراة حاسمة بوقت أقصر.\n• اتفقوا قبل البدء على وقت التفكير إن كان اللعب مباشراً.",
    "en": "• Format: single elimination, or Swiss if there are many entrants.\n• Series: best of 3 in the late rounds, swapping colours between games.\n• Tie: a shorter decider game.\n• Agree the time control beforehand if playing live."
   }
  }
 ],
 "sea-battle": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 15 دقيقة\nلاعبان",
    "en": "Approx. length: 10–15 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة التخمين البحرية الكلاسيكية على شبكة 10×10.",
    "en": "The classic naval guessing game on a 10×10 grid."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أغرق جميع سفن خصمك قبل أن يغرق سفنك.",
    "en": "Sink all your opponent’s ships before they sink yours."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "كانت اللعبة تُلعب بالورقة والقلم قبل أن تُصنَّع تجارياً. وصدرت نسخة «سالفو» سنة 1931، ثم أصدرت شركة ميلتون برادلي لعبة «باتل شيب» بقطع بلاستيكية سنة 1967.",
    "en": "The game was played with pencil and paper before it was manufactured. A version called Salvo appeared in 1931, and Milton Bradley released Battleship with plastic pieces in 1967."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• وزّع سفنك بحيث لا تكون متجاورة كلها.\n• بعد إصابة، جرّب المربعات المجاورة لإكمال السفينة.\n• استهدف الشبكة بنمط شبكي (مربع بعد مربع) لتوفر محاولاتك.\n• غيّر مواضع سفنك في كل مباراة حتى لا يتعلم خصمك نمطك.",
    "en": "• Spread your ships so they are not all next to each other.\n• After a hit, try neighbouring squares to finish the ship.\n• Search the grid in a checkerboard pattern to save shots.\n• Change your ship positions each game so your rival can’t learn your pattern."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3.\n• اتفقوا قبل البدء على استخدام التوزيع العشوائي أو اليدوي.",
    "en": "• Format: single elimination.\n• Series: best of 3.\n• Agree whether random or manual placement is used."
   }
  }
 ],
 "spades": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 20 إلى 40 دقيقة\n4 لاعبين في فريقين",
    "en": "Approx. length: 20–40 min\n4 players in two teams"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة ورق لأربعة لاعبين في فريقين، تقوم على حصد «الأكلات».",
    "en": "A four-player, two-team trick-taking card game."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول فريق يبلغ 100 أو 200 أو 500 نقطة حسب الإعدادات.",
    "en": "Be the first team to reach 100, 200 or 500 points, per the settings."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ظهرت «سبيدز» في الولايات المتحدة في ثلاثينيات القرن العشرين تقريباً، وهي متفرعة عن لعبة «ويست» الإنجليزية القديمة.",
    "en": "Spades appeared in the United States around the 1930s and descends from the older English game Whist."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• قدّر عدد أكلاتك بتحفظ، فالنقص في الرهان أخف من الزيادة.\n• تعاون مع شريكك في تغطية الأكلات.\n• لا تبدأ بورقة الأسبيد قبل أن تُكسر.\n• راقب الأوراق الكبيرة التي نزلت لتعرف ما بقي.",
    "en": "• Estimate your tricks conservatively; missing a bid hurts.\n• Work with your partner to cover tricks.\n• Don’t lead a spade until they are broken.\n• Track the high cards played to know what remains."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر بين الفرق.\n• المواجهة: أفضل 3، والنهائي أفضل 5.\n• اتفقوا قبل البدء على نقاط الهدف (100 أو 200 أو 500).",
    "en": "• Format: single elimination between teams.\n• Series: best of 3, the final best of 5.\n• Agree the target score (100, 200 or 500) beforehand."
   }
  }
 ],
 "mancala": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nلاعبان",
    "en": "Approx. length: 5–10 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة قديمة لشخصين تُوزَّع فيها البذور على الحفر بالتناوب.",
    "en": "An ancient two-player game of sowing seeds around pits in turn."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "اجمع أكبر عدد من البذور في مخزنك.",
    "en": "Collect the most seeds in your store."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "المنقلة عائلة من الألعاب القديمة المنتشرة في إفريقيا والشرق الأوسط وآسيا، وتتعدد الروايات حول أصلها. ويُقال إن اسمها مأخوذ من الكلمة العربية «نقل»، لأن اللاعب ينقل البذور بين الحفر.",
    "en": "Mancala is a family of ancient games found across Africa, the Middle East and Asia, with several accounts of its origin. Its name is said to come from the Arabic word for “moving”, since players move seeds between pits."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• ابحث عن حفرة تنتهي بك في مخزنك لتحصل على دور إضافي.\n• احسب موضع آخر بذرة قبل أن تختار.\n• ادخر بعض البذور في حفرك البعيدة للمراحل الأخيرة.\n• احمِ الحفر الممتلئة من الأسر.",
    "en": "• Look for a pit that ends in your store to earn another turn.\n• Count where the last seed lands before choosing.\n• Save some seeds in your far pits for the late stage.\n• Protect full pits from capture."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3، وأفضل 5 في النهائي.\n• تبديل البداية: يبدأ اللاعبان بالتناوب.",
    "en": "• Format: single elimination.\n• Series: best of 3, best of 5 in the final.\n• Starting turn: alternate who starts."
   }
  }
 ],
 "werewolf": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 15 إلى 30 دقيقة\n7 أو 9 لاعبين",
    "en": "Approx. length: 15–30 min\n7 or 9 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة استنتاج اجتماعي مباشرة (تُعرف أيضاً بالمافيا) مع دردشة.",
    "en": "A live social-deduction game (also called Mafia) with chat."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "فريق الخير يكشف كل الأشرار؛ وفريق الشر يخدع حتى يتساوى العدد.",
    "en": "The good team finds every evil player; the evil team deceives until the numbers are level."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ابتكر ديمتري دافيدوف لعبة «المافيا» سنة 1986 في جامعة موسكو الحكومية. ثم ابتكر أندرو بلوتكن نسخة «المستذئب» سنة 1997.",
    "en": "Dimitry Davidoff created Mafia in 1986 at Moscow State University. Andrew Plotkin then created the Werewolf variant in 1997."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• استمع قبل أن تتكلم، فالأخطاء في الأقوال تكشف الأشرار.\n• لا تتهم أحداً دون سبب واضح.\n• إذا كنت شريراً فشارك في النقاش ولا تصمت.\n• راقب من يغيّر موقفه فجأة.",
    "en": "• Listen before you speak; slips in statements reveal the evil players.\n• Don’t accuse anyone without a clear reason.\n• If you are evil, join the discussion and don’t stay silent.\n• Watch who suddenly changes position."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات متعددة، وكل طاولة تُحتسب نقاطها حسب فوز الفريق.\n• اتفقوا قبل البدء على الأدوار (قياسية أو عشوائية بالكامل).\n• اتفقوا على مدة النقاش والتصويت.",
    "en": "• Format: several tables, with points awarded to each table’s winning team.\n• Agree the roles (standard or all-random) beforehand.\n• Agree discussion and voting times."
   }
  }
 ],
 "dots-and-boxes": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nلاعبان",
    "en": "Approx. length: 5–10 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة الورقة والقلم الكلاسيكية لشخصين: سهلة التعلم وفيها خطط ذكية.",
    "en": "The classic pen-and-paper game for two: easy to learn, full of clever plans."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "استحوذ على مربعات أكثر من خصمك.",
    "en": "Claim more boxes than your opponent."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "وصف عالم الرياضيات الفرنسي إدوارد لوكاس هذه اللعبة سنة 1889 باسم «بيبوبيبيت».",
    "en": "The French mathematician Édouard Lucas described this game in 1889 under the name “la pipopipette”."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• تجنب رسم الضلع الثالث لأي مربع، فهذا يعطي خصمك المربع.\n• في المراحل الأخيرة، تعلّم «التضحية» بمربعين لتحصل على سلسلة أطول.\n• عدّ السلاسل الطويلة والقصيرة قبل نهاية اللعبة.\n• ابدأ بالأطراف ثم اتجه إلى الوسط.",
    "en": "• Avoid drawing the third side of any box, as it gives your opponent the box.\n• In the endgame, learn to sacrifice two boxes to win a longer chain.\n• Count long and short chains before the end of the game.\n• Start from the edges and move toward the middle."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3.\n• تبديل البداية: يبدأ اللاعبان بالتناوب.",
    "en": "• Format: single elimination.\n• Series: best of 3.\n• Starting turn: alternate who starts."
   }
  }
 ],
 "basketball": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 3 إلى 5 دقائق\nخصم واحد",
    "en": "Approx. length: 3–5 min\nOne opponent"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة تصويب سريعة: سجّل أكبر عدد من السلال قبل نهاية الوقت.",
    "en": "A quick shooting game: score as many baskets as you can before time runs out."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "سجّل سلالاً أكثر من خصمك.",
    "en": "Make more baskets than your opponent."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "اخترع جيمس نايسميث كرة السلة في شهر ديسمبر سنة 1891 في مدينة سبرينغفيلد بولاية ماساتشوستس، مستخدماً سلتين من الخوخ معلّقتين على الجدار.",
    "en": "James Naismith invented basketball in December 1891 in Springfield, Massachusetts, using two peach baskets nailed to a wall."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• حافظ على حركة التمرير نفسها في كل رمية.\n• لا تتسرع؛ الدقة تعطيك نقاطاً أكثر من السرعة.\n• اضبط القوة حسب بعد السلة.\n• استغل الثواني الأخيرة بتسديدات متتالية.",
    "en": "• Keep the same swipe motion on every shot.\n• Don’t rush; accuracy earns more than speed.\n• Set the power according to the basket’s distance.\n• Use the final seconds for rapid, consecutive shots."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: ثلاث جولات، والأعلى مجموعاً يفوز.\n• التعادل: جولة إضافية قصيرة.",
    "en": "• Format: single elimination.\n• Series: three rounds, highest total wins.\n• Tie: a short extra round."
   }
  }
 ],
 "cup-pong": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nعدة لاعبين",
    "en": "Approx. length: 5–10 min\nSeveral players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة فرق: ارمِ كرات صغيرة لتسقط في أكواب الفريق الآخر.",
    "en": "A team game: toss small balls so they land in the other side’s cups."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أزل جميع أكواب الفريق المنافس.",
    "en": "Clear all of the opposing team’s cups."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ظهرت كرة تنس الطاولة في إنجلترا في أواخر القرن التاسع عشر. أما ألعاب رمي الكرات الصغيرة في الأكواب فانتشرت بين طلاب الجامعات، ولا يوجد تاريخ موثّق لهذه اللعبة تحديداً.",
    "en": "Table tennis balls appeared in England in the late 19th century. Cup-toss games spread among university students, and there is no documented history for this exact game."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• استهدف الأكواب الأمامية أولاً.\n• اضبط القوة حسب بعد الكوب.\n• إدخال كرتين في كوب واحد يمنحك رميتين إضافيتين، فاستهدفه.\n• حافظ على الحركة نفسها في كل رمية.",
    "en": "• Aim at the front cups first.\n• Set the power by the distance of the cup.\n• Landing two balls in one cup earns two bonus shots, so go for it.\n• Keep the same motion on every throw."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر بين الفرق.\n• المواجهة: أفضل 3.\n• اتفقوا قبل البدء على عدد اللاعبين في كل فريق.",
    "en": "• Format: single elimination between teams.\n• Series: best of 3.\n• Agree the number of players per team beforehand."
   }
  }
 ],
 "bullshit": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 20 دقيقة\n4 لاعبين",
    "en": "Approx. length: 10–20 min\n4 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة ورق قائمة على الخداع: تخلّص من أوراقك بالكذب، أو اكشف الكاذبين.",
    "en": "A bluffing card game: shed your cards by lying, or catch the liars."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "تخلّص من جميع أوراقك بالخداع أو بكشف الآخرين.",
    "en": "Get rid of all your cards by deceit or by catching the others."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "لعبة ورق قديمة لا يُعرف مخترعها، وتُعرف بأسماء كثيرة مثل «تشيت» و«أنا أشك». ولا يوجد تاريخ موثّق دقيق لها.",
    "en": "An old card game with an unknown inventor, known by many names such as Cheat and I Doubt It. There is no precisely documented history."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• اكذب أحياناً وليس دائماً، فالنمط الثابت يُكشف.\n• راقب الأوراق التي ظهرت لتعرف إن كان أحدهم يكذب.\n• لا تتهم دون حساب؛ فالخسارة كبيرة إن أخطأت.\n• حافظ على ثبات وجهك.",
    "en": "• Lie sometimes, not always; a steady pattern gets exposed.\n• Track the cards that have appeared to know if someone is lying.\n• Don’t accuse carelessly; being wrong costs a lot.\n• Keep a steady face."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات من 4 لاعبين يتأهل أولها.\n• اتفقوا قبل البدء على تفعيل خيار «الذخيرة» أو إلغائه.\n• الترتيب: الأول من يتخلص من أوراقه.",
    "en": "• Format: tables of four where the winner advances.\n• Agree whether the Ammo option is on or off.\n• Ranking: first to empty their hand."
   }
  }
 ],
 "checkers": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 20 دقيقة\nلاعبان",
    "en": "Approx. length: 10–20 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة استراتيجية لشخصين على رقعة مربعات، ولها نسختان.",
    "en": "A two-player strategy game on a checkered board, in two variants."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أسر جميع قطع خصمك أو اتركه بلا حركة ممكنة.",
    "en": "Capture all your opponent’s pieces or leave them with no legal move."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تنحدر لعبة الداما من لعبة «ألكيرك» القديمة. وظهرت نسخة تُلعب على رقعة الشطرنج في فرنسا في القرن الثاني عشر تقريباً، ثم نشأت النسخة الدولية على رقعة 10×10 في فرنسا في القرن الثامن عشر.",
    "en": "Checkers descends from the ancient game Alquerque. A version played on a chessboard appeared in France around the 12th century, and the international 10×10 version developed in France in the 18th century."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• حافظ على الصف الخلفي أطول وقت ممكن لمنع التتويج.\n• سيطر على المركز بدل الأطراف.\n• التقاط القطع إلزامي، فاستغله لإجبار الخصم على فخ.\n• لا تتقدم بقطع منفردة.",
    "en": "• Keep your back row as long as possible to prevent kings.\n• Control the centre rather than the edges.\n• Capturing is mandatory, so use it to force your rival into a trap.\n• Don’t advance lone pieces."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر، أو سويسري إذا كثر المشاركون.\n• المواجهة: أفضل 3، مع تبديل لون البداية.\n• اتفقوا قبل البدء على النسخة (8×8 أو 10×10) وعلى وقت النقلة.",
    "en": "• Format: single elimination, or Swiss if there are many entrants.\n• Series: best of 3, swapping colours.\n• Agree the variant (8×8 or 10×10) and the move time beforehand."
   }
  }
 ],
 "truco": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 15 إلى 30 دقيقة\nلاعبان أو فريقان",
    "en": "Approx. length: 15–30 min\n2 players or two teams"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة ورق شائعة في أمريكا الجنوبية تجمع بين الرهان والخداع وحصد الأكلات.",
    "en": "A popular South American card game mixing betting, bluffing and tricks."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول فريق يبلغ النقاط المطلوبة (12 أو 15 أو 30 حسب النسخة).",
    "en": "Be the first team to reach the target (12, 15 or 30, by variant)."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "يُقال إن «تروكو» انحدرت من لعبة إسبانية قديمة، ثم انتقلت مع المهاجرين إلى الأرجنتين وأوروغواي والبرازيل، حيث تنوعت قواعدها.",
    "en": "Truco is said to descend from an old Spanish game and travelled with emigrants to Argentina, Uruguay and Brazil, where its rules diversified."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• استعمل «تروكو» عندما تملك ورقة قوية، وأحياناً عندما تخدع.\n• لا ترفع الرهان كثيراً إذا لم تكن واثقاً.\n• تعلّم ترتيب الأوراق في النسخة المختارة.\n• راقب سلوك خصمك عند ورقته الأولى.",
    "en": "• Call Truco when you hold a strong card, and sometimes to bluff.\n• Don’t raise too much if you aren’t confident.\n• Learn the card order in the chosen variant.\n• Watch your opponent’s behaviour at their first card."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر بين الفرق أو اللاعبين.\n• المواجهة: أفضل 3.\n• اتفقوا قبل البدء على النسخة (أرجنتينية أو غاوتشو أو ميناريو أو باوليستا).",
    "en": "• Format: single elimination between teams or players.\n• Series: best of 3.\n• Agree the variant (Argentinean, Gaúcho, Mineiro or Paulista) beforehand."
   }
  }
 ],
 "draw-together": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 دقائق\nرسام ومخمِّن",
    "en": "Approx. length: 5 min\nOne drawer, one guesser"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة رسم وتخمين مرحة مع صديق أو خصم عشوائي.",
    "en": "A playful draw-and-guess game with a friend or a matched opponent."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "ارسم المطلوب بوضوح يكفي ليخمّنه الطرف الآخر.",
    "en": "Draw your prompt clearly enough for the other player to guess it."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ابتكر روب أنجل لعبة «بيكشنري» سنة 1985 في مدينة سياتل الأمريكية، وانتشرت انتشاراً واسعاً بعد صدورها.",
    "en": "Rob Angel created Pictionary in 1985 in Seattle, and it spread widely after its release."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• ارسم الشكل العام أولاً ثم التفاصيل.\n• لا تضيّع الوقت في الزخرفة.\n• استخدم رموزاً بسيطة يفهمها الجميع.\n• قل لنفسك: ما أول شيء يخطر في بال المخمِّن؟",
    "en": "• Draw the overall shape first, then details.\n• Don’t waste time on decoration.\n• Use simple symbols everyone understands.\n• Ask yourself: what would the guesser think of first?"
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: جولات يتبادل فيها اللاعبان الدورين.\n• النقاط: مجموع النقاط في جميع الجولات.\n• اتفقوا قبل البدء على عدد الجولات.",
    "en": "• Format: rounds in which the two players swap roles.\n• Points: total points across all rounds.\n• Agree the number of rounds beforehand."
   }
  }
 ],
 "minesweepers": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nمن 2 إلى 4 لاعبين",
    "en": "Approx. length: 5–10 min\n2–4 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "نسخة متعددة اللاعبين من لعبة كاسحة الألغام الكلاسيكية.",
    "en": "A multiplayer version of classic Minesweeper."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "افتح أكبر عدد من المربعات الآمنة وتجنب الألغام؛ والأعلى نقاطاً يفوز عند اكتشاف الألغام كلها.",
    "en": "Open as many safe tiles as you can and avoid mines; the highest score wins once all mines are found."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "اشتهرت «كاسحة الألغام» حين أُدرجت ضمن نظام التشغيل ويندوز في تسعينيات القرن العشرين، لكن فكرتها أقدم من ذلك.",
    "en": "Minesweeper became famous when it was included in Windows in the 1990s, though the idea is older."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• ابدأ من الأرقام الصغيرة لأنها أسهل في الاستنتاج.\n• ضع علماً عند التأكد فقط.\n• لا تفوّت الدور لأن الخسارة 3 نقاط.\n• ابتعد عن المربع الذي اختاره الآخرون إن أردت نقاطاً كاملة.",
    "en": "• Start from small numbers; they are easier to deduce.\n• Place a flag only when you are sure.\n• Don’t miss a turn; it costs 3 points.\n• Avoid the tile others pick if you want full points."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات من 2 إلى 4 لاعبين يتأهل أولها.\n• النقاط: المربع الآمن +6، اللغم −12، تفويت الدور −3، العلم الصحيح +10.\n• اتفقوا قبل البدء على عدد اللاعبين في كل طاولة.",
    "en": "• Format: tables of 2–4 players where the winner advances.\n• Points: safe tile +6, mine −12, missed turn −3, correct flag +10.\n• Agree the number of players per table beforehand."
   }
  }
 ],
 "literati": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 15 إلى 30 دقيقة\nعدة لاعبين",
    "en": "Approx. length: 15–30 min\nSeveral players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة كلمات لوحية تبني فيها الكلمات من رقائق الحروف.",
    "en": "A board word game where you build words from letter tiles."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "تفوّق على خصمك بتكوين كلمات أعلى نقاطاً.",
    "en": "Out-score your opponent by forming higher-scoring words."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تشبه هذه اللعبة «سكرابل»، التي ابتكرها المهندس المعماري ألفريد بوتس سنة 1938، وسُمّيت «سكرابل» سنة 1948.",
    "en": "This game resembles Scrabble, created by the architect Alfred Butts in 1938 and named Scrabble in 1948."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• استخدم المربعات المضاعِفة مع الحروف عالية القيمة.\n• لا تحرق الحرف الفارغ على كلمة قصيرة.\n• لا تفتح للخصم ثغرة تضاعف نقاطه.\n• تعلّم الكلمات القصيرة ذات الحروف النادرة.",
    "en": "• Use bonus squares with high-value letters.\n• Don’t spend the blank on a short word.\n• Don’t open a hole that multiplies your opponent’s score.\n• Learn short words made of rare letters."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3.\n• اتفقوا قبل البدء على القاموس المعتمد للتحقق من الكلمات.",
    "en": "• Format: single elimination.\n• Series: best of 3.\n• Agree the dictionary used to verify words."
   }
  }
 ],
 "old-zombie": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\n4 لاعبين",
    "en": "Approx. length: 5–10 min\n4 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "نسخة الزومبي من لعبة «العانس»: لا تبقَ ممسكاً ببطاقة الزومبي.",
    "en": "A zombie twist on Old Maid: don’t be left holding the Zombie card."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كوّن أزواجاً وتخلّص من أوراقك، وتجنب أن تبقى معك ورقة الزومبي في النهاية.",
    "en": "Make pairs, shed your cards and avoid being left with the Zombie card at the end."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تنحدر اللعبة من لعبة «العانس» (⁦Old Maid⁩)، وهي لعبة ورق أوروبية الأصل يُرجَّح أنها شاعت في القرن التاسع عشر. ولا يوجد تاريخ موثّق للنسخة نفسها.",
    "en": "The game descends from Old Maid, a card game of European origin that probably became common in the 19th century. There is no documented history for this exact version."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• لا تُظهر انفعالاً عندما تسحب ورقة الزومبي.\n• حافظ على ثبات وجهك عندما يسحب منك الآخرون.\n• راقب من يتردد عند اختيار ورقة، فقد تكون معه ورقة مهمة.\n• تذكّر أن ترتيب أوراقك يُخلط بعد كل دور.",
    "en": "• Don’t show emotion when you draw the Zombie card.\n• Keep a steady face when others draw from you.\n• Watch who hesitates when choosing a card; they may hold something important.\n• Remember your hand is shuffled after each turn."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات من 4 لاعبين، وخاسر واحد في كل طاولة.\n• يتأهل الباقون إلى الدور التالي، أو تُجمع النقاط عبر عدة جولات.\n• اتفقوا قبل البدء على عدد الجولات.",
    "en": "• Format: tables of four, with one loser per table.\n• The rest advance, or points are collected over several rounds.\n• Agree the number of rounds beforehand."
   }
  }
 ],
 "big-two": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 20 دقيقة\n4 لاعبين",
    "en": "Approx. length: 10–20 min\n4 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة ورق للتخلص من الأوراق، صينية الأصل، وتُعرف في الفلبين باسم «بوسوي دوس».",
    "en": "A card-shedding game of Chinese origin, known in the Philippines as Pusoy Dos."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول من يتخلص من جميع أوراقه.",
    "en": "Be the first to get rid of all your cards."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "يُقال إن اللعبة صينية الأصل، ثم انتشرت في الفلبين وجنوب شرق آسيا ومنها إلى مناطق أخرى. ولا يوجد تاريخ موثّق دقيق لنشأتها.",
    "en": "The game is said to be of Chinese origin and spread to the Philippines, Southeast Asia and beyond. There is no precisely documented history of its beginnings."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• احتفظ بالأوراق القوية للنهاية.\n• تخلص من الأوراق المنفردة الضعيفة مبكراً.\n• لا تلعب الاثنين مبكراً دون ضرورة.\n• تذكّر الأوراق التي نزلت لتعرف ما بقي.",
    "en": "• Keep your strong cards for the end.\n• Shed weak single cards early.\n• Don’t play a 2 early without need.\n• Remember the cards played to know what remains."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات من 4 لاعبين يتأهل أولها أو أولها وثانيها.\n• اتفقوا قبل البدء على ورقة الافتتاح (3 ديناري أو 3 سباتي).\n• اتفقوا على ترتيب التوليفات.",
    "en": "• Format: tables of four where the winner (or top two) advances.\n• Agree the opening card (3 of Diamonds or 3 of Clubs).\n• Agree the combination ranking."
   }
  }
 ],
 "reversi": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nلاعبان",
    "en": "Approx. length: 5–10 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة لوحية استراتيجية بأقراص ذات وجهين على رقعة 8×8.",
    "en": "A strategy board game with two-sided discs on an 8×8 board."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "انهِ اللعبة وأكثر الأقراص ظاهرٌ بلونك. وتعادل العدد يعني تعادلاً.",
    "en": "Finish with more discs showing your colour. Equal counts mean a draw."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ظهرت «ريفرسي» في إنجلترا سنة 1883، ويُنسب ابتكارها إلى لويس واترمان أو جون موليت. ثم أعاد الياباني غورو هاسيغاوا إحياءها سنة 1971 باسم «أوثيلو».",
    "en": "Reversi appeared in England in 1883, credited to Lewis Waterman or John Mollett. The Japanese designer Goro Hasegawa revived it in 1971 under the name Othello."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• تمسّك بالزوايا لأنها لا تُقلب أبداً.\n• لا تقلب أقراصاً كثيرة مبكراً؛ فهذا يعطي خصمك خيارات.\n• احرص على أن يبقى لك عدد حركات كافٍ.\n• تجنّب الخانات المجاورة للزوايا إن كانت الزاوية فارغة.",
    "en": "• Hold the corners; they can never be flipped.\n• Don’t flip too many discs early; it gives your rival options.\n• Keep enough available moves for yourself.\n• Avoid squares next to empty corners."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3.\n• تبديل اللون: يبدأ اللاعبان بالتناوب لأن الأسود يلعب أولاً.",
    "en": "• Format: single elimination.\n• Series: best of 3.\n• Swap colours between games, since Black moves first."
   }
  }
 ],
 "hearts": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 15 إلى 30 دقيقة\n4 لاعبين",
    "en": "Approx. length: 15–30 min\n4 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة ورق لأربعة لاعبين هدفها تجنب النقاط.",
    "en": "A four-player trick-taking game whose aim is to avoid points."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أنهِ اللعبة بأقل نقاط. القلب بنقطة، وملكة البستوني بـ13.",
    "en": "Finish with the lowest score. Each heart is 1 point and the queen of spades 13."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تنتمي «القلوب» إلى عائلة ألعاب «ريفرسيس» الأوروبية القديمة، وصيغتها الحالية معروفة منذ القرن التاسع عشر. وزادت شهرتها مع إدراجها ضمن ويندوز في تسعينيات القرن العشرين.",
    "en": "Hearts belongs to the old European Reversis family of games, and its current form has been known since the 19th century. It gained fame when it was included in Windows in the 1990s."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• مرّر أوراقك العالية عند تبادل الأوراق.\n• تخلص من ملكة البستوني بتحريرها في أول فرصة.\n• فكّر في «إطلاق القمر» عندما تكون يدك قوية جداً.\n• راقب من يجمع القلوب حتى لا يفاجئك.",
    "en": "• Pass your high cards when swapping.\n• Get rid of the queen of spades at the first chance.\n• Consider “shooting the moon” when your hand is very strong.\n• Watch who collects hearts so you aren’t surprised."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات من 4 لاعبين، ويتأهل صاحب أقل نقاط.\n• اتفقوا قبل البدء على نقاط النهاية (100) وعلى تفعيل جاك الديناري (−10).\n• التعادل: جولة إضافية.",
    "en": "• Format: tables of four, with the lowest scorer advancing.\n• Agree the end score (100) and whether the jack of diamonds (−10) is used.\n• Tie: an extra round."
   }
  }
 ],
 "conquest": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 20 دقيقة\nلاعبان",
    "en": "Approx. length: 10–20 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة استراتيجية على خريطة العالم تغزو فيها الأقاليم برمي النرد.",
    "en": "A world-map strategy game where you invade territories by rolling dice."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "امتلك أكبر عدد من الأقاليم بعد 10 جولات.",
    "en": "Own the most territories after 10 rounds."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تشبه اللعبة «ريسك»، التي ابتكرها المخرج الفرنسي ألبير لاموريس سنة 1957 باسم «غزو العالم».",
    "en": "The game resembles Risk, created by the French filmmaker Albert Lamorisse in 1957 under the name “La Conquête du monde”."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• ركّز على أقاليم متجاورة لتسهل حمايتها.\n• لا تهاجم إلا بتفوق واضح في الوحدات.\n• اترك وحدات كافية على الحدود المكشوفة.\n• استخدم التعزيزات حيث يضعف خصمك.",
    "en": "• Focus on neighbouring territories so they are easy to protect.\n• Don’t attack unless you have clear superiority in units.\n• Leave enough units on exposed borders.\n• Use reinforcements where your rival is weak."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3.\n• اتفقوا قبل البدء على اللون الذي يبدأ لكل لاعب (الأحمر أو الأصفر).",
    "en": "• Format: single elimination.\n• Series: best of 3.\n• Agree who plays red or yellow before starting."
   }
  }
 ],
 "legions": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 5 إلى 10 دقائق\nلاعبان",
    "en": "Approx. length: 5–10 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة بطاقات استراتيجية تُلعب على لوحة معركة، وتقوم على الأسر.",
    "en": "A strategic card game played on a battleground board, built on capture."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "امتلك أكبر عدد من البطاقات بلونك على اللوحة بعد وضع جميع البطاقات.",
    "en": "Hold the most cards of your colour on the board once all cards are placed."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تشبه اللعبة لعبة «ترايبل ترايد» التي ظهرت داخل «فاينل فانتسي 8» سنة 1999. ولا يوجد تاريخ موثّق لهذه اللعبة تحديداً.",
    "en": "The game resembles Triple Triad, which appeared inside Final Fantasy VIII in 1999. There is no documented history for this exact game."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• ضع بطاقاتك القوية في مواضع لا يستطيع خصمك مهاجمتها.\n• استفد من قاعدة «التطابق» لأسر بطاقات متعددة.\n• فكّر في ردّ خصمك قبل وضع بطاقتك.\n• اختر فيلقين يكمل أحدهما الآخر.",
    "en": "• Place your strong cards where your opponent can’t attack them.\n• Use the “Same” rule to capture several cards.\n• Think about your rival’s reply before placing a card.\n• Pick two Legions that complement each other."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المهلة: دقيقة لكل دور، وتفويت دورين متتاليين يعني الخسارة.\n• اتفقوا قبل البدء على الفيالق المسموحة.",
    "en": "• Format: single elimination.\n• Timer: one minute per turn; missing two in a row forfeits.\n• Agree the allowed Legions beforehand."
   }
  }
 ],
 "the-island": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 15 إلى 30 دقيقة\nعدة لاعبين",
    "en": "Approx. length: 15–30 min\nSeveral players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة اجتماعية للبقاء: كوّن تحالفات وقرّر من يبقى.",
    "en": "A social survival game: form alliances and decide who stays."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن آخر من يبقى على الجزيرة.",
    "en": "Be the last one left on the island."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تستلهم اللعبة برامج البقاء التلفزيونية مثل «سورفايفر». ولا يوجد تاريخ موثّق للعبة نفسها.",
    "en": "The game draws on survival TV shows such as Survivor. There is no documented history for the game itself."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• كوّن تحالفات صغيرة وموثوقة.\n• لا تُظهر قوتك مبكراً.\n• استمع قبل أن تعد الآخرين.\n• كن مرناً عند تغير التحالفات.",
    "en": "• Form small, trusted alliances.\n• Don’t show your strength early.\n• Listen before making promises.\n• Stay flexible when alliances shift."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات يتأهل أولها، أو ترتيب حسب الخروج.\n• اتفقوا قبل البدء على عدد اللاعبين في كل طاولة.\n• يُنصح بإجراء مباريات خاصة بين المشاركين لتجنب التواطؤ.",
    "en": "• Format: tables where the winner advances, or ranking by order of elimination.\n• Agree the number of players per table beforehand.\n• Use private games among entrants to avoid collusion."
   }
  }
 ],
 "rock-card": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 15 إلى 30 دقيقة\nمن 3 إلى 5 لاعبين",
    "en": "Approx. length: 15–30 min\n3–5 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة حفلات بالأوراق: يملأ اللاعبون الفراغ في بطاقة بأطرف إجابة، ويختار الحَكَم الأفضل.",
    "en": "A party card game: players fill the blank on a card with the funniest answer, and the judge picks the best."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "كن أول من يصل إلى 5 نقاط.",
    "en": "Be the first to reach 5 points."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "فكرة الحَكَم الذي يختار أطرف بطاقة ظهرت في لعبة «أبلز تو أبلز» سنة 1999، ثم انتشرت في ألعاب حفلات كثيرة مشابهة.",
    "en": "The idea of a judge choosing the funniest card appeared in Apples to Apples in 1999 and then spread to many similar party games."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• اعرف ذوق الحَكَم قبل اختيار بطاقتك.\n• لا تلعب أقوى بطاقاتك مبكراً.\n• اختر ما يناسب السؤال لا ما يناسب ذوقك أنت.\n• حافظ على الأدب مع بقية اللاعبين.",
    "en": "• Learn the judge’s taste before choosing your card.\n• Don’t play your best cards too early.\n• Pick what fits the prompt, not just your own taste.\n• Stay respectful toward the other players."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات من 3 إلى 5 لاعبين يتأهل أولها.\n• اتفقوا قبل البدء على قواعد الذوق العام.\n• التعادل: جولة إضافية.",
    "en": "• Format: tables of 3–5 players where the winner advances.\n• Agree house rules of conduct beforehand.\n• Tie: an extra round."
   }
  }
 ],
 "dungeon-tales": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 30 إلى 60 دقيقة\n5 لاعبين",
    "en": "Approx. length: 30–60 min\n5 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة أدوار تعاونية مستوحاة من ألعاب الطاولة مثل «دنجنز آند دراجونز».",
    "en": "A co-op role-playing game inspired by tabletop RPGs such as Dungeons & Dragons."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أنجزوا أهداف الحملة معاً؛ ويفوز الفريق إن نجا لاعب واحد على الأقل.",
    "en": "Complete the campaign’s goals together; the party wins if at least one player survives."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "ابتكر غاري غيغاكس وديف آرنسون لعبة «دنجنز آند دراجونز» سنة 1974، وصارت أساس ألعاب تقمّص الأدوار.",
    "en": "Gary Gygax and Dave Arneson created Dungeons & Dragons in 1974, which became the foundation of role-playing games."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• اختر فئة تكمل فريقك (محارب، كاهن، ساحر، لص، شاعر).\n• تحدّثوا قبل اتخاذ القرارات الكبيرة.\n• لا تتهوّر؛ فللقرارات عواقب.\n• ساعد زملاءك قبل أن تطلب منهم المساعدة.",
    "en": "• Pick a class that completes your party (Warrior, Cleric, Wizard, Rogue, Bard).\n• Talk before making big decisions.\n• Don’t be reckless; choices have consequences.\n• Help your teammates before asking for help."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: ترتيب الفرق حسب نجاح الحملة أو الشهرة المكتسبة.\n• اتفقوا على الحملة نفسها لكل الفرق.\n• اتفقوا على الظروف الخاصة إن وُجدت.",
    "en": "• Format: rank parties by campaign success or Fame earned.\n• Agree on the same campaign for all parties.\n• Agree any special conditions beforehand."
   }
  }
 ],
 "conspiracy": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 15 إلى 25 دقيقة\n6 لاعبين: 4 مجتمع و2 جواسيس",
    "en": "Approx. length: 15–25 min\n6 players: 4 Society, 2 Spies"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة خداع تشبه «المستذئب»: جواسيس يفسدون المهام، ومجتمع يحاول إنجازها.",
    "en": "A deception game like Werewolf: spies sabotage missions, and society tries to complete them."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "ينجز المجتمع 3 مهام. ويفوز الجواسيس بإفساد 3 مهام، أو برفض 4 اقتراحات لمهمة واحدة.",
    "en": "Society completes 3 missions. Spies win by sabotaging 3, or by getting 4 proposals for one mission rejected."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تشبه اللعبة «المقاومة» التي ابتكرها دون إسكريدج سنة 2009، و«أفالون» التي صدرت سنة 2012.",
    "en": "The game resembles The Resistance, created by Don Eskridge in 2009, and Avalon, released in 2012."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• راقب من يرفض الفرق باستمرار دون سبب.\n• لا تتسرع في اتهام قائد الفريق.\n• إذا كنت جاسوساً فلا تُفسد المهمة الأولى دائماً.\n• اطلب تبريراً لكل تصويت مشبوه.",
    "en": "• Watch who keeps rejecting teams for no reason.\n• Don’t rush to accuse the team leader.\n• If you are a spy, don’t always sabotage the first mission.\n• Ask for a reason behind any suspicious vote."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات من 6 لاعبين، وتُحتسب النقاط لفريق الفائز.\n• اتفقوا قبل البدء على مدة النقاش والتصويت.\n• اتفقوا على توزيع الأدوار عشوائياً.",
    "en": "• Format: tables of six, with points to the winning team.\n• Agree the discussion and voting times beforehand.\n• Agree that roles are assigned randomly."
   }
  }
 ],
 "deep-thots": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 20 دقيقة\nعدة لاعبين",
    "en": "Approx. length: 10–20 min\nSeveral players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة حفلات: أجب عن الأسئلة بأكثر الطرق إبداعاً أو طرافة، ثم يصوّت الجميع.",
    "en": "A party game: answer questions as creatively or amusingly as you can, then everyone votes."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "احصل على أكبر عدد من الأصوات لتحقق أعلى نقاط.",
    "en": "Win the most votes to reach the highest score."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تشبه اللعبة ألعاب الحفلات مثل «كويبلاش» التي أصدرتها شركة «جاكبوكس» سنة 2015.",
    "en": "The game resembles party games such as Quiplash, released by Jackbox in 2015."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• اكتب إجابات قصيرة ومباشرة.\n• فاجئ القارئ بنهاية غير متوقعة.\n• تجنّب الإجابات المكررة.\n• صوّت بإنصاف لأفضل إجابة لا لأقرب صديق.",
    "en": "• Write short, direct answers.\n• Surprise the reader with an unexpected ending.\n• Avoid repeated answers.\n• Vote fairly for the best answer, not your closest friend."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات يتأهل أصحاب أعلى النقاط منها.\n• اتفقوا قبل البدء على عدد الجولات.\n• لتجنب التحيز، يُفضَّل أن يكون التصويت مجهولاً.",
    "en": "• Format: tables where the top scorers advance.\n• Agree the number of rounds beforehand.\n• To avoid bias, anonymous voting is best."
   }
  }
 ],
 "go": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 20 إلى 60 دقيقة\nلاعبان",
    "en": "Approx. length: 20–60 min\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة استراتيجية قديمة لشخصين: قواعد بسيطة وعمق هائل على رقعة 19×19.",
    "en": "An ancient two-player strategy game: simple rules, vast depth, on a 19×19 board."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "سجّل نقاطاً أكثر من الأرض التي تحيط بها والأحجار التي تأسرها.",
    "en": "Score more from the territory you surround and the stones you capture."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "نشأت «غو» في الصين قبل أكثر من 2500 سنة، ويُقال إن عمرها أكبر من ذلك. ثم انتقلت إلى كوريا واليابان وصارت جزءاً من ثقافتهما. وفي سنة 2016 هزم برنامج «ألفاغو» الكوري لي سيدول.",
    "en": "Go began in China more than 2,500 years ago, and some say it is older. It spread to Korea and Japan and became part of their culture. In 2016 the program AlphaGo beat the Korean player Lee Sedol."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• ابدأ بالزوايا ثم الأطراف ثم الوسط.\n• لا تلاحق أحجار الخصم المحاصرة إن كانت ميتة أصلاً.\n• اربط أحجارك لتكون أصعب في الأسر.\n• انتبه لقاعدة «كو» ولا تكرر الوضع السابق.",
    "en": "• Start with corners, then edges, then the centre.\n• Don’t chase enemy stones that are already dead.\n• Connect your stones so they are harder to capture.\n• Mind the ko rule and don’t repeat the previous position."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر، أو سويسري إذا كثر المشاركون.\n• المواجهة: أفضل 3 في الأدوار الأخيرة.\n• اتفقوا على قيمة كومي (عادة 5.5) ووقت التفكير.",
    "en": "• Format: single elimination, or Swiss if there are many entrants.\n• Series: best of 3 in the late rounds.\n• Agree the komi (usually 5.5) and the time control."
   }
  }
 ],
 "match-it": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة: 24 إلى 144 بلاطة\nمهارة وسرعة\nلاعبان",
    "en": "Length: 24–144 tiles\nSkill and speed\n2 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة مطابقة بلاطات للاعبين، يحصل فيها كل لاعب على اللوحة نفسها ويحاول إزالة بلاطاتها أولاً.",
    "en": "A two-player tile-matching game in which both players get the same board and try to clear it first."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "أزل جميع البلاطات قبل خصمك، أو اجمع أزواجاً أكثر منه في وضع سباق الأزواج.",
    "en": "Clear all your tiles before your opponent, or collect more pairs than them in Pair Rush."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "لا يوجد تاريخ موثّق لهذه اللعبة. وتشبه ألعاب مطابقة البلاطات مثل «ماهجونغ سوليتير» الذي ظهر باسم «شنغهاي» سنة 1981.",
    "en": "There is no documented history for this game. It resembles tile-matching games such as Mahjong Solitaire, which appeared as Shanghai in 1981."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• استخدم التلميحات المحدودة في اللحظات الصعبة فقط.\n• راقب تقدم خصمك تحت اسمه وصورته لتقدّر سرعتك.\n• لا تخشَ الخطأ في المطابقة، فلا توجد عقوبة عليه.\n• في سباق الأزواج، اختر الأزواج التي يصعب على خصمك رؤيتها.",
    "en": "• Save the limited hints for hard moments.\n• Watch your opponent’s progress under their name and avatar to judge your pace.\n• Don’t fear a wrong match; there is no penalty.\n• In Pair Rush, pick pairs your opponent is less likely to spot."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: إقصاء مباشر.\n• المواجهة: أفضل 3 جولات.\n• اتفقوا قبل البدء على الوضع (سباق أو سباق الأزواج) وعلى الطول (فورية 24 أو سريعة 48 أو متوسطة 72 أو كلاسيكية 144 بلاطة).\n• في وضع السباق تكون اللوحة نفسها لكلا اللاعبين، فيكون التكافؤ أعلى.",
    "en": "• Format: single elimination.\n• Series: best of 3 rounds.\n• Agree the mode (Race or Pair Rush) and length (Instant 24, Quick 48, Medium 72 or Classic 144 tiles) beforehand.\n• In Race mode both players get the same board, so fairness is higher."
   }
  }
 ],
 "bloko": [
  {
   "title": {
    "ar": "معلومات سريعة",
    "en": "Quick facts"
   },
   "body": {
    "ar": "المدة التقريبية: 10 إلى 20 دقيقة\nمن 2 إلى 4 لاعبين",
    "en": "Approx. length: 10–20 min\n2–4 players"
   }
  },
  {
   "title": {
    "ar": "لمحة عن اللعبة",
    "en": "A quick look"
   },
   "body": {
    "ar": "لعبة لوحية استراتيجية تجريدية من 2 إلى 4 لاعبين، لكل لاعب 21 قطعة بلونه توضع زاوية بزاوية.",
    "en": "An abstract strategy board game for 2–4 players; each has 21 pieces of their colour, placed corner to corner."
   }
  },
  {
   "title": {
    "ar": "الهدف",
    "en": "Goal"
   },
   "body": {
    "ar": "ضع أكبر عدد من مربعات لونك على اللوحة، فالأعلى نقاطاً يفوز.",
    "en": "Fit as many of your coloured squares on the board as you can; the highest score wins."
   }
  },
  {
   "title": {
    "ar": "تاريخ مبسط",
    "en": "A short history"
   },
   "body": {
    "ar": "تشبه اللعبة «بلوكوس» التي صممها الفرنسي برنار تافيتيان وصدرت سنة 2000.",
    "en": "The game resembles Blokus, designed by the Frenchman Bernard Tavitian and released in 2000."
   }
  },
  {
   "title": {
    "ar": "نصائح للفوز",
    "en": "Tips to win"
   },
   "body": {
    "ar": "• ابدأ بالقطع الكبيرة واحتفظ بالصغيرة للنهاية.\n• احرص على أن تكون قطعتك الأخيرة هي المربع الواحد لتنال 20 نقطة إضافية.\n• اتجه نحو مركز اللوحة مبكراً.\n• أغلق منافذ خصومك للتوسع، وحافظ على زواياك مفتوحة.",
    "en": "• Start with the big pieces and keep small ones for the end.\n• Try to finish with the single-square piece for a 20-point bonus.\n• Head toward the centre of the board early.\n• Close off your rivals’ ways to expand and keep your own corners open."
   }
  },
  {
   "title": {
    "ar": "للبطولات",
    "en": "For tournaments"
   },
   "body": {
    "ar": "• النظام: طاولات من 2 إلى 4 لاعبين يتأهل فيها الأعلى نقاطاً.\n• النقاط: كل قطعة موضوعة تمنح عدد مربعاتها، وكل مربع متبقٍ يخصم نقطة، ووضع كل القطع يمنح 15 (أو 20 إن كانت الأخيرة المربع الواحد).\n• تُمرَّر الأدوار إن تعذّر وضع قطعة. ويُنسحب اللاعب تلقائياً إن لم يغيّر شيئاً في 3 أدوار متتالية.\n• ترتيب الأدوار: أحمر ثم أزرق ثم أخضر ثم أصفر. اتفقوا على عدد اللاعبين في كل طاولة.",
    "en": "• Format: tables of 2–4 players where the highest score advances.\n• Scoring: each piece placed scores its squares, each leftover square costs 1, and placing every piece earns 15 (20 if the last is the single square).\n• Turns pass if no piece can be placed, and a player is auto-removed after 3 idle turns in a row.\n• Turn order: red, blue, green, yellow. Agree the number of players per table."
   }
  }
 ]
};
