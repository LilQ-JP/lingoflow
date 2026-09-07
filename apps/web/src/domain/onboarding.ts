import type { RoadmapStep } from './platform.ts';
export interface DiagnosticQuestion {id:string;kind:'語彙・表現'|'文法'|'リスニング';prompt:string;options:string[];answer:number;spoken?:string}
export const diagnosticQuestions:DiagnosticQuestion[]=[
['v1','語彙・表現','「試してみる」に近い表現は？',['give it a shot','take a seat','make a wish','leave it alone'],0],
['v2','語彙・表現','「だいたい、ほとんど」は？',['right away','pretty much','at first','by chance'],1],
['v3','語彙・表現','"in front of" の意味は？',['〜の後ろ','〜の上','〜の前','〜の中'],2],
['v4','語彙・表現','"I am running late." は？',['走るのが好きです','遅れそうです','もう帰ります','急がなくていいです'],1],
['v5','語彙・表現','"That makes sense." は？',['なるほど','気をつけて','いただきます','残念です'],0],
['v6','語彙・表現','"look forward to" は？',['前を見る','探し回る','楽しみにする','諦める'],2],
['v7','語彙・表現','"It depends." は？',['間違いない','場合による','とても簡単だ','終わった'],1],
['v8','語彙・表現','"I ended up staying home." は？',['家を買った','家に帰れなかった','家を出た','結局家にいた'],3],
['g1','文法','She ___ coffee every morning.',['drink','drinks','drinking','drank'],1],
['g2','文法','Yesterday, we ___ to the zoo.',['go','going','went','gone'],2],
['g3','文法','I have lived here ___ 2020.',['for','since','during','until'],1],
['g4','文法','If I had more time, I ___ travel.',['will','am','would','was'],2],
['g5','文法','I enjoy ___ new languages.',['learn','learned','to learn','learning'],3],
['l1','リスニング','聞こえた内容に合うものを選んでください。',['水をください','お会計をお願いします','予約しました','メニューをください'],0,'Could I have some water, please?'],
['l2','リスニング','何時に会いますか？',['5時15分','5時30分','5時45分','6時'],1,"Let’s meet at half past five."],
['l3','リスニング','話し手は何を提案していますか？',['家に帰る','映画を見る','コーヒーを飲む','散歩に行く'],3,'How about going for a walk?'],
['l4','リスニング','週末はどう過ごしましたか？',['一日中働いた','友人と旅行した','家でゆっくりした','家を掃除した'],2,'I decided to take it easy and stay home.'],
['l5','リスニング','話し手の気持ちは？',['延期したい','楽しみにしている','断りたい','忘れていた'],1,"I’m really looking forward to seeing you."],
].map(([id,kind,prompt,options,answer,spoken])=>({id,kind,prompt,options,answer,spoken})) as DiagnosticQuestion[];
export function estimateLevel(correct:number,total:number):'A1'|'A2'|'B1'{const ratio=total?correct/total:0;return ratio>=.8?'B1':ratio>=.45?'A2':'A1'}
export function proposeRoadmap(goal:string,topics:string[]):RoadmapStep[]{
 const travel=/旅行|カフェ|海外|旅|cafe|travel/i.test(goal+topics.join(' '));
 const work=/仕事|ビジネス|会議|work/i.test(goal+topics.join(' '));
 const titles=travel?['挨拶で、会話をはじめる','カフェで好みを伝える','聞き返して、理解を深める','旅先の出来事を話す']:work?['自分のことを、短く伝える','相手の意見を聞き取る','質問して、会話をつなぐ','仕事の出来事を説明する']:['動画から、ひとつ表現を見つける','聞こえた言葉を、声にする','自分の言葉として思い出す','好きな話題で、会話をつなぐ'];
 return titles.map((title,i)=>({id:`step-${i+1}`,title,description:['短い動画を見て、使いたい表現を見つけましょう。','お手本を聞き、発話または文字入力で練習します。','別の日にもヒントなしで思い出し、定着を確かめます。','習得した表現を、自分の文で使ってみましょう。'][i]!,completed:false}));
}
